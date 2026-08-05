// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkGfm from 'remark-gfm';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.forkspoonandstraw.com',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    processor: unified({ remarkPlugins: [remarkGfm] }),
  },
});
