# Handoff: fork spoon and straw — personal blog

## Overview
UX/UI for a personal food-and-travel blog by "lele", an American writing from Toulouse. Mobile-first (most readers land on phones), Astro as the target stack, a few dozen posts, four editorial columns: **Food**, **Travel**, **Touloused & Confused** (her city), **Pardon My Franglais** (expat life). The site should read like a letter from a friend, not a publication.

## About the design files
The files in this bundle are **design references created in HTML** — prototypes showing intended look and behavior, not production code to copy. The task is to **recreate these designs in the target codebase** (Astro, per the brief) using its own components, content collections and conventions. If a different stack is chosen, implement the same designs idiomatically there.

Do not lift the inline styles wholesale; they exist so the mock renders standalone. Rebuild with the tokens in `astro-build-notes.md`.

## Fidelity
**High-fidelity.** Final colors, typography, spacing and layout. Recreate pixel-faithfully. Grey/striped diagonal blocks are **photo placeholders** — real photography replaces them at the same aspect ratios.

## Screens

### 1. Home (mobile, 375px) — `#home-mobile`
Purpose: first-time reader understands who lele is before the feed starts; returning reader jumps to the latest post.
Layout, top to bottom:
1. **Cast Iron masthead** (`#2E4552`, padding 16/18/26): 30px blue circle avatar + hamburger row; wordmark "fork spoon and straw" Bricolage 800, 38px, lh .98, ls -.035em, `#FDFAF4`, with a coral period; tagline Newsreader italic 19px at 82% white.
2. **Intro card** — raised `#FDFAF4`, radius 20, 1px `rgba(44,40,37,.09)` border, margin-top **-14px** so it overlaps the masthead. 74px round portrait with a 2px Roquefort `#5B7D8F` ring; "Bonjour, c'est *lele*." (Bricolage 700 23px, with "lele" in Newsreader italic coral); uppercase Roquefort eyebrow "AMERICAN IN TOULOUSE" 11px ls .08em; one Newsreader 17px/1.62 paragraph; "more about me →" 13px bold `#3E5C6B`.
3. **Category grid** — 2×2, gap 10, radius 16, card bg `#FDFAF4`, **3px left border**: Roquefort for Food/Travel, Saumon for the two named columns. Title Bricolage 700 18–19px, subtitle 11px `#8C837B`.
4. **"LATEST" rule** — Roquefort 11px uppercase label, 1px `rgba(91,125,143,.35)` rule, date right.
5. **Featured post card** — raised card, 340px photo, Roquefort pill "Travel", title Bricolage 700 32px lh 1.02 ls -.03em, Newsreader italic dek, Newsreader 17px excerpt, "read it →".
6. **Two-up feed** — deliberately uneven: left card image 170px, right card image 130px with `margin-top:26px`. Never equalize.
7. **Franglais promo** — solid Roquefort `#5B7D8F` block, Rosé label, Crème Bricolage 26px title, body with Rosé italics.
8. **"all 38 entries"** — 50px pill, 1.5px Roquefort outline.
9. **Newsletter** — Cast Iron band, Newsreader italic 26px headline, ghost input + Saumon "Send it" button (both 48px, radius 99).
10. **Footer** — 12px Truffle Gray left, "xx lele" Newsreader italic Paprika right.

### 2. Post (mobile) — `#post`
Cast Iron mini-header ("← Travel" in `#A9C4CE` + wordmark) over a 3px reading-progress track (`rgba(46,69,82,.2)` with a Saumon fill). Title block on Crème: Roquefort pill, Bricolage 700 36px lh .99 ls -.035em, Newsreader italic 20px dek in `#3E5C6B`, meta row (date · Roquefort dot · read time). 300px full-bleed hero. Body Newsreader 19px/1.68 `#332F2B` with a **Bricolage 800 62px Roquefort drop cap** (float left, lh .82). Section headings: 26px Roquefort rule + "STOP ONE" label + place name (Bricolage 700 26px Cast Iron) + Paprika italic subtitle. **Gallery**: horizontal scroller of 170×212 cards, gap 9, with "swipe — 6 photos" + a Roquefort progress bar. **Callout**: full-bleed Roquefort band, Rosé uppercase label, Newsreader italic 24px Crème. Signoff "xx lele" Newsreader italic 28px Paprika. Tags: Roquefort-outlined pills. "Read next" card on a hairline.

### 3. About + contact (mobile) — `#about`
Cast Iron header; Bricolage 800 40px "Bonjour, c'est *lele*." with the name in Newsreader italic Paprika; 330px portrait; two Newsreader 19px paragraphs; a three-row fact list (label left, Newsreader italic `#3E5C6B` right) separated by `rgba(91,125,143,.3)` rules; "Start here" card with a Saumon left border and three numbered links. **Contact block** (Cast Iron): "Say hello" label, Bricolage 700 32px "Tell me where to eat next", intro paragraph, name + email side by side (46px), 110px message field, full-width Saumon "Send it my way" button, "or find me" divider, Instagram/Email ghost buttons, Rosé "xx lele".

