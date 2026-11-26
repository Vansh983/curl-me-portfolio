// The opening picture shown while the walk is prepared (public/assets/stage/preview.webp): the first frame, as the stage
// draws it. Remake it after any change to the apartment or the first key of the camera: node scripts/look/poster.mjs
import sharp from 'sharp';
import { open } from './stage.mjs';
const s = await open({ width: 1440, height: 900, cards: true });
await s.page.evaluate(() => scrollTo(0, 0));
await s.page.waitForTimeout(3000);
await s.page.addStyleTag({ content: '.wall, .cap { visibility:hidden !important; }' });
await sharp(await s.page.locator('canvas.gl').screenshot()).webp({ quality: 82 }).toFile('public/assets/stage/preview.webp');
console.log(await sharp('public/assets/stage/preview.webp').metadata().then((m) => [m.width, m.height]));
await s.close();
