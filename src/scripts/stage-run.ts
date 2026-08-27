// The renderer. Loaded lazily by Journey.astro when the section is near the viewport.
// Builds one mesh per actor with station keys as morph targets, an ink outline as an
// inverted hull sharing the geometry, painted textures (some blended by the station
// progress: the TV picture into Notepad, the Barcelona shirt into the school shirt,
// dusk into daylight), and drives everything from scroll progress.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, Float32BufferAttribute, MeshToonMaterial,
  MeshBasicMaterial, DataTexture, RedFormat, NearestFilter, HemisphereLight, DirectionalLight, Color, BackSide,
  DoubleSide, CanvasTexture, SRGBColorSpace, Vector3, type Material, type Texture,
} from 'three';
import { ACTORS, STATIONS, type Actor } from '../lib/stage/world.ts';
import { makeShot, stageProgress } from '../lib/stage/shot.ts';
import { flatNormals } from '../lib/stage/rig.ts';
import { BOOKS } from '../lib/stage/props.ts';

const OUTLINE = 0.0045; // metres pushed along the normal
const INK = '#17282f'; // the ink of the authored scenes; the room is lit, so it stays dark in both themes
const D = Math.PI / 180;

type Mat = Material & { color: Color };
interface Built { actor: Actor; mesh: Mesh; outline?: Mesh; a: Color[]; mat: Mat }
type Ctx = CanvasRenderingContext2D;
type Painter = (x: Ctx, w: number, h: number) => void;
interface Paint { w: number; h: number; a: Painter; b?: Painter } // b only for 'mix'
interface Mixer { a: HTMLCanvasElement; b: HTMLCanvasElement; out: HTMLCanvasElement; tex: CanvasTexture; last: number; live: boolean }

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
const canvas2d = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
};
const loadImage = (src: string) => new Promise<HTMLImageElement | null>((res) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = () => res(null);
  i.src = src;
});

function geometryFor(actor: Actor): BufferGeometry {
  const g = new BufferGeometry();
  const [base, ...rest] = actor.keys;
  g.setAttribute('position', new Float32BufferAttribute(base, 3));
  g.setAttribute('normal', new Float32BufferAttribute(flatNormals(base), 3));
  g.setAttribute('uv', new Float32BufferAttribute(actor.uv, 2));
  g.setAttribute('color', new Float32BufferAttribute(actor.col, 3));
  g.morphAttributes.position = rest.map((k) => new Float32BufferAttribute(k, 3));
  g.morphAttributes.normal = rest.map((k) => new Float32BufferAttribute(flatNormals(k), 3));
  return g;
}

/** Inverted hull: same geometry, back faces, pushed out along the (morphed) normal. */
function outlineMaterial(ink: Color): MeshToonMaterial {
  const m = new MeshToonMaterial({ color: 0x000000, emissive: ink, side: BackSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOut = { value: OUTLINE };
    shader.vertexShader = 'uniform float uOut;\n' + shader.vertexShader.replace('#include <morphtarget_vertex>', '#include <morphtarget_vertex>\n\ttransformed += objectNormal * uOut;');
  };
  return m;
}

/** Fills the canvas white first: every rig's default uv points at the corner, which must read white. */
const white = (x: Ctx, w: number, h: number) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); };

/**
 * Everything painted. Canvas y runs down, texture v runs up, so "top" in the world is y = 0 here.
 * Images (the portrait, the Xbox logo) are drawn once they load and the texture is re-uploaded.
 */
