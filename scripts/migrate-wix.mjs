#!/usr/bin/env node
// Migrates forkspoonandstraw.com from Wix to this repo's content collection.
//
// Post discovery uses the sitemap; per-post pages are server-rendered
// (verified by fetching them directly) -- there's no need to call Wix's
// internal blog API or run a headless browser. Discovery and scraping both
// just fetch + cheerio.
import { load } from 'cheerio';
import TurndownService from 'turndown';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE = 'https://www.forkspoonandstraw.com';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT_DIR = path.join(ROOT, 'src/content/posts');
const REPORT_PATH = path.join(ROOT, 'migration-report.json');

const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_ARG = process.argv.find((a) => a.startsWith('--only='));
const ONLY_SLUGS = ONLY_ARG ? new Set(ONLY_ARG.slice('--only='.length).split(',')) : null;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ForkSpoonStrawMigration/1.0; +https://forkspoonandstraw.com)';

const report = {
  startedAt: new Date().toISOString(),
  dryRun: DRY_RUN,
  postsFound: 0,
  postsMigrated: 0,
  postsFailed: [],
  imagesDownloaded: 0,
  imagesFailed: [],
  urlMapping: [], // { wixUrl, slug }
};

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} fetching ${url}`);
  return res.text();
}

function slugFromPostUrl(url) {
  const raw = decodeURIComponent(new URL(url).pathname)
    .replace(/^\/post\//, '')
    .replace(/\/+$/, '');
  // Normalize accented characters (bébé -> bebe, ça -> ca) so the slug is a
  // clean, portable directory/URL segment instead of carrying raw UTF-8.
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// --- 1. Discovery -----------------------------------------------------

// Wix's sitemap (confirmed: a single flat <urlset>, no further pagination)
// is the authoritative list of every published post. The category *listing*
// pages looked like a shortcut for category membership too, but they only
// render an initial batch server-side (confirmed: posts visible in Wix's own
// dashboard under a category were absent from that category's listing page
// HTML) -- so category membership is read from each post's own page instead,
// during the per-post scrape below.
async function discoverPosts() {
  const postUrls = new Map(); // slug -> wix url
  const issues = [];

  try {
    const xml = await fetchHtml(`${SITE}/blog-posts-sitemap.xml`);
    const $ = load(xml, { xmlMode: true });
    $('url > loc').each((_, el) => {
      const href = $(el).text().trim();
      if (href) postUrls.set(slugFromPostUrl(href), href);
    });
  } catch (err) {
    issues.push({ page: `${SITE}/blog-posts-sitemap.xml`, error: err.message });
  }

  return { postUrls, issues };
}

// --- 2. Per-post scrape -------------------------------------------------

function fullResWixUrl(src) {
  // Wix media URLs are static.wixstatic.com/media/<original-filename>/v1/<transform>/...
  // The original filename segment isn't always a clean "<hash>~mv2.ext" --
  // older posts use suffixed variants like "~mv2_d_3888_2592_s_4_2.jpg"
  // (confirmed: a regex anchored on "~mv2.<ext>" silently missed these,
  // leaving 1,560 of 2,780 downloaded images as small thumbnails instead of
  // full-res originals). Match everything up to the "/v1/" boundary instead
  // of guessing the filename's internal structure.
  const match = src.match(/(static\.wixstatic\.com\/media\/[^/]+)\/v1\//);
  if (!match) return src;
  return `https://${match[1]}`;
}

function extFromUrl(url) {
  const m = url.match(/\.([a-zA-Z0-9]+)$/);
  return m ? m[1].toLowerCase() : 'jpg';
}

function slugifySection(label) {
  const full = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (full.length <= 40) return full || 'general';
  // Truncate at the last word boundary within the limit instead of
  // mid-word (e.g. "...kilomete" from "...kilometers").
  const cut = full.slice(0, 40);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 0 ? cut.slice(0, lastDash) : cut) || 'general';
}

// Content inside <script> tags is never HTML-entity-decoded by the parser
// (verified: the site's JSON-LD literally contains "&amp;" for every "&"),
// so JSON-LD string fields need manual decoding before use as plain text.
function decodeEntities(str) {
  if (!str) return str;
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function extractJsonLd($) {
  let data = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    if (data) return;
    try {
      const parsed = JSON.parse($(el).contents().text());
      if (parsed['@type'] === 'BlogPosting') data = parsed;
    } catch {
      // ignore malformed JSON-LD blocks
    }
  });
  return data;
}

