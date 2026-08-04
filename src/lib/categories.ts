import { slugify } from './slugify';

// Known categories carried over from the Wix site, with their existing
// URL slugs preserved so old links keep working after migration.
// `accent` drives the CategoryGrid left-border color per the design spec:
// roquefort (blue) for the two generic categories, saumon (coral) for the
// two named/branded ones.
export const CATEGORIES = [
  { label: 'Travel', slug: 'travel', accent: 'roquefort' },
  { label: 'Pardon My Franglais', slug: 'pardon-my-franglais', accent: 'saumon' },
  { label: 'Food', slug: 'food', accent: 'roquefort' },
  { label: 'Touloused & Confused', slug: 'touloused-confused', accent: 'saumon' },
] as const;

const labelToSlug = new Map<string, string>(CATEGORIES.map((c) => [c.label, c.slug]));
const slugToLabel = new Map<string, string>(CATEGORIES.map((c) => [c.slug, c.label]));

export function getCategorySlug(label: string): string {
  return labelToSlug.get(label) ?? slugify(label);
}

export function getCategoryLabel(slug: string): string {
  return slugToLabel.get(slug) ?? slug;
}
