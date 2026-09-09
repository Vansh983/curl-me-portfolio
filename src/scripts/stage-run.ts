// The journey stage, client side. Seven connected sets, lit by a soft studio environment indoors
// and a clear sky outdoors (both made in code, nothing downloaded), dressed with a few scanned
// models and designed materials on code-built shells, joined by one camera dolly that changes set
// while the frame is inside a doorway. Spec: docs/rebuild/13-journey-real-spec.md.
//
// Everything here touches the DOM or the renderer. The world (sets.ts), the camera path (dolly.ts),
// the shells (shell.ts), the props (built.ts) and the materials (materials.ts) are pure and tested.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, DirectionalLight, HemisphereLight, PointLight, Mesh, Group, Object3D, ShaderMaterial, UniformsUtils, UniformsLib,
  BufferGeometry,
  Points,
  PointsMaterial,
  AdditiveBlending, BufferAttribute, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, PlaneGeometry, Texture, CanvasTexture, VideoTexture, TextureLoader,
  RepeatWrapping, SRGBColorSpace, AgXToneMapping, ACESFilmicToneMapping, NeutralToneMapping, PCFShadowMap, PMREMGenerator, Raycaster, Vector2, Vector3,
  LinearFilter, LinearMipmapLinearFilter, Material, SphereGeometry, BackSide, DoubleSide, Float32BufferAttribute,
  AnimationMixer, AnimationClip, Box3, ShaderChunk, type WebGLRenderTarget,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { N8AOPass } from 'n8ao';
import { SETS, HALIFAX_CAMPUS, type Placement, type StageSet, type Live } from '../lib/stage/sets.ts';
import { DOLLY, makeDolly, type Frame } from '../lib/stage/dolly.ts';
import { buildShell, type Slab } from '../lib/stage/shell.ts';
import { BUILT, type Built, type BuiltSurface } from '../lib/stage/built.ts';
import { streetLights } from '../lib/stage/city.ts';
import { boxUv, flatUv } from '../lib/stage/rig.ts';
import { LM_SCALE, DROP_PROP, CONTEXT_PROP, pieceIsLive, placementIsLive, parseBakedName } from '../lib/stage/bake.ts';
import { flightAt, phoneAt, FLIGHT, PHONE } from '../lib/stage/flight.ts';
import { createPhone } from './stage-phone.ts';
import { mat as matSpec, type Mat } from '../lib/stage/materials.ts';
import { asset, assetUrl } from '../lib/stage/assets.ts';
import { stageProgress, STAGE_SPAN } from '../lib/stage/shot.ts';
import { loadAllSets, showSetBackdrops, type SetScoped } from '../lib/stage/lifecycle.ts';
import { detailMap, fbm, type Kind } from '../lib/stage/surface.ts';
import { painters, loadImage, canvas2d, SURFACE_PAINT, CITY_PAINT, SCREEN_PAINT, WINDOW_PAINT, BADGE_PAINT, CLOUD_PAINT, beanPaint, type Paint } from './stage-paint.ts';

const D = Math.PI / 180;
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
const LIVE_ALL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('live'); // review: every set built and lit at runtime, no baked files
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

/** A placed thing: its root in the scene and the placement it came from. */
interface Placed { root: Object3D; p: Placement; set: number }

