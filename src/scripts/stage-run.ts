// The renderer. Loaded lazily by Journey.astro when the section is near the viewport.
// Builds one mesh per actor with station keys as morph targets, an ink outline as an
// inverted hull sharing the geometry, a canvas-mixed screen (video -> Notepad), and
// drives everything from scroll progress. Renders only when something changed.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, Float32BufferAttribute, MeshToonMaterial,
  MeshBasicMaterial, DataTexture, RedFormat, NearestFilter, HemisphereLight, DirectionalLight, Color, BackSide,
  DoubleSide, CanvasTexture, TextureLoader, SRGBColorSpace, Vector3, type Material,
} from 'three';
import { ACTORS, STATIONS, type Actor } from '../lib/stage/world.ts';
import { makeShot, stageProgress } from '../lib/stage/shot.ts';
import { flatNormals } from '../lib/stage/rig.ts';
import { FACE_UV } from '../lib/stage/props.ts';

const OUTLINE = 0.0045; // metres pushed along the normal
const INK = '#17282f'; // the ink of the authored scenes; the room is lit, so it stays dark in both themes
const D = Math.PI / 180;

type Built = { actor: Actor; mesh: Mesh; outline?: Mesh; a: Color[]; mat: Material & { color: Color } };

const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

function geometryFor(actor: Actor): BufferGeometry {
  const g = new BufferGeometry();
  const [base, ...rest] = actor.keys;
  g.setAttribute('position', new Float32BufferAttribute(base, 3));
  g.setAttribute('normal', new Float32BufferAttribute(flatNormals(base), 3));
  if (actor.kind === 'screen' || actor.kind === 'poster') g.setAttribute('uv', new Float32BufferAttribute(FACE_UV, 2));
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

function notepad(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = '#F4F4F2'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#245EDC'; x.fillRect(0, 0, w, 30);
  x.fillStyle = '#FFFFFF'; x.font = 'bold 15px sans-serif'; x.fillText('Untitled - Notepad', 10, 20);
  x.fillStyle = '#E9E9E6'; x.fillRect(0, 30, w, 22);
  x.fillStyle = '#2B2B2B'; x.font = '13px sans-serif'; x.fillText('File   Edit   Format   View   Help', 10, 46);
  x.font = '15px ui-monospace, Menlo, monospace';
  const lines = ['<!DOCTYPE html>', '<html>', '<head>', '  <title>My first website</title>', '</head>', '<body>', '  <h1>Hello world</h1>', '  <p>Made by Vansh, 2013</p>', '</body>', '</html>'];
  lines.forEach((l, i) => x.fillText(l, 12, 76 + i * 20));
  return c;
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

  // the screen: video mixed into Notepad on a 2D canvas, uploaded as a texture
  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const mixCanvas = document.createElement('canvas');
  mixCanvas.width = 512; mixCanvas.height = 320;
  const mix = mixCanvas.getContext('2d')!;
  const pad = notepad(512, 320);
  const screenTex = new CanvasTexture(mixCanvas);
  screenTex.colorSpace = SRGBColorSpace;
  let screenT = 0;
  const drawScreen = () => {
    mix.globalAlpha = 1;
    mix.fillStyle = '#101815'; mix.fillRect(0, 0, 512, 320);
    if (video.readyState >= 2) mix.drawImage(video, 0, 0, 512, 320);
    mix.globalAlpha = screenT; mix.drawImage(pad, 0, 0);
    screenTex.needsUpdate = true;
  };
  drawScreen();

  let needs = true;
  const poster = new TextureLoader().load('/assets/scenes/jobs.jpg', () => { needs = true; kick(); });
  poster.colorSpace = SRGBColorSpace;

  const built: Built[] = [];
  for (const actor of ACTORS) {
    const g = geometryFor(actor);
    const colors = actor.colors.map((c) => new Color(c));
    let mat: Built['mat'];
    if (actor.kind === 'flat') mat = new MeshBasicMaterial({ color: colors[0], side: DoubleSide });
    else if (actor.kind === 'screen') mat = new MeshBasicMaterial({ map: screenTex });
    else if (actor.kind === 'poster') mat = new MeshBasicMaterial({ map: poster });
    else mat = new MeshToonMaterial({ color: colors[0], gradientMap: grad });
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

  const shot = makeShot(STATIONS);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, raf = 0, target = 0, cur = 0, lastT = 0;

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
    screenT = f.i === 0 ? f.t : 1;
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
    if (!video.paused && screenT < 1) drawScreen();
    else if (needs) drawScreen();
    renderer.render(scene, camera);
    needs = false;
    const live = visible && ((!video.paused && screenT < 1) || (fan && !reduce.matches));
    if (cur !== target || live) raf = requestAnimationFrame(tick);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
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
