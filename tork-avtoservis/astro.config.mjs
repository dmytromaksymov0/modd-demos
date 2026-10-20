// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages project name: tork-avtoservis (= name in wrangler.toml, robots.txt). Checked free on 20.10.2026.
export default defineConfig({
  site: 'https://tork-avtoservis.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|dyakuyemo|404)\/?$/.test(page) })],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
