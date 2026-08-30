// The journey stage, client side. Three sets along +x lit by photographs (HDRIs), dressed with
// scanned models and scanned surfaces on code-built shells, joined by one camera dolly that
// changes set while the frame is inside a doorway. Spec: docs/rebuild/13-journey-real-spec.md.
//
// Everything here touches the DOM or the renderer. The world (sets.ts), the camera path (dolly.ts),
// the shells (shell.ts) and the code-built props (built.ts) are pure and tested in node.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, DirectionalLight, PointLight, Mesh, Group, Object3D,
  BufferGeometry, BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Texture, TextureLoader,
  CanvasTexture, VideoTexture, DataTexture, RepeatWrapping, SRGBColorSpace, ACESFilmicToneMapping, PCFShadowMap,
  EquirectangularReflectionMapping, PMREMGenerator, Raycaster, Vector2, Vector3, Euler, RGBAFormat, UnsignedByteType,
  LinearFilter, LinearMipmapLinearFilter, Material, UVMapping, SphereGeometry, BackSide,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { SETS, type Placement, type StageSet } from '../lib/stage/sets.ts';
import { DOLLY, makeDolly, type Frame } from '../lib/stage/dolly.ts';
import { buildShell, type Slab } from '../lib/stage/shell.ts';
import { BUILT, type Built, type BuiltSurface } from '../lib/stage/built.ts';
import { asset, assetUrl } from '../lib/stage/assets.ts';
import { stageProgress } from '../lib/stage/shot.ts';
import { detailMap } from '../lib/stage/surface.ts';
import { painters, loadImage, canvas2d, type Paint } from './stage-paint.ts';

const D = Math.PI / 180;
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

/** A placed thing: its root in the scene and the placement it came from. */
interface Placed { root: Object3D; p: Placement; set: number }