### 4. Category archive (mobile) — `#archive`
Cast Iron header carrying the category identity: Sea Salt rule + "CATÉGORIE", Bricolage 800 38px title, Newsreader italic dek, entry count. Filter chips (active = solid Roquefort, rest = Roquefort outline, horizontal scroll). One featured card (230px photo, Saumon "Coup de coeur" pill). "EVERYTHING ELSE" rule, then 100×126 thumb rows in raised cards. "load 11 more" outline pill. Newsletter + footer.

### 5. Home (desktop, 1280px) — `#home-desktop`
Cast Iron nav bar (six items, Contact in Rosé) flowing into a **full Cast Iron hero**: 1.25fr / .9fr grid — Bricolage 800 74px lh .94 greeting, Newsreader italic 24px tagline, Newsreader 19px paragraph, Saumon "Start here" + ghost "More about me" buttons; 430px portrait right. The **four category cards overlap the hero by -52px**. Then the LATEST rule; a featured card as a 1.15fr / 1fr split (photo left, 44px padded text right, title 52px); a three-column feed with staggered top margins (0 / 52px / 14px) where column three stacks the Roquefort franglais promo over a smaller card; a centered "all 38 entries" pill; a full-width Cast Iron newsletter band; footer.

## Interactions & behavior
- **Reading progress**: Saumon bar under the post header, width = scroll ratio. The only required JS on a post page.
- **Galleries**: CSS scroll-snap (`scroll-snap-type:x mandatory`, `scroll-snap-align:start`); the Roquefort bar under it reflects `scrollLeft / scrollWidth`. Degrades to a plain scroller without JS.
- **Filter chips** (archive): navigate to a filtered route; active chip = solid Roquefort, others Roquefort outline. No client-side filtering needed.
- **Hover** (desktop): cards lift 2px with shadow `0 14px 30px rgba(44,40,37,.14)` over 150ms ease-out; links go `#3E5C6B` → `#C2726B`; buttons darken ~6%.
- **Focus**: 2px Roquefort outline, 2px offset, on every interactive element. Do not remove it.
- **Forms**: newsletter and contact post to whatever provider is chosen; inline validation, success replaces the form with a Newsreader italic confirmation in the same band.
- **Responsive**: single breakpoint at 900px. Below it, everything is one column with 14–20px gutters; above, the layouts described in screen 5. Reading measure caps at 680px.
- **Motion**: none beyond hover/focus and the progress bar. Respect `prefers-reduced-motion`.

## State management
Effectively static. Per-page state only: scroll progress (post), gallery scroll position, form submit status (idle / submitting / success / error), mobile menu open/closed. Content comes from Astro content collections at build time — no client data fetching.

## Design tokens
Peach Melba `#F3E5DD` (page) · Crème `#FDFAF4` (card) · Cast Iron `#2E4552` (bands) · Roquefort `#5B7D8F` (structure, from the logo) · Roquefort Ink `#3E5C6B` (links on light) · Sea Salt `#A9C4CE` (labels on Cast Iron) · Saumon `#E0908A` (buttons) · Paprika `#C2726B` (franglais, signoff) · Rosé `#F5C7BF` (franglais on Cast Iron) · Espresso `#2C2825` (headlines) · Cacao `#332F2B` (body) · Truffle Gray `#8C837B` (meta) · Fleur de Sel `rgba(44,40,37,.09)` (hairline) · Roquefort rule `rgba(91,125,143,.30)`.

Spacing: 4 / 8 / 10 / 14 / 18 / 20 / 22 / 26 / 44 / 52. Gutters 14–20px mobile, 48px desktop.

Radius: 26 phone shell · 20 cards · 18 grid cards · 14/12 thumbs · 99 pills.

Shadow: cards `0 8px 22px rgba(44,40,37,.09)`; hover `0 14px 30px rgba(44,40,37,.14)`.

Type: see the table in `astro-build-notes.md`. Body never below 16px; reading measure 680px.

## Assets
No production imagery yet — every striped block is a placeholder to be replaced with the author's photography at the aspect ratios shown (hero 4:5 mobile / 3:2 desktop, gallery 170×212 ≈ 4:5, thumbs 1:1 and 100×126). Logo: `uploads/logo-*.avif` in the design project; the blue circle "f" in the mocks stands in for it. Fonts are Google Fonts (Bricolage Grotesque, Newsreader, DM Sans, DM Mono) — self-host for performance.

## Files
- `reference-mockups.html` — all five screens, static, opens in any browser.
- `astro-build-notes.md` — tokens, type scale, component breakdown, breakpoint and content rules.
