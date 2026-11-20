const tmux = document.querySelector<HTMLElement>('.blog-tmux');

if (tmux) {
  const win = tmux.querySelector<HTMLElement>('.blog-window')!;
  const view = tmux.querySelector<HTMLElement>('.blog-view')!;
  const keys = tmux.querySelector<HTMLElement>('.blog-keys')!;
  const status = tmux.querySelector<HTMLElement>('.blog-active-slug')!;
  const clock = tmux.querySelector<HTMLTimeElement>('.blog-clock')!;
  const postsWindow = tmux.querySelector<HTMLAnchorElement>('.blog-posts-window')!;
  const openHint = tmux.querySelector<HTMLAnchorElement>('.blog-open');
  const keysHint = tmux.querySelector<HTMLButtonElement>('.blog-toggle-keys')!;
  const panes = [...tmux.querySelectorAll<HTMLAnchorElement>('a.blog-pane')];
  const isPost = tmux.dataset.mode === 'post';
  let active = 0;
  let savedScroll = 0;
  let savedFocus: HTMLElement | null = null;

  function tick() {
    const date = new Date();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const pad = (n: number) => String(n).padStart(2, '0');
    clock.dateTime = date.toISOString();
    clock.textContent = `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}-${months[date.getMonth()]}-${String(date.getFullYear()).slice(-2)}`;
  }

  function setActive(index: number, follow = false) {
    const pane = panes[index];
    if (!pane) return;
    panes[active]?.setAttribute('aria-current', 'false');
    active = index;
    pane.setAttribute('aria-current', 'true');
    status.textContent = `"${pane.dataset.slug}"`;
    if (openHint) openHint.href = pane.href;
    if (follow) pane.scrollIntoView({ block: 'nearest' });
  }

  function move(dx: number, dy: number) {
    const current = panes[active];
    if (!current) return;
    const a = current.getBoundingClientRect();
    let best = -1;
    let score = Infinity;
    panes.forEach((pane, index) => {
      if (index === active) return;
      const r = pane.getBoundingClientRect();
      const overlap = dx ? Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top) : Math.min(a.right, r.right) - Math.max(a.left, r.left);
      const distance = dx ? (dx > 0 ? r.left - a.right : a.left - r.right) : (dy > 0 ? r.top - a.bottom : a.top - r.bottom);
      if (overlap <= 2 || distance < -2) return;
      const candidate = distance * 1000 - overlap;
      if (candidate < score) { score = candidate; best = index; }
    });
    if (best >= 0) setActive(best, true);
  }

  function toggleKeys() {
    const opening = keys.hidden;
    if (opening) {
      savedScroll = win.scrollTop;
      savedFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    keys.hidden = !opening;
    keysHint.setAttribute('aria-expanded', String(opening));
    view.hidden = opening;
    postsWindow.textContent = `0:posts*${isPost && !opening ? 'Z' : ''}`;
    if (opening) keys.focus({ preventScroll: true });
    else savedFocus?.focus({ preventScroll: true });
    win.scrollTop = opening ? 0 : savedScroll;
  }

  panes.forEach((pane, index) => {
    pane.addEventListener('mouseenter', () => setActive(index));
    pane.addEventListener('focus', () => setActive(index));
  });

  keysHint.addEventListener('click', toggleKeys);
  tmux.querySelector('.blog-move')?.addEventListener('click', () => {
    if (!keys.hidden) toggleKeys();
    if (panes.length) setActive((active + 1) % panes.length, true);
  });

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.altKey || event.defaultPrevented) return;
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || target.closest('input, textarea, select, [role="textbox"]'))) return;
    if (event.ctrlKey) {
      if (event.key === 'b') event.preventDefault();
      return;
    }
    const key = event.key;
    if (key === '?') { event.preventDefault(); toggleKeys(); return; }
    if (!keys.hidden) {
      if (['q', 'Escape', 'Enter'].includes(key)) { event.preventDefault(); toggleKeys(); }
      return;
    }
    if (key === 'o') {
      event.preventDefault();
      if (isPost && tmux.dataset.next) location.assign(tmux.dataset.next);
      else if (panes.length) setActive((active + 1) % panes.length, true);
      return;
    }
    if (isPost) {
      if (['z', 'q', 'Escape'].includes(key)) { event.preventDefault(); location.assign('/blog'); }
      else if (key === 'j' || key === 'ArrowDown') { event.preventDefault(); win.scrollTop += 80; }
      else if (key === 'k' || key === 'ArrowUp') { event.preventDefault(); win.scrollTop -= 80; }
      return;
    }
    if (key === 'ArrowLeft' || key === 'h') { event.preventDefault(); move(-1, 0); }
    else if (key === 'ArrowRight' || key === 'l') { event.preventDefault(); move(1, 0); }
    else if (key === 'ArrowUp' || key === 'k') { event.preventDefault(); move(0, -1); }
    else if (key === 'ArrowDown' || key === 'j') { event.preventDefault(); move(0, 1); }
    else if (key === 'z' || key === 'Enter') {
      // Keep native Enter activation on the status links and other controls.
      if (key === 'Enter' && target instanceof Element && target.closest('a:not(.blog-pane), button')) return;
      if (panes[active]) { event.preventDefault(); location.assign(panes[active].href); }
    }
  });
  tick();
  setInterval(tick, 10000);
}
