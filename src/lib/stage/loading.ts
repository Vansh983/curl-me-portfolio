/** Yield between pieces of scene preparation, including on browsers without scheduler.yield. */
export function yieldToBrowser(): Promise<void> {
  const scheduler = (globalThis as typeof globalThis & { scheduler?: { yield(): Promise<void> } }).scheduler;
  return scheduler?.yield() ?? new Promise((resolve) => setTimeout(resolve, 0));
}

/** Bounded work with a shared queue. A failure stops scheduling new work. */
export async function loadInOrder<T>(items: readonly T[], load: (item: T) => Promise<void>, concurrency = 2): Promise<void> {
  let next = 0, failed = false;
  const run = async () => {
    while (!failed && next < items.length) {
      const item = items[next++];
      try { await load(item); } catch (error) { failed = true; throw error; }
    }
  };
  await Promise.all(Array.from({ length: Math.min(items.length, Math.max(1, concurrency)) }, run));
}
