// Every scanned model on the stage, by name. The fetch script (scripts/stage-assets.mjs) turns
// this into optimised .glb files under public/assets/stage/ and a credits file; the runtime only
// ever asks assetUrl(). All of it is Poly Haven, CC0. Textures are capped at 512 px: the whole
// set has to stay light enough for a phone on a bad connection.
export type AssetKind = 'model';
export interface Asset {
  id: string; // the Poly Haven slug
  kind: AssetKind;
  res: '1k';
  licence: 'CC0';
  author: string;
  use: string; // where it goes, for the credits file
  maxTex: 256 | 512;
  simplify?: number; // meshopt simplification error (fraction of the mesh's size); off when absent
}

const model = (id: string, author: string, use: string, maxTex: 256 | 512 = 512, simplify?: number): Asset =>
  ({ id, kind: 'model', res: '1k', licence: 'CC0', author, use, maxTex, simplify });

export const ASSETS: Asset[] = [
  // 2010, the room
  model('television_02', 'Benny Weimer', 'the CRT television, and scaled down, the lab monitors'),
  model('ceiling_fan', 'Ulan Cabanilla', 'the ceiling fan'),
  model('gaming_console', 'Sean Buckley', 'the Xbox 360'),
  model('gamepad', 'Josh Dean', 'the controller on the rug', 256),
  model('football', 'Amal Kumar', 'the football', 256),
  model('book_encyclopedia_set_01', 'John Malcolm', 'the books on the shelf', 256),
  model('throw_pillows_01', 'Serhii Khromov', 'cushions on the rug', 256),
  // 2013, the lab
  model('SchoolDesk_01', 'Ethan Place', 'the lab desks'),
  model('SchoolChair_01', 'Ethan Place', 'the lab chairs'),
  model('wall_clock', 'PierreB3D', 'the clock', 256),
  // 2018, the plaza
  model('street_lamp_01', 'Josh Dean', 'the lamp post'),
  model('modular_street_seating', 'Stuart Attenborrow', 'the bench'),
  model('island_tree_01', 'Rob Tuytel', 'the trees by the plaza (1.6 M triangles scanned, simplified hard)', 512, 0.003),
];

export const assetUrl = (a: Asset): string => `/assets/stage/${a.id}.glb`;

export const asset = (id: string): Asset => {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`no asset ${id}`);
  return a;
};
