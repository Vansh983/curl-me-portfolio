import { isLaptop, LAPTOP_QUERY } from '../lib/view-mode';
import './about-text';

const graphic = document.querySelector<HTMLElement>('[data-graphic-view]')!;
const stage = document.getElementById('home-stage')!;
const layout = matchMedia(LAPTOP_QUERY);
const template = document.getElementById('home-stage-template') as HTMLTemplateElement;
let selected: 'scroll' | 'walk' | 'graphic' = 'scroll';
let pendingMode = true;
let applyingMode = false;
let active = '';
let graphicY = 0;
let stageY = 0;
let journey: HTMLElement | undefined;
let controller: ReturnType<typeof import('./journey-view').initJourney> | undefined;

function syncControls() {
  if (!journey) return;
  if (active === '3d' && journey.dataset.stage === 'ready' && journey.dataset.mode !== 'preparing') {
    const actual = journey.dataset.mode === 'walk' ? 'walk' : 'scroll';
    if (pendingMode && selected !== actual) {
      applyingMode = true;
      journey.querySelector<HTMLButtonElement>(`button[data-mode="${selected}"]`)?.click();
      applyingMode = false;
    } else {
      if (!pendingMode) selected = actual; // Escape can leave Walk without a button click.
      pendingMode = false;
    }
  }
  for (const button of journey.querySelectorAll<HTMLButtonElement>('.mode [data-view]')) {
    button.setAttribute('aria-pressed', String(button.dataset.view === (active === 'graphic' ? 'graphic' : selected)));
  }
}

function show() {
  const laptop = isLaptop();
  document.documentElement.dataset.laptop = String(laptop);
  stage.hidden = !laptop;
  const next = laptop && selected !== 'graphic' ? '3d' : 'graphic';
  if (next === active) { syncControls(); return; }
  if (active === 'graphic') graphicY = scrollY;
  else if (active === '3d') {
    stageY = scrollY;
    controller?.setActive(false);
  }
  active = next;
  document.documentElement.dataset.homeView = next;
  graphic.hidden = next !== 'graphic';
  if (next === 'graphic') {
    scrollTo({ top: graphicY, behavior: 'instant' });
    dispatchEvent(new Event('graphic:show'));
  } else {
    dispatchEvent(new Event('graphic:hide'));
    if (!journey) {
      stage.appendChild(template.content);
      template.remove();
      journey = stage.querySelector<HTMLElement>('section.journey')!;
      const controls = journey.querySelector<HTMLElement>('.mode')!;
      controls.addEventListener('click', event => {
        const button = (event.target as Element).closest<HTMLButtonElement>('[data-view]');
        if (!button || applyingMode) return;
        selected = button.dataset.view as typeof selected;
        pendingMode = selected !== 'graphic';
        // Finish the native activation before replaying a mode click from Graphic.
        setTimeout(show, 0);
      });
      for (const type of ['keydown', 'keyup']) controls.addEventListener(type, event => {
        if (['Enter', 'Space'].includes((event as KeyboardEvent).code)) event.stopPropagation();
      });
      new MutationObserver(syncControls).observe(journey, { attributes: true, attributeFilter: ['data-stage', 'data-mode'] });
      journey.dispatchEvent(new Event('stage:mounted', { bubbles: true }));
      void import('./journey-view').then(({ initJourney }) => {
        controller = initJourney(journey!, false);
        if (active === '3d') {
          scrollTo({ top: stageY, behavior: 'instant' });
          controller.setActive(true);
        }
      });
    }
    scrollTo({ top: stageY, behavior: 'instant' });
    controller?.setActive(true);
  }
  syncControls();
}

if (layout.addEventListener) layout.addEventListener('change', show);
else layout.addListener(show);
show();
