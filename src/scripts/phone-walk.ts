import type { PathStop } from '../lib/phone/story-path';
import { pathDistance, follow } from '../lib/phone/pacing';
import { activityAt } from '../lib/phone/activities';
import { isLaptop, LAPTOP_QUERY } from '../lib/view-mode';

const { stops, length }: { stops: Omit<PathStop, 'paragraphs'>[]; length: number } =
  JSON.parse(document.getElementById('path-data')!.textContent!);
const root = document.documentElement;
const view = document.querySelector<HTMLElement>('[data-graphic-view]')!;
const pic = document.getElementById('pic') as unknown as SVGSVGElement;
const landscape = document.getElementById('landscape')!;
const plane = document.getElementById('flight')!;
const planeShadow = document.getElementById('flight-shadow')!;
const planeGear = document.querySelector('#flight .plane-gear')!;
const me = document.getElementById('me') as HTMLButtonElement;
const description = document.getElementById('scene-description')!;
const blocks = Array.from(document.querySelectorAll<HTMLElement>('[data-stop]'));
const footer = document.querySelector<HTMLElement>('.end')!;
const motion = matchMedia('(prefers-reduced-motion: reduce)');
let reduce = motion.matches;
let width = innerWidth;
let height = innerHeight;
let scale = 1;
let viewWidth = 390;
let anchors: number[] = [];
const distances = [...stops.map(stop => stop.x + 100), length - 60];
let current = 100;
let frame = 0;
let lastTime = 0;
let active = -1;
let jumping = false;
let jumpTimer = 0;

function measure(viewportChanged = true) {
  if (viewportChanged) {
    width = innerWidth;
    height = innerHeight;
  }
  root.style.setProperty('--vh', `${height / 100}px`);
  scale = pic.clientHeight / 260;
  viewWidth = pic.clientWidth / scale;
  pic.setAttribute('viewBox', `0 0 ${viewWidth} 260`);
  anchors = blocks.map((block, i) => i === 0 ? 0 : Math.max(1, block.getBoundingClientRect().top + scrollY - height * 0.2));
  const lastReadable = Math.min(footer.getBoundingClientRect().top + scrollY - height * 0.2,
    document.documentElement.scrollHeight - height);
  anchors.push(Math.max(anchors[anchors.length - 1] + 1, lastReadable));
  // A stop with no text still occupies its share of the path between readable stops.
  for (let i = 1; i < blocks.length; i++) {
    if (blocks[i].querySelector('[data-about-paragraph]')) continue;
    let before = i - 1, after = i + 1;
    while (before > 0 && !blocks[before].querySelector('[data-about-paragraph]')) before--;
    while (after < blocks.length && !blocks[after].querySelector('[data-about-paragraph]')) after++;
    const fraction = (distances[i] - distances[before]) / (distances[after] - distances[before]);
    anchors[i] = anchors[before] + fraction * (anchors[after] - anchors[before]);
  }
  me.style.width = `${44 * scale}px`;
  me.style.height = `${72.3 * scale}px`;
}

function readingStop() {
  let i = 0;
  while (i < stops.length - 1 && scrollY >= anchors[i + 1]) i++;
  return i;
}

function draw(distance: number) {
  const action = activityAt(distance, stops, reduce);
  const camera = Math.max(0, Math.min(distance - 100 - action.boarding * 30, length - viewWidth));
  // All landmarks and the pavement share this single translation. Their
  // shapes, opacity, relative positions and connecting ground never change.
  landscape.setAttribute('transform', `translate(${-camera} 0)`);
  const screenX = distance - camera;
  me.style.left = `${(screenX - 22) * scale}px`;
  me.style.bottom = `calc(${(26 + action.hop) * scale}px + env(safe-area-inset-bottom, 0px))`;
  me.style.opacity = String(1 - action.boarding);
  me.disabled = action.boarding > 0.98;
  me.dataset.activity = action.activity;
  me.dataset.jumping = String(action.hop > 0.5);
  plane.setAttribute('transform', `translate(${screenX} ${230 - action.altitude}) rotate(${action.pitch}) scale(${me.dataset.direction === 'back' ? -1 : 1} 1)`);
  plane.setAttribute('opacity', String(action.boarding));
  planeGear.setAttribute('opacity', String(action.gear));
  planeShadow.setAttribute('cx', String(screenX));
  planeShadow.setAttribute('opacity', String(action.boarding * (0.22 - action.altitude / 800)));
  root.dataset.activity = action.flight ? 'flight' : action.activity;
  root.dataset.distance = distance.toFixed(2);
  const index = readingStop();
  if (index !== active) {
    active = index;
    root.dataset.place = stops[index].id;
  }
  description.textContent = action.flight ? `Vansh takes a flight from ${action.flight.route}.` : stops[index].description;
}

function tick(time: number) {
  frame = 0;
  if (view.hidden) { lastTime = 0; return; }
  const dt = lastTime ? Math.min(time - lastTime, 64) : 16.7;
  lastTime = time;
  const target = reduce ? distances[readingStop()] : pathDistance(scrollY, anchors, distances);
  const previous = current;
  if (reduce || Math.abs(target - current) > viewWidth * 3) current = target;
  else current = Math.abs(target - current) < 0.05 ? target : follow(current, target, dt);
  if (!reduce && Math.abs(current - previous) > 0.1) {
    me.dataset.step = String(Math.floor(current / 16) % 4);
    me.dataset.direction = current < previous ? 'back' : 'forward';
  } else me.dataset.step = 'idle';
  draw(current);
  if (Math.abs(target - current) >= 0.05 && !document.hidden) frame = requestAnimationFrame(tick);
  else {
    lastTime = 0;
    me.dataset.step = 'idle';
  }
}

function schedule() {
  if (!frame && !document.hidden && !view.hidden) frame = requestAnimationFrame(tick);
}
function place() {
  root.dataset.laptop = String(isLaptop());
  if (view.hidden) return;
  measure();
  current = reduce ? distances[readingStop()] : pathDistance(scrollY, anchors, distances);
  draw(current);
}

root.classList.add('walk-ready');
place();
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', () => {
  // Hiding a mobile browser's address bar must not move every paragraph.
  if (innerWidth !== width) place();
});
addEventListener('orientationchange', () => setTimeout(place, 250));
addEventListener('pageshow', place);
document.fonts?.ready.then(place);
document.addEventListener('about:rowchange', () => {
  if (view.hidden) return;
  measure(false);
  schedule();
});
addEventListener('graphic:show', place);
addEventListener('graphic:hide', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; });
const layout = matchMedia(LAPTOP_QUERY);
if (layout.addEventListener) layout.addEventListener('change', place);
else layout.addListener(place);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  else schedule();
});
const onMotionChange = () => {
  reduce = motion.matches;
  me.classList.remove('jump');
  me.dataset.step = 'idle';
  clearTimeout(jumpTimer);
  jumping = false;
  schedule();
};
if (motion.addEventListener) motion.addEventListener('change', onMotionChange);
else motion.addListener(onMotionChange);

// A completed tap can jump; a touch that is scrolling the page cannot.
me.addEventListener('click', () => {
  if (reduce || jumping) return;
  jumping = true;
  me.classList.add('jump');
  jumpTimer = window.setTimeout(() => { me.classList.remove('jump'); jumping = false; }, 720);
});
