// Removes named nodes (and what only they used) from a glTF before it is optimised: the coils
// behind a fridge, eight wine glasses, a 67 k vertex towel. usage: node scripts/gltf-drop.mjs in out name...
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

const [input, output, ...names] = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(),
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});
const doc = await io.read(input);
let dropped = 0;
for (const n of doc.getRoot().listNodes()) {
  if (names.some((p) => (p.endsWith('*') ? n.getName().startsWith(p.slice(0, -1)) : n.getName() === p))) { n.dispose(); dropped++; }
}
await doc.transform(prune());
for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'KHR_draco_mesh_compression' || ext.extensionName === 'EXT_meshopt_compression') ext.dispose(); // written plain; optimise compresses again
await io.write(output, doc);
console.log(`dropped ${dropped} nodes`);
