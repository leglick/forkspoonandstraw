# Fork Spoon & Straw: setup + reference guide

Last verified against the repo: 2026-11. This replaces "FSS how to.pdf", which is
out of date (see "Where the old PDF is wrong" at the bottom). For writing and
publishing posts, see `HOW-TO-PUBLISH.md`.

## 1. Where everything lives

| Thing | Where |
|---|---|
| Live site | https://forkspoonandstraw.com |
| Preview/backup URL | https://fss-blog.pages.dev |
| Code + posts + photos (the source of truth) | GitHub: `leglick/forkspoonandstraw` (public) |
| Hosting | Cloudflare Pages, project `fss-blog`, deploys automatically on every push to `main` |
| Cloudflare build settings | Build command `npm run build`, output directory `dist`, no adapter, no wrangler |
| Contact form | Formspree, form ID `xbdnnqrz` (set in `src/components/ContactBlock.astro`) |
| Git identity | `leglick` / leahglickman12@gmail.com |
| Old Wix URLs | `public/_redirects` maps all old `/post/slug` URLs to `/posts/slug` |

Things only you know. Fill these in and keep them somewhere safe:
- Where the domain `forkspoonandstraw.com` is registered / where its DNS is managed: ______
- Formspree account email (contact-form messages go here): ______
- Cloudflare login email: ______
- GitHub login: leglick / ______

## 2. Moving to a new computer (do in this order)

### A. On the OLD computer, first: save any unpushed work
Anything not pushed to GitHub does NOT exist on the new computer.
1. Open GitHub Desktop, choose the repo, and look at the **Changes** tab.
2. Review the changed files. Obsidian often rewrites the frontmatter style
   (quotes, list format) of posts you merely opened. That is harmless. Real
   edits you made (descriptions, text, new photos) must be kept.
3. Type a summary (e.g. "save pending edits"), click **Commit to main**, then **Push origin**.
4. Confirm "No local changes" and nothing to push.

### B. On the NEW computer: install the tools (one-time)
1. **Node.js**: install the current LTS from nodejs.org. It must be 22.12 or newer.
   Check in Terminal: `node -v`.
2. **GitHub Desktop**: desktop.github.com. Sign in as `leglick`.
3. **Obsidian**: obsidian.md (only if you write posts there).
4. Clone: GitHub Desktop → File → Clone Repository → `leglick/forkspoonandstraw`.
   It downloads everything (about 1.6 GB: all posts, all photos).

### C. Run the site locally
1. GitHub Desktop → Repository → **Show in Finder** (⌘⇧F) to find the folder.
2. Open Terminal in that folder (right-click the folder → New Terminal at Folder).
3. Run these once: `npm install`
4. Run this each time you want a preview: `npm run dev`
5. Open http://localhost:4321. Stop with `Ctrl+C`.

### D. Obsidian
1. Obsidian → Open folder as vault → choose `src/content/posts` inside the project
   (that is how it is set up on the old computer).
2. Optional: copy the hidden folder `src/content/posts/.obsidian` from the old
   computer (Finder: press ⌘⇧. to show hidden files) to keep theme/plugin settings.
   It is deliberately not in git.

### E. The two-computer rule
- **Before** you start writing on either computer: GitHub Desktop → **Fetch origin**,
  then **Pull origin** if it offers.
- **After** you finish: Commit, then **Push origin**.
- Never leave edits uncommitted on one computer while you work on the other. That
  is what causes merge conflicts.

## 3. Publishing a new post

The full step-by-step (folder layout, photos, every frontmatter field including
`readNext`, all the formatting, publishing, troubleshooting, and a copy-paste
template) is in **`HOW-TO-PUBLISH.md`**. Use that file; it is the single source for
publishing so the two guides can't disagree.

Short version: new folder in `src/content/posts/` named after the slug, a file called
`index.md` (never `.mdx`), photos in `images/`, `:::gallery{folder="name"}` for
galleries, then GitHub Desktop: Fetch origin, Commit to main, Push origin.

## 4. Editing the site itself (not posts)

| To change | Edit |
|---|---|
| Home page greeting + intro copy | `src/components/IntroCard.astro` |
| About page text, facts list, "Start here" posts | `src/pages/about.astro` |
| Footer links/text | `src/components/Footer.astro` |
| Nav / masthead | `src/components/Masthead.astro` |
| Category list/order | `src/lib/categories.ts` |
| Category page intro lines | `DEKS` in `src/pages/[category].astro` |
| Colors, fonts, spacing | `src/styles/global.css` (named tokens at the top) |
| How a post page is laid out | `src/layouts/PostLayout.astro` |
| Gallery look | `src/components/Gallery.astro` |
| Contact form | `src/components/ContactBlock.astro` |
| Fonts loaded | the Google Fonts `<link>` in `src/layouts/BaseLayout.astro` |
| Home feed size | `FEED_SIZE` in `src/pages/index.astro` (currently 9) |

Also: `public/robots.txt`, `public/_redirects`, favicons in `public/`. RSS is `/rss.xml`
and the sitemap is `/sitemap-index.xml` (both generated automatically). Design reference
material is in `design/` and `astro-build-notes.md`.

## 5. Known gotchas

1. **Name posts `index.md`, never `index.mdx`.** The site only reads `index.md`. An
   `.mdx` post is silently ignored.
2. **Dev preview says "collection posts does not exist" or shows odd errors**: stop it
   (`Ctrl+C`), run `rm -rf .astro node_modules/.vite`, then `npm run dev` again.
3. **Don't run `npm run build` while `npm run dev` is running.** They share a cache and
   break each other (fix as in #2).
4. **Obsidian reformats frontmatter** of files you open (removes quotes, changes list
   style). It's harmless. It just shows up as "changed files" in GitHub Desktop.
5. Photos in git are permanent. Even deleting a photo later doesn't shrink the repo
   history (about 1.6 GB now). Resize before adding.
6. `scripts/recompress-images.mjs` was a one-time migration tool. Do **not** re-run it:
   it recompresses everything again and its reference-fixing step still looks for
   `index.mdx`.
7. Old Wix links still redirect only because of `public/_redirects` (old `/post/slug` and
   `/home/...` addresses). Leave that file.
8. Old `#hashtag` links from Wix are rendered as plain coral pills by `src/lib/markdown.ts`
   (the post files still contain the dead Wix links, which is harmless).

## 6. Where the old PDF ("FSS how to.pdf") is wrong
- It says to name the post `index.mdx`. That is wrong now (see gotcha 1). Use `index.md`.
- It says to turn on Obsidian's "Detect all file extensions". Not needed for `.md`.
- Its template includes `dek:`. That field is ignored (use `description`).
- It says a future `date` hides a post. The site does not filter by date.
- It says "category". The field is `categories` (a list).
- It says "47 posts" and a vault at `~/projects/forkspoonandstraw`. There are now 50
  posts, and the Obsidian vault is `src/content/posts`.
