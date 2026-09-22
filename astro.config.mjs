// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import stageDelivery from './scripts/stage-delivery.mjs';

// Static output. No adapter: every route is a file on the CDN.
// The only dynamic hop is Vercel Routing Middleware (see /middleware.ts) for curl.
export default defineConfig({
  site: 'https://vanshsood.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [sitemap(), stageDelivery()],
  vite: {
    // Lightning CSS (Vite's default minifier) folds animation-timeline into the
    // animation shorthand, which browsers reject (parcel-bundler/lightningcss#1283).
    // esbuild leaves the longhands alone.
    build: { cssMinify: 'esbuild' },
    // the bake's exporter is imported on demand: pre-bundle it, or Vite re-optimises mid-session and answers 504 (Outdated Optimize Dep)
    optimizeDeps: { include: ['three/examples/jsm/exporters/GLTFExporter.js'] },
  },
  markdown: {
    // css-variables keeps code blocks on the brand tokens in both themes.
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
});
