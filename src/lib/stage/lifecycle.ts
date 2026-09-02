/** Runtime sequencing kept pure so set loading and set-scoped visibility stay testable. */
export async function loadAllSets(
  count: number,
  load: (index: number) => Promise<void>,
  afterFirst?: () => void,
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await load(i);
    if (i === 0) afterFirst?.();
  }
}

export interface SetScoped<T extends { visible: boolean }> {
  root: T;
  sets: readonly number[];
}

/** Large backdrops share one scene, but must never leak into another set. */
export function showSetBackdrops<T extends { visible: boolean }>(items: SetScoped<T>[], activeSet: number): void {
  for (const item of items) item.root.visible = item.sets.includes(activeSet);
}
