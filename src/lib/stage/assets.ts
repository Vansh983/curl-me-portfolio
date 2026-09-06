// Every downloaded model on the stage, by name. The fetch script (scripts/stage-assets.mjs)
// turns this into optimised .glb files under public/assets/stage/ and a credits file; the runtime
// only ever asks assetUrl(). Everything is Poly Haven, CC0. Model textures are capped at 512 px
// and scanned surfaces at 1k: the whole set has to stay light enough for a phone on a bad connection.
export type Licence = 'CC0' | 'CC-BY-3.0' | 'RF'; // RF: BlenderKit royalty free (use anywhere, no credit, the file itself is not for resale)
export type TexMap = 'diff' | 'nor' | 'arm'; // colour, normal (gl), and ambient occlusion + roughness + metalness packed in r, g, b
export interface Asset {
  id: string; // the Poly Haven slug, or our own name for a url asset
  kind: 'model' | 'texture';
  source: 'polyhaven' | 'url' | 'blenderkit';
  url?: string; // source 'url': a direct .glb
  bk?: number; // source 'blenderkit': the numeric download id of the gltf file (api/v1/downloads/<id>/)
  res: '1k';
  licence: Licence;
  author: string;
  use: string; // where it goes, for the credits file
  maxTex: 256 | 512 | 1024;
  simplify?: number; // meshopt simplification error (fraction of the mesh's size); off when absent
  anims?: string[]; // rigged models: the animation clips to keep, the rest are dropped
  maps?: TexMap[]; // textures: which maps to ship (a wall keeps its designed colour and takes only the relief)
  size?: number; // textures: metres per repeat, from the scan
}

const model = (id: string, author: string, use: string, maxTex: 256 | 512 = 512, simplify?: number): Asset =>
  ({ id, kind: 'model', source: 'polyhaven', res: '1k', licence: 'CC0', author, use, maxTex, simplify });
const kit = (id: string, bk: number, author: string, use: string, maxTex: 256 | 512 = 512, simplify?: number): Asset =>
  ({ id, kind: 'model', source: 'blenderkit', bk, res: '1k', licence: 'RF', author, use, maxTex, simplify });
const texture = (id: string, author: string, use: string, size: number, maps: TexMap[], maxTex: 512 | 1024 = 512): Asset =>
  ({ id, kind: 'texture', source: 'polyhaven', res: '1k', licence: 'CC0', author, use, maxTex, maps, size });

export const ASSETS: Asset[] = [
  // now, Toronto
  model('desk_lamp_arm_01', 'Yann Kervran', 'the desk lamp', 256),
  model('steel_frame_shelves_01', 'James Ray Cock', 'the shelves behind the desk'),
  model('potted_plant_01', 'Rico Cilliers', 'the plant by the window', 256, 0.004),
  kit('office_chair_black', 1003111, 'BlenderKit (Blender Interior)', 'the office chair'),
  kit('laptop_14_aluminium', 945638, 'BlenderKit (Blender Interior)', 'the laptop'),
  kit('keyboard_mouse_black', 927116, 'BlenderKit (Blender Interior)', 'the keyboard and mouse'),
  kit('bed_single', 1273846, 'BlenderKit', 'the bed along the window'),
  model('modern_arm_chair_01', 'Vibrant Nordic', 'the armchair facing the window'),
  kit('pendant_tense', 853305, 'BlenderKit', 'the pendant over the armchair', 256),
  kit('wall_art_circles', 919410, 'BlenderKit', 'the print by the condo door', 512),
  kit('coffee_mug', 782558, 'BlenderKit', 'the mug on the desk', 256),
  kit('headphones_retro', 1049005, 'BlenderKit', 'the headphones on the desk', 256, 0.004),
  model('side_table_01', 'James Ray Cock', 'the side table by the armchair', 256),
  // 2010, the room
  model('television_02', 'Benny Weimer', 'the CRT television, and scaled down, the lab monitors'),
  model('ceiling_fan', 'Ulan Cabanilla', 'the ceiling fan'),
  kit('xbox_controller', 1143937, 'BlenderKit', 'the controller on the rug', 256, 0.001),
  model('football', 'Amal Kumar', 'the football', 256),
  model('book_encyclopedia_set_01', 'John Malcolm', 'the books on the shelf', 256),
  model('throw_pillows_01', 'Serhii Khromov', 'cushions on the rug', 256),
  // 2013, the lab
  model('SchoolDesk_01', 'Ethan Place', 'the lab desks'),
  model('SchoolChair_01', 'Ethan Place', 'the lab chairs'),
  model('wall_clock', 'PierreB3D', 'the clock', 256),
  // 2018, the plaza
  model('island_tree_01', 'Rob Tuytel', 'the trees by the plaza (1.6 M triangles scanned, simplified hard)', 512, 0.003),
  kit('palm_medium', 609465, 'BlenderKit (CC0)', 'the palms along the Embarcadero'),
  // scanned surfaces: floors take the whole set, walls and cloth take only the relief and keep their designed colour
  texture('herringbone_parquet', 'Jenelle van Heerden', 'the condo floor', 3.4, ['diff', 'nor', 'arm'], 1024),
  texture('dark_brick_wall', 'Dario Barresi', 'the wall behind the desk', 1.05, ['diff', 'nor', 'arm']),
  texture('plank_flooring_02', 'Dario Barresi', 'the 2010 room floor', 1.98, ['diff', 'nor', 'arm'], 1024),
  texture('plastered_wall_04', 'Rob Tuytel', 'the relief of every plastered wall', 3.2, ['nor', 'arm']),
  texture('wool_boucle', 'colormass', 'the office chair, the pouf', 0.35, ['nor', 'arm']),
  texture('polar_fleece', 'colormass', 'the duvet and the pillow', 0.27, ['nor', 'arm']),
  texture('cotton_jersey', 'colormass', 'the curtains', 0.26, ['nor', 'arm']),
  texture('dirty_carpet', 'Rohit Seervi', 'the rugs', 0.6, ['nor', 'arm']),
  texture('oak_veneer_01', 'Jenelle van Heerden', 'the shelves, the bed frame', 1.83, ['diff', 'nor', 'arm']),
  texture('asphalt_02', 'Rob Tuytel', 'the Embarcadero road', 3.0, ['diff', 'nor', 'arm']),
];

export const assetUrl = (a: Asset): string => (a.kind === 'texture' ? `/assets/stage/tex/${a.id}` : `/assets/stage/${a.id}.glb`);

export const asset = (id: string): Asset => {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`no asset ${id}`);
  return a;
};