function makeTurndown() {
  const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

  // Wix's Rich Content Editor marks emphasis with inline styles on spans
  // rather than <em>/<strong> tags (verified against the live site's markup).
  td.addRule('wixItalic', {
    filter: (node) =>
      node.nodeName === 'SPAN' && /font-style:\s*italic/.test(node.getAttribute('style') || ''),
    replacement: (content) => (content.trim() ? `*${content}*` : content),
  });
  td.addRule('wixBold', {
    filter: (node) =>
      node.nodeName === 'SPAN' &&
      /font-weight:\s*(bold|[6-9]00)/.test(node.getAttribute('style') || ''),
    replacement: (content) => (content.trim() ? `**${content}**` : content),
  });

  // Cross-post links in the body still point at the live Wix URL (e.g. a
  // "see our Montreal trip" link) -- rewrite those to the new local route so
  // they don't break once Wix is decommissioned.
  td.addRule('internalPostLink', {
    filter: (node) =>
      node.nodeName === 'A' && /^https?:\/\/(www\.)?forkspoonandstraw\.com\/post\//i.test(node.getAttribute('href') || ''),
    replacement: (content, node) => `[${content}](/posts/${slugFromPostUrl(node.getAttribute('href'))})`,
  });

  td.remove(['script', 'style']);

  return td;
}

// The Ricos editor wraps every top-level content block (paragraph, heading,
// embed) in an element with id="viewer-<nodeId>", including exactly one
// wrapper per gallery embed around its data-hook="gallery-viewer" node. We
// extract + replace those wrappers with a placeholder *before* turndown runs,
// which sidesteps ambiguity from turndown's own rule-matching seeing the
// same gallery at several nested div levels.
function extractGalleries($, bodyRoot) {
  const galleryImages = [];
  let lastHeading = null;
  const sectionCounts = new Map();

  // Wix lets authors pick any heading level for a section title (this site
  // uses h5 for its "Day 1: ..." style section headers), so all of h1-h6
  // count as heading blocks here, not just h2-h4.
  const blocks = bodyRoot.find('h1, h2, h3, h4, h5, h6, [id^="viewer-"]').toArray();

  for (const el of blocks) {
    const $el = $(el);
    const tag = el.tagName?.toLowerCase();

    if (/^h[1-6]$/.test(tag)) {
      const text = $el.text().trim();
      if (text) lastHeading = text;
      continue;
    }

    const galleryNode = $el.find('[data-hook="gallery-viewer"]').first();
    if (galleryNode.length === 0) continue;

    const base = lastHeading ? slugifySection(lastHeading) : 'general';
    const count = sectionCounts.get(base) || 0;
    sectionCounts.set(base, count + 1);
    const folder = count === 0 ? base : `${base}-${count + 1}`;

    const urls = [
      ...new Set(
        $el
          .find('img')
          .toArray()
          .map((img) => $(img).attr('src'))
          .filter(Boolean)
          .map(fullResWixUrl)
      ),
    ];
    urls.forEach((url) => galleryImages.push({ folder, url }));

    $el.replaceWith(`<p>%%GALLERY:${folder}%%</p>`);
  }

  return galleryImages;
}

// Anything left over is a standalone (non-gallery) inline image. Download it
// too and point the markdown at the local copy instead of leaving a live
// wixstatic.com URL in the content.
function extractStandaloneImages($, bodyRoot, galleryImages) {
  let inlineCount = 0;
  bodyRoot.find('img').each((_, el) => {
    const $img = $(el);
    const src = $img.attr('src');
    if (!src) return;
    const url = fullResWixUrl(src);
    inlineCount += 1;
    const ext = extFromUrl(url);
    const filename = `${String(inlineCount).padStart(2, '0')}.${ext}`;
    galleryImages.push({ folder: 'inline', url });
    $img.attr('src', `./images/inline/${filename}`);
    $img.attr('alt', $img.attr('alt') || '');
  });
}

