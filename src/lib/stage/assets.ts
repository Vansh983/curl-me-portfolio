// Every downloaded model on the stage, by name. The fetch script (scripts/stage-assets.mjs)
// turns this into optimised .glb files under public/assets/stage/ and a credits file; the runtime
// only ever asks assetUrl(). Downloaded assets carry their licences; local geometry has a rebuild script. Model textures are capped at 512 px
// and scanned surfaces at 1k: the whole set has to stay light enough for a phone on a bad connection.
export type Licence = 'CC0' | 'CC-BY-3.0' | 'CC-BY-4.0' | 'RF' | 'Original'; // Original: project-authored geometry; RF: BlenderKit royalty free
export type TexMap = 'diff' | 'nor' | 'arm'; // colour, normal (gl), and ambient occlusion + roughness + metalness packed in r, g, b
export interface Asset {
  id: string; // the Poly Haven slug, or our own name for a url asset
  kind: 'model' | 'texture';
  source: 'polyhaven' | 'url' | 'blenderkit' | 'sketchfab' | 'local';
  url?: string; // source 'url': a direct .glb; source 'sketchfab': the model page (the file is downloaded by hand with an account into .cache/polyhaven/<id>/<id>.glb)
  bk?: number; // source 'blenderkit': the numeric download id of the gltf file (api/v1/downloads/<id>/)
  res: '1k';
  licence: Licence;
  author: string;
  use: string; // where it goes, for the credits file
  maxTex: 256 | 512 | 1024;
  simplify?: number; // meshopt simplification error (fraction of the mesh's size); off when absent
  anims?: string[]; // rigged models: the animation clips to keep, the rest are dropped
  drop?: string[]; // node names (or `prefix*`) cut before optimising: the unseen and the too dense
  skin?: Record<string, { color?: string; map?: false; emissive?: false; rough?: number; metal?: number }>; // material names: colour, roughness and metalness set at load, the colour map or the glow dropped (a night-lit model in daylight)
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
  { id: 'dalhousie_campus', kind: 'model', source: 'local', res: '1k', licence: 'Original', author: 'Project-authored in Blender', use: 'the dimensional Goldberg campus seen while airborne', maxTex: 512 },
  // 2024, Sydney: out of the hacker house window. Downloaded from Sketchfab with the user's account into the cache; the pipeline optimises it from there
  { id: 'sydney_opera_house', kind: 'model', source: 'sketchfab', url: 'https://sketchfab.com/3d-models/sydney-opera-house-317b2d540f0a4f7e8d87dd3b0372712d', res: '1k', licence: 'CC-BY-4.0', author: 'Nick Reinhardt (Sketchfab)', use: 'the Opera House across the water from the Sydney window', maxTex: 512, simplify: 0.001,
    drop: ['Plane_3', 'Object_12', 'Object_15', 'Object_17'], // its painted night sky, its water and its camera: the harbour is ours
    // modelled for a night scene: the shells and the podium take daylight colours here, and nothing glows
    skin: { FINS: { color: '#EDE7DA', map: false, emissive: false, rough: 0.45 }, STONE: { color: '#B9AE9A', map: false, emissive: false, rough: 0.85 }, GLASS: { color: '#3C4A56', map: false, rough: 0.2 }, BRONZE: { color: '#8A6A3F', rough: 0.5, metal: 0.6 }, LIGHT: { emissive: false }, LIGHTPOLE: { color: '#4A4A4A', map: false } } },
  // now, Toronto
  // 2010, the Delhi bedroom
  model('wooden_bookshelf_worn', 'Ulan Cabanilla', 'the bookshelf in the bedroom: the figures and the encyclopedias', 256, 0.004),
  model('wooden_table_02', 'Serhii Khromov', 'the study table in the bedroom', 256, 0.004),
  model('painted_wooden_chair_01', 'Kuutti Siitonen', 'the chair at the study table', 256, 0.004),
  model('alarm_clock_01', 'Yann Kervran, James Ray Cock', 'the alarm clock on the study table', 256, 0.004),
  model('desk_lamp_arm_01', 'Yann Kervran', 'the desk lamp, and the bedside lamp', 256, 0.004),
  model('steel_frame_shelves_01', 'James Ray Cock', 'the shelves behind the desk'),
  model('potted_plant_01', 'Rico Cilliers', 'the plant by the window', 256, 0.004),
  kit('office_chair_black', 1003111, 'BlenderKit (Blender Interior)', 'the office chair', 512, 0.004),
  kit('laptop_14_aluminium', 945638, 'BlenderKit (Blender Interior)', 'the laptop', 512, 0.003),
  kit('keyboard_mouse_black', 927116, 'BlenderKit (Blender Interior)', 'the keyboard and mouse', 512, 0.004),
  kit('bed_single', 1273846, 'BlenderKit', 'the bed along the window'),
  model('modern_arm_chair_01', 'Vibrant Nordic', 'the armchair facing the window'),
  kit('pendant_tense', 853305, 'BlenderKit', 'the pendant over the armchair', 256),
  kit('wall_art_circles', 919410, 'BlenderKit', 'the print by the condo door', 512),
  kit('coffee_mug', 782558, 'BlenderKit', 'the mug on the desk', 256),
  model('side_table_01', 'James Ray Cock', 'the side table by the armchair', 256),
  kit('bed_double', 444375, 'BlenderKit', 'the bed in the bedroom', 512, 0.004),
  kit('nightstand_modern', 590108, 'BlenderKit', 'the nightstand', 256),
  kit('sofa_teak', 940237, 'BlenderKit', 'the sofa', 512),
  kit('coffee_table_square', 1088749, 'BlenderKit', 'the coffee table', 256),
  kit('tv_stand', 780861, 'BlenderKit', 'the unit under the television, and the bedroom dresser', 256),
  { ...kit('kitchen_modern', 1019778, 'BlenderKit', 'the kitchen run with its appliances', 512, 0.002), drop: ['Fridge_compressor', 'Fridge_coils', 'Fridge_Hinges', 'Towel', 'Wine_Glass_3', 'Wine_Glass_4', 'Wine_Glass_5', 'Wine_Glass_6', 'Wine_Glass_7', 'Wine_Glass_8'] },
  kit('bathtub_abrazo', 1197628, 'BlenderKit', 'the bathtub', 256),
  kit('toilet_ceramic', 544975, 'BlenderKit', 'the toilet', 256, 0.004),
  kit('basin_mirror', 892665, 'BlenderKit', 'the basin and mirror', 512, 0.004),
  kit('shoe_rack_modern', 463109, 'BlenderKit', 'the shoe rack by the front door', 256),
  // 2010, the room
  model('television_02', 'Benny Weimer', 'the CRT television, and scaled down, the lab monitors'),
  model('ceiling_fan', 'Ulan Cabanilla', 'the ceiling fan'),
  kit('xbox_controller', 1143937, 'BlenderKit', 'the controller on the rug', 256, 0.001),
  model('football', 'Amal Kumar', 'the football', 256),
  model('book_encyclopedia_set_01', 'John Malcolm', 'the books on the shelf', 256, 0.004),
  model('throw_pillows_01', 'Serhii Khromov', 'cushions on the rug', 256),
  // 2013, the lab
  model('SchoolDesk_01', 'Ethan Place', 'the lab desks'),
  model('SchoolChair_01', 'Ethan Place', 'the Dalhousie classroom chairs'),
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
  texture('concrete_pavement', 'Charlotte Baglioni', 'the paving of the promenade', 2.0, ['diff', 'nor', 'arm']),
];

export const assetUrl = (a: Asset): string => (a.kind === 'texture' ? `/assets/stage/tex/${a.id}` : `/assets/stage/${a.id}.glb`);

export const asset = (id: string): Asset => {
  const a = ASSETS.find((x) => x.id === id);
  if (!a) throw new Error(`no asset ${id}`);
  return a;
};
