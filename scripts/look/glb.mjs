// What a model is made of, before it is placed: node scripts/look/glb.mjs <file.glb> [file.glb ...]
// Its bounds (where its origin is, which way up it stands), its materials by name (for `skin` in assets.ts), and every
// mesh node with its own bounds. The pendant lamp hung upside down for weeks because nobody had looked.
import { NodeIO, getBounds } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptDecoder } from 'meshoptimizer';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const f3 = (v) => v.map((x) => x.toFixed(2)).join(',');
for (const f of process.argv.slice(2)) {
  const d = await io.read(f), b = getBounds(d.getRoot().listScenes()[0]);
  console.log(f.split('/').pop(), 'min', f3(b.min), 'max', f3(b.max), 'size', f3(b.max.map((x, i) => x - b.min[i])));
  for (const m of d.getRoot().listMaterials()) console.log('  material', m.getName(), 'colour', f3(m.getBaseColorFactor()), 'map', m.getBaseColorTexture()?.getSize()?.join('x') ?? 'none', 'rough', m.getRoughnessFactor().toFixed(2));
  for (const n of d.getRoot().listNodes()) {
    const mesh = n.getMesh(); if (!mesh) continue;
    const lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], M = n.getWorldMatrix();
    for (const p of mesh.listPrimitives()) { const a = p.getAttribute('POSITION'); for (let i = 0; i < a.getCount(); i++) { const v = a.getElement(i, []); for (let k = 0; k < 3; k++) { const w = M[k] * v[0] + M[4 + k] * v[1] + M[8 + k] * v[2] + M[12 + k]; lo[k] = Math.min(lo[k], w); hi[k] = Math.max(hi[k], w); } } }
    console.log('  node', n.getName(), mesh.listPrimitives().map((p) => p.getMaterial()?.getName()).join('+'), f3(lo), '..', f3(hi));
  }
}
