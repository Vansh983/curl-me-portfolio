// Shared 3D text motion. The stage still reads the untouched chapter spacers.
export function initJourneyText(journey: HTMLElement) {
  const viewport = journey.querySelector<HTMLElement>('.text-viewport')!;
  const column = journey.querySelector<HTMLElement>('.text-column')!;
  const spacers = Array.from(journey.querySelectorAll<HTMLElement>('.ch'));
  const sizes = Array.from(journey.querySelectorAll<HTMLElement>('.chapter-size'));
  let start = 0;
  let scrollRange = 1;
  let textRange = 0;
  let frame = 0;

  function draw() {
    frame = 0;
    if (!journey.offsetHeight) return;
    const progress = Math.max(0, Math.min(1, (scrollY - start) / scrollRange));
    column.style.transform = `translateY(${-progress * textRange}px)`;
  }

  function measure() {
    if (!journey.offsetHeight) return;
    // Some original cards exceed their chapter's minimum height. Keep that geometry too.
    sizes.forEach((card, i) => { spacers[i].style.height = `${card.getBoundingClientRect().height}px`; });
    start = journey.getBoundingClientRect().top + scrollY;
    scrollRange = Math.max(1, journey.offsetHeight - viewport.clientHeight);
    textRange = Math.max(0, column.offsetHeight - viewport.clientHeight);
    draw();
  }

  addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(draw); }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('pageshow', measure);
  document.addEventListener('about:rowchange', measure);
  // Tabbing to a later tag advances the page, rather than scrolling the clipped layer.
  column.addEventListener('focusin', event => {
    draw(); // A focus change can arrive before the previous scroll's animation frame.
    const target = event.target as HTMLElement;
    const bounds = target.getBoundingClientRect();
    const visible = viewport.getBoundingClientRect();
    if (bounds.top >= visible.top && bounds.bottom <= visible.bottom) return;
    const offset = bounds.top - column.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, (offset - viewport.clientHeight / 2) / Math.max(1, textRange)));
    scrollTo({ top: start + progress * scrollRange, behavior: 'instant' });
    draw();
  });
  document.fonts?.ready.then(measure);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(measure).observe(column);
  measure();
  return measure;
}
