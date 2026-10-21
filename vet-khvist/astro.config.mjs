// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages project name: vet-khvist (= name in wrangler.toml, robots.txt). Checked free with curl on 21.10.2026.
export default defineConfig({
  site: 'https://vet-khvist.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|dyakuyemo|404)(\/|$)/.test(page) })],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
