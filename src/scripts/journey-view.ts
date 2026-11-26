// Loads and pauses the 3D journey and handles retry and skip controls.
import { initJourneyText } from './journey-text';
import type { StageControls } from './stage-run';

export function initJourney(root: HTMLElement, active = true) {
  const measure = initJourneyText(root);
  const canvas = root.querySelector<HTMLCanvasElement>('canvas.gl')!;
  const panel = root.querySelector<HTMLElement>('.preparation')!;
  const retry = root.querySelector<HTMLButtonElement>('[data-retry-stage]')!;
  let runtime: StageControls | undefined;
  let loading: Promise<typeof import('./stage-run')> | undefined;
  async function start() {
    if (root.dataset.stage === 'skipped') return;
    root.dataset.stage = 'loading';
    panel.hidden = false;
    try {
      const module = await (loading ??= import('./stage-run'));
      if (active && root.dataset.stage !== 'skipped') runtime ??= module.mount(root, canvas, Number(root.dataset.n) || 1);
    } catch (error) {
      root.dataset.stage = 'error';
      root.querySelector<HTMLElement>('[data-load-status]')!.textContent = 'The 3D journey could not load. You can still read the story.';
      retry.hidden = false;
      console.warn('[journey] stage did not start', error);
    }
  }
  root.querySelector('[data-skip-stage]')!.addEventListener('click', () => { root.dataset.stage = 'skipped'; runtime?.(); });
  retry.addEventListener('click', () => location.reload());
  new MutationObserver(() => { if (root.dataset.stage === 'error') retry.hidden = false; }).observe(root, { attributes: true, attributeFilter: ['data-stage'] });
  function setActive(value: boolean) {
    active = value;
    if (active) measure();
    if (runtime) runtime.setActive(active);
    else if (active) void start();
  }
  setActive(active);
  return { setActive };
}
