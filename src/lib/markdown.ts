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

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeStringify);

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
