import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '*/index.{md,mdx}', base: './src/content/posts' }),
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
    }),
});

export const collections = { posts };
