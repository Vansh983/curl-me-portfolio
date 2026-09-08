// Licensed location photograph for the cinematic window/phone backdrop, not a building scan.
import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
const url = 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Goldberg_Computer_Science_Building%2C_Dalhousie_University_%E2%80%93_Halifax%2C_NS_%E2%80%93_%282018-08-26%29.jpg';
const response = await fetch(url, { headers: { 'User-Agent': 'PortfolioAssets/1.0 (licensed Wikimedia Commons asset)' } });
if (!response.ok) throw new Error(`Campus photograph: HTTP ${response.status}`);
await mkdir('.cache/halifax', { recursive: true });
const input = Buffer.from(await response.arrayBuffer());
await writeFile('.cache/halifax/goldberg-original.jpg', input);
await sharp(input).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 86 }).toFile('public/assets/scenes/dalhousie-goldberg.webp');
