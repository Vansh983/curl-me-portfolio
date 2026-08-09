// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Static output. No adapter: every route is a file on the CDN.
// The only dynamic hop is Vercel Routing Middleware (see /middleware.ts) for curl.
export default defineConfig({
  site: 'https://vanshsood.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap()],
  markdown: {
    // css-variables keeps code blocks on the brand tokens in both themes.
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
});