function bodyToMarkdown($, bodyRoot, slug) {
  const galleryImages = extractGalleries($, bodyRoot);
  extractStandaloneImages($, bodyRoot, galleryImages);

  const td = makeTurndown();
  let markdown = td.turndown($.html(bodyRoot));

  // MDX parses `<` and `{`/`}` as the start of JSX/expressions, so literal
  // occurrences in prose break the build (confirmed: a "<3" heart emoji in
  // one post's text was parsed as an unclosed JSX tag starting with a
  // digit). Escape them before inserting our own real <Gallery /> tags.
  markdown = markdown.replace(/</g, '&lt;').replace(/\{/g, '&#123;').replace(/\}/g, '&#125;');

  markdown = markdown.replace(/%%GALLERY:([a-z0-9-]+)%%/g, (_m, folder) => {
    return `<Gallery post="${slug}" folder="${folder}" />`;
  });

  // Wix's editor inserts an empty-line spacer block between nearly every
  // paragraph, which turndown converts into lines containing only a
  // markdown hard-break ("  "). Collapse those into normal blank-line
  // paragraph spacing instead of leaving visual clutter in every post.
  markdown = markdown.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n');

  return { markdown, galleryImages };
}

async function scrapePost(slug, wixUrl, issues) {
  const html = await fetchHtml(wixUrl);
  const $ = load(html);

  const jsonLd = extractJsonLd($);
  if (!jsonLd) {
    issues.push({ slug, error: 'No BlogPosting JSON-LD found; skipping metadata extraction' });
    return null;
  }

  const title = $('h1[data-hook="post-title"]').first().text().trim() || decodeEntities(jsonLd.headline);
  const description = decodeEntities(jsonLd.description) || '';
  const date = jsonLd.datePublished;
  const author = jsonLd.author?.name;
  const coverUrl = jsonLd.image?.url ? fullResWixUrl(jsonLd.image.url) : null;

  const readTimeText = $('[data-hook="time-to-read"]').first().text();
  const readTimeMatch = readTimeText.match(/(\d+)/);
  const readTime = readTimeMatch ? Number(readTimeMatch[1]) : 1;

  // Read from the post's own "Post categories" footer rather than the
  // category listing pages -- verified against Wix's own post dashboard that
  // the listing pages under-report membership (they only render an initial
  // batch), while this per-post footer matches the dashboard exactly.
  const categories = [];
  $('ul[aria-label="Post categories"] a').each((_, el) => {
    const text = $(el).text().trim();
    if (text) categories.push(text);
  });

  // Tags: best-effort across a couple of known Wix hashtag hook patterns.
  // If none are present on this post, tags legitimately comes back empty --
  // this blog appears to use categories only, not the hashtag feature.
  const tags = new Set();
  $('[data-hook="post-list-item__hashtags"] a, a[href*="/blog/tags/"]').each((_, el) => {
    const text = $(el).text().trim().replace(/^#/, '');
    if (text) tags.add(text);
  });

  const bodyRoot = $('[data-hook="post-description"]').first();
  if (bodyRoot.length === 0) {
    issues.push({ slug, error: 'No post-description body found; skipping' });
    return null;
  }

  const { markdown, galleryImages } = bodyToMarkdown($, bodyRoot, slug);

  return {
    slug,
    title,
    description,
    date,
    author,
    categories,
    tags: [...tags],
    readTime,
    coverUrl,
    markdown,
    galleryImages,
    wixUrl,
  };
}

// --- 3. Download + write -------------------------------------------------

async function downloadImage(url, destPath) {
  // Skip re-downloading images that already exist, so re-running the
  // migration to fix a text/markdown bug doesn't re-fetch ~2,800 images.
  try {
    const stat = await fs.stat(destPath);
    if (stat.size > 0) return;
  } catch {
    // doesn't exist yet -- fall through and download
  }
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} downloading ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, buffer);
}

