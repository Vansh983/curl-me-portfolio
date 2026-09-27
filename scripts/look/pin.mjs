// One frame from a camera put anywhere: node scripts/look/pin.mjs <out.png> <set> "x,y,z,lx,ly,lz" [chapter]
// The set decides the light; the chapter decides what has moved or opened by then.
import { open } from './stage.mjs';
const [out, set, cam, c = '0'] = process.argv.slice(2);
const s = await open({ query: `&set=${set}&cam=${cam}${process.env.LIVE ? '&live' : ''}` });
await s.go(+c);
await s.page.screenshot({ path: out });
await s.close();
