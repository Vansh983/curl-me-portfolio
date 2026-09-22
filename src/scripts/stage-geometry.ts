import type { Built } from '../lib/stage/built.ts';

/** One build per prop variant, shared by every placement. No detached copies or main-thread city generation. */
export function createGeometrySource() {
  const worker = new Worker(new URL('./stage-geometry.worker.ts', import.meta.url), { type: 'module' });
  const cache = new Map<string, Promise<Built[]>>();
  const pending = new Map<string, { resolve: (parts: Built[]) => void; reject: (error: Error) => void }>();
  let stopped = false;
  const dispose = () => {
    stopped = true;
    worker.terminate();
    for (const request of pending.values()) request.reject(new Error('Scene preparation stopped'));
    pending.clear();
    cache.clear();
  };
  worker.onmessage = ({ data }: MessageEvent<{ key: string; parts: Built[]; error?: string }>) => {
    const request = pending.get(data.key);
    if (!request) return;
    pending.delete(data.key);
    if (data.error) request.reject(new Error(data.error));
    else request.resolve(data.parts);
  };
  worker.onerror = () => dispose();
  return {
    load(name: string, baked = false, live = ''): Promise<Built[]> {
      if (stopped) return Promise.reject(new Error('Scene preparation stopped'));
      const key = `${name}:${baked}:${live}`;
      let result = cache.get(key);
      if (!result) {
        result = new Promise((resolve, reject) => {
          pending.set(key, { resolve, reject });
          worker.postMessage({ key, name, baked, live });
        });
        cache.set(key, result);
      }
      return result;
    },
    dispose,
  };
}
