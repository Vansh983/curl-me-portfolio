// Trims a downloaded model before the asset pipeline optimises it: drops the nodes wider than `max` metres in x or z
// (a site slab, a Google Earth snapshot under a 3D Warehouse building), drops every primitive whose material is a
// Google Earth snapshot, makes every material plain (SketchUp exports them metallic), and moves the rest so its bounds' bottom centre sits on the origin.
//   node scripts/gltf-trim.mjs <in.glb> <out.glb> [max metres] [keep x0,z0,x1,z1]   (keep: only nodes whose centre lies in that box, source metres)
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';

const [input, output, maxArg, keepArg] = process.argv.slice(2);
const max = Number(maxArg ?? '0'), keep = keepArg ? keepArg.split(',').map(Number) : null;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(input);
const root = doc.getRoot();
let dropped = 0;
for (const node of root.listNodes()) {
  const mesh = node.getMesh();
  if (!mesh) continue;
  for (const prim of mesh.listPrimitives()) if (/Google Earth Snapshot/i.test(prim.getMaterial()?.getName() ?? '')) { mesh.removePrimitive(prim); dropped++; }
  if (mesh.listPrimitives().length === 0) { node.dispose(); continue; }
  const b = getBounds(node);
  if (max > 0 && (b.max[0] - b.min[0] > max || b.max[2] - b.min[2] > max)) { node.dispose(); dropped++; continue; }
  if (keep) { const cx = (b.min[0] + b.max[0]) / 2, cz = (b.min[2] + b.max[2]) / 2; if (cx < keep[0] || cz < keep[1] || cx > keep[2] || cz > keep[3]) { node.dispose(); dropped++; } }
}
for (const m of root.listMaterials()) { m.setMetallicFactor(0).setRoughnessFactor(0.85); if (m.getBaseColorTexture()) m.setBaseColorFactor([1, 1, 1, 1]); } // SketchUp's exporter writes every material metallic, and tints a textured one with its colour: black under a sky
await doc.transform(prune());
const scene = root.listScenes()[0];
const b = getBounds(scene);
const dx = -(b.min[0] + b.max[0]) / 2, dy = -b.min[1], dz = -(b.min[2] + b.max[2]) / 2;
const shift = doc.createNode('trimmed').setTranslation([dx, dy, dz]);
for (const child of scene.listChildren()) { scene.removeChild(child); shift.addChild(child); }
scene.addChild(shift);
await io.write(output, doc);
const b2 = getBounds(scene);
console.log(`${output}: dropped ${dropped}, size ${b2.max.map((v, i) => (v - b2.min[i]).toFixed(1)).join(' x ')}`);
