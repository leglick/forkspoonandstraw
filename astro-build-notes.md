# fork spoon and straw — build notes (Astro)

Reference design: `Fork Spoon and Straw.dc.html`, turn 7 (7a home, 7b post, 7c about + contact).

## Tokens

```css
:root {
  /* surfaces — three layers, never flat */
  --melba:      #F3E5DD; /* Peach Melba — page background */
  --creme:      #FDFAF4; /* Crème — raised surface: posts, cards, reading areas */
  --cast-iron:  #2E4552; /* Cast Iron — masthead, newsletter, contact, footer bands */

  /* brand */
  --roquefort:      #5B7D8F; /* Roquefort — the logo blue. Structure: pills, rules, drop cap, callout */
  --roquefort-ink:  #3E5C6B; /* Roquefort Ink — links + text on light surfaces (contrast-safe) */
  --sea-salt:       #A9C4CE; /* Sea Salt — labels on Cast Iron */
  --saumon:     #E0908A; /* Saumon — buttons, accents on dark */
  --paprika:    #C2726B; /* Paprika — franglais italics + signoff on light */
  --rose:       #F5C7BF; /* Rosé — franglais + labels on Cast Iron */

  /* text */
  --espresso: #2C2825; /* Espresso — headlines */
  --cacao:    #332F2B; /* Cacao — body copy */
  --truffle:  #8C837B; /* Truffle Gray — metadata, captions */

  --fleur-de-sel: rgba(44,40,37,.09); /* hairline borders */
  --rule-roquefort: rgba(91,125,143,.30);
  --shadow-card: 0 8px 22px rgba(44,40,37,.09);
}
```

Rule of thumb: Saumon/Paprika are highlighters, not UI colors. Roquefort is structure. If something is interactive or organizing, it's Roquefort; if it's a flourish in the writing, it's Paprika.

## Type

Google Fonts: `Bricolage+Grotesque:opsz,wght@12..96,400;600;700;800`, `Newsreader:ital,opsz,wght@0,6..72,400;500;1,6..72,400`, `DM+Sans:wght@400;500;600;700`, `DM+Mono:wght@400` (optional, captions only).

| Role | Font | Size / LH |
|---|---|---|
| Masthead | Bricolage 800, ls -.035em | 38px mob / 56px desk |
| Post title | Bricolage 700, ls -.035em | 36px mob / 52px desk, lh .99–1.03 |
| Card title | Bricolage 700, ls -.02em | 19–26px, lh 1.1 |
| Section heading (place name) | Bricolage 700 | 26px, color `--slate` |
| Body | Newsreader 400 | 19px / 1.68 (17px in cards) |
| Dek + pull quote + signoff | Newsreader italic | 20–28px |
| Franglais | Newsreader italic, Paprika | inherits |
| Pills, buttons, meta, nav | DM Sans 600/700 | 10–14px, uppercase ls .06–.14em for labels |

Reading measure 680px. Never below 16px body on mobile.

## Components

- `Masthead.astro` — Cast Iron band; logo dot, wordmark, hamburger. Sticky variant on post pages with a 3px Saumon progress bar.
- `IntroCard.astro` — home only, overlaps the masthead by -14px; round portrait with a 2px Roquefort ring, greeting, 2 sentences, "more about me".
- `CategoryGrid.astro` — 2×2 mobile / 4-up desktop; card with 3px left border (Roquefort for Food + Travel, Saumon for the two named columns).
- `FeaturedPost.astro` — raised card, image on top, Roquefort category pill, title, dek, excerpt, "read it →".
- `PostCard.astro` — props: `size` (`lg`/`sm`). Sizes must differ on purpose: staggered top margin (26px) and different image heights (170 vs 130) so the grid never lines up.
- `SectionHeading.astro` — 26px Roquefort rule + "STOP ONE" label + place name + Paprika italic tagline.
- `Gallery.astro` — horizontal scroller from a named subfolder; 170×212 items, 9px gap, `scroll-snap-type: x mandatory`, Roquefort progress bar underneath. CSS-only; JS only to update the bar (progressive enhancement).
- `Callout.astro` — full-bleed Roquefort band, Rosé label, Newsreader italic. One per post, max.
- `TagRow.astro` — Roquefort-outlined pills.
- `NewsletterBlock.astro` / `ContactBlock.astro` — Cast Iron bands, Saumon button. Contact adds name/email/message + Instagram/Email fallbacks.
- `Signoff.astro` — "xx lele", Newsreader italic 28px, Paprika. Ends every post.
- `Footer.astro`

## Layout / breakpoints

Mobile-first, single breakpoint at 900px (design targets 375 and 1280).

- Page gutters: 14px mobile (cards) / 20px (text) → 48px desktop.
- Home desktop: intro splits 1.25fr / .9fr with the portrait right; latest post 1.15fr / 1fr image-left; then a 3-column feed with staggered `padding-top` (0 / 52px / 14px) — that stagger is the whole personality, don't normalize it.
- Post desktop: single 680px column centered; hero, gallery and callout bleed full width.
- Archive: Cast Iron header, category title + dek, Roquefort filter chips (horizontal scroll on mobile), one featured card then 100×126 thumb rows.
- Radii: 26px phone shell, 20px cards, 14px thumbs, 99px pills.

## Content rules

- Every post ends with the signoff. Every post has ≥1 gallery and at most one callout.
- French words are wrapped in `<em>` and styled Paprika by the prose stylesheet — authors just write markdown italics.
- Frontmatter: `title, dek, category, date, readingTime, hero, tags[], galleries[]`; images co-located with the post.

## Non-negotiables

Zero JS for reading. No uniform card heights. No pure white, no pure black. Saumon never used for large surfaces.
