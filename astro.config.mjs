// @ts-check
import { defineConfig } from 'astro/config';
import { parseFrontmatter } from 'astro/markdown';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import stageDelivery from './scripts/stage-delivery.mjs';

const blogDirectory = new URL('./src/content/blog/', import.meta.url);
const blogLastmod = new Map(
  readdirSync(blogDirectory, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const { frontmatter } = parseFrontmatter(readFileSync(new URL(file, blogDirectory), 'utf8'));
      return [`/blog/${file.slice(0, -3)}`, new Date(frontmatter.updatedDate ?? frontmatter.pubDate).toISOString()];
    })
);

// Static output. No adapter: every route is a file on the CDN.
// The only dynamic hop is Vercel Routing Middleware (see /middleware.ts) for curl.
export default defineConfig({
  site: 'https://vanshsood.com',
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sitemap({
      serialize(item) {
        const lastmod = blogLastmod.get(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    stageDelivery(),
  ],
  vite: {
    // Lightning CSS (Vite's default minifier) folds animation-timeline into the
    // animation shorthand, which browsers reject (parcel-bundler/lightningcss#1283).
    // esbuild leaves the longhands alone.
    build: { cssMinify: 'esbuild' },
    // the bake's exporter is imported on demand: pre-bundle it, or Vite re-optimises mid-session and answers 504 (Outdated Optimize Dep)
    optimizeDeps: { include: ['three/examples/jsm/exporters/GLTFExporter.js', 'three-mesh-bvh'] },
  },
  markdown: {
    // css-variables keeps code blocks on the brand tokens in both themes.
    shikiConfig: { theme: 'css-variables', wrap: true },
  },
});
