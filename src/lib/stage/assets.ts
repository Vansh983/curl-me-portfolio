// Every scanned thing on the stage, by name. The fetch script (scripts/stage-assets.mjs) turns
// this into files under public/assets/stage/ and a credits file; the runtime only ever asks
// assetUrl(). All of it is Poly Haven, CC0.
export type AssetKind = 'model' | 'hdri' | 'texture';
export interface Asset {
  id: string; // the Poly Haven slug
  kind: AssetKind;
  res: '1k' | '2k';
  licence: 'CC0';
  author: string;
  use: string; // where it goes, for the credits file
  maxTex?: 512 | 1024; // models: cap on texture size after optimisation (default 1024)
  simplify?: number; // models: meshopt simplification error (fraction of the mesh's size); off when absent
}

const model = (id: string, author: string, use: string, maxTex?: 512 | 1024, simplify?: number): Asset => ({ id, kind: 'model', res: '1k', licence: 'CC0', author, use, maxTex, simplify });
const hdri = (id: string, author: string, use: string, res: '1k' | '2k' = '1k'): Asset => ({ id, kind: 'hdri', res, licence: 'CC0', author, use });
const tex = (id: string, author: string, use: string): Asset => ({ id, kind: 'texture', res: '1k', licence: 'CC0', author, use });

export const ASSETS: Asset[] = [
  // light
  hdri('small_empty_room_1', 'Sergej Majboroda', '2010: the room, afternoon sun through a window'),
  hdri('school_hall', 'Dimitrios Savva', '2013: the lab, tube light and a high window'),
  hdri('golden_gate_hills', 'Dimitrios Savva', '2018: the plaza, the sky and the Marin hills', '2k'),
  // 2010, the room
  model('television_02', 'Benny Weimer', 'the CRT television, and scaled down, the lab monitors'),
  model('ceiling_fan', 'Ulan Cabanilla', 'the ceiling fan'),
  model('gaming_console', 'Sean Buckley', 'the Xbox 360'),
  model('gamepad', 'Josh Dean', 'the controller on the rug', 512),
  model('football', 'Amal Kumar', 'the football', 512),
  model('wooden_bookshelf_worn', 'Ulan Cabanilla', 'the shelf'),
  model('book_encyclopedia_set_01', 'John Malcolm', 'the books on the shelf', 512),
  model('hanging_picture_frame_01', 'James Ray Cock', 'the Jobs poster frame', 512),
  model('throw_pillows_01', 'Serhii Khromov', 'cushions on the rug', 512),
  // 2013, the lab
  model('SchoolDesk_01', 'Ethan Place', 'the lab desks'),
  model('SchoolChair_01', 'Ethan Place', 'the lab chairs'),
  model('wall_clock', 'PierreB3D', 'the clock', 512),
  // 2018, the plaza
  model('street_lamp_01', 'Josh Dean', 'the lamp post'),
  model('modular_street_seating', 'Stuart Attenborrow', 'the bench'),
  model('island_tree_01', 'Rob Tuytel', 'the trees by the plaza (1.6 M triangles scanned, simplified to about a tenth)', 512, 0.0015),
  // surfaces on code-built shells
  tex('plank_flooring', 'Dario Barresi', 'the room floor'),
  tex('painted_plaster_wall', 'Amal Kumar', 'the passage walls'),
  tex('plastered_wall', 'Amal Kumar', 'the room walls, cream distemper'),
  tex('white_plaster_02', 'Rob Tuytel', 'the lab walls'),
  tex('ceiling_interior', 'Dimitrios Savva', 'the ceilings'),
  tex('old_linoleum_flooring_01', 'Charlotte Baglioni', 'the lab floor'),
  tex('concrete_pavement', 'Charlotte Baglioni', 'the plaza'),
  tex('dirty_carpet', 'Rohit Seervi', 'the rug'),
  tex('cotton_jersey', 'colormass', 'the curtains'),
];

export const assetUrl = (a: Asset): string =>
  a.kind === 'model' ? `/assets/stage/${a.id}.glb`
  : a.kind === 'hdri' ? `/assets/stage/${a.id}_${a.res}.hdr`
  : `/assets/stage/tex/${a.id}`;

export const asset = (id: string): Asset => {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`no asset ${id}`);
  return a;
};
