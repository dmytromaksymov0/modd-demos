// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages project name: vyshnia-beauty (= name in wrangler.toml, robots.txt). Checked free with curl on 21.10.2026.
export default defineConfig({
  site: 'https://vyshnia-beauty.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|zapysano|404)(\/|$)/.test(page) })],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
