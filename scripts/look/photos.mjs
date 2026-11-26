// His photographs for the stage, cut to 4:3 and stripped of their EXIF: node scripts/look/photos.mjs <dir with the originals>
// The originals are not in the repository: the award is in his Google Drive (IMG_20190627_100614_Original.jpg), the
// sign is on the curl-era branch (git show curl-era:public/assets/story/google-code.jpeg). Name them award.jpg and google-code.jpeg.
import sharp from 'sharp';
const S = process.argv[2], out = 'public/assets/stage/photos';
await sharp(`${S}/google-code.jpeg`).rotate().resize(1280, 960, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}/google-sign.jpg`);
// the award: the screen with his name, the trophies, the two of them, the banner; the cart on the right left out: the widest 4:3 of the frame
await sharp(`${S}/award.jpg`).rotate().extract({ left: 300, top: 0, width: 3000, height: 2250 }).resize(1280, 960, { fit: 'cover' }).jpeg({ quality: 82, mozjpeg: true }).toFile(`${out}/google-award.jpg`);
for (const f of ['google-sign', 'google-award']) console.log(f, await sharp(`${out}/${f}.jpg`).metadata().then((m) => [m.width, m.height, m.exif ? 'exif' : 'no exif']));
