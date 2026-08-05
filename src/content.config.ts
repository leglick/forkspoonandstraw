import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*/index.md', base: './src/content/posts' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      slug: z.string(),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      categories: z.array(z.string()),
      tags: z.array(z.string()),
      cover: image(),
      description: z.string(),
      readTime: z.number(),
      // Manual override for the "Read next" card at the bottom of the post.
      // Value is another post's `slug`. Falls back to the default
      // reverse-chronological pick (see PostLayout.astro) if omitted or if
      // the slug doesn't match any post.
      readNext: z.string().optional(),
    }),
});

export const collections = { posts };
