import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Stable URLs by content: a changed model never reuses a year-cached URL. */
export function deliveryManifest(publicDir) {
  return readdirSync(join(publicDir, 'assets'), { recursive: true }).filter((file) => /\.(glb|webp|png|jpe?g|mp4)$/.test(file)).map((file) => {
    const source = join(publicDir, 'assets', file), content = readFileSync(source);
    const hash = createHash('sha256').update(content).digest('hex').slice(0, 16);
    const path = relative(publicDir, source).replaceAll('\\', '/');
    return { path: `/${path}`, versioned: `/${path.replace(/^assets\//, `assets/versioned/${hash}/`)}`, content };
  });
}

/** @returns {import('astro').AstroIntegration} */
export default function stageDelivery() {
  let files = [];
  return {
    name: 'stage-delivery',
    hooks: {
      'astro:config:setup': ({ command, config, updateConfig }) => {
        files = command === 'build' ? deliveryManifest(fileURLToPath(config.publicDir)) : [];
        updateConfig({ vite: { define: { __STAGE_ASSET_URLS__: JSON.stringify(Object.fromEntries(files.map((file) => [file.path, file.versioned]))) } } });
      },
      'astro:build:done': async ({ dir }) => {
        for (const file of files) {
          const destination = join(fileURLToPath(dir), file.versioned.slice(1));
          await mkdir(dirname(destination), { recursive: true });
          await writeFile(destination, file.content);
        }
      },
    },
  };
}