/** The screen face of television_02 in its own metres: where the glass is, seen from the front. */
const TV_SCREEN = { w: 0.3, h: 0.24, at: [0, 0.2, 0.178] as const };
const GRAIN = 128; // pixels per grain tile: a faint normal, never a texture you would look at

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // two tiers: a phone (coarse pointer, few cores) gets half-resolution occlusion and plain
  // shadows; everything else gets the full pipeline. The pacer below still drops things if it stutters
  const tierParam = new URLSearchParams(location.search).get('tier'); // review only: ?tier=0|1 forces one
  const tier = tierParam !== null ? Number(tierParam) : matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency ?? 4) <= 4 ? 0 : 1;
  const dprCap = Math.min(devicePixelRatio, 1.25);
  let dpr = dprCap;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  // Khronos neutral: the designed colours come through as designed, the sky stays blue, nothing
  // crushes. Review only: ?tm=aces|agx tries the others
  const tm = new URLSearchParams(location.search).get('tm');
  renderer.toneMapping = tm === 'aces' ? ACESFilmicToneMapping : tm === 'agx' ? AgXToneMapping : NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new Scene();
  const fog = new Fog(new Color('#EFE3D0'), 12, 60);
  scene.fog = fog;
  const camera = new PerspectiveCamera(50, 1, 0.05, 2600); // the city outside the condo is a kilometre away
  const phone = createPhone(renderer);
  // the laptop in hand for the tour: built like any prop, hung on the camera low and left, the road dashboard on it
  scene.add(camera);
  const heldLaptop = new Group();
  heldLaptop.name = 'heldLaptop';
  heldLaptop.visible = false;
  camera.add(heldLaptop);
  const TOUR_SETS = new Set([8, 9, 10, 11]);
  const TOUR_PAGE: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3 }; // the laptop's page per city
  const tourPages: CanvasTexture[] = [];
  let tourPage = -1, tourScreen: Mesh | undefined;

  // one sun that casts, one hemisphere that tints; the rest of the light is the environment
  const sun = new DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(tier ? 2048 : 1024, tier ? 2048 : 1024);
  Object.assign(sun.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 0.5, far: 80 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 2;
  const hemi = new HemisphereLight(0xffffff, 0x888888, 0.5);
  scene.add(sun, sun.target, hemi);

  // ---- light made in code: a soft studio room for indoors, a clear sky for outdoors
  const pmrem = new PMREMGenerator(renderer);
  const studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  // the sky is a designed gradient, deep blue overhead to a pale haze at the horizon, and the
  // ground half is the pale warm of the pavers, so the environment lights the plaza the same way
  const skyGeo = new SphereGeometry(800, 32, 24); // inside the camera far plane
  const top = new Color('#3F87D2'), horizon = new Color('#D3E3F0'), ground = new Color('#CFC9BF');
  const pos = skyGeo.getAttribute('position');
  const col: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 800;
    if (y >= 0) c.copy(horizon).lerp(top, Math.pow(Math.min(1, y * 2.2), 0.6));
    else c.copy(horizon).lerp(ground, Math.min(1, -y * 6));
    col.push(c.r, c.g, c.b);
  }
  skyGeo.setAttribute('color', new Float32BufferAttribute(col, 3));
  const sky = new Mesh(skyGeo, new MeshBasicMaterial({ vertexColors: true, side: BackSide, fog: false }));
  const skyScene = new Scene();
  skyScene.add(sky);
  const skyEnv = pmrem.fromScene(skyScene, 0, 0.1, 3000).texture;
  skyScene.remove(sky);
  sky.visible = false;

  // ---- loaders and caches
  const gltf = new GLTFLoader();
  gltf.setMeshoptDecoder(MeshoptDecoder);
  interface Loaded { scene: Group; animations: AnimationClip[] }
  const modelCache = new Map<string, Promise<Loaded>>();
  const loadModel = (id: string): Promise<Loaded> => {
    let p = modelCache.get(id);
    if (!p) {
      const skin = asset(id).skin;
      p = gltf.loadAsync(assetUrl(asset(id))).then((g) => {
        g.scene.traverse((o) => {
          if (!(o instanceof Mesh)) return;
          o.castShadow = true;
          o.receiveShadow = true;
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            if (m instanceof MeshStandardMaterial) {
              m.envMapIntensity = Math.min(1, m.envMapIntensity);
              if (m.map) m.map.anisotropy = maxAniso;
              const k = skin?.[m.name];
              if (k) { // the manifest's daylight skin for a model made for another light
                if (k.color) m.color.set(k.color);
                if (k.map === false) m.map = null;
                if (k.emissive === false) { m.emissive.set('#000000'); m.emissiveMap = null; m.emissiveIntensity = 0; }
                if (k.rough !== undefined) { m.roughness = k.rough; m.roughnessMap = null; m.metalnessMap = null; }
                if (k.metal !== undefined) m.metalness = k.metal;
                m.needsUpdate = true;
              }
            }
          }
        });
        return { scene: g.scene, animations: g.animations };
      });
      modelCache.set(id, p);
    }
    return p;
  };

  // ---- painted canvases
  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'metadata' });
  video.setAttribute('playsinline', '');
  const images = { jobs: null as HTMLImageElement | null, xbox: null as HTMLImageElement | null, clan: null as HTMLImageElement | null, dalhousie: null as HTMLImageElement | null, bean: null as HTMLImageElement | null };
  const PAINT: Record<string, Paint> = { ...painters(images, video), ...SURFACE_PAINT, ...CITY_PAINT, ...SCREEN_PAINT, ...WINDOW_PAINT, ...BADGE_PAINT, ...CLOUD_PAINT, ...beanPaint(images) };
  const painted: Array<{ name: string; frame: number; c: HTMLCanvasElement; tex: CanvasTexture }> = [];
  const paintTex = (name: string, frame = 0): CanvasTexture => {
    const p = PAINT[name];
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
    kick();
  };
  const videoTex = new VideoTexture(video);
  videoTex.colorSpace = SRGBColorSpace;

  // ---- designed materials: a colour, a roughness, a faint grain, maybe a painted map
  // pixels to a canvas texture (not a DataTexture): the bake exporter can only draw canvases and images
  const pixelTex = (px: Uint8Array | Uint8ClampedArray, n: number): CanvasTexture => {
    const c = canvas2d(n, n);
    const img = c.getContext('2d')!.createImageData(n, n);
    img.data.set(px);
    c.getContext('2d')!.putImageData(img, 0, 0);
    const t = new CanvasTexture(c);
    t.wrapS = t.wrapT = RepeatWrapping;
    t.magFilter = LinearFilter;
    t.minFilter = LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = maxAniso;
    return t;
  };
  const grains = new Map<Kind, CanvasTexture>();
  const grainFor = (kind: Kind): CanvasTexture => {
    let t = grains.get(kind);
    if (!t) {
      t = pixelTex(detailMap(kind, GRAIN), GRAIN);
      grains.set(kind, t);
    }
    return t;
  };
  // roughness wanders across a plain surface: a low noise, its floor set by `vary`, so nothing reads as one flat sheet of plastic
  const wanders = new Map<number, CanvasTexture>();
  const wanderFor = (vary: number): CanvasTexture => {
    const key = Math.round(vary * 20);
    let t = wanders.get(key);
    if (!t) {
      const n = 128, h = fbm(n, 5, 7, 3, 0.55);
      const px = new Uint8Array(n * n * 4);
      for (let i = 0; i < n * n; i++) { const g = Math.round(255 * (1 - vary * (1 - h[i]))); px[i * 4] = 255; px[i * 4 + 1] = g; px[i * 4 + 2] = 255; px[i * 4 + 3] = 255; }
      t = pixelTex(px, n);
      wanders.set(key, t);
    }
    return t;
  };
  // scanned surfaces from assets.ts: loaded once, cloned per material for its own repeat
  const texLoader = new TextureLoader();
  const scans = new Map<string, Texture>();
  const scanning: Promise<void>[] = []; // the bake export waits for these
  const scanFor = (id: string, map: 'diff' | 'nor' | 'arm'): Texture => {
    const key = `${id}_${map}`;
    let t = scans.get(key);
    if (!t) {
      let done = () => {};
      scanning.push(new Promise<void>((r) => { done = r; }));
      t = texLoader.load(`${assetUrl(asset(id))}_${map}.webp`, () => { done(); kick(); }, undefined, () => done());
      t.wrapS = t.wrapT = RepeatWrapping;
      t.anisotropy = maxAniso;
      if (map === 'diff') t.colorSpace = SRGBColorSpace;
      scans.set(key, t);
    }
    return t;
  };
  const surfacePaint = new Map<string, CanvasTexture>();
  const mats = new Map<string, MeshStandardMaterial>();
  let flightEnvironment: WebGLRenderTarget | undefined;
  const matFor = (name: string): MeshStandardMaterial => {
    let m = mats.get(name);
    if (m) return m;
    const s: Mat = matSpec(name);
    const physical = s.sheen !== undefined || s.clearcoat !== undefined;
    m = s.unlit
      ? (new MeshBasicMaterial({ color: s.color, fog: s.fog !== false, vertexColors: s.tint === true }) as unknown as MeshStandardMaterial)
      : physical
        ? new MeshPhysicalMaterial({ color: s.color, roughness: s.rough, metalness: s.metal ?? 0, envMapIntensity: 1, fog: s.fog !== false, vertexColors: s.tint === true })
        : new MeshStandardMaterial({ color: s.color, roughness: s.rough, metalness: s.metal ?? 0, envMapIntensity: 1, fog: s.fog !== false, vertexColors: s.tint === true });
    if (m instanceof MeshPhysicalMaterial) {
      if (s.sheen !== undefined) { m.sheen = s.sheen; m.sheenRoughness = 0.8; m.sheenColor.set(s.color).lerp(new Color('#FFFFFF'), 0.5); }
      if (s.clearcoat !== undefined) { m.clearcoat = s.clearcoat; m.clearcoatRoughness = s.clearcoatRough ?? 0.15; }
    }
    if (s.emissive && !s.unlit) { m.emissive.set(s.emissive); m.emissiveIntensity = s.emissivePower ?? 1; }
    if (s.inside) m.side = BackSide;
    if (s.alpha !== undefined) { m.transparent = true; m.opacity = s.alpha; m.depthWrite = false; }
    if (name === 'flightSky') {
      const skyMaterial = m;
      scanning.push(texLoader.loadAsync('/assets/stage/flight-sky.webp').then((texture) => {
        texture.colorSpace = SRGBColorSpace;
        skyMaterial.map = texture; skyMaterial.color.set('#FFFFFF'); skyMaterial.toneMapped = false; skyMaterial.needsUpdate = true;
        flightEnvironment = pmrem.fromEquirectangular(texture);
        if (curSet === 5) scene.environment = flightEnvironment.texture;
        kick();
      }));
    }
    const tiled = <T extends Texture>(t: T): T => { const c = t.clone(); c.repeat.set(1 / s.tile, 1 / s.tile); return c; };
    if (s.paint) {
      let t = surfacePaint.get(s.paint);
      if (!t) { t = paintTex(s.paint); t.wrapS = t.wrapT = RepeatWrapping; surfacePaint.set(s.paint, t); }
      m.map = tiled(t);
    }
    if (s.tex && !s.unlit) {
      const maps = asset(s.tex).maps ?? [];
      if (maps.includes('diff')) m.map = tiled(scanFor(s.tex, 'diff'));
      if (maps.includes('nor')) { m.normalMap = tiled(scanFor(s.tex, 'nor')); m.normalScale.set(s.amp ?? 0.5, s.amp ?? 0.5); }
      // the packed map: occlusion in r, roughness in g, metal in b. A floor keeps its crevices; a wall or cloth that keeps its own colour takes only a hint
      if (maps.includes('arm')) { const arm = tiled(scanFor(s.tex, 'arm')); m.aoMap = arm; m.roughnessMap = arm; m.metalnessMap = arm; m.aoMapIntensity = maps.includes('diff') ? 0.8 : 0.35; }
    } else if (s.grain && !s.unlit) {
      m.normalMap = tiled(grainFor(s.grain));
      m.normalScale.set(s.amp ?? 0.25, s.amp ?? 0.25);
    }
    if (!s.tex && !s.unlit && (s.vary ?? 0.2) > 0) m.roughnessMap = tiled(wanderFor(s.vary ?? 0.2));
    if (s.layer) { m.polygonOffset = true; m.polygonOffsetFactor = -s.layer; m.polygonOffsetUnits = -s.layer * 3; } // the flat layers of the city keep their order a kilometre off
    mats.set(name, m);
    return m;
  };

  // ---- geometry helpers
  const slabGeometry = (s: Slab, material?: Material): BufferGeometry => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(s.pos, 3));
    g.setAttribute('normal', new BufferAttribute(s.nor, 3));
    // a prop built with no map in mind takes a box projection in metres once its material carries one
    const mapped = material instanceof MeshStandardMaterial && (material.map || material.normalMap || material.roughnessMap);
    g.setAttribute('uv', new BufferAttribute(mapped && flatUv(s.uv) ? boxUv(s.pos, s.nor) : s.uv, 2));
    const col = (s as Built).col;
    if (material?.vertexColors && col) g.setAttribute('color', new BufferAttribute(col, 3));
    return g;
  };
  /**
   * Cumulus as billboards: each puff is a quad in the field's x-y plane whose vertex colour carries its width (r × 600 m),
   * its cell of the 2 × 2 atlas (g) and its brightness (b). The vertex shader finds the quad's centre from the uv corner,
   * moves it to view space and lays the corner out there, so the puff always faces the camera; a puff the camera is
   * inside dissolves. Fogged and tone mapped like the rest of the world so the deck sits in the same air as the city.
   */
  const cloudMaterial = (map: CanvasTexture): Material => {
    const m = new ShaderMaterial({
      uniforms: UniformsUtils.merge([UniformsLib.fog, { map: { value: map }, tint: { value: new Color('#FFFFFF') } }]),
      vertexShader: `
        varying vec2 vUv; varying float vFade; varying float vBright;
        #include <fog_pars_vertex>
        void main() {
          float size = color.r * 600.0;
          vec2 corner = (uv - 0.5) * vec2(size, size * 0.62);
          vec3 centre = position - vec3(corner, 0.0);
          vec4 mvC = modelViewMatrix * vec4(centre, 1.0);
          vec4 mvPosition = mvC + vec4(corner, 0.0, 0.0);
          gl_Position = projectionMatrix * mvPosition;
          float cell = floor(color.g * 4.0);
          vUv = (uv + vec2(mod(cell, 2.0), floor(cell / 2.0))) * 0.5;
          vFade = smoothstep(0.0, 1.0, (length(mvC.xyz) - size * 0.35) / (size * 0.5));
          vBright = color.b;
          #include <fog_vertex>
        }`,
      fragmentShader: `
        uniform sampler2D map; uniform vec3 tint;
        varying vec2 vUv; varying float vFade; varying float vBright;
        #include <fog_pars_fragment>
        void main() {
          vec4 t = texture2D(map, vUv);
          float a = t.a * vFade;
          if (a < 0.01) discard;
          gl_FragColor = vec4(t.rgb * tint * vBright, a);
          #include <fog_fragment>
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      vertexColors: true, transparent: true, depthWrite: false, side: DoubleSide, fog: true,
    });
    m.toneMapped = true;
    return m;
  };
  const builtMaterial = (s: BuiltSurface, live?: Live): Material => {
    if ('paint' in s) {
      const [name, frame] = s.paint.split(':');
      // screens and the city at night give off their own light: unlit, not tone mapped, no fog on the city
      if (name === 'video') return new MeshBasicMaterial({ map: videoTex, toneMapped: false });
      const backdrop = name === 'toronto' || name === 'sydney' || name === 'vancouver' || name.startsWith('campus'); // a view out of a window: unlit, beyond the fog
      if (name.startsWith('screen') || backdrop) return new MeshBasicMaterial({ map: paintTex(name, Number(frame ?? 0)), toneMapped: false, fog: !backdrop });
      if (name === 'cloudPuffs') return cloudMaterial(paintTex(name, 0)); // the cloud field: every quad turned to the camera, sized by its vertex colour
      return new MeshStandardMaterial({ map: paintTex(name, Number(frame ?? 0)), roughness: 0.6, metalness: 0, envMapIntensity: 0.6 });
    }
    // emitters and the water get their own copy so their state does not leak into the shared one
    if (live === 'bulb' && s.mat === 'bulb') { const m = matFor(s.mat).clone(); m.emissive.set('#FFC978'); m.emissiveIntensity = 6; return m; }
    if (live === 'tube' && s.mat === 'tubeGlass') { const m = matFor(s.mat).clone(); m.emissive.set('#EAF2FF'); m.emissiveIntensity = 0; return m; }
    if (live === 'water') { const m = matFor(s.mat).clone(); m.envMapIntensity = 0.25; return m; }
    return matFor(s.mat);
  };

  // ---- baked light: a mesh that came back from Blender takes its light from the lightmap alone.
  // The shader keeps the environment's reflections and drops every direct light and the
  // hemisphere, so the live sun that lights the curtains does not light the walls twice
  const bakedLighting = (m: MeshStandardMaterial, lm: Texture) => {
    m.lightMap = lm;
    m.lightMapIntensity = LM_SCALE * Math.PI; // Blender's diffuse bake is irradiance over pi
    m.onBeforeCompile = (sh) => {
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <lights_fragment_begin>', ShaderChunk.lights_fragment_begin.replaceAll('RE_Direct( directLight,', 'directLight.color = vec3( 0.0 ); RE_Direct( directLight,').replaceAll('irradiance += get', 'irradiance += 0.0 * get'))
        .replace('#include <lights_fragment_maps>', ShaderChunk.lights_fragment_maps.replace('iblIrradiance += getIBLIrradiance', 'iblIrradiance += 0.0 * getIBLIrradiance'));
    };
    m.customProgramCacheKey = () => 'baked';
  };

  // ---- live things
  const live = {
    fans: [] as Object3D[],
    doors: [] as Array<{ obj: Object3D; from: number; to: number; base: number }>, // leaves that swing open with the stage progress
    curtains: [] as MeshStandardMaterial[],
    water: [] as MeshStandardMaterial[],
    tubes: [] as { mat: MeshStandardMaterial; light: PointLight }[],
    mixers: [] as AnimationMixer[],
    backdrops: [] as SetScoped<Object3D>[],
    flight: [] as Array<{ obj: Object3D; base: [number, number, number] }>,
    drops: [] as Array<{ obj: Object3D; from: number; to: number; by: number; base: number }>, // things that lower with the stage progress: the projection screen
  };
  // the world under the aircraft: `flightRoll` at the cabin rolls with the bank (the sky with it, so the horizon tilts);
  // inside it `flightWorld` sinks with the altitude and slides aft with the ground track
  const flightRoll = new Group(), flightWorld = new Group();
  flightRoll.position.set(-3.4, 1.4, -6.5);
  flightRoll.add(flightWorld);
  let fanSpeed = 0, tubeOn = 0, tubeClock = -1;
  const timeU = { value: 0 };

  const addScreen = (model: Object3D, p: Placement, map: Texture, baked = false) => {
    const k = typeof p.scale === 'number' ? p.scale : 1;
    const laptop = p.model === 'laptop_14_aluminium';
    const display = laptop ? { w: 0.288, h: 0.182, at: [0, 0.13, -0.11] } : TV_SCREEN;
    const plane = new Mesh(new PlaneGeometry(display.w, display.h), new MeshBasicMaterial({ map, toneMapped: false }));
    plane.position.set(display.at[0], display.at[1], display.at[2]);
    if (laptop) plane.rotation.x = -0.08;
    model.add(plane);
    // the television lights the room a little; nine monitors would be nine more lights in every
    // shader, so those keep to their emissive glass. A baked set has the glow in its lightmap
    if (p.live !== 'tv' || baked) return;
    const light = new PointLight('#9CC4FF', 1.2, 1.8 * k, 2);
    light.position.set(0, TV_SCREEN.at[1], TV_SCREEN.at[2] + 0.1);
    model.add(light);
  };

  // ---- the sets
  const groups: Group[] = SETS.map(() => new Group());
  const hot: Placed[] = [];

  /** The street lights of downtown: a soft warm point every 28 m along every road, additive, no fog (the city is outside it). */
  const streetLightPoints = (): Points => {
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(streetLights(), 3));
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d')!;
    const grad = x.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
    grad.addColorStop(0.6, 'rgba(255,255,255,0.18)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = grad;
    x.fillRect(0, 0, 32, 32);
    const map = new CanvasTexture(c);
    const mat = new PointsMaterial({ color: '#FFC27A', size: 9, sizeAttenuation: true, map, transparent: true, depthWrite: false, blending: AdditiveBlending, fog: false, opacity: 1, toneMapped: false });
    const pts = new Points(geo, mat);
    pts.name = 'b|city|mat:streetLight|city';
    return pts;
  };
  const buildHeldLaptop = () => {
    const obj = placeBuilt('laptopTour', { build: 'laptopTour', at: [0, 0, 0], live: 'screen' });
    obj.traverse((o) => { if (o instanceof Mesh) { o.castShadow = false; o.receiveShadow = false; } });
    obj.position.set(-0.02, -0.3, -0.44); // held in both hands while walking: the base low in the frame, the lid up, the screen square to the eye
    obj.rotation.set(0.36, 0.0, 0.0);
    obj.scale.setScalar(1.0);
    obj.traverse((o) => { if (o instanceof Mesh && o.name.includes('paint:screenTour')) tourScreen = o; });
    heldLaptop.add(obj);
  };
  const placeBuilt = (name: string, p: Placement, baked = false): Object3D => {
    const part: Built[] = BUILT[name]();
    const g = new Group();
    g.name = name;
    for (const piece of part) {
      const key = 'mat' in piece.surface ? `mat:${piece.surface.mat}` : `paint:${piece.surface.paint}`;
      if (baked && !DROP_PROP.has(name) && !CONTEXT_PROP.has(name) && !pieceIsLive(key, p.live ?? '')) continue; // the rest of the prop is in the baked set
      const material = builtMaterial(piece.surface, p.live);
      const mesh = new Mesh(slabGeometry(piece, material), material);
      // the name carries what the bake pipeline needs: prop, surface, and whether it stays live at runtime
      mesh.name = `b|${name}|${'mat' in piece.surface ? `mat:${piece.surface.mat}` : `paint:${piece.surface.paint}`}|${p.live ?? ''}`;
      mesh.castShadow = p.shadow ?? piece.pos.length < 20000;
      mesh.receiveShadow = true;
      if (p.live === 'curtain' && 'mat' in piece.surface && piece.surface.mat === 'curtain') {
        const m = (mesh.material = (material as MeshStandardMaterial).clone());
        m.onBeforeCompile = (sh) => {
          sh.uniforms.uTime = timeU;
          sh.vertexShader = sh.vertexShader
            .replace('#include <common>', '#include <common>\nuniform float uTime;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\n float sway = clamp(-position.y / 1.7, 0.0, 1.0);\n transformed.z += 0.035 * sway * sin(uTime * 1.3 + position.x * 4.0) + 0.012 * sway * sin(uTime * 2.7 + position.y * 3.0);');
        };
        live.curtains.push(m);
      }
      if (p.live === 'water') live.water.push(material as MeshStandardMaterial);
      if (p.live === 'tube' && 'mat' in piece.surface && piece.surface.mat === 'tubeGlass') {
        const light = new PointLight('#EAF2FF', 0, 9, 1.5);
        light.position.set(0, -0.2, 0);
        if (!baked) g.add(light); // baked: the tubes' light is in the lightmap, only the glass flickers
        live.tubes.push({ mat: material as MeshStandardMaterial, light });
      }
      if (baked) { g.add(mesh); continue; }
      if (p.live === 'tv' && 'paint' in piece.surface) {
        // the television lights the room a little
        const light = new PointLight('#9CC4FF', 1.2, 2.4, 2);
        light.position.set(0, 0.5, 0.15);
        g.add(light);
      }
      if (p.live === 'screen' && 'paint' in piece.surface && name === 'monitor') {
        // the screens light his face and the desk: one cool light for the pair
        const light = new PointLight('#9FB8FF', 0.9, 2.2, 1.8);
        light.position.set(0, 0.7, 0.35);
        g.add(light);
      }
      if (p.live === 'bulb' && 'mat' in piece.surface && piece.surface.mat === 'bulb') {
        const light = new PointLight('#FFC978', 3, 5, 1.6);
        light.position.set(1.5, 2.1, 0.6);
        g.add(light);
      }
      g.add(mesh);
    }
    if (name === 'city') g.add(streetLightPoints()); // the streets below, a light every 28 m
    if (p.live === 'door' && p.door) live.doors.push({ obj: g, from: p.door[0], to: p.door[1], base: (p.rot?.[1] ?? 0) * D });
    if (p.drop) live.drops.push({ obj: g, from: p.drop[0], to: p.drop[1], by: p.drop[2], base: p.at[1] });
    if (name === 'downlight' && p.live === 'downlight' && !baked) {
      const light = new PointLight('#FFF0DC', 28, 14, 1.6); // a recessed can six metres up: a pool on the tier below
      light.position.set(0, -0.15, 0);
      g.add(light);
    }
    if (name === 'discLight' && p.live === 'pendant' && !baked) {
      const light = new PointLight('#FFF1DA', 6, 6.0, 1.6); // a flush ceiling light: the whole small room
      light.position.set(0, -0.12, 0);
      g.add(light);
    }
    return g;
  };

  const place = async (p: Placement, set: number, baked = false): Promise<void> => {
    let obj: Object3D;
    if (p.model && baked && (p.live === 'tv' || p.live === 'monitor')) {
      // the set is baked: only the glass is live, on an empty where the model stands
      obj = new Group();
      addScreen(obj, p, p.live === 'tv' ? videoTex : paintTex(p.screen ?? 'screen', p.screen ? 0 : 1), true);
    } else if (p.model) {
      obj = (await loadModel(p.model)).scene.clone();
      obj.traverse((o) => { if (o instanceof Mesh) o.name = `m|${p.model}|${o.name}|${p.live ?? ''}`; });
      if (p.live === 'fan') live.fans.push(obj);
      if (p.live === 'pendant' && !baked) {
        const light = new PointLight('#FFD9A8', 7, 5.0, 1.6); // in the mouth of the shade, so the pool falls on the chair
        light.position.set(0, 0.12, 0);
        obj.add(light);
      }
      if (p.live === 'lamp' && !baked) {
        const light = new PointLight('#FFC98A', 2.5, 2.4, 1.8); // the desk, not the wall
        light.position.set(0.05, 0.78, 0.2);
        obj.add(light);
      }
      if (p.live === 'tv') addScreen(obj, p, videoTex);
      if (p.live === 'monitor') addScreen(obj, p, paintTex(p.screen ?? 'screen', p.screen ? 0 : 1));
    } else {
      obj = placeBuilt(p.build!, p, baked);
    }
    obj.position.set(...p.at);
    if (p.live === 'flight') obj.name = p.build ?? 'flightTree';
    if (p.rot) obj.rotation.set(p.rot[0] * D, p.rot[1] * D, p.rot[2] * D);
    if (p.scale !== undefined) typeof p.scale === 'number' ? obj.scale.setScalar(p.scale) : obj.scale.set(...p.scale);
    if (p.live === 'city' || p.live === 'sky' || p.live === 'flight') {
      const sets = p.live === 'sky' ? [Math.max(0, set - 1), set] : [set];
      obj.visible = sets.includes(curSet);
      live.backdrops.push({ root: obj, sets });
    }
    if (set === 0 && p.build === 'passage' && p.at[0] === -4.2) {
      // The flight's L-shaped corridor owns this floor while approaching from Halifax.
      obj.visible = curSet === 0;
      live.backdrops.push({ root: obj, sets: [0] });
    }
    if (p.live === 'flight') {
      // the ground and the sky ride the flight groups; their `at` is in the ground frame, about the cabin
      if (p.build === 'flightSky') { obj.position.set(p.at[0] - flightRoll.position.x, p.at[1] - flightRoll.position.y, p.at[2] - flightRoll.position.z); flightRoll.add(obj); }
      else flightWorld.add(obj);
      if (!flightRoll.parent) groups[set].add(flightRoll);
    } else groups[set].add(obj);
    if (p.cap) hot.push({ root: obj, p, set });
    if (DEBUG) {
      obj.updateWorldMatrix(true, true);
      const b = new Box3().setFromObject(obj);
      console.warn(`[stage] ${p.model ?? p.build} min ${b.min.toArray().map((v) => v.toFixed(2))} max ${b.max.toArray().map((v) => v.toFixed(2))}`);
    }
  };

  /** A set Blender lit: the static meshes come back in one file with a second uv set and a lightmap; only the live pieces are built here. */
  const loadBaked = async (i: number): Promise<void> => {
    const S = SETS[i];
    const lm = texLoader.load(`/assets/stage/baked/set${i}_lm.webp`, () => kick());
    lm.flipY = false;
    lm.channel = 1;
    lm.colorSpace = SRGBColorSpace;
    const g = await gltf.loadAsync(`/assets/stage/baked/set${i}.glb`);
    g.scene.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      const from = o.material as Material;
      const info = parseBakedName(from.name);
      let m: Material = from;
      if (info && info.kind !== 'm') {
        // a built piece or the shell: the designed material, as the runtime would have made it
        const surface: BuiltSurface = info.surface.startsWith('mat:') ? { mat: info.surface.slice(4) } : { paint: info.surface.slice(6) };
        m = builtMaterial(surface, (info.live || undefined) as Live | undefined).clone();
      }
      if (m instanceof MeshStandardMaterial) {
        bakedLighting(m, lm);
        if (info?.kind === 'm') { m.envMapIntensity = Math.min(m.envMapIntensity, 0.6); if (m.map) m.map.anisotropy = maxAniso; }
      }
      o.material = m;
      o.name = from.name;
      o.castShadow = true; // onto the live ground and cloth; its own light is in the map
      o.receiveShadow = false;
    });
    groups[i].add(g.scene);
    // every built prop is offered: its live pieces (painted faces, glass, cloth) are built, the rest was baked; models only when live
    await Promise.all(S.props.filter((p) => p.build || placementIsLive(p)).map((p) => place(p, i, true)));
  };

  const loadSet = async (i: number): Promise<void> => {
    const S = SETS[i];
    if (S.baked && exportSet !== i && !LIVE_ALL) {
      await loadBaked(i);
      await Promise.all(scanning); // cloned surface maps must have pixels before this group can render
      groups[i].visible = curSet < 0 || Math.abs(i - curSet) <= 1;
      scene.add(groups[i]);
      kick();
      return;
    }
    if (S.shell) {
      const sh = buildShell(S.shell);
      const floor = new Mesh(slabGeometry(sh.floor), matFor(S.shell.floor));
      const walls = new Mesh(slabGeometry(sh.walls), matFor(S.shell.wall));
      const ceiling = new Mesh(slabGeometry(sh.ceiling), matFor(S.shell.ceiling ?? S.shell.wall));
      floor.name = `s|floor|mat:${S.shell.floor}|`;
      walls.name = `s|walls|mat:${S.shell.wall}|`;
      ceiling.name = `s|ceiling|mat:${S.shell.ceiling ?? S.shell.wall}|`;
      floor.receiveShadow = walls.receiveShadow = ceiling.receiveShadow = true;
      walls.castShadow = true;
      groups[i].add(floor, walls, ceiling);
    }
    if (S.env === 'sky') {
      const sets = [Math.max(0, i - 1), i]; // visible through the preceding set's exit before the environment swaps
      sky.visible = sets.includes(curSet);
      sky.name = 'b|sky|mat:sky|sky';
      live.backdrops.push({ root: sky, sets });
      groups[i].add(sky);
    }
    await Promise.all(S.props.map((p) => place(p, i)));
    await Promise.all(scanning);
    groups[i].visible = curSet < 0 || Math.abs(i - curSet) <= 1;
    scene.add(groups[i]);
    kick();
    if (exportSet === i) await exportForBake(i);
  };

  // ---- bake pipeline: ?export=<set> hands the set's geometry and lights to scripts/stage-export.mjs,
  // which writes them for Blender (scripts/stage-bake.py) to light and bake
  const exportSet = Number(new URLSearchParams(location.search).get('export') ?? 'NaN');
  const exportForBake = async (i: number) => {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    await Promise.all(scanning);
    if (DEBUG) {
      groups[i].traverse((o) => {
        if (!(o instanceof Mesh)) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          for (const k of ['map', 'normalMap', 'roughnessMap', 'aoMap', 'metalnessMap', 'emissiveMap'] as const) {
            const t = (m as unknown as Record<string, Texture | null>)[k];
            if (!t) continue;
            const im = t.image as { constructor?: { name: string }; width?: number; complete?: boolean } | undefined;
            if (!im || !im.width) console.warn(`[export] ${o.name} ${k}: ${im?.constructor?.name} w ${im?.width} complete ${im?.complete}`);
          }
        }
      });
    }
    const S = SETS[i];
    const lights: Array<{ at: number[]; color: string; intensity: number; distance: number; decay: number; of: string }> = [];
    groups[i].updateWorldMatrix(true, true);
    groups[i].traverse((o) => {
      if (!(o instanceof PointLight)) return;
      const wp = new Vector3();
      o.getWorldPosition(wp);
      lights.push({ at: wp.toArray(), color: `#${o.color.getHexString()}`, intensity: o.intensity, distance: o.distance, decay: o.decay, of: o.parent?.children.find((c) => c instanceof Mesh)?.name ?? '' });
    });
    if (DEBUG) {
      for (const child of groups[i].children) {
        try { await new GLTFExporter().parseAsync(child, { binary: true, onlyVisible: false }); } catch (e) {
          const names: string[] = [];
          child.traverse((o) => { if (o instanceof Mesh) names.push(o.name); });
          console.warn(`[export] fails: ${names.slice(0, 3).join(', ')}: ${(e as Error).message.slice(0, 80)}`);
        }
      }
    }
    // the video is not an image the exporter can draw: the glass goes out as dark glass and comes back live anyway
    const swapped: Array<[Mesh, Material | Material[]]> = [];
    groups[i].traverse((o) => {
      if (o instanceof Mesh && o.material instanceof MeshBasicMaterial && o.material.map instanceof VideoTexture) {
        swapped.push([o, o.material]);
        o.material = new MeshBasicMaterial({ color: '#202428' });
      }
    });
    const buf = (await new GLTFExporter().parseAsync(groups[i], { binary: true, onlyVisible: false })) as ArrayBuffer;
    for (const [o, m] of swapped) o.material = m;
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(k, k + 0x8000)));
    (window as unknown as { __export: unknown }).__export = {
      glb: btoa(bin),
      manifest: { set: i, id: S.id, env: S.env, envPower: S.envPower, exposure: S.exposure, tint: S.tint, sun: S.sun, fog: S.fog, shell: S.shell ?? null, lights, view: DOLLY.find((k) => k.set === i && k.blend === undefined) ?? null },
    };
  };

  // ---- pipeline: render with ambient occlusion (the corners, the underside of the desk, where
  // the chair meets the rug: what makes a box read as a thing), a little bloom off the emitters,
  // tone map, a soft vignette, anti-alias
  const composer = new EffectComposer(renderer);
  // the occlusion pass draws the scene itself; the plain pass only steps in when it is switched off
  const plain = new RenderPass(scene, camera);
  composer.addPass(plain);
  const ao = new N8AOPass(scene, camera, 1, 1);
  Object.assign(ao.configuration, {
    aoRadius: 0.55, distanceFalloff: 0.6, intensity: 2.6, aoSamples: tier ? 16 : 8, denoiseSamples: tier ? 8 : 4, denoiseRadius: 10,
    halfRes: !tier, gammaCorrection: false, screenSpaceRadius: false,
  });
  composer.addPass(ao);
  const aoOn = (on: boolean) => { ao.enabled = on; plain.enabled = !on; };
  const bloom = tier ? new UnrealBloomPass(new Vector2(1, 1), 0.22, 0.5, 1.15) : undefined;
  if (bloom) composer.addPass(bloom);
  composer.addPass(new OutputPass());
  const vignette = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uAmount: { value: 0.32 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D tDiffuse; uniform float uAmount; varying vec2 vUv; void main() { vec4 c = texture2D(tDiffuse, vUv); vec2 d = (vUv - 0.5) * vec2(1.0, 0.85); float v = 1.0 - uAmount * smoothstep(0.35, 0.95, length(d)); gl_FragColor = vec4(c.rgb * v, c.a); }',
  });
  composer.addPass(vignette);
  const smaa = new SMAAPass();
  composer.addPass(smaa);
  // review only: ?off=ao,bloom,vignette,smaa switches passes off one at a time
  const off = new Set((new URLSearchParams(location.search).get('off') ?? '').split(','));
  aoOn(!off.has('ao'));
  if (bloom) bloom.enabled = !off.has('bloom');
  vignette.enabled = !off.has('vignette');
  smaa.enabled = !off.has('smaa');
  if (DEBUG) (window as unknown as { __stage: unknown }).__stage = { yFor, renderer, composer, ao, bloom, scene, camera, Raycaster, Vector3 }; // the classes too, for a probe script to cast rays

  // assets that arrive later repaint what uses them
  loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster']); });
  loadImage('/assets/story/cc.jpg').then((i) => { images.clan = i; repaint(['poster']); });
  loadImage('/assets/stage/bean-logo.png').then((i) => { images.bean = i; repaint(['beanSign', 'whiteboardBean', 'screenBeanPhone', 'screenProductHunt', 'beanPoster', 'boothFront', 'boothBack', 'screenTour', 'totemVancouver', 'totemCalgary', 'totemToronto', 'totemHalifax']); });
  document.fonts.load('700 40px "Product Sans"').then(() => repaint(['sign'])).catch(() => {});

  const dolly = makeDolly(DOLLY);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, visible = false, target = 0, cur = 0, vel = 0, lastT = 0, curSet = -1, shown = false;
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  const applyTheme = () => {
    renderer.setClearColor(new Color(cssVar('--bg')));
    kick();
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
    kick();
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
    if (ema < 1 / 50) return;
    // the occlusion goes to half resolution first, then off, before pixels are given up
    if (ao.enabled && !ao.configuration.halfRes) { ao.configuration.halfRes = true; paced = -60; return; }
    if (ao.enabled) { aoOn(false); paced = -60; return; }
    if (bloom?.enabled) { bloom.enabled = false; paced = -60; return; }
    if (dpr <= 1) return;
    tried = ema;
    apply(Math.max(1, dpr - 0.25));
  };

  // Section progress in chapter units, read off the chapter articles themselves rather than assumed uniform: a chapter
  // is the scroll from one article's top to the next's, so a card given more room (the tour's first card) slows the
  // stage over its chapter instead of skewing every chapter after it. Returned as a fraction of (chapters - 1) so
  // stageProgress() maps it as before.
  const articles = [...root.querySelectorAll<HTMLElement>('.ch')];
  /** The document scroll that puts the stage at progress q: the audit scripts use it (window.__stage.yFor). */
  function yFor(q: number): number { // hoisted: __stage takes it before this line runs
    const c = Math.min(1, Math.max(0, q)) * STAGE_SPAN, i = Math.min(articles.length - 2, Math.floor(c));
    const tops = articles.map((a) => a.offsetTop), base = root.getBoundingClientRect().top + scrollY;
    return base + tops[i] + (c - i) * (tops[i + 1] - tops[i]);
  }
  const progress = () => {
    if (articles.length < 2) return 0;
    const y = -root.getBoundingClientRect().top;
    const tops = articles.map((a) => a.offsetTop);
    let i = 0;
    while (i < tops.length - 2 && y >= tops[i + 1]) i++;
    const span = Math.max(1, tops[i + 1] - tops[i]);
    const c = i + Math.min(1, Math.max(0, (y - tops[i]) / span));
    return Math.min(1, Math.max(0, c / (chapters - 1)));
  };

  /** Switches the light to a set: environment, tint, exposure, fog. Called while the frame is in a doorway. */
  const enter = (i: number) => {
    curSet = i;
    showSetBackdrops(live.backdrops, i);
    // the sets share one scene in a ring; only a neighbour can be seen through a door, so the rest are
    // hidden. A neighbour stays visible through the doorway both ways, so a door is never a void that
    // pops: the plaza's daylight shows through the lab's south door before the walk reaches it
    groups.forEach((g, k) => {
      const d = Math.min(Math.abs(k - i), groups.length - Math.abs(k - i));
      g.visible = d <= 1;
    });
    const S = SETS[i];
    ao.configuration.intensity = S.baked ? 1.4 : 2.6; // the lightmap already holds the soft occlusion
    scene.environment = i === 5 && flightEnvironment ? flightEnvironment.texture : S.env === 'sky' ? skyEnv : studioEnv;
    const span = i === 5 ? 140 : 7;
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, far: i === 5 ? 450 : 80 });
    sun.shadow.camera.updateProjectionMatrix();
    if (i === 1 && tubeClock < 0) tubeClock = 0;
  };

  // review only: ?cam=x,y,z,lx,ly,lz pins the camera anywhere, so a set can be looked at from outside the dolly; ?set=i lights it as that set
  const pinned = new URLSearchParams(location.search).get('cam')?.split(',').map(Number);
  const pinnedSet = Number(new URLSearchParams(location.search).get('set') ?? 'NaN');
  const frame = (fIn: Frame) => {
    let f: Frame = pinned && pinned.length === 6 && pinned.every(Number.isFinite) ? { ...fIn, cam: [pinned[0], pinned[1], pinned[2]], look: [pinned[3], pinned[4], pinned[5]] } : fIn;
    if (pinned && Number.isInteger(pinnedSet) && SETS[pinnedSet]) f = { ...f, set: pinnedSet, from: pinnedSet, into: pinnedSet, blend: 0, envDip: 1 };
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    // portrait: the text owns the lower half, so the frustum is cropped from a taller one
    camera.aspect = w / h; // setViewOffset changes aspect; never feed that cropped value into the next frame
    camera.position.set(...f.cam);
    camera.lookAt(new Vector3(...f.look));
    const v = 2 * Math.atan(Math.tan((f.fov * D) / 2) / camera.aspect);
    camera.fov = Math.min(78, Math.max(35, v / D));
    const shift = Math.max(0, 1 - camera.aspect) * 0.9;
    // the window sits low in the taller frame, but not at its foot: the eye line lands 40 percent down, so heads keep clear of the top
    if (shift > 0.01) camera.setViewOffset(w, h * (1 + shift), 0, h * shift * 0.7, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();

    if (f.set !== curSet) enter(f.set);
    // These neighbours connect by the phone, not their shared wall. Keep cabin trim out of
    // the theatre; its boarding corridor becomes visible again beyond the rear exit.
    if (f.set === 6) groups[5].visible = f.cam[2] > -2;
    // through a doorway the light of one set becomes the light of the next by degrees: exposure, fog,
    // sky and sun cross over the length of the passage, so the eye never sees a cut or a blink. Only
    // the environment map and the shadow strength switch, at the midpoint, inside enter()
    const A: StageSet = SETS[f.from], B: StageSet = SETS[f.into];
    const t = f.from === f.into ? 0 : f.blend * f.blend * (3 - 2 * f.blend);
    const mix = (a: number, b: number) => a + (b - a) * t;
    scene.environmentIntensity = mix(A.envPower, B.envPower);
    hemi.intensity = mix(A.tint.power, B.tint.power);
    hemi.color.set(A.tint.sky).lerp(new Color(B.tint.sky), t);
    hemi.groundColor.set(A.tint.ground).lerp(new Color(B.tint.ground), t);
    sun.intensity = mix(A.sun.power, B.sun.power);
    sun.color.set(A.sun.color).lerp(new Color(B.sun.color), t);
    fog.color.set(A.fog.color).lerp(new Color(B.fog.color), t);
    fog.near = mix(A.fog.near, B.fog.near);
    fog.far = mix(A.fog.far, B.fog.far);
    renderer.toneMappingExposure = mix(A.exposure, B.exposure);
    sun.shadow.intensity = mix(A.sun.shadow, B.sun.shadow);
    const sunDir = new Vector3(...A.sun.dir).normalize().lerp(new Vector3(...B.sun.dir).normalize(), t).normalize(); // the shadows swing round with the light, never jump
    // the sun follows the look, so the shadow map stays tight around what is in frame
    const fl = flightAt(f.q, reduce.matches);
    const look = f.set === 5 ? new Vector3(flightRoll.position.x + HALIFAX_CAMPUS[0], -fl.altitude, flightRoll.position.z + HALIFAX_CAMPUS[1] + fl.travel - FLIGHT.distance) : new Vector3(...f.look);
    sun.position.copy(look).addScaledVector(sunDir, f.set === 5 ? 600 : 30);
    sun.target.position.copy(look);
    sun.target.updateMatrixWorld();
  };

  // ---- hotspots: point at something and it says what it is; click opens its link
  const cap = document.createElement('div');
  cap.className = 'cap';
  root.querySelector('.stage')!.appendChild(cap);
  // the cloud deck: as the aircraft sinks through it the window goes white; a veil over the frame does the whiteout
  const veil = document.createElement('div');
  veil.className = 'veil';
  root.querySelector('.stage')!.appendChild(veil);
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
        const list = (Array.isArray(m.material) ? m.material : [m.material]).map((x) => {
          const c = x.clone();
          if (c instanceof MeshStandardMaterial) { c.emissive.copy(accent); c.emissiveIntensity = 0.28; }
          return c;
        });
        m.material = Array.isArray(m.material) ? list : list[0];
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
    kick();
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
    let q = stageProgress(cur, chapters, STAGE_SPAN);
    if (reduce.matches) q = Math.round(q * (SETS.length - 1)) / Math.max(1, SETS.length - 1);
    const mainFrame = dolly(q);
    root.classList.toggle('phone-focus', phoneAt(q, reduce.matches).visible);
    frame(mainFrame);
    for (const d of live.doors) { const k = Math.min(1, Math.max(0, (q - d.from) / (d.to - d.from))); d.obj.rotation.y = d.base + (Math.PI / 2) * k * k * (3 - 2 * k); }
    for (const d of live.drops) { const k = Math.min(1, Math.max(0, (q - d.from) / (d.to - d.from))); d.obj.position.y = d.base - d.by * k * k * (3 - 2 * k); }
    const flight = flightAt(q, reduce.matches);
    flightWorld.position.set(0, -flight.altitude - flightRoll.position.y, flight.travel - FLIGHT.distance);
    flightRoll.rotation.z = flight.bank * D;
    veil.style.opacity = String(mainFrame.set === 5 ? 0.7 * flight.veil : 0); // the puffs on the track do most of it; the veil adds the glow
    if (heldLaptop.children.length === 0 && TOUR_SETS.has(mainFrame.set)) buildHeldLaptop();
    const page = TOUR_PAGE[mainFrame.into] ?? TOUR_PAGE[mainFrame.set];
    if (tourScreen && page !== undefined && page !== tourPage) { // the laptop's page follows the city
      tourPage = page;
      if (!tourPages[page]) tourPages[page] = paintTex('screenTour', page);
      (tourScreen.material as MeshBasicMaterial).map = tourPages[page];
      (tourScreen.material as MeshBasicMaterial).needsUpdate = true;
    }
    heldLaptop.visible = TOUR_SETS.has(mainFrame.set) || (mainFrame.into !== mainFrame.from && TOUR_SETS.has(mainFrame.into) && mainFrame.blend > 0.5);

    // things on their own clock
    const t = now / 1000;
    const still = reduce.matches;
    if (!still) {
      for (const m of live.mixers) m.update(dt);
      fanSpeed = Math.min(6, fanSpeed + dt * 2);
      for (const f of live.fans) f.rotation.y += dt * fanSpeed;
      timeU.value = t;
      for (const m of live.water) m.normalMap?.offset.set(0.02 * t, 0.013 * t);
    }
    if (tubeClock >= 0 && tubeClock < 0.7) {
      // the tube light catches: three flickers, then on
      tubeClock += dt;
      const seq = [0, 1, 0.2, 1, 0.4, 1, 1];
      tubeOn = seq[Math.min(seq.length - 1, Math.floor((tubeClock / 0.7) * seq.length))];
    } else if (tubeClock >= 0.7) tubeOn = 1;
    for (const tb of live.tubes) { tb.mat.emissiveIntensity = 4 * tubeOn; tb.light.intensity = 6 * tubeOn; }
    if (hovered && pointer) setHover(pick(pointer.x, pointer.y));
    phone.update(q, (canvas.clientWidth || 1) / (canvas.clientHeight || 1), reduce.matches, (captureCamera, target) => {
      // The handset always shows the destination, with the same back-row camera and portrait crop.
      frame(dolly(PHONE.reveal));
      captureCamera.projectionMatrix.copy(camera.projectionMatrix);
      captureCamera.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      const visibility = groups.map((g) => g.visible);
      groups.forEach((g, i) => { g.visible = i === 6; });
      const previousTarget = renderer.getRenderTarget();
      renderer.setRenderTarget(target); renderer.render(scene, captureCamera); renderer.setRenderTarget(previousTarget);
      groups.forEach((g, i) => { g.visible = visibility[i]; });
    });
    frame(mainFrame);
    composer.render();
    phone.render();
    if (!shown) { shown = true; canvas.classList.add('on'); } // the first frame fades in over the page colour
    // scrolling renders every frame; at rest, the live things (fan, video, curtains, water) run at
    // thirty, which is what a laptop on battery can give all day
    const running = visible && !still;
    if (cur !== target) raf = requestAnimationFrame(tick);
    else if (running) { raf = -1; setTimeout(() => { raf = requestAnimationFrame(tick); }, 33); }
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

  // the set in view first, then every remaining set in sequence while the reader is near the stage
  const loading = Number.isInteger(exportSet) && SETS[exportSet] ? loadSet(exportSet) : loadAllSets(SETS.length, loadSet, () => {
    if (curSet < 0) enter(0);
    kick();
  });
  loading.catch((err) => console.warn('[journey] a set did not load', err));

  return () => {
    if (raf > 0) cancelAnimationFrame(raf);
    raf = -1;
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
    flightEnvironment?.dispose();
    mats.get('flightSky')?.map?.dispose();
    phone.dispose();
    composer.dispose();
    renderer.dispose();
    cap.remove();
    root.classList.remove('phone-focus');
  };
}