function frontmatterYaml(post, coverRelPath) {
  const escape = (s) => String(s).replace(/'/g, "''");
  const list = (arr) => `[${arr.map((v) => `'${escape(v)}'`).join(', ')}]`;
  return [
    '---',
    `title: '${escape(post.title)}'`,
    `slug: '${escape(post.slug)}'`,
    `date: ${new Date(post.date).toISOString().slice(0, 10)}`,
    `categories: ${list(post.categories)}`,
    `tags: ${list(post.tags)}`,
    `cover: '${coverRelPath}'`,
    `description: '${escape(post.description)}'`,
    `readTime: ${post.readTime}`,
    '---',
    '',
  ].join('\n');
}

async function writePost(post) {
  const postDir = path.join(OUT_DIR, post.slug);
  await fs.mkdir(postDir, { recursive: true });

  let coverRelPath = './cover.jpg';
  if (post.coverUrl) {
    const ext = extFromUrl(post.coverUrl);
    coverRelPath = `./cover.${ext}`;
    try {
      await downloadImage(post.coverUrl, path.join(postDir, `cover.${ext}`));
      report.imagesDownloaded++;
    } catch (err) {
      report.imagesFailed.push({ slug: post.slug, url: post.coverUrl, error: err.message });
    }
  }

  const byFolder = new Map();
  for (const { folder, url } of post.galleryImages) {
    if (!byFolder.has(folder)) byFolder.set(folder, []);
    byFolder.get(folder).push(url);
  }
  for (const [folder, urls] of byFolder) {
    for (let i = 0; i < urls.length; i++) {
      const ext = extFromUrl(urls[i]);
      const filename = `${String(i + 1).padStart(2, '0')}.${ext}`;
      const destPath = path.join(postDir, 'images', folder, filename);
      try {
        await downloadImage(urls[i], destPath);
        report.imagesDownloaded++;
      } catch (err) {
        report.imagesFailed.push({ slug: post.slug, url: urls[i], error: err.message });
      }
    }
  }

  const usesGallery = post.galleryImages.length > 0;
  const frontmatter = frontmatterYaml(post, coverRelPath);
  const galleryImport = usesGallery
    ? "import Gallery from '../../../components/Gallery.astro';\n\n"
    : '';
  const ext = usesGallery ? 'mdx' : 'md';
  const content = `${frontmatter}\n${galleryImport}${post.markdown.trim()}\n`;
  await fs.writeFile(path.join(postDir, `index.${ext}`), content);
}

// --- main ----------------------------------------------------------------

async function main() {
  console.log(`Discovering posts from ${SITE}'s sitemap...`);
  const { postUrls: allPostUrls, issues } = await discoverPosts();
  const postUrls = ONLY_SLUGS
    ? new Map([...allPostUrls].filter(([slug]) => ONLY_SLUGS.has(slug)))
    : allPostUrls;
  report.postsFound = postUrls.size;

  console.log(`Found ${allPostUrls.size} unique post(s)${ONLY_SLUGS ? `, processing ${postUrls.size} (--only)` : ''}.`);
  if (ONLY_SLUGS) {
    const missing = [...ONLY_SLUGS].filter((slug) => !allPostUrls.has(slug));
    if (missing.length) console.log(`  ! --only slug(s) not found: ${missing.join(', ')}`);
  }
  if (issues.length) {
    console.log(`\n${issues.length} discovery issue(s):`);
    issues.forEach((i) => console.log(`  ! ${i.page}: ${i.error}`));
  }

  // Every post's own page is fetched even in dry-run mode -- categories live
  // in a per-post footer, not the listing pages, so there's no cheaper way
  // to report accurate categorization before committing to the real run.
  // Dry-run still writes nothing to disk: no image downloads, no post files.
  console.log(`\n${DRY_RUN ? 'Scraping (dry run, no downloads/writes)' : 'Scraping and writing'} posts...`);
  for (const [slug, url] of postUrls) {
    try {
      const post = await scrapePost(slug, url, issues);
      if (!post) {
        report.postsFailed.push({ slug, error: 'scrapePost returned null (see issues log)' });
        continue;
      }
      report.urlMapping.push({ wixUrl: url, slug, categories: post.categories });

      if (DRY_RUN) {
        console.log(
          `  - ${slug} [${post.categories.join(', ') || 'uncategorized'}] (${post.galleryImages.length} gallery image(s), ${post.markdown.length} markdown chars)`
        );
        continue;
      }

      await writePost(post);
      report.postsMigrated++;
      console.log(`  ✓ ${slug} [${post.categories.join(', ') || 'uncategorized'}] (${post.galleryImages.length} gallery image(s))`);
    } catch (err) {
      report.postsFailed.push({ slug, error: err.message });
      console.log(`  ✗ ${slug}: ${err.message}`);
    }
  }

  report.discoveryIssues = issues;
  report.finishedAt = new Date().toISOString();
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  if (DRY_RUN) {
    console.log(`\nDry run complete. Nothing was downloaded or written.`);
  } else {
    console.log(`\nDone. Migrated ${report.postsMigrated}/${report.postsFound} posts.`);
    console.log(`Downloaded ${report.imagesDownloaded} image(s), ${report.imagesFailed.length} failed.`);
  }
  console.log(`Report written to ${path.relative(ROOT, REPORT_PATH)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
