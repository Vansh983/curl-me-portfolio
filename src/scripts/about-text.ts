// One open row across both views, including the 3D text inserted on first use.
document.addEventListener('click', event => {
  const tag = (event.target as Element).closest<HTMLButtonElement>('[data-about-tag]');
  if (!tag) return;
  const opening = tag.getAttribute('aria-expanded') !== 'true';
  for (const other of document.querySelectorAll<HTMLButtonElement>('[data-about-tag]')) {
    const open = other === tag && opening;
    other.setAttribute('aria-expanded', String(open));
    document.getElementById(other.getAttribute('aria-controls')!)!.hidden = !open;
  }
  document.dispatchEvent(new Event('about:rowchange'));
});

// Native controls own their keys even while the stage handles Walk input.
function bindKeys(scope: ParentNode) {
  for (const element of scope.querySelectorAll<HTMLElement>('[data-about-tag], .about-cards')) {
    const ownKeys = (event: KeyboardEvent) => {
      if (event.code === 'Enter' || event.code === 'Space' ||
          (element.classList.contains('about-cards') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.code))) event.stopPropagation();
    };
    element.addEventListener('keydown', ownKeys);
    element.addEventListener('keyup', ownKeys);
    if (element.classList.contains('about-cards')) element.addEventListener('wheel', event => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey) event.stopPropagation();
    }, { passive: true });
  }
}
bindKeys(document);
document.addEventListener('stage:mounted', event => bindKeys(event.target as HTMLElement));
