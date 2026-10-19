// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// Pages project name: brightwater-dental (= name in wrangler.toml). Cloudflare gave it the subdomain
// brightwater-dental-ba5.pages.dev because brightwater-dental.pages.dev belongs to another account.
export default defineConfig({
  site: 'https://brightwater-dental-ba5.pages.dev',
  integrations: [sitemap({ filter: (page) => !/\/(styleguide|thanks|404)\/?$/.test(page) })],
  build: { inlineStylesheets: 'always' },
  vite: { plugins: [tailwindcss()] },
});