function painters(images: { jobs: HTMLImageElement | null; xbox: HTMLImageElement | null }, video: HTMLVideoElement): Record<string, Paint> {
  const mono = '15px ui-monospace, Menlo, monospace';
  return {
    // the Barcelona 2013 home shirt from the back, then the white school shirt. u: 0 front seam, 0.5 the back.
    'figure-shirt': {
      w: 512, h: 512,
      a: (x, w, h) => {
        const stripes = ['#A50044', '#004D98', '#A50044', '#004D98', '#A50044', '#004D98', '#A50044', '#004D98'];
        stripes.forEach((c, i) => { x.fillStyle = c; x.fillRect((i * w) / stripes.length, 0, w / stripes.length + 1, h); });
        x.fillStyle = '#F4C542'; x.fillRect(0, 0, w, 22); // collar
        x.textAlign = 'center'; x.fillStyle = '#F4C542';
        x.font = '700 44px Inter, system-ui, sans-serif'; x.fillText('MESSI', w / 2, 215);
        x.font = '700 140px Inter, system-ui, sans-serif'; x.fillText('10', w / 2, 360);
      },
      b: (x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#E3E3DF'; x.fillRect(0, 0, w, 26); // collar
        x.fillStyle = '#D9D9D5'; x.fillRect(0, 0, 3, h); x.fillRect(w - 3, 0, 3, h); // the placket at the front seam
      },
    },
    // the TV picture with the Call of Duty HUD, then Notepad with the first website
    screen: {
      w: 512, h: 320,
      a: (x, w, h) => {
        x.fillStyle = '#101815'; x.fillRect(0, 0, w, h);
        if (video.readyState >= 2) x.drawImage(video, 0, 0, w, h);
        x.textAlign = 'right';
        x.fillStyle = 'rgba(245,245,245,0.9)'; x.font = '26px "Bebas Neue", Impact, "Arial Narrow", sans-serif'; x.fillText('CALL·OF·DUTY', w - 18, 40);
        x.fillStyle = '#7AC142'; x.font = '17px "Bebas Neue", Impact, "Arial Narrow", sans-serif'; x.fillText('ZOMBIES · ROUND 12', w - 18, 62);
        x.textAlign = 'left';
      },
      b: (x, w, h) => {
        x.fillStyle = '#F4F4F2'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#245EDC'; x.fillRect(0, 0, w, 30);
        x.fillStyle = '#FFFFFF'; x.font = 'bold 15px Inter, system-ui, sans-serif'; x.fillText('index.html - Notepad', 10, 20);
        x.fillStyle = '#E9E9E6'; x.fillRect(0, 30, w, 22);
        x.fillStyle = '#2B2B2B'; x.font = '13px Inter, system-ui, sans-serif'; x.fillText('File   Edit   Format   View   Help', 10, 46);
        x.font = mono;
        const lines = ['<!DOCTYPE html>', '<html>', '<head>', '  <title>My first website</title>', '</head>', '<body>', '  <h1>Hello world</h1>', '  <p>Made by Vansh, 2013</p>', '</body>', '</html>'];
        lines.forEach((l, i) => x.fillText(l, 12, 76 + i * 20));
        x.fillStyle = '#2B2B2B'; x.fillRect(12 + 7 * 9.1, 76 + 9 * 20 - 13, 2, 16); // the caret after </html>
      },
    },
    // the window: dusk over the Delhi rooftops, then daylight over the school trees
    window: {
      w: 512, h: 512,
      a: (x, w, h) => {
        x.fillStyle = '#F7B267'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#E9A15E'; x.fillRect(0, 0, w, h * 0.43);
        x.fillStyle = '#C98352'; x.fillRect(0, 0, w, h * 0.23);
        for (const [cx, cy, rx, ry, a] of [[90, 150, 52, 14, 0.62], [130, 147, 34, 11, 0.62], [400, 85, 66, 16, 0.48]] as const) {
          x.fillStyle = `rgba(249,215,176,${a})`; x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill();
        }
        x.fillStyle = '#F2575D'; x.beginPath(); x.arc(w * 0.34, h * 0.55, 62, 0, Math.PI * 2); x.fill();
        // rooftops with water tanks and a Delhi minar
        x.fillStyle = '#33535F';
        x.beginPath();
        x.moveTo(0, h * 0.68); x.lineTo(60, h * 0.68); x.lineTo(60, h * 0.6); x.lineTo(150, h * 0.6); x.lineTo(150, h * 0.65); x.lineTo(210, h * 0.65);
        x.lineTo(210, h * 0.55); x.lineTo(255, h * 0.55); x.lineTo(255, h * 0.69); x.lineTo(330, h * 0.69); x.lineTo(330, h * 0.63); x.lineTo(390, h * 0.63);
        x.lineTo(390, h * 0.7); x.lineTo(435, h * 0.7); x.lineTo(435, h * 0.52); x.lineTo(453, h * 0.52); x.lineTo(453, h * 0.36); x.lineTo(462, h * 0.32); x.lineTo(471, h * 0.36);
        x.lineTo(471, h * 0.52); x.lineTo(489, h * 0.52); x.lineTo(489, h * 0.7); x.lineTo(w, h * 0.7); x.lineTo(w, h); x.lineTo(0, h); x.closePath(); x.fill();
        x.fillStyle = '#2A4550';
        x.fillRect(84, h * 0.53, 36, 36); x.fillRect(300, h * 0.56, 33, 36); x.fillRect(0, h * 0.86, w, h * 0.14);
      },
      b: (x, w, h) => {
        x.fillStyle = '#CFE7F5'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#E8F3FA'; x.fillRect(0, 0, w, h * 0.3);
        x.fillStyle = '#9FB7A0';
        for (const [cx, r] of [[60, 70], [170, 90], [300, 60], [420, 85]] as const) { x.beginPath(); x.arc(cx, h * 0.78, r, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = '#B9C4C9'; x.fillRect(230, h * 0.55, 90, h * 0.45); x.fillRect(360, h * 0.62, 60, h * 0.38);
        x.fillStyle = '#7F9A80'; x.fillRect(0, h * 0.9, w, h * 0.1);
      },
    },
    // the poster: the portrait on the left, the quote on the right, four drawing pins
    poster: {
      w: 800, h: 340,
      a: (x, w, h) => {
        x.fillStyle = '#111111'; x.fillRect(0, 0, w, h);
        if (images.jobs) {
          const iw = images.jobs.naturalWidth, ih = images.jobs.naturalHeight, s = Math.max(240 / iw, 292 / ih);
          x.save(); x.beginPath(); x.rect(24, 24, 240, 292); x.clip();
          x.drawImage(images.jobs, 24 + (240 - iw * s) / 2, 24 + (292 - ih * s) / 2, iw * s, ih * s); x.restore();
        } else { x.fillStyle = '#2B2B2B'; x.fillRect(24, 24, 240, 292); }
        x.fillStyle = '#3B3B3B'; x.fillRect(296, 56, 3, 228);
        x.fillStyle = '#F5F5F5'; x.font = '600 44px Inter, system-ui, sans-serif';
        x.fillText("Here's to the", 340, 152); x.fillText('crazy ones.', 340, 212);
        x.fillStyle = '#F7D44C';
        for (const [px, py] of [[20, 20], [780, 20], [20, 320], [780, 320]] as const) { x.beginPath(); x.arc(px, py, 10, 0, Math.PI * 2); x.fill(); }
      },
    },
    // the spine titles, one cell per book, transparent elsewhere
    shelfLabels: {
      w: 1536, h: 256,
      a: (x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.fillStyle = '#F9F4EC'; x.textAlign = 'center'; x.textBaseline = 'middle';
        BOOKS.forEach((b, i) => {
          x.save(); x.translate((i + 0.5) * (w / 12), h / 2); x.rotate(-Math.PI / 2);
          x.font = `600 ${b.title === 'FAMOUS FIVE' ? 34 : 40}px Inter, system-ui, sans-serif`;
          x.fillText(b.title, 0, 0); x.restore();
        });
        x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      },
    },
    xboxLogo: {
      w: 256, h: 64,
      a: (x, w, h) => {
        x.clearRect(0, 0, w, h);
        if (images.xbox) x.drawImage(images.xbox, 0, 0, w, h);
      },
    },
    // the football: white with the black panels
    ball: {
      w: 512, h: 256,
      a: (x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#17282F';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
          const cx = ((c + (r % 2) * 0.5) * w) / 6, cy = (r + 0.5) * (h / 3);
          x.beginPath();
          for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * Math.PI * 2) / 5; x.lineTo(cx + 26 * Math.cos(a), cy + 26 * Math.sin(a)); }
          x.closePath(); x.fill();
        }
      },
    },
    // the keyboard: a dark slab with rows of keys
    keyboard: {
      w: 512, h: 192,
      a: (x, w, h) => {
        x.fillStyle = '#2B2B2B'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#4A4A4A';
        for (let r = 0; r < 5; r++) {
          const n = r === 4 ? 6 : 14 - r, kw = (w - 24) / 14;
          for (let c = 0; c < n; c++) {
            const width = r === 4 && c === 2 ? kw * 5 : kw, off = r === 4 && c > 2 ? kw * 4 : 0;
            x.fillRect(12 + c * kw + off + 2 + (r === 4 ? 0 : r * kw * 0.3), 12 + r * (h - 24) / 5, width - 4, (h - 24) / 5 - 4);
          }
        }
      },
    },
  };
}

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  const camera = new PerspectiveCamera(50, 1, 0.05, 30);
  scene.add(new HemisphereLight(0xffffff, 0x8a8a8a, 1.1));
  const sun = new DirectionalLight(0xffffff, 2.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);

  const grad = new DataTexture(new Uint8Array([100, 175, 255]), 3, 1, RedFormat);
  grad.minFilter = grad.magFilter = NearestFilter;
  grad.needsUpdate = true;
  const outlineMat = outlineMaterial(new Color(INK));

  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const images = { jobs: null as HTMLImageElement | null, xbox: null as HTMLImageElement | null };
  const PAINT = painters(images, video);

  let needs = true, raf = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // textures: static ones painted once, mixed ones blended when the station progress moves
  const statics: Array<{ id: string; c: HTMLCanvasElement; tex: CanvasTexture }> = [];
  const mixers: Record<string, Mixer> = {};
  const textureFor = (id: string): Texture | undefined => {
    const p = PAINT[id];
    if (!p) return undefined;
    if (p.b) {
      const a = canvas2d(p.w, p.h), b = canvas2d(p.w, p.h), out = canvas2d(p.w, p.h);
      p.a(a.getContext('2d')!, p.w, p.h);
      p.b(b.getContext('2d')!, p.w, p.h);
      const tex = new CanvasTexture(out);
      tex.colorSpace = SRGBColorSpace;
      mixers[id] = { a, b, out, tex, last: -1, live: id === 'screen' };
      return tex;
    }
    const c = canvas2d(p.w, p.h);
    p.a(c.getContext('2d')!, p.w, p.h);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    statics.push({ id, c, tex });
    return tex;
  };
  const repaint = (ids: string[]) => {
    for (const s of statics) if (ids.includes(s.id)) { PAINT[s.id].a(s.c.getContext('2d')!, s.c.width, s.c.height); s.tex.needsUpdate = true; }
    for (const id of ids) if (mixers[id]) { const m = mixers[id]; PAINT[id].a(m.a.getContext('2d')!, m.a.width, m.a.height); m.last = -1; }
    needs = true; kick();
  };
  const blend = (id: string, t: number) => {
    const m = mixers[id];
    if (!m || (m.last === t && !m.live)) return;
    m.last = t;
    if (m.live) PAINT[id].a(m.a.getContext('2d')!, m.a.width, m.a.height);
    const x = m.out.getContext('2d')!;
    x.globalAlpha = 1; x.drawImage(m.a, 0, 0);
    x.globalAlpha = t; x.drawImage(m.b, 0, 0);
    x.globalAlpha = 1;
    m.tex.needsUpdate = true;
  };

  const built: Built[] = [];
  for (const actor of ACTORS) {
    const g = geometryFor(actor);
    const colors = actor.colors.map((c) => new Color(c));
    const map = actor.tex ? textureFor(actor.id) : undefined;
    const common = { color: colors[0], vertexColors: actor.vc, transparent: actor.transparent ?? false, ...(map ? { map } : {}) };
    const mat: Mat = actor.shade === 'flat' ? new MeshBasicMaterial({ ...common, side: DoubleSide }) : new MeshToonMaterial({ ...common, gradientMap: grad });
    const mesh = new Mesh(g, mat);
    if (actor.at) mesh.position.set(...actor.at);
    scene.add(mesh);
    let outline: Mesh | undefined;
    if (actor.outline) {
      outline = new Mesh(g, outlineMat);
      outline.position.copy(mesh.position);
      scene.add(outline);
    }
    built.push({ actor, mesh, outline, a: colors, mat });
  }
  const fan = built.find((b) => b.actor.id === 'fan');

  // assets that arrive later repaint what uses them
  loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster']); });
  loadImage('/assets/scenes/xbox-360-logo.png').then((i) => { images.xbox = i; repaint(['xboxLogo']); });
  const bebas = new FontFace('Bebas Neue', 'url(/fonts/bebas-neue.ttf)');
  document.fonts.add(bebas);
  bebas.load().then(() => repaint(['screen'])).catch(() => {});

  const shot = makeShot(STATIONS);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, target = 0, cur = 0, lastT = 0, t01 = 0;

  const applyTheme = () => {
    renderer.setClearColor(new Color(cssVar('--bg')));
    needs = true;
    kick();
  };
  const themeObs = new MutationObserver(applyTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', applyTheme);

  const fit = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    needs = true;
    kick();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  const progress = () => {
    const r = root.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  };
  const frame = (q: number) => {
    const f = shot(q);
    camera.position.set(...f.cam);
    camera.lookAt(new Vector3(...f.look));
    // f.fov is horizontal: convert so narrow viewports keep the width of the shot.
    // In portrait the text owns the lower half, so the frustum is cropped from a taller
    // one (setViewOffset) and the subject lands in the upper part without tilting the camera.
    const v = 2 * Math.atan(Math.tan((f.fov * D) / 2) / camera.aspect);
    camera.fov = Math.min(78, Math.max(35, v / D));
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    const shift = Math.max(0, 1 - camera.aspect) * 0.9;
    if (shift > 0.01) camera.setViewOffset(w, h * (1 + shift), 0, h * shift, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    for (const b of built) {
      const inf = b.mesh.morphTargetInfluences;
      if (inf) for (let k = 0; k < inf.length; k++) inf[k] = f.inf[k] ?? 0;
      const oinf = b.outline?.morphTargetInfluences;
      if (oinf) for (let k = 0; k < oinf.length; k++) oinf[k] = f.inf[k] ?? 0;
      const j = Math.min(f.i + 1, b.a.length - 1);
      b.mat.color.copy(b.a[f.i]).lerp(b.a[j], f.t);
    }
    // the blended textures follow the first station gap only
    t01 = f.i === 0 ? f.t : 1;
    for (const id in mixers) blend(id, t01);
  };

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    if (reduce.matches) cur = target;
    else {
      cur += (target - cur) * 0.18;
      if (Math.abs(target - cur) < 0.0005) cur = target;
    }
    let q = stageProgress(cur, chapters, STATIONS.length);
    if (reduce.matches) q = Math.round(q * (STATIONS.length - 1)) / Math.max(1, STATIONS.length - 1);
    frame(q);
    if (fan && !reduce.matches) fan.mesh.rotation.y += dt * 5;
    if (fan?.outline) fan.outline.rotation.y = fan.mesh.rotation.y;
    renderer.render(scene, camera);
    needs = false;
    const live = visible && ((!video.paused && t01 < 1) || (fan && !reduce.matches));
    if (cur !== target || live) raf = requestAnimationFrame(tick);
  };
  const onScroll = () => { target = progress(); kick(); };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) { video.play().catch(() => {}); kick(); } else video.pause();
  });
  io.observe(root);
  addEventListener('scroll', onScroll, { passive: true });
  applyTheme();
  fit();
  onScroll();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('scroll', onScroll);
    ro.disconnect(); io.disconnect(); themeObs.disconnect();
    scheme.removeEventListener('change', applyTheme);
    video.pause(); video.src = '';
    renderer.dispose();
  };
}
