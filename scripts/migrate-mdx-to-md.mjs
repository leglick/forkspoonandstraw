// One-off migration: converts every src/content/posts/*/index.mdx to
// index.md, replacing `<Gallery post="slug" folder="x" />` component tags
// (dropping the now-redundant `import Gallery ...` line and the `post`
// prop, which PostLayout now derives from the post itself) with the plain
// `:::gallery{folder="x"}` marker syntax. Handles the same tag optionally
// wrapped in backticks, since Obsidian's author had one draft where they'd
// typed it as inline code (understandably -- it looked like a code snippet
// to them, not a working component).
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..', 'src', 'content', 'posts');

const IMPORT_LINE = /^import Gallery from ['"][^'"]+['"];\s*\n?/gm;
const GALLERY_TAG = /`?<Gallery\s+post="[^"]*"\s+folder="([\w-]+)"\s*\/>`?/g;

async function main() {
  const dirs = await fs.readdir(ROOT, { withFileTypes: true });
  let converted = 0;

  for (const dir of dirs) {
    if (!dir.isDirectory()) continue;
    const mdxPath = path.join(ROOT, dir.name, 'index.mdx');
    const mdPath = path.join(ROOT, dir.name, 'index.md');

    let content;
    try {
      content = await fs.readFile(mdxPath, 'utf-8');
    } catch {
      continue; // already .md, nothing to do
    }

    const before = content;
    content = content.replace(IMPORT_LINE, '');
    content = content.replace(GALLERY_TAG, (_match, folder) => `:::gallery{folder="${folder}"}`);

    if (content.includes('<Gallery') || content.includes('import Gallery')) {
      console.error(`UNCONVERTED tag left in ${dir.name}/index.mdx -- check manually`);
    }

    await fs.writeFile(mdPath, content, 'utf-8');
    await fs.unlink(mdxPath);
    converted++;
    if (content !== before) {
      const galleryCount = (content.match(/:::gallery/g) ?? []).length;
      console.log(`${dir.name}: converted, ${galleryCount} gallery marker(s)`);
    } else {
      console.log(`${dir.name}: renamed only (no Gallery usage)`);
    }
  }

  console.log(`\nDone. ${converted} file(s) converted from .mdx to .md.`);
}

main();
