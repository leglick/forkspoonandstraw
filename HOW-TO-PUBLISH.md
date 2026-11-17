# How to publish a post on Fork Spoon & Straw

This replaces "FSS how to.pdf". Everything below was checked against the real site
code and your existing posts. First-time setup on a new computer is in `FSS-GUIDE.md`.

## The 60-second version
1. Create a folder in `src/content/posts/` named after your post (the slug).
2. Put photos in `images/` inside it (cover + one folder per gallery).
3. Create `index.md` (**.md, never .mdx**), paste the template at the bottom, fill it in.
4. Write. Add galleries with `:::gallery{folder="name"}`.
5. Preview with `npm run dev` (http://localhost:4321).
6. GitHub Desktop: Fetch origin, Commit to main, Push origin. Live in 1 to 3 minutes.

---

## 1. Folder layout

```
src/content/posts/
  my-new-post/                 <- folder name = the slug (see rules below)
    index.md                   <- the post, must be named exactly index.md
    images/
      cover.jpg                <- the cover photo
      inline/                  <- optional: single photos placed between paragraphs
        01.jpg
      ferry/                   <- one folder per gallery
        01.jpg
        02.jpg
        03.jpg
      beach/
        01.jpg
```

- The folder name, the `slug:` in the frontmatter and the web address all match:
  folder `my-new-post` = slug `my-new-post` = `forkspoonandstraw.com/posts/my-new-post`.
- Slug rules: lowercase, letters/numbers/dashes only. No spaces, no accents (write
  `ile-de-beaute`, not `île-de-beauté`).
- Gallery folders must be directly inside `images/` (not nested deeper). Gallery folder
  names may only use letters, numbers, `-` and `_` (no spaces or accents).

## 2. Photos

- Formats that work: `.jpg` `.jpeg` `.png` `.webp` `.avif`.
- **.HEIC does not work** (browsers can't show it and the site can't process it). Export
  from Photos as JPEG, or iPhone Settings > Camera > Formats > Most Compatible.
- Use lowercase extensions (`.jpg`, not `.JPG`). Uppercase may not be picked up.
- Photos in a gallery appear in alphabetical filename order. Name them `01`, `02`, `03`...
  (or `IMG_2013` etc., which already sort in shooting order).
- How photos are displayed (so you can choose the right shots):
  - **Cover**: cropped to a landscape 3:2 rectangle with rounded corners, centered.
    Portrait photos get their middle band cropped, so pick a cover with the subject mid-frame.
  - **Gallery**: swipeable row of small **portrait** tiles. Landscape photos get
    center-cropped into portrait tiles.
  - **Single inline photo**: shown full column width with its natural proportions,
    rounded corners. A tall portrait photo will be very tall on screen.
- Size: big phone photos work, but every photo stays in the repo history forever
  (the repo is already about 1.6 GB). Resizing to roughly 2400 px on the long edge
  before adding keeps things fast.

## 3. The frontmatter (the block at the very top)

```yaml
---
title: "Your Post Title"
slug: your-post-title
categories:
  - Travel
  - Pardon My Franglais
date: 2026-08-04
readTime: 6
cover: ./images/cover.jpg
description: "One or two sentences. It is the italic subtitle under the title, the text on post cards, and the preview in Google and social shares."
tags:
  - travel
  - corsica
readNext: another-post-slug
---
```

| Field | Required? | What it does |
|---|---|---|
| `title` | yes | Big title on the post, tab title, cards. |
| `slug` | yes | Must equal the folder name. Becomes the web address. |
| `date` | yes | `YYYY-MM-DD`. **Controls ordering**: the newest date is the featured post at the top of the home page, and the default "Read next" is based on it. Shown on the post in French (e.g. "18 mai 2026"). A future date does not hide the post. |
| `categories` | yes | A list. Must be exactly: `Travel`, `Pardon My Franglais`, `Food`, `Touloused & Confused`. A post can have several; the **first** one is the label on the post and cards and the "Back" link. Either style works: the multi-line list above, or `categories: [Travel, Food]`. |
| `readTime` | yes | A number of minutes (just `6`, not "6 min"). Shown as "6 min read". |
| `cover` | yes | Path to the cover photo, relative to the post folder. If the file doesn't exist, the **whole site build fails**. |
| `description` | yes | The italic subtitle under the title, card text, Google/social preview. |
| `tags` | yes | List of lowercase words, shown as small labels at the bottom. Use `tags: []` if none. |
| `readNext` | optional | Pins the "Read next" card. See section 4. |
| `updated` | optional | A date. Accepted, but not displayed anywhere yet. |
| `dek` | **do not use** | Not a real field: it is silently ignored. Put the subtitle in `description`. |

### YAML traps (the usual cause of a failed build)
- If a title or description contains a **colon followed by a space** (`: `), an `&`
  at the start, or ` #`, wrap the whole value in double quotes:
  `title: "Pines, Popovers & Park Loops: 3 Days in Acadia"`.
- If the text itself contains double quotes, wrap it in single quotes instead, and
  double any apostrophe: `description: 'It''s "ça roule"'`.
- Keep the `---` line at the top and the bottom of the block.
- Indent list items with two spaces and a dash, exactly as in the template.
- Obsidian may rewrite your frontmatter style (drops quotes, changes list format) when
  you open a file. That is harmless as long as it still parses.

## 4. readNext: choosing the "Read next" card

At the bottom of every post there is a "Read next" card: the cover thumbnail, the
category and the title of another post.

- **Default (no `readNext`)**: the site sorts all posts newest to oldest and shows the
  post right after the current one, i.e. the **next older post**. On the oldest post it
  wraps around to the newest. It does not look at categories and is not random.
- **Override**: add `readNext: slug-of-the-post-you-want` to the frontmatter. The value
  is the other post's slug (its folder name / its `slug:` line).
  ```yaml
  readNext: ile-de-beaute-corse-pt-2
  ```
- Typical use: a series (Corsica part 1 points to part 2, part 2 points to part 3), or
  steering readers from a travel recap to a restaurant post.
- Safety net: if the slug is misspelled or doesn't exist, the site falls back to the
  default pick, prints a warning in the build log, and does not fail.
- It only changes *this* post's card. To make part 2 lead to part 3, set `readNext` in
  part 2.
- The last post of a series can leave `readNext` out (default pick) or point somewhere
  fresh.
- Currently set: Corsica part 1 points to part 2, and part 2 points to part 3.

## 5. Writing the post: all the formatting you use

Write below the closing `---`. Leave a blank line between paragraphs.

| What you want | What you type | How it looks |
|---|---|---|
| Section heading | `##### Heading text` | Bold dark-slate heading (the style you use almost everywhere) |
| Bigger heading | `## Heading text` | Larger heading. (`###` to `######` all look identical to `#####`.) |
| French / foreign word | `_pépites_` | *Coral italics* (the one you use most). `*pépites*` also works |
| Bold | `**bold text**` | Bold |
| Link | `[text](https://example.com)` | Blue-slate underlined |
| Link to another post | `[text](/posts/other-post-slug)` | Same; use the slug, with `/posts/` in front |
| One photo between paragraphs | `![describe the photo](./images/inline/01.jpg)` | Full-width rounded photo |
| Swipe gallery | `:::gallery{folder="ferry"}` | Swipeable row of portrait tiles with "swipe - N photos" and a progress line |
| Pull-quote / aside band | `> Pro-traveler tip: book dinner early` | Full-width blue band, italic serif text |
| Bullet list | `* item` or `- item` | Small coral dot before each item, space between items |
| Numbered list | `1. item` | Coral numbers, space between items |

Rules that matter:
- **Gallery and single-photo lines must each be on their own line**, with a blank
  line before and after. A photo written in the middle of a sentence won't work.
- Gallery syntax is exact: `:::gallery{folder="ferry"}` with straight double quotes,
  no spaces inside the braces, and the folder name matching the real folder
  (`images/ferry/`) exactly, including capitals. You can use the same folder in
  more than one place, but you normally won't.
- A single photo path starts with `./` and is relative to the post folder
  (`./images/inline/01.jpg`). Put these in any subfolder of `images/`; `inline/` is
  the convention.
- Pull-quote: one `>` at the start of the line. It becomes a full-width band, so keep
  it to a sentence or two.
- The first paragraph of the post gets a big blue **drop-cap** letter automatically.
  Start your first paragraph with a normal word (not a quotation mark).
- Don't use a single `#` heading: the post title is already the page's main heading.
- The "xx lele" signoff, the tag labels, the Read next card and the reading-progress bar
  are added automatically. Don't type them.
- Don't use HTML tags (`<br>`, `<iframe>`, ...). They are silently dropped.
- Tables, code blocks, footnotes and `---` divider lines aren't styled for this site,
  so avoid them.
- **Lists**: put a blank line before the first item, and one item per line. Each bullet
  gets a small coral dot and each numbered item a coral number. Don't put a loose line
  (like a lone "and") right under an item: it becomes part of that item.

## 6. Preview locally (optional but recommended)

1. Open Terminal in the project folder.
2. Run `npm run dev` and open http://localhost:4321.
3. Check: galleries swipe, photos load, French words are coral, the Read next card is right.
4. If a brand-new post doesn't show up: save the file, `Ctrl+C`, run `npm run dev` again.
5. `Ctrl+C` to stop when done.

If you see errors like "collection posts does not exist": `Ctrl+C`, then run
`rm -rf .astro node_modules/.vite`, then `npm run dev`. And never run `npm run build`
while `npm run dev` is running: they share a cache and break each other.

## 7. Publish

1. GitHub Desktop: **Fetch origin** first (pulls anything from your other computer).
2. Review the changed files, write a summary (e.g. "new: corsica part 4"), click
   **Commit to main**, then **Push origin**.
3. Cloudflare builds automatically. Watch it in the Cloudflare dashboard >
   Workers & Pages > `fss-blog` > Deployments (about 1 to 3 minutes).
4. Open the post on https://forkspoonandstraw.com and scroll through it on your phone too.

**If the deployment shows red / failed**: the live site keeps its previous version (nothing
breaks), but ONE bad post blocks every new deploy until it's fixed. Open the failed
deployment's log; it names the file. Usual causes: a `cover:` path to a file that doesn't
exist, broken frontmatter quoting, a missing required field, or a post named `index.mdx`.

## 8. Editing or removing an existing post

- **Edit**: open `src/content/posts/<slug>/index.md` in Obsidian, change it, then Commit and
  Push as above. Live in a few minutes.
- **Change the Read next card**: add or edit `readNext:` in that post.
- **Remove a post**: delete its whole folder, commit and push. Its web address will then
  show the 404 page.
- **Change a slug**: avoid it. The address changes and links to the old one break.

## 9. Troubleshooting

| Problem | Likely cause / fix |
|---|---|
| Post doesn't appear at all | File is not named exactly `index.md` (watch for `.mdx`, `Index.md`, `.md.txt`), or it's not directly inside its own folder in `src/content/posts/` |
| Whole build fails | A `cover:` file is missing, a required field is missing, or the YAML is broken (see traps in section 3) |
| Gallery says "No images found" | Folder name in `:::gallery{folder="..."}` doesn't match the folder in `images/` exactly (case matters), or the photos are .HEIC / have uppercase extensions |
| Some photos missing from a gallery | They're .HEIC or have an unsupported/uppercase extension |
| A single photo doesn't show | The line has other text on it, or the path is wrong (`./images/inline/01.jpg`) |
| Gallery line shows as plain text | Typo in `:::gallery{folder="..."}`: check the colons, braces and straight quotes |
| French words not coral | Use `_word_` or `*word*` (not quotes) with no space inside the marks |
| Wrong "Read next" card | Check the slug in `readNext:` matches the target post's folder exactly |
| Two computers disagree / merge conflict | Always Fetch origin before writing and Push when done. If GitHub Desktop reports a conflict, don't guess: ask for help |

## 10. Copy-paste template for `index.md`

```markdown
---
title: "Your Post Title"
slug: your-post-title
categories:
  - Travel
date: 2026-08-04
readTime: 6
cover: ./images/cover.jpg
description: "One or two sentences for the subtitle, cards and Google."
tags:
  - travel
readNext: another-post-slug
---
The first paragraph. It gets the big drop-cap letter automatically, and French words like _pépites_ turn coral.

##### First section heading

More text with **bold**, a [link](https://example.com), and a link to [another post](/posts/another-post-slug).

:::gallery{folder="first-spot"}

> A pull-quote or aside shows up as a full-width blue band.

![A single photo](./images/inline/01.jpg)

##### Second section heading

More text ...

:::gallery{folder="second-spot"}
```