/** The screen face of television_02 in its own metres: where the glass is, seen from the front. */
const TV_SCREEN = { w: 0.3, h: 0.24, at: [0, 0.2, 0.178] as const };

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const dprCap = Math.min(devicePixelRatio, 1.5);
  let dpr = dprCap;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new Scene();
  const fog = new Fog(new Color('#E9DCC6'), 12, 60);
  scene.fog = fog;
  const camera = new PerspectiveCamera(50, 1, 0.05, 900);

  // one sun; everything else about the light is the photograph
  const sun = new DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 80 });
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.02;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  // ---- loaders and caches
  const gltf = new GLTFLoader();
  gltf.setMeshoptDecoder(MeshoptDecoder);
  const rgbe = new RGBELoader();
  const texLoader = new TextureLoader();
  const pmrem = new PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();

  const modelCache = new Map<string, Promise<Group>>();
  const loadModel = (id: string): Promise<Group> => {
    let p = modelCache.get(id);
    if (!p) {
      p = gltf.loadAsync(assetUrl(asset(id))).then((g) => {
        g.scene.traverse((o) => {
          if (!(o instanceof Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = true;
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            if (m instanceof MeshStandardMaterial) {
              m.envMapIntensity = Math.min(1, m.envMapIntensity);
              if (m.map) m.map.anisotropy = maxAniso;
            }
          }
        });
        return g.scene;
      });
      modelCache.set(id, p);
    }
    return p;
  };

  interface Scan { map: Texture; normalMap: Texture; aoMap: Texture; roughnessMap: Texture; metalnessMap: Texture }
  const scanCache = new Map<string, Promise<Scan>>();
  const loadScan = (id: string): Promise<Scan> => {
    let p = scanCache.get(id);
    if (!p) {
      const base = assetUrl(asset(id));
      const one = (suffix: string, srgb: boolean) => texLoader.loadAsync(`${base}_${suffix}.webp`).then((t) => {
        t.wrapS = t.wrapT = RepeatWrapping;
        t.anisotropy = maxAniso;
        if (srgb) t.colorSpace = SRGBColorSpace;
        return t;
      });
      p = Promise.all([one('diff', true), one('nor', false), one('arm', false)]).then(([map, normalMap, arm]) => ({
        map, normalMap, aoMap: arm, roughnessMap: arm, metalnessMap: arm,
      }));
      scanCache.set(id, p);
    }
    return p;
  };

  const hdriCache = new Map<string, Promise<{ env: Texture; sky: Texture }>>();
  const loadHdri = (id: string) => {
    let p = hdriCache.get(id);
    if (!p) {
      p = rgbe.loadAsync(assetUrl(asset(id))).then((sky) => {
        sky.mapping = EquirectangularReflectionMapping;
        const env = pmrem.fromEquirectangular(sky).texture;
        return { env, sky };
      });
      hdriCache.set(id, p);
    }
    return p;
  };

  // ---- painted canvases
  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const images = { jobs: null as HTMLImageElement | null, xbox: null as HTMLImageElement | null, clan: null as HTMLImageElement | null };
  const PAINT = painters(images, video);
  const painted: Array<{ name: string; frame: number; c: HTMLCanvasElement; tex: CanvasTexture }> = [];
  const paintTex = (name: string, frame = 0): CanvasTexture => {
    const p: Paint = PAINT[name];
    const c = canvas2d(p.w, p.h);
    p.frames[frame](c.getContext('2d')!, p.w, p.h);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = maxAniso;
    painted.push({ name, frame, c, tex });
    return tex;
  };
  const repaint = (names: string[]) => {
    for (const e of painted) {
      if (!names.includes(e.name)) continue;
      PAINT[e.name].frames[e.frame](e.c.getContext('2d')!, e.c.width, e.c.height);
      e.tex.needsUpdate = true;
    }
    needs = true; kick();
  };
  const videoTex = new VideoTexture(video);
  videoTex.colorSpace = SRGBColorSpace;

  // the ripple on the bay: a procedural normal map, scrolled
  const ripple = new DataTexture(detailMap('ripple', 256), 256, 256, RGBAFormat, UnsignedByteType);
  ripple.wrapS = ripple.wrapT = RepeatWrapping;
  ripple.magFilter = LinearFilter;
  ripple.minFilter = LinearMipmapLinearFilter;
  ripple.generateMipmaps = true;
  ripple.needsUpdate = true;

  // ---- geometry helpers
  const slabGeometry = (s: Slab): BufferGeometry => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(s.pos, 3));
    g.setAttribute('normal', new BufferAttribute(s.nor, 3));
    g.setAttribute('uv', new BufferAttribute(s.uv, 2));
    g.setAttribute('uv1', new BufferAttribute(s.uv, 2));
    return g;
  };
  const scanMaterial = async (id: string): Promise<MeshStandardMaterial> => {
    const maps = await loadScan(id);
    return new MeshStandardMaterial({ ...maps, roughness: 1, metalness: 1, envMapIntensity: 1 });
  };
  const builtMaterial = async (s: BuiltSurface): Promise<Material> => {
    if ('tex' in s) return scanMaterial(s.tex);
    if ('paint' in s) {
      const [name, frame] = s.paint.split(':');
      return new MeshStandardMaterial({ map: paintTex(name, Number(frame ?? 0)), roughness: 0.6, metalness: 0, envMapIntensity: 0.6 });
    }
    const m = new MeshStandardMaterial({ color: s.color, roughness: s.rough, metalness: s.metal, envMapIntensity: 1 });
    if (s.emissive) { m.emissive.set(s.emissive); m.emissiveIntensity = s.emissivePower ?? 1; }
    if (s.ripple) { m.normalMap = ripple; m.normalScale.set(0.35, 0.35); }
    return m;
  };

  // ---- live things
  const live = { fans: [] as Object3D[], curtains: [] as MeshStandardMaterial[], water: [] as MeshStandardMaterial[], tubes: [] as { mat: MeshStandardMaterial; light: PointLight }[], screens: [] as PointLight[] };
  let fanSpeed = 0, tubeOn = 0, tubeClock = -1;
  const timeU = { value: 0 };

  const addScreen = (model: Object3D, p: Placement, map: Texture) => {
    const k = typeof p.scale === 'number' ? p.scale : 1;
    const plane = new Mesh(new PlaneGeometry(TV_SCREEN.w, TV_SCREEN.h), new MeshBasicMaterial({ map, toneMapped: false }));
    plane.position.set(TV_SCREEN.at[0], TV_SCREEN.at[1], TV_SCREEN.at[2]);
    model.add(plane);
    // the television lights the room a little; nine monitors would be nine more lights in every
    // shader, so those keep to their emissive glass
    if (p.live !== 'tv') return;
    const light = new PointLight('#9CC4FF', 1.2, 1.8 * k, 2);
    light.position.set(0, TV_SCREEN.at[1], TV_SCREEN.at[2] + 0.1);
    model.add(light);
    live.screens.push(light);
  };

  // ---- the sets
  const groups: Group[] = SETS.map(() => new Group());
  const envs: Array<{ env: Texture; sky: Texture } | undefined> = SETS.map(() => undefined);
  const hot: Placed[] = [];
  const placed: Placed[] = [];

  const placeBuilt = async (name: string, p: Placement, set: number): Promise<Object3D> => {
    const part: Built[] = BUILT[name]();
    const g = new Group();
    for (const piece of part) {
      const mesh = new Mesh(slabGeometry(piece), await builtMaterial(piece.surface));
      mesh.castShadow = p.shadow ?? !('tex' in piece.surface && piece.pos.length > 200);
      mesh.receiveShadow = true;
      if (p.live === 'curtain' && 'tex' in piece.surface) {
        const m = mesh.material as MeshStandardMaterial;
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uTime = timeU;
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uTime;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n float sway = clamp(-position.y / 1.7, 0.0, 1.0);\n transformed.z += 0.035 * sway * sin(uTime * 1.3 + position.x * 4.0) + 0.012 * sway * sin(uTime * 2.7 + position.y * 3.0);');
        };
        live.curtains.push(m);
      }
      if (p.live === 'water') live.water.push(mesh.material as MeshStandardMaterial);
      if (p.live === 'tube' && 'emissive' in piece.surface && piece.surface.emissive) {
        const light = new PointLight('#EAF2FF', 0, 9, 1.5);
        light.position.set(0, -0.2, 0);
        g.add(light);
        live.tubes.push({ mat: mesh.material as MeshStandardMaterial, light });
      }
      if (p.live === 'bulb' && 'emissive' in piece.surface && piece.surface.emissive) {
        const light = new PointLight('#FFC978', 4, 5, 1.6);
        light.position.set(1.5, 2.1, 0.6);
        g.add(light);
      }
      g.add(mesh);
    }
    return g;
  };

  const place = async (p: Placement, set: number): Promise<void> => {
    let obj: Object3D;
    if (p.model) {
      obj = (await loadModel(p.model)).clone();
      if (p.live === 'fan') live.fans.push(obj);
      if (p.live === 'tv') addScreen(obj, p, videoTex);
      if (p.live === 'monitor') addScreen(obj, p, paintTex('screen', 1));
    } else {
      obj = await placeBuilt(p.build!, p, set);
    }
    obj.position.set(...p.at);
    if (p.rot) obj.rotation.set(p.rot[0] * D, p.rot[1] * D, p.rot[2] * D);
    if (p.scale !== undefined) typeof p.scale === 'number' ? obj.scale.setScalar(p.scale) : obj.scale.set(...p.scale);
    groups[set].add(obj);
    const entry = { root: obj, p, set };
    placed.push(entry);
    if (p.cap) hot.push(entry);
  };

  const loadSet = async (i: number): Promise<void> => {
    const S = SETS[i];
    const jobs: Promise<unknown>[] = [loadHdri(S.hdri).then((e) => {
      envs[i] = e;
      if (!S.background) return;
      const sky = e.sky.clone();
      sky.mapping = UVMapping;
      sky.needsUpdate = true;
      const dome = new Mesh(new SphereGeometry(700, 48, 24), new MeshBasicMaterial({ map: sky, side: BackSide, fog: false }));
      dome.rotation.y = S.hdriRot * D;
      dome.position.set(...DOLLY[DOLLY.length - 1].cam);
      dome.position.y = 0;
      groups[i].add(dome);
    })];
    if (S.shell) {
      const sh = buildShell(S.shell);
      jobs.push(scanMaterial(S.shell.floor).then((m) => { const f = new Mesh(slabGeometry(sh.floor), m); f.receiveShadow = true; groups[i].add(f); }));
      jobs.push(scanMaterial(S.shell.wall).then((m) => { const w = new Mesh(slabGeometry(sh.walls), m); w.receiveShadow = true; w.castShadow = true; groups[i].add(w); }));
      jobs.push(scanMaterial(S.shell.ceiling ?? S.shell.wall).then((m) => { const c = new Mesh(slabGeometry(sh.ceiling), m); c.receiveShadow = true; groups[i].add(c); }));
    }
    for (const p of S.props) jobs.push(place(p, i));
    await Promise.all(jobs);
    scene.add(groups[i]);
    needs = true; kick();
  };

  // ---- pipeline
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.25, distanceExponent: 1, thickness: 1, scale: 1, samples: 12, distanceFallOff: 1, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 8, depthPhi: 2.5, normalPhi: 3.5, radius: 3, rings: 2, samples: 12 });
  gtao.blendIntensity = 0.6;
  composer.addPass(gtao);
  composer.addPass(new OutputPass());
  composer.addPass(new FXAAPass());

  // assets that arrive later repaint what uses them
  loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster']); });
  loadImage('/assets/story/cc.jpg').then((i) => { images.clan = i; repaint(['poster']); });
  document.fonts.load('700 40px "Product Sans"').then(() => repaint(['sign'])).catch(() => {});

  const dolly = makeDolly(DOLLY);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let needs = true, raf = 0, visible = false, target = 0, cur = 0, vel = 0, lastT = 0, curSet = -1, last: Frame | undefined;
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const applyTheme = () => {
    renderer.setClearColor(new Color(cssVar('--bg')));
    needs = true; kick();
  };
  const themeObs = new MutationObserver(applyTheme);
  themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const scheme = matchMedia('(prefers-color-scheme: dark)');
  scheme.addEventListener('change', applyTheme);

  const fit = () => {
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    needs = true; kick();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  // adaptive resolution, downwards only, and only when it actually buys something
  let ema = 1 / 60, paced = 0, pacing = true, tried = 0;
  const pace = (dt: number) => {
    if (!pacing) return;
    ema += (dt - ema) * 0.08;
    if (++paced < 60) return;
    paced = 0;
    const apply = (next: number) => { dpr = next; renderer.setPixelRatio(dpr); composer.setPixelRatio(dpr); fit(); };
    if (tried) {
      if (ema > tried * 0.9) { apply(Math.min(dprCap, dpr + 0.25)); pacing = false; }
      tried = 0;
      return;
    }
    if (dpr <= 1 || ema < 1 / 50) return;
    tried = ema;
    apply(Math.max(1, dpr - 0.25));
  };

  const progress = () => {
    const r = root.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  };

  /** Switches the light to a set: environment, sky, exposure, fog. Called while the frame is in a doorway. */
  const enter = (i: number) => {
    curSet = i;
    const S = SETS[i];
    const e = envs[i];
    scene.environment = e?.env ?? null;
    scene.environmentRotation = new Euler(0, S.hdriRot * D, 0);
    renderer.toneMappingExposure = S.exposure;
    sun.color.set(S.sun.color);
    sun.shadow.intensity = S.sun.shadow;
    fog.color.set(S.fog.color);
    fog.near = S.fog.near;
    fog.far = S.fog.far;
    if (i === 1 && tubeClock < 0) tubeClock = 0;
  };

  const frame = (f: Frame) => {
    last = f;
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    // portrait: the text owns the lower half, so the frustum is cropped from a taller one
    camera.position.set(...f.cam);
    camera.lookAt(new Vector3(...f.look));
    const v = 2 * Math.atan(Math.tan((f.fov * D) / 2) / camera.aspect);
    camera.fov = Math.min(78, Math.max(35, v / D));
    const shift = Math.max(0, 1 - camera.aspect) * 0.9;
    if (shift > 0.01) camera.setViewOffset(w, h * (1 + shift), 0, h * shift, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();

    if (f.set !== curSet) enter(f.set);
    const S: StageSet = SETS[f.set];
    if (!scene.environment && envs[f.set]) enter(f.set);
    scene.environmentIntensity = S.envPower * f.envDip;
    sun.intensity = S.sun.power * f.envDip;
    // the sun follows the look, so the shadow map stays tight around what is in frame
    const look = new Vector3(...f.look);
    sun.position.copy(look).addScaledVector(new Vector3(...S.sun.dir).normalize(), 30);
    sun.target.position.copy(look);
    sun.target.updateMatrixWorld();
  };

  // ---- hotspots: point at something and it says what it is; click opens its link
  const cap = document.createElement('div');
  cap.className = 'cap';
  root.querySelector('.stage')!.appendChild(cap);
  const ray = new Raycaster();
  const ndc = new Vector2();
  let hovered: Placed | undefined, pointer: { x: number; y: number } | undefined;
  const accent = new Color(cssVar('--acc'));
  const tinted = new Map<Mesh, Material | Material[]>();
  const tint = (o: Object3D, on: boolean) => {
    o.traverse((m) => {
      if (!(m instanceof Mesh)) return;
      if (on) {
        if (!tinted.has(m)) tinted.set(m, m.material);
        const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => {
          const c = x.clone();
          if (c instanceof MeshStandardMaterial) { c.emissive.copy(accent); c.emissiveIntensity = 0.28; }
          return c;
        });
        m.material = Array.isArray(m.material) ? mats : mats[0];
      } else if (tinted.has(m)) {
        m.material = tinted.get(m)!;
        tinted.delete(m);
      }
    });
  };
  const setHover = (b: Placed | undefined) => {
    if (hovered === b) return;
    if (hovered) tint(hovered.root, false);
    hovered = b;
    if (hovered) tint(hovered.root, true);
    const text = hovered?.p.cap ?? '';
    cap.textContent = text;
    cap.classList.toggle('on', !!text);
    canvas.style.cursor = text && hovered?.p.href ? 'pointer' : text ? 'help' : '';
    needs = true; kick();
  };
  const pick = (x: number, y: number): Placed | undefined => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(hot.filter((h) => h.set === curSet).map((h) => h.root), true);
    for (const hit of hits) {
      let o: Object3D | null = hit.object;
      while (o) {
        const found = hot.find((h) => h.root === o);
        if (found) return found;
        o = o.parent;
      }
    }
    return undefined;
  };
  const placeCap = () => {
    if (!pointer) return;
    const r = canvas.getBoundingClientRect();
    const x = pointer.x - r.left, y = pointer.y - r.top;
    cap.style.left = `${Math.min(x + 14, r.width - cap.offsetWidth - 8)}px`;
    cap.style.top = `${Math.max(8, y - cap.offsetHeight - 14)}px`;
  };
  const onMove = (ev: PointerEvent) => {
    if (ev.pointerType === 'touch') return;
    pointer = { x: ev.clientX, y: ev.clientY };
    setHover(pick(ev.clientX, ev.clientY));
    placeCap();
  };
  const onLeave = () => { pointer = undefined; setHover(undefined); };
  const onClick = (ev: PointerEvent) => {
    const b = pick(ev.clientX, ev.clientY);
    if (ev.pointerType === 'touch') {
      pointer = { x: ev.clientX, y: ev.clientY };
      if (b !== hovered) { setHover(b); placeCap(); return; }
    }
    if (b?.p.href) window.open(b.p.href, '_blank', 'noopener');
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerup', onClick);

  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, (now - lastT) / 1000 || 0);
    lastT = now;
    if (dt > 0) pace(dt);
    if (reduce.matches) { cur = target; vel = 0; }
    else {
      // a critically damped spring toward the scroll position: weight without wobble
      const k = 60, c = 2 * Math.sqrt(k);
      vel += (k * (target - cur) - c * vel) * dt;
      cur += vel * dt;
      if (Math.abs(target - cur) < 0.0004 && Math.abs(vel) < 0.002) { cur = target; vel = 0; }
    }
    let q = stageProgress(cur, chapters, SETS.length);
    if (reduce.matches) q = Math.round(q * (SETS.length - 1)) / Math.max(1, SETS.length - 1);
    frame(dolly(q));

    // things on their own clock
    const t = now / 1000;
    const still = reduce.matches;
    if (!still) {
      fanSpeed = Math.min(6, fanSpeed + dt * 2);
      for (const f of live.fans) f.rotation.y += dt * fanSpeed;
      timeU.value = t;
      for (const m of live.water) { m.normalMap!.offset.set(0.02 * t, 0.013 * t); }
    }
    if (tubeClock >= 0 && tubeClock < 0.7) {
      // the tube light catches: three flickers, then on
      tubeClock += dt;
      const seq = [0, 1, 0.2, 1, 0.4, 1, 1];
      tubeOn = seq[Math.min(seq.length - 1, Math.floor((tubeClock / 0.7) * seq.length))];
    } else if (tubeClock >= 0.7) tubeOn = 1;
    for (const tb of live.tubes) { tb.mat.emissiveIntensity = 4 * tubeOn; tb.light.intensity = 6 * tubeOn; }
    if (hovered && pointer) setHover(pick(pointer.x, pointer.y));
    composer.render();
    needs = false;
    const running = visible && !still && (curSet === 0 || curSet === 1 || live.water.length > 0 || tubeClock < 0.7);
    if (cur !== target || running) raf = requestAnimationFrame(tick);
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

  // the set in view first, the others while the reader is on the first
  loadSet(0).then(() => { enter(0); needs = true; kick(); return loadSet(1); }).then(() => loadSet(2)).catch((err) => console.warn('[journey] a set did not load', err));

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('scroll', onScroll);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerup', onClick);
    io.disconnect();
    ro.disconnect();
    themeObs.disconnect();
    scheme.removeEventListener('change', applyTheme);
    video.pause();
    pmrem.dispose();
    composer.dispose();
    renderer.dispose();
    cap.remove();
  };
}
