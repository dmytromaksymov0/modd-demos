// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://kestrel-roofing-co.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|thanks)\/$/.test(page) })],
  build: { inlineStylesheets: 'always' }, // ~10 KB of CSS: inline it, no render-blocking request
  vite: { plugins: [tailwindcss()] },
});
