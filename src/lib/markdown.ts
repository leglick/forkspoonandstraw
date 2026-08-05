// Renders raw markdown body text to HTML outside of Astro's normal content
// pipeline, and splits a post body around `:::gallery{folder="..."}` markers
// so PostLayout can interleave real <Gallery> component instances between
// rendered markdown chunks. See PostLayout.astro for why: this lets authors
// write plain .md files (Obsidian can't edit .mdx) with a plain-text marker
// instead of an MDX component import + JSX tag.
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

// Matches a `:::gallery{folder="some-folder"}` marker alone on its own line.
// Leaf-style (no closing `:::`) -- the gallery has no nested content, so
// there's nothing for an author to accidentally leave unclosed.
const GALLERY_MARKER = /^:::gallery\{folder="([\w-]+)"\}\s*$/gm;

export type PostSegment = { type: 'markdown'; markdown: string } | { type: 'gallery'; folder: string };

export function splitPostBody(body: string): PostSegment[] {
  const segments: PostSegment[] = [];
  let lastIndex = 0;

  for (const match of body.matchAll(GALLERY_MARKER)) {
    const [full, folder] = match;
    const index = match.index ?? 0;
    const before = body.slice(lastIndex, index);
    if (before.trim().length > 0) {
      segments.push({ type: 'markdown', markdown: before });
    }
    segments.push({ type: 'gallery', folder });
    lastIndex = index + full.length;
  }

  const rest = body.slice(lastIndex);
  if (rest.trim().length > 0) {
    segments.push({ type: 'markdown', markdown: rest });
  }

  return segments;
}
