// Renders raw markdown body text to HTML outside of Astro's normal content
// pipeline, and splits a post body around `:::gallery{folder="..."}` markers
// and standalone `![alt](./relative.jpg)` images so PostLayout can
// interleave real <Gallery>/<Image> component instances between rendered
// markdown chunks. See PostLayout.astro for why: this lets authors write
// plain .md files (Obsidian can't edit .mdx) with a plain-text marker
// instead of an MDX component import + JSX tag -- and as a side effect,
// bypassing Astro's normal Content rendering this way also means its
// built-in local-image-optimization remark plugin (the thing that turns
// `![](./photo.jpg)` into an optimized asset) never runs, so inline images
// need the same explicit treatment here as galleries do.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

// Hashtags: the Wix export turned every #hashtag into a link to a Wix
// hashtag page (/home/hashtags/...) that no longer exists. Render those as
// plain-text "pill" spans instead (styled by .hashtag in global.css), and do
// the same for hashtags typed as plain text, so old and new posts match.
// Number-only ones (#1, #2 -- Wix auto-linked "Flight #1" etc.) stay plain
// text: they're numbering, not tags.
// Done at render time, so the post files themselves are left untouched.
const HASHTAG_LINK = /\/home\/hashtags\//;
const HAS_LETTER = /\p{L}/u;
const HASHTAG_IN_TEXT = /(^|\s)(#[\p{L}\p{N}_]*\p{L}[\p{L}\p{N}_]*)/gu;
// Nodes whose text must not be touched: link text (e.g. "Video hike #1"),
// headings, and code.
const SKIP_TYPES = new Set(['link', 'linkReference', 'heading', 'inlineCode', 'code']);

// The `emphasis` type is only a vehicle: data.hName/hProperties make
// remark-rehype emit <span class="hashtag"> instead of <em>.
function hashtagSpan(value: string): any {
  return {
    type: 'emphasis',
    data: { hName: 'span', hProperties: { className: ['hashtag'] } },
    children: [{ type: 'text', value }],
  };
}

function linkText(node: any): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(linkText).join('');
}

function rewriteHashtags(parent: any): void {
  const next: any[] = [];
  for (const child of parent.children ?? []) {
    if (child.type === 'link' && HASHTAG_LINK.test(child.url ?? '')) {
      const text = linkText(child);
      next.push(HAS_LETTER.test(text) ? hashtagSpan(text) : { type: 'text', value: text });
    } else if (child.type === 'text') {
      let last = 0;
      for (const m of child.value.matchAll(HASHTAG_IN_TEXT)) {
        const start = (m.index ?? 0) + m[1].length;
        if (start > last) next.push({ type: 'text', value: child.value.slice(last, start) });
        next.push(hashtagSpan(m[2]));
        last = start + m[2].length;
      }
      if (last === 0) next.push(child);
      else if (last < child.value.length) next.push({ type: 'text', value: child.value.slice(last) });
    } else {
      if (!SKIP_TYPES.has(child.type)) rewriteHashtags(child);
      next.push(child);
    }
  }
  parent.children = next;
}

function remarkHashtags() {
  return (tree: any) => rewriteHashtags(tree);
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkHashtags)
  .use(remarkRehype)
  .use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

// Matches, alone on its own line: a `:::gallery{folder="some-folder"}`
// marker (leaf-style, no closing `:::` -- the gallery has no nested content,
// so there's nothing for an author to accidentally leave unclosed), or a
// standalone `![alt text](./relative/path.jpg)` image reference. Every
// inline image in every post is already written on its own line (verified
// against the current content), so this doesn't need to handle images
// embedded mid-paragraph.
const MARKER =
  /^:::gallery\{folder="(?<galleryFolder>[\w-]+)"\}\s*$|^!\[(?<imageAlt>[^\]]*)\]\(\.\/(?<imagePath>[^)]+)\)\s*$/gm;

export type PostSegment =
  | { type: 'markdown'; markdown: string }
  | { type: 'gallery'; folder: string }
  | { type: 'image'; alt: string; path: string };

export function splitPostBody(body: string): PostSegment[] {
  const segments: PostSegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(MARKER)) {
    const { galleryFolder, imageAlt, imagePath } = match.groups!;
    const index = match.index ?? 0;
    const before = body.slice(lastIndex, index);
    if (before.trim().length > 0) {
      segments.push({ type: 'markdown', markdown: before });
    }
    if (galleryFolder !== undefined) {
      segments.push({ type: 'gallery', folder: galleryFolder });
    } else {
      segments.push({ type: 'image', alt: imageAlt ?? '', path: imagePath });
    }
    lastIndex = index + match[0].length;
  }

  const rest = body.slice(lastIndex);
  if (rest.trim().length > 0) {
    segments.push({ type: 'markdown', markdown: rest });
  }

  return segments;
}
