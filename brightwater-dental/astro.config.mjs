// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages project name is fixed: brightwater-dental (same in wrangler.toml and public/robots.txt).
export default defineConfig({
  site: 'https://brightwater-dental.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|thanks|404)\/?$/.test(page) })],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
