// The authored geometry is CPU work; keep it off the page's animation/input thread.
import { BUILT } from '../lib/stage/built.ts';
import { DROP_PROP, CONTEXT_PROP, pieceIsLive } from '../lib/stage/bake.ts';

self.onmessage = ({ data }: MessageEvent<{ key: string; name: string; baked: boolean; live: string }>) => {
  try {
    const parts = BUILT[data.name]().filter((piece) => !data.baked || DROP_PROP.has(data.name) || CONTEXT_PROP.has(data.name)
      || pieceIsLive('mat' in piece.surface ? `mat:${piece.surface.mat}` : `paint:${piece.surface.paint}`, data.live));
    const buffers = new Set<ArrayBuffer>();
    for (const p of parts) for (const a of [p.pos, p.nor, p.uv, p.col]) if (a) buffers.add(a.buffer as ArrayBuffer);
    self.postMessage({ key: data.key, parts }, { transfer: [...buffers] });
  } catch (error) {
    self.postMessage({ key: data.key, error: String(error) });
  }
};
