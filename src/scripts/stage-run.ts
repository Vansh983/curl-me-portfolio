// The journey stage, client side. Thirteen connected sets, lit by a soft studio environment indoors
// and a clear sky outdoors (both made in code, nothing downloaded), dressed with a few scanned
// models and designed materials on code-built shells, joined by one camera dolly that changes set
// while the frame is inside a doorway. Spec: docs/rebuild/13-journey-real-spec.md.
//
// Everything here touches the DOM or the renderer. The world (sets.ts), the camera path (dolly.ts),
// the shells (shell.ts), the props (built.ts) and the materials (materials.ts) are pure and tested.
import {
  WebGLRenderer, LoadingManager, Scene, PerspectiveCamera, Color, Fog, Light, DirectionalLight, HemisphereLight, PointLight, Mesh, SkinnedMesh, Group, Quaternion, Matrix4, Object3D, ShaderMaterial, UniformsUtils, UniformsLib,
  BufferGeometry,
  Points,
  PointsMaterial,
  AdditiveBlending, BufferAttribute, MeshStandardMaterial, MeshPhysicalMaterial, MeshBasicMaterial, PlaneGeometry, Texture, CanvasTexture, VideoTexture, TextureLoader,
  RepeatWrapping, SRGBColorSpace, AgXToneMapping, ACESFilmicToneMapping, NeutralToneMapping, PCFShadowMap, PMREMGenerator, Raycaster, Vector2, Vector3,
  LinearFilter, LinearMipmapLinearFilter, Material, SphereGeometry, BackSide, DoubleSide, Float32BufferAttribute,
  AnimationMixer, AnimationClip, Box3, ShaderChunk, WebGLRenderTarget, Plane, MeshDepthMaterial, RGBADepthPacking, Sprite, SpriteMaterial, InstancedBufferGeometry, InstancedBufferAttribute, NormalBlending, ClampToEdgeWrapping,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneRig } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/examples/jsm/postprocessing/SMAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { N8AOPass } from 'n8ao';
import { SETS, HALIFAX_CAMPUS, WALK_LAMPS, HOME, DELHI, STAGE_BIN, VOLTA_DOOR, type Placement, type StageSet, type Live, type Wear } from '../lib/stage/sets.ts';
import { airAt, onWalk, laptopAt, cueAt, seaplaneAt, streetcarAt, ferryAt, walkZ, markAt, voltaViewAt, MARKS, CITY_AIR, type Mark, WALK, type Air, type SkyName, type Pose } from '../lib/stage/walk.ts';
import { DOLLY, makeDolly, type Frame } from '../lib/stage/dolly.ts';
import { buildShell, type Slab } from '../lib/stage/shell.ts';
import type { Built, BuiltSurface } from '../lib/stage/built.ts';
import { createGeometrySource } from './stage-geometry.ts';
import { loadInOrder, yieldToBrowser } from '../lib/stage/loading.ts';
import { deliveryUrl } from '../lib/stage/delivery.ts';
import { crowdSeats, crowdLoop, CROWD, type CrowdSheet } from '../lib/stage/crowd.ts';
import { streetLights } from '../lib/stage/city.ts';
import { boxUv, flatUv } from '../lib/stage/rig.ts';
import { LM_SCALE, DROP_PROP, CONTEXT_PROP, pieceIsLive, placementIsLive, parseBakedName } from '../lib/stage/bake.ts';
import { flightAt, phoneAt, FLIGHT, PHONE, DEGREE, COFFEE } from '../lib/stage/flight.ts';
import { createPhone } from './stage-phone.ts';
import { createWeather } from './stage-weather.ts';
import { mat as matSpec, type Mat } from '../lib/stage/materials.ts';
import { asset, assetUrl } from '../lib/stage/assets.ts';
import { stageProgress, STAGE_SPAN, LAST_SPAN, CARD_SPAN, chapterStart } from '../lib/stage/shot.ts';
import { showSetBackdrops, type SetScoped } from '../lib/stage/lifecycle.ts';
import { detailMap, fbm, type Kind } from '../lib/stage/surface.ts';
import { painters, loadImage, canvas2d, tourLive, SURFACE_PAINT, CITY_PAINT, SCREEN_PAINT, WINDOW_PAINT, BADGE_PAINT, CLOUD_PAINT, beanPaint, type Paint, type Images } from './stage-paint.ts';

const D = Math.PI / 180;
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
const AUDIT = DEBUG || (typeof location !== 'undefined' && new URLSearchParams(location.search).has('audit'));
const VOID = typeof location !== 'undefined' && new URLSearchParams(location.search).has('void'); // review: what is not built keeps the colour the audit gives it (.cache/void.mjs)
const EXPORTING = typeof location !== 'undefined' && new URLSearchParams(location.search).has('export'); // the bake's export: a lamp gives the light it gives in the bake
const LIVE_ALL = typeof location !== 'undefined' && new URLSearchParams(location.search).has('live'); // review: every set built and lit at runtime, no baked files
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

/** A placed thing: its root in the scene and the placement it came from. */
interface Placed { root: Object3D; p: Placement; set: number }

/** The screen face of television_02 in its own metres: where the glass is, seen from the front. */
const TV_SCREEN = { w: 0.3, h: 0.24, at: [0, 0.2, 0.178] as const };
const GRAIN = 128; // pixels per grain tile: a faint normal, never a texture you would look at

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  let stopped = false, ready = false;
  const status = root.querySelector<HTMLElement>('[data-load-status]');
  const report = (text: string) => { if (status) status.textContent = text; };
  const checkActive = () => { if (stopped) throw new Error('Scene preparation stopped'); };
  let sliceStart = performance.now();
  const breathe = async () => {
    checkActive();
    if (performance.now() - sliceStart < 6) return;
    await yieldToBrowser();
    checkActive();
    sliceStart = performance.now();
  };
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const geometrySource = createGeometrySource();
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
  renderer.localClippingEnabled = true; // the whale goes up course by course (Placement.rise)
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new Scene();
  const fog = new Fog(new Color('#EFE3D0'), 12, 60);
  scene.fog = fog;
  const camera = new PerspectiveCamera(50, 1, 0.05, 2600); // the city outside the condo is a kilometre away
  const phone = createPhone(renderer);
  const weather = createWeather(scene, fog); // the leaves and the snow over the tour's walk
  // the laptop in hand for the tour: built like any prop, hung on the camera low and left, the road dashboard on it
  scene.add(camera);
  const heldLaptop = new Group();
  heldLaptop.name = 'heldLaptop';
  heldLaptop.visible = false;
  camera.add(heldLaptop);
  const TOUR_SETS = new Set([8, 9]); // the sets the laptop is carried in: it comes up for the numbers as a city begins and goes down again (walk.ts `laptopAt`)
  const WALK_SETS = new Set([8, 9, 10]); // the sets of the tour's walk: their light is the walk's script, not their own
  /** The degree in hand on the stage at the end: a rolled parchment, raised as the walk reaches the dais. */
  let crowdFrames: [CanvasTexture, CanvasTexture] | undefined; // the crowd's two frames, painted once
  const heldDegree = new Group();
  heldDegree.name = 'heldDegree';
  heldDegree.visible = false;
  camera.add(heldDegree);
  let degreeScroll: Object3D | undefined, degreeBall: Object3D | undefined, thrownBall: Object3D | undefined;
  const release = new Vector3(), binMouth = new Vector3(STAGE_BIN[0] + (SETS[11].at?.[0] ?? 0), STAGE_BIN[1] + 0.66 + (SETS[11].at?.[1] ?? 0), STAGE_BIN[2] + (SETS[11].at?.[2] ?? 0)); // where the crushed degree leaves the hand, and the mouth of the bin
  const heldCoffee = new Group(); // the coffee from Volta's bar, in its paper cup
  heldCoffee.name = 'heldCoffee';
  heldCoffee.visible = false;
  camera.add(heldCoffee);
  // the laptop's screen is live: a canvas repainted a dozen times a second with code running, the editor, the app, the numbers
  const tourCanvas = canvas2d(768, 480);
  const tourTex = new CanvasTexture(tourCanvas);
  tourTex.colorSpace = SRGBColorSpace;
  let tourPage = 0, tourScreen: Mesh | undefined, tourLast = 0, tourShown = 0, tourFrom = -1, tourSwitched = 0; // the page before the last change, faded out over it

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
  const skyGeo = new SphereGeometry(2400, 32, 24); // inside the camera far plane; the North Shore stands 1.7 km off at its scale
  const top = new Color('#3F87D2'), horizon = new Color('#D3E3F0'), ground = new Color('#CFC9BF');
  const pos = skyGeo.getAttribute('position');
  const col: number[] = [];
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 2400;
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
  sky.name = 'b|sky|mat:sky|sky';
  scene.add(sky);
  // the walk's skies: three photographed skies (public/assets/stage/sky, scripts/stage-sky.mjs), one a city, on a dome
  // of their own: two of them mixed as one city gives way to the next, dimmed as the day goes, washed toward the fog's
  // colour as the mist closes in. Each is turned so its sun stands where the walk's script has the sun
  const SKY_KEEP = 0.56, SKY_SUN: Record<SkyName, number> = { vancouver: 0.59, toronto: 0.582, halifax: 0.598 };
  // how each sky is shown: a gain, and a lift toward a pale blue. Vancouver's and Toronto's are lighter than the photographs
  const SKY_LOOK: Record<SkyName, [number, number]> = { vancouver: [1.22, 0.2], toronto: [1.12, 0.1], halifax: [1, 0] };
  const skyTurn = (name: SkyName): number => { const d = CITY_AIR[name].sun.dir; return SKY_SUN[name] - (Math.atan2(d[2], d[0]) / (2 * Math.PI) + 0.5); };
  const domeFragment = `
    uniform sampler2D mapA; uniform sampler2D mapB; uniform float mixAB; uniform float dim; uniform float mist; uniform vec3 mistColor; uniform float turnA; uniform float turnB; uniform float keep; uniform float drift; uniform vec2 lookA; uniform vec2 lookB;
    varying vec3 vDir;
    vec3 sky(sampler2D map, float turn, vec2 look, vec3 d) {
      float u = atan(d.z, d.x) / 6.28318530718 + 0.5 + turn + drift;
      float v = acos(clamp(d.y, -1.0, 1.0)) / 3.14159265359;
      vec3 c = texture2D(map, vec2(u, 1.0 - min(v / keep, 0.995))).rgb * look.x;
      return mix(c, vec3(0.62, 0.8, 1.0) * max(1.0, look.x), look.y * (1.0 - smoothstep(0.75, 1.0, max(c.r, max(c.g, c.b))))); // the blue lifted, the cloud left white
    }
    void main() {
      vec3 d = normalize(vDir);
      vec3 c = mix(sky(mapA, turnA, lookA, d), sky(mapB, turnB, lookB, d), mixAB) * dim;
      float low = 1.0 - smoothstep(0.0, 0.55, d.y);
      c = mix(c, mistColor, clamp(mist * (0.45 + 0.55 * low), 0.0, 1.0));
      gl_FragColor = vec4(c, 1.0);
    }`;
  const domeVertex = 'varying vec3 vDir; void main() { vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  const domeUniforms = () => ({ mapA: { value: null as Texture | null }, mapB: { value: null as Texture | null }, mixAB: { value: 0 }, dim: { value: 1 }, mist: { value: 0 }, mistColor: { value: new Color('#B4BBC6') }, turnA: { value: 0 }, turnB: { value: 0 }, keep: { value: SKY_KEEP }, drift: { value: 0 }, lookA: { value: new Vector2(1, 0) }, lookB: { value: new Vector2(1, 0) } });
  const domeU = domeUniforms();
  const dome = new Mesh(new SphereGeometry(2350, 48, 24), new ShaderMaterial({ uniforms: domeU, vertexShader: domeVertex, fragmentShader: domeFragment, side: BackSide, depthWrite: false, fog: false }));
  dome.name = 'b|sky|mat:walkSky|sky';
  dome.visible = false;
  dome.frustumCulled = false;
  scene.add(dome);
  const skyMaps: Partial<Record<SkyName, Texture>> = {};
  const skyEnvs: Partial<Record<SkyName, WebGLRenderTarget>> = {};

  // ---- loaders and caches
  const loadingManager = new LoadingManager();
  loadingManager.setURLModifier(deliveryUrl);
  const gltf = new GLTFLoader(loadingManager);
  MeshoptDecoder.useWorkers(2);
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
  Object.assign(video, { src: deliveryUrl('/assets/scenes/zombies-gameplay.mp4'), muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const images: Images = { jobs: null, xbox: null, clan: null, dalhousie: null, bean: null, websummit: null, elevate: null, volta: null, investns: null, producthunt: null, floqer: null, elevatePhoto: null, demodayPhoto: null, tripAward: null, tripSign: null, collect: null };
  const PAINT: Record<string, Paint> = { ...painters(images, video), ...SURFACE_PAINT, ...CITY_PAINT, ...SCREEN_PAINT, ...WINDOW_PAINT, ...BADGE_PAINT, ...CLOUD_PAINT, ...beanPaint(images) };
  const painted: Array<{ name: string; frame: number; c: HTMLCanvasElement; tex: CanvasTexture }> = [];
  const paintCache = new Map<string, CanvasTexture>();
  const paintTex = (name: string, frame = 0): CanvasTexture => {
    const key = `${name}:${frame}`;
    const cached = paintCache.get(key);
    if (cached) return cached;
    const p = PAINT[name];
    const c = canvas2d(p.w, p.h);
    p.frames[frame](c.getContext('2d')!, p.w, p.h);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = maxAniso;
    painted.push({ name, frame, c, tex });
    paintCache.set(key, tex);
    return tex;
  };
  const repaint = (names: string[]) => {
    if (stopped) return;
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
  const texLoader = new TextureLoader(loadingManager);
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
  for (const name of ['vancouver', 'toronto', 'halifax'] as SkyName[]) {
    scanning.push(texLoader.loadAsync(`/assets/stage/sky/${name}.webp`).then((t) => {
      t.colorSpace = SRGBColorSpace; t.wrapS = RepeatWrapping; t.wrapT = ClampToEdgeWrapping; t.minFilter = LinearFilter; t.generateMipmaps = false;
      skyMaps[name] = t;
      // its light: the same sky on a small dome of its own, its sun where the script has it, as bright as its hour
      const u = domeUniforms();
      u.mapA.value = u.mapB.value = t; u.turnA.value = u.turnB.value = skyTurn(name); u.dim.value = CITY_AIR[name].dim;
      u.lookA.value.set(...SKY_LOOK[name]); u.lookB.value.set(...SKY_LOOK[name]);
      const own = new Scene();
      own.add(new Mesh(new SphereGeometry(100, 32, 16), new ShaderMaterial({ uniforms: u, vertexShader: domeVertex, fragmentShader: domeFragment, side: BackSide, depthWrite: false })));
      skyEnvs[name] = pmrem.fromScene(own, 0, 0.1, 500);
      kick();
    }));
  }
  const surfacePaint = new Map<string, CanvasTexture>();
  const mats = new Map<string, MeshStandardMaterial>();
  /**
   * Halifax's snow: a cover on the walk's own materials, as much of it as the walk's script has lying (`coverU`). It
   * lies first where snow lies first (on the grass, along the edges of the paving), ragged by a noise, and is whole by
   * Volta's door; only on what faces up. The lawn takes the season too: green in May, gone to gold by October. The
   * snow that has a shape of its own (the drifts, the snow along a limb) comes on with the same cover, grain by grain.
   */
  const SNOWED = new Set(['paveVancouver', 'paveToronto', 'paveHalifax', 'walkLawn', 'walkGranite', 'railOak', 'trackBed', 'houseRoof', 'lampPost', 'snowForm']);
  const snowCover = (m: MeshStandardMaterial, name: string) => {
    const noise = wanderFor(1).clone();
    noise.repeat.set(1, 1);
    const grass = name === 'walkLawn' ? 0.24 : 0;
    const season = name === 'walkLawn' ? 'diffuseColor.rgb *= mix(vec3(0.78, 1.16, 0.6), vec3(1.06, 0.93, 0.64), smoothstep(0.35, 1.1, uSeason));' : ''; // May's grass is green, October's gone to gold
    const formed = name === 'snowForm' ? 'if (uCover * 1.25 - 0.14 < texture2D(snowNoise, vSnowAt.xz * 0.9 + vSnowAt.y * 0.7).g * 0.9) discard;' : '';
    m.onBeforeCompile = (sh) => {
      sh.uniforms.snowNoise = { value: noise };
      sh.uniforms.uCover = coverU; sh.uniforms.uSeason = seasonU;
      sh.uniforms.snowLine = { value: WALK.x };
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSnowAt;')
        .replace('#include <project_vertex>', '#include <project_vertex>\n vSnowAt = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vSnowAt; uniform sampler2D snowNoise; uniform float uCover; uniform float uSeason; uniform float snowLine;')
        .replace('#include <lights_physical_fragment>', `
          ${formed}
          ${season}
          float snowN = texture2D(snowNoise, vSnowAt.xz * 0.31).g * 0.5 + texture2D(snowNoise, vSnowAt.xz * 1.27).g * 0.32 + texture2D(snowNoise, vSnowAt.xz * 4.9).g * 0.18;
          float snowEdge = smoothstep(1.3, 3.1, abs(vSnowAt.x - snowLine)) * 0.2 + ${grass.toFixed(2)};
          float snowUp = smoothstep(0.45, 0.8, inverseTransformDirection(normal, viewMatrix).y);
          float snowOn = ${name === 'snowForm' ? '0.0' : 'smoothstep(0.46, 0.56, uCover * 1.22 + snowEdge * uCover * 1.6 + (snowN - 0.5) * 0.7 - 0.12) * snowUp * step(0.001, uCover)'};
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.9, 0.97), snowOn);
          roughnessFactor = mix(roughnessFactor, 0.94, snowOn);
          metalnessFactor *= 1.0 - snowOn;
          #include <lights_physical_fragment>
          #ifdef USE_CLEARCOAT
            material.clearcoat *= 1.0 - snowOn;
          #endif`);
    };
    m.customProgramCacheKey = () => `snow:${name}`;
  };
  let flightEnvironment: WebGLRenderTarget | undefined;
  const roomEnvironments = new Map<number, WebGLRenderTarget>(); // a baked room's own panorama (set<i>_env.webp), the environment its glass and parquet reflect
  const matFor = (name: string): MeshStandardMaterial => {
    let m = mats.get(name);
    if (m) return m;
    const s: Mat = matSpec(name);
    const physical = s.sheen !== undefined || s.clearcoat !== undefined;
    m = s.unlit
      ? (new MeshBasicMaterial({ color: s.color, fog: s.fog !== false, vertexColors: s.tint === true }) as unknown as MeshStandardMaterial)
      : physical
        ? new MeshPhysicalMaterial({ color: s.color, roughness: s.rough, metalness: s.metal ?? 0, envMapIntensity: s.env ?? 1, fog: s.fog !== false, vertexColors: s.tint === true })
        : new MeshStandardMaterial({ color: s.color, roughness: s.rough, metalness: s.metal ?? 0, envMapIntensity: s.env ?? 1, fog: s.fog !== false, vertexColors: s.tint === true });
    if (m instanceof MeshPhysicalMaterial) {
      if (s.sheen !== undefined) { m.sheen = s.sheen; m.sheenRoughness = 0.8; m.sheenColor.set(s.color).lerp(new Color('#FFFFFF'), 0.5); }
      if (s.clearcoat !== undefined) { m.clearcoat = s.clearcoat; m.clearcoatRoughness = s.clearcoatRough ?? 0.15; }
    }
    if (s.emissive && !s.unlit) { m.emissive.set(s.emissive); m.emissiveIntensity = (EXPORTING ? s.bakePower : undefined) ?? s.emissivePower ?? 1; }
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
    if (SNOWED.has(name)) snowCover(m, name);
    mats.set(name, m);
    return m;
  };

  // ---- geometry helpers
  const geometryCache = new WeakMap<Slab, Map<string, BufferGeometry>>();
  const slabGeometry = (s: Slab, material?: Material): BufferGeometry => {
    const mapped = material instanceof MeshStandardMaterial && Boolean(material.map || material.normalMap || material.roughnessMap);
    const key = `${mapped}:${!!material?.vertexColors}`;
    let variants = geometryCache.get(s);
    if (!variants) { variants = new Map(); geometryCache.set(s, variants); }
    const cached = variants.get(key);
    if (cached) return cached;
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(s.pos, 3));
    g.setAttribute('normal', new BufferAttribute(s.nor, 3));
    // a prop built with no map in mind takes a box projection in metres once its material carries one
    g.setAttribute('uv', new BufferAttribute(mapped && flatUv(s.uv) ? boxUv(s.pos, s.nor) : s.uv, 2));
    const col = (s as Built).col;
    if (material?.vertexColors && col) g.setAttribute('color', new BufferAttribute(col, 3));
    const aux = (s as Built).aux;
    if (aux) g.setAttribute('aux', new BufferAttribute(aux, 4));
    variants.set(key, g);
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
  /**
   * The leaves of the walk's trees: the painted sprigs on cards, cut out by their alpha, lit the same from both sides
   * (a leaf lets the light through) and stirred a little by the wind. The season is the walk's (`seasonU`): a card
   * carries three randoms and by them it turns from its green to its own gold, orange or red, browns, and lets go,
   * one card after another, so a crown thins before it is bare. The shadow it throws goes with it (`leafDepth`).
   */
  const signs: MeshStandardMaterial[] = []; // the walk's signs: their letters lit once the lamps are
  const glowing: MeshStandardMaterial[] = []; // windows with the light on inside: brought up by the walk's script as the day goes
  const seasonU = { value: 0 }, fallU = { value: 0 }, coverU = { value: 0 }; // the walk's season, how many leaves are down, how much snow lies
  const LEAF_SWAY = '\n vec4 wp = modelMatrix * vec4(position, 1.0);\n float gust = sin(uTime * 0.9 + wp.x * 0.35 + wp.z * 0.22) * 0.5 + sin(uTime * 2.3 + wp.z * 1.1 + wp.y * 0.8) * 0.25;\n transformed += vec3(0.05, 0.015, 0.035) * gust * clamp((wp.y - 2.0) / 3.0, 0.0, 1.0) / max(0.2, length(modelMatrix[0].xyz));\n vHold = aux.y;';
  let leaves: MeshStandardMaterial | undefined, leafShadow: MeshDepthMaterial | undefined;
  const leafMaterial = (): MeshStandardMaterial => {
    if (leaves) return leaves;
    const map = paintTex('leafSprig', 0);
    const m = new MeshStandardMaterial({ map, alphaTest: 0.5, side: DoubleSide, roughness: 0.8, metalness: 0, envMapIntensity: 0.35 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = timeU; sh.uniforms.uSeason = seasonU; sh.uniforms.uFall = fallU;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uSeason; attribute vec4 aux; varying vec3 vLeaf; varying float vHold;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>${LEAF_SWAY}
          vec3 green = mix(vec3(0.2, 0.36, 0.11), vec3(0.34, 0.48, 0.15), aux.x);
          vec3 gold = aux.x < 0.5 ? mix(vec3(0.9, 0.68, 0.16), vec3(0.85, 0.42, 0.1), aux.x * 2.0) : mix(vec3(0.85, 0.42, 0.1), vec3(0.7, 0.2, 0.08), (aux.x - 0.5) * 2.0);
          float turned = smoothstep(0.25, 0.85, uSeason + (aux.y - 0.5) * 0.45);
          float done = smoothstep(1.1, 1.75, uSeason + (aux.x - 0.5) * 0.3);
          vLeaf = mix(mix(green, gold, turned), vec3(0.5, 0.3, 0.12), done) * (0.78 + aux.z * 0.34);`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uFall; varying vec3 vLeaf; varying float vHold;')
        .replace('#include <map_fragment>', 'if (vHold < uFall) discard;\n#include <map_fragment>\n diffuseColor.rgb *= vLeaf;')
        .replace('#include <normal_fragment_begin>', ShaderChunk.normal_fragment_begin.replace('gl_FrontFacing ? 1.0 : - 1.0', '1.0'))
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.06;');
    };
    m.customProgramCacheKey = () => 'leaves';
    leaves = m;
    return m;
  };
  /** The leaves that are down: the same sprigs lying on the paving and the grass, arriving through October one by one, gone under the snow as it comes. */
  let litter: MeshStandardMaterial | undefined;
  const litterMaterial = (): MeshStandardMaterial => {
    if (litter) return litter;
    const m = new MeshStandardMaterial({ map: paintTex('leafSprig', 0), alphaTest: 0.5, side: DoubleSide, roughness: 0.85, metalness: 0, envMapIntensity: 0.3, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uSeason = seasonU; sh.uniforms.uCover = coverU;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nattribute vec4 aux; varying vec3 vLeaf; varying float vHold;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 gold = aux.x < 0.5 ? mix(vec3(0.9, 0.68, 0.16), vec3(0.85, 0.42, 0.1), aux.x * 2.0) : mix(vec3(0.85, 0.42, 0.1), vec3(0.7, 0.2, 0.08), (aux.x - 0.5) * 2.0);
          vLeaf = mix(gold, vec3(0.45, 0.27, 0.11), aux.z * 0.6) * (0.7 + aux.z * 0.3);
          vHold = aux.y;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uSeason; uniform float uCover; varying vec3 vLeaf; varying float vHold;')
        .replace('#include <map_fragment>', 'if (uSeason < 0.62 + vHold * 0.55 || uCover > 0.12 + vHold * 0.5) discard;\n#include <map_fragment>\n diffuseColor.rgb *= vLeaf;');
    };
    m.customProgramCacheKey = () => 'litter';
    litter = m;
    return m;
  };
  const leafDepth = (): MeshDepthMaterial => {
    if (leafShadow) return leafShadow;
    const m = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, map: paintTex('leafSprig', 0), alphaTest: 0.5 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = timeU; sh.uniforms.uFall = fallU;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime; attribute vec4 aux; varying float vHold;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>${LEAF_SWAY}`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uFall; varying float vHold;')
        .replace('#include <map_fragment>', 'if (vHold < uFall) discard;\n#include <map_fragment>');
    };
    m.customProgramCacheKey = () => 'leafDepth';
    leafShadow = m;
    return m;
  };
  /**
   * The harbour: a dark water whose colour is mostly the sky's, its surface two swells crossing (the ripple grain read
   * twice, at two scales, drifting two ways) so it never slides as one sheet; smooth enough to take the sun's glitter.
   */
  /**
   * The harbour's swell as a normal map that tiles: trains of waves of whole numbers of lengths across the tile, a few
   * long and many short, running mostly one way with the wind, and a little noise over them.
   */
  const swellTex = (): CanvasTexture => {
    const N = 256, h = new Float32Array(N * N), px = new Uint8Array(N * N * 4);
    let seed = 2221;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    const trains = Array.from({ length: 22 }, (_, i) => { const k = 1 + Math.floor(rnd() * (i < 6 ? 3 : 11)), th = (rnd() - 0.5) * 1.9 + 0.6; const kx = Math.round(k * Math.cos(th)), kz = Math.round(k * Math.sin(th)) || 1; return { kx, kz, a: 1 / (0.6 + Math.hypot(kx, kz)), p: rnd() * Math.PI * 2 }; });
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let v = 0;
      for (const t of trains) { const ph = ((t.kx * x + t.kz * y) / N) * Math.PI * 2 + t.p, s = Math.sin(ph); v += t.a * (s + 0.35 * Math.sin(2 * ph + 1.3)); } // sharper crests than troughs
      h[y * N + x] = v;
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const dx = h[y * N + ((x + 1) % N)] - h[y * N + ((x + N - 1) % N)], dy = h[((y + 1) % N) * N + x] - h[((y + N - 1) % N) * N + x];
      const nx = -dx * 1.6, ny = -dy * 1.6, l = Math.hypot(nx, ny, 1), i = (y * N + x) * 4;
      px[i] = Math.round((nx / l * 0.5 + 0.5) * 255); px[i + 1] = Math.round((ny / l * 0.5 + 0.5) * 255); px[i + 2] = Math.round((1 / l * 0.5 + 0.5) * 255); px[i + 3] = 255;
    }
    return pixelTex(px, N);
  };
  let water: MeshStandardMaterial | undefined;
  const waterMaterial = (): MeshStandardMaterial => {
    if (water) return water;
    const spec = matSpec('walkWater');
    const m = new MeshStandardMaterial({ color: spec.color, roughness: spec.rough, metalness: 0, envMapIntensity: 1.15 });
    const n = swellTex();
    n.repeat.set(1 / 14, 1 / 14);
    m.normalMap = n;
    m.normalScale.set(0.55, 0.55);
    m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -3;
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = timeU;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <normal_fragment_maps>', ShaderChunk.normal_fragment_maps.replace('vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;',
          'vec2 w2 = mat2( 0.545, 0.839, - 0.839, 0.545 ) * vNormalMapUv; vec2 w3 = mat2( 0.829, - 0.559, 0.559, 0.829 ) * vNormalMapUv;\n vec3 n1 = texture2D( normalMap, vNormalMapUv + vec2( uTime * 0.011, uTime * 0.017 ) ).xyz * 2.0 - 1.0;\n vec3 n2 = texture2D( normalMap, w2 * 0.31 + vec2( - uTime * 0.006, uTime * 0.004 ) ).xyz * 2.0 - 1.0;\n vec3 n3 = texture2D( normalMap, w3 * 2.7 + vec2( uTime * 0.03, - uTime * 0.021 ) ).xyz * 2.0 - 1.0;\n n2.xy = mat2( 0.545, - 0.839, 0.839, 0.545 ) * n2.xy; n3.xy = mat2( 0.829, 0.559, - 0.559, 0.829 ) * n3.xy;\n float nearness = clamp( 1.0 - length( vViewPosition ) / 180.0, 0.0, 1.0 );\n vec3 mapN = normalize( vec3( ( n1.xy * 0.7 + n2.xy + n3.xy * 0.4 * nearness ) * ( 0.35 + 0.65 * nearness ), 1.25 ) );'));
    };
    m.customProgramCacheKey = () => 'walkWater';
    water = m;
    return m;
  };
  const builtMaterial = (s: BuiltSurface, live?: Live): Material => {
    if ('paint' in s) {
      const [name, frame] = s.paint.split(':');
      // screens and the city at night give off their own light: unlit, not tone mapped, no fog on the city
      if (name === 'video') return new MeshBasicMaterial({ map: videoTex, toneMapped: false });
      const backdrop = name === 'toronto' || name === 'sydney' || name.startsWith('campus'); // a view out of a window: unlit, beyond the fog
      if (name.startsWith('screen') || backdrop) return new MeshBasicMaterial({ map: paintTex(name, Number(frame ?? 0)), toneMapped: false, fog: !backdrop });
      if (name === 'cloudPuffs') return cloudMaterial(paintTex(name, 0)); // the cloud field: every quad turned to the camera, sized by its vertex colour
      if (name.startsWith('sign')) { // a sign of the walk: the mark cut out by its own edge, lit from within once the lamps are
        const map = paintTex(name, 0), m = new MeshStandardMaterial({ map, alphaTest: 0.5, side: DoubleSide, roughness: 0.55, metalness: 0.05, envMapIntensity: 0.6, emissive: '#FFFFFF', emissiveMap: map, emissiveIntensity: 0 });
        signs.push(m);
        return m;
      }
      if (name === 'trip') return new MeshStandardMaterial({ map: paintTex(name, Number(frame ?? 0)), roughness: 0.92, metalness: 0, envMapIntensity: 0.2 }); // a matt print behind its mount: the sky does not lie on it as a veil
      if (name === 'leafSprig') return leafMaterial();
      if (name === 'leafLitter') return litterMaterial();
      if (name === 'windowPane') { // a window of Volta's building: the lit ones glow with the map as the day goes, the dark ones hold the sky
        const map = paintTex(name, Number(frame ?? 0));
        if (Number(frame ?? 0) === 1) return new MeshStandardMaterial({ map, roughness: 0.12, metalness: 0.1, envMapIntensity: 1 });
        const m = new MeshStandardMaterial({ map: paintTex(name, 1), roughness: 0.14, metalness: 0.1, envMapIntensity: 1, emissive: '#FFFFFF', emissiveMap: map, emissiveIntensity: 0 }); // by day a window like the rest; the room behind it shows when its light is on
        glowing.push(m);
        return m;
      }
      if (name === 'voltaLetters') return new MeshBasicMaterial({ map: paintTex(name, 0), alphaTest: 0.5 }); // black letters on the planks: the wall shows round them
      if (name === 'floqer') { const map = paintTex(name, 0); return new MeshStandardMaterial({ map, transparent: true, alphaTest: 0.4, emissive: '#FFFFFF', emissiveMap: map, emissiveIntensity: 0.45, roughness: 0.6, metalness: 0, envMapIntensity: 0.4 }); } // the sign on the brick: its own light, the wall through the clear
      if (name === 'crowd') { const map = paintTex(name, Number(frame ?? 0)); return new MeshStandardMaterial({ map, emissive: '#FFFFFF', emissiveMap: map, emissiveIntensity: 0.32, roughness: 0.9, metalness: 0, envMapIntensity: 0.5, transparent: true, alphaTest: 0.5, side: DoubleSide }); } // a cut-out row of people, a little lit from the stage
      return new MeshStandardMaterial({ map: paintTex(name, Number(frame ?? 0)), roughness: 0.6, metalness: 0, envMapIntensity: 0.6 });
    }
    // emitters and the water get their own copy so their state does not leak into the shared one
    if (live === 'bulb' && s.mat === 'bulb') { const m = matFor(s.mat).clone(); m.emissive.set('#FFC978'); m.emissiveIntensity = 6; return m; }
    if (live === 'tube' && s.mat === 'tubeGlass') { const m = matFor(s.mat).clone(); m.emissive.set('#EAF2FF'); m.emissiveIntensity = 0; return m; }
    if (live === 'water') { const m = matFor(s.mat).clone(); m.envMapIntensity = 0.25; return m; }
    if (s.mat === 'walkWater') return waterMaterial();
    if (s.mat === 'windowLit') { const m = matFor(s.mat).clone(); glowing.push(m); return m; }
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
    doors: [] as Array<{ obj: Object3D; from: number; to: number; base: number; shut?: [number, number] }>, // leaves that swing open with the stage progress, and some shut again behind him
    curtains: [] as MeshStandardMaterial[],
    water: [] as MeshStandardMaterial[],
    crowd: [] as Array<{ mat: MeshStandardMaterial; base: number }>, // the rows of the crowd: their two frames alternate while the hall is on
    tubes: [] as { mat: MeshStandardMaterial; light: PointLight }[],
    mixers: [] as Array<{ mixer: AnimationMixer; set: number }>,
    backdrops: [] as SetScoped<Object3D>[],
    flight: [] as Array<{ obj: Object3D; base: [number, number, number] }>,
    drops: [] as Array<{ obj: Object3D; from: number; to: number; by: number; base: number }>, // things that lower with the stage progress: the projection screen
    lamps: [] as Array<{ mat: MeshStandardMaterial; glow: SpriteMaterial; pool: MeshBasicMaterial; light?: PointLight; rank: number }>, // the walk's lamps, lit by its script
    movers: [] as Array<{ obj: Object3D; kind: NonNullable<Placement['mover']>; turn: number; set: number }>, // the seaplane, the streetcar, the ferry
    cues: [] as Array<{ obj: Object3D; p: Placement }>, // things that arrive with the scroll
    rises: [] as Array<{ obj: Object3D; plane: Plane; from: number; to: number; course: number; y0: number; y1: number }>, // things built from the ground up
    indoor: [] as Array<{ obj: Object3D; set: number; mode: 'in' | 'out'; kind: 'mover' | 'backdrop' | 'prop' }>, // Volta's view of the city and the harbour it stands in for (walk.ts VOLTA_VIEW)
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
  const groups: Group[] = SETS.map((S) => { const g = new Group(); if (S.at) g.position.set(...S.at); return g; }); // a set written about its own origin stands where `at` puts it
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
  /** A soft round light on clear: the halo round a lamp, and its pool on the ground. */
  let halo: CanvasTexture | undefined;
  const haloTex = (): CanvasTexture => {
    if (halo) return halo;
    const c = canvas2d(128, 128), x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,0.62)'); g.addColorStop(0.45, 'rgba(255,255,255,0.2)'); g.addColorStop(0.75, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    halo = new CanvasTexture(c);
    halo.colorSpace = SRGBColorSpace;
    return halo;
  };
  const buildHeldLaptop = (parts: Built[]) => {
    const obj = placeBuilt('laptopTour', { build: 'laptopTour', at: [0, 0, 0], live: 'screen' }, false, parts);
    obj.traverse((o) => { if (o instanceof Mesh) { o.castShadow = false; o.receiveShadow = false; } });
    obj.position.set(-0.25, -0.25, -0.66); // carried on the left arm, open, the screen turned to him: in the lower left of the frame, the walk's middle clear
    obj.rotation.set(0.42, 0.24, 0.04);
    obj.scale.setScalar(0.78);
    obj.traverse((o) => { if (o instanceof Mesh && o.name.includes('paint:screenTour')) { tourScreen = o; (o.material as MeshBasicMaterial).map = tourTex; (o.material as MeshBasicMaterial).needsUpdate = true; } });
    heldLaptop.add(obj);
  };
  const placeBuilt = (name: string, p: Placement, baked: boolean, part: Built[]): Object3D => {
    const g = new Group();
    g.name = name;
    for (const piece of part) {
      const key = 'mat' in piece.surface ? `mat:${piece.surface.mat}` : `paint:${piece.surface.paint}`;
      if (baked && !DROP_PROP.has(name) && !CONTEXT_PROP.has(name) && !pieceIsLive(key, p.live ?? '')) continue; // the rest of the prop is in the baked set
      const material = builtMaterial(piece.surface, p.live);
      const mesh = new Mesh(slabGeometry(piece, material), material);
      // the name carries what the bake pipeline needs: prop, surface, and whether it stays live at runtime
      mesh.name = `b|${name}|${'mat' in piece.surface ? `mat:${piece.surface.mat}` : `paint:${piece.surface.paint}`}|${p.live ?? ''}`;
      mesh.castShadow = (p.shadow ?? piece.pos.length < 20000) && !('mat' in piece.surface && piece.surface.mat === 'snowForm');
      mesh.receiveShadow = true;
      if ('paint' in piece.surface && piece.surface.paint === 'leafSprig') { mesh.customDepthMaterial = leafDepth(); mesh.castShadow = true; }
      if ('paint' in piece.surface && piece.surface.paint === 'leafLitter') mesh.castShadow = false;
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
      if (name === 'crowdRows' && 'paint' in piece.surface) live.crowd.push({ mat: material as MeshStandardMaterial, base: Number(piece.surface.paint.split(':')[1] ?? 0) });
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
        if (!baked) g.add(light); // baked: the bulb's light is in the lightmap; lit twice, the closed landing behind the house's door went white
      }
      g.add(mesh);
    }
    if (name === 'city') g.add(streetLightPoints()); // the streets below, a light every 28 m
    if (p.live === 'door' && p.door) live.doors.push({ obj: g, from: p.door[0], to: p.door[1], base: (p.rot?.[1] ?? 0) * D, shut: p.shut });
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
    if (name === 'ringPendant' && p.live === 'pendant' && !baked) {
      const light = new PointLight('#FFD9A8', 9, 7.5, 1.6); // a ring of warm light over the bar's side of the room
      light.position.set(0, -1.15, 0);
      g.add(light);
    }
    if (name === 'walkLamp' && p.live === 'walkLamp') {
      // a lamp of the walk: its head glows, a soft halo hangs round it in the damp air, and its pool lies on the paving;
      // the three at the Halifax end throw real light as well, on the snow, the rail and the trees
      let head: MeshStandardMaterial | undefined;
      g.traverse((o) => { if (o instanceof Mesh && o.name.includes('mat:lampLight')) { head = (o.material as MeshStandardMaterial).clone(); o.material = head; } });
      const glow = new SpriteMaterial({ map: haloTex(), color: '#FFC98A', transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: true, toneMapped: false });
      const halo = new Sprite(glow);
      halo.position.set(0.92, 4.4, 0);
      halo.scale.setScalar(2.6);
      const pool = new MeshBasicMaterial({ map: haloTex(), color: '#FFB56A', transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending, fog: true, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -8 });
      const lit = new Mesh(new PlaneGeometry(9, 9), pool);
      lit.rotation.x = -Math.PI / 2;
      lit.position.set(1.4, 0.05, 0);
      lit.name = 'b|walkLamp|mat:lampPool|walkLamp';
      g.add(halo, lit);
      const rank = WALK_LAMPS.length - 1 - WALK_LAMPS.indexOf(p.at[2]); // the furthest along comes on first
      let light: PointLight | undefined;
      if (rank < 3) { light = new PointLight('#FFC27E', 0, 8.5, 1.6); light.position.set(1.3, 4.2, 0); g.add(light); } // reaching the paving and the snow, not the water: on it the light broke into sparks
      if (head) live.lamps.push({ mat: head, glow, pool, light, rank });
    }
    if (p.cue) live.cues.push({ obj: g, p });
    return g;
  };

  /** The colour a bone's vertices take under a person's clothes: skin on the head, neck and hands; the top, the legs, the shoes. */
  const wearOf = (bone: string, w: Wear): string => {
    if (/^DEF-(head|neck|hand|f_|thumb)/.test(bone)) return w.skin;
    if (/^DEF-forearm/.test(bone)) return w.sleeves === 'long' ? w.top : w.skin;
    if (/^DEF-(spine|shoulder|upper_arm)/.test(bone)) return w.top;
    if (/^DEF-(hips|thigh|shin)/.test(bone)) return w.legs;
    if (/^DEF-(foot|toe)/.test(bone)) return w.shoes;
    return w.top;
  };
  const PERSON_CLIP = { idle: /Idle_Loop$/, talk: /Idle_Talking_Loop$/, sit: /Sitting_Idle_Loop$/, sitTalk: /Sitting_Talking_Loop$/ } as const;
  /**
   * A person: the rig cloned with its own skeleton, every vertex coloured by the bone that moves it most, a little self-lit
   * so faces read in a dark hall; the chosen idle loop started `phase` seconds in.
   */
  const dressPerson = (loaded: Loaded, p: Placement, set: number): Object3D => {
    const root = cloneRig(loaded.scene) as Group, person = p.person!;
    root.traverse((o) => {
      if (!(o instanceof SkinnedMesh)) return;
      o.frustumCulled = false;
      const bones = o.skeleton.bones, colors = bones.map((b) => new Color(wearOf(b.name, person.wear)));
      const mat = new MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85, metalness: 0, envMapIntensity: 0.6 });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uBone = { value: colors };
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\nuniform vec3 uBone[${bones.length}];\nvarying vec3 vBody;`)
          .replace('#include <skinbase_vertex>', '#include <skinbase_vertex>\n vBody = uBone[int(skinIndex.x)];');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vBody;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb = vBody;')
          .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vBody * 0.3;');
      };
      mat.customProgramCacheKey = () => `person${bones.length}`;
      o.material = mat;
      o.castShadow = p.shadow ?? true;
      o.receiveShadow = true;
    });
    const clip = loaded.animations.find((a) => PERSON_CLIP[person.clip].test(a.name)) ?? loaded.animations[0];
    if (clip) { const mixer = new AnimationMixer(root); const action = mixer.clipAction(clip); action.play(); action.time = person.phase % clip.duration; mixer.update(0); live.mixers.push({ mixer, set }); }
    return root;
  };
  /**
   * Hair for a person: a cap sized from the skull in the head bone's own space (the bind pose of the vertices the head bone
   * moves, taken through the mesh's bind matrix and the bone's inverse bind), so no world matrix and no unit of the rig is
   * involved; the cap is a child of the bone in the bone's units and rides the loop with it.
   */
  const attachHair = (root: Object3D, person: NonNullable<Placement['person']>) => {
    const box = new Box3(), v = new Vector3(), m4 = new Matrix4();
    let head: Object3D | undefined;
    root.traverse((m) => {
      if (!(m instanceof SkinnedMesh)) return;
      const hi = m.skeleton.bones.findIndex((b) => b.name === 'DEF-head');
      if (hi < 0) return;
      head = m.skeleton.bones[hi];
      m4.copy(m.skeleton.boneInverses[hi]).multiply(m.bindMatrix); // mesh bind space to the bone's space
      const pos = m.geometry.getAttribute('position'), idx = m.geometry.getAttribute('skinIndex');
      for (let i = 0; i < pos.count; i++) { if (idx.getX(i) !== hi) continue; v.fromBufferAttribute(pos, i).applyMatrix4(m4); box.expandByPoint(v); }
    });
    if (!head || box.isEmpty()) return;
    const c = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
    // the box holds the neck too: the skull is its upper part, the cap sits over that, open at the face and the nape
    const cap = new Mesh(new SphereGeometry(1, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), new MeshStandardMaterial({ color: person.hair, roughness: 0.75, metalness: 0, emissive: person.hair, emissiveIntensity: 0.3 }));
    cap.name = 'm|base_character|hair|person';
    cap.position.set(c.x, c.y + size.y * 0.14, c.z);
    cap.scale.set(size.x * 0.52, size.y * 0.42, size.z * 0.54);
    head.add(cap);
  };
  const place = async (p: Placement, set: number, baked = false): Promise<void> => {
    let obj: Object3D;
    if (p.model && p.live === 'person' && p.person) {
      obj = dressPerson(await loadModel(p.model), p, set);
      obj.traverse((o) => { if (o instanceof Mesh) o.name = `m|${p.model}|${o.name}|person`; });
    } else if (p.model && baked && (p.live === 'tv' || p.live === 'monitor')) {
      // the set is baked: only the glass is live, on an empty where the model stands
      obj = new Group();
      addScreen(obj, p, p.live === 'tv' ? videoTex : paintTex(p.screen ?? 'screen', p.screen ? 0 : 1), true);
    } else if (p.model) {
      obj = (await loadModel(p.model)).scene.clone();
      obj.traverse((o) => { if (o instanceof Mesh) o.name = `m|${p.model}|${o.name}|${p.live ?? ''}`; });
      if (p.live === 'fan') live.fans.push(obj);
      if (p.live === 'pendant' && !baked) {
        const light = new PointLight('#FFD9A8', 7, 5.0, 1.6); // in the mouth of the shade, so the pool falls on the chair
        light.position.set(0, p.rot?.[0] === 180 ? 1.16 : 0.12, 0); // turned over, the shade is at the model's top: the light 12 cm under it
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
      const parts = await geometrySource.load(p.build!, baked, p.live ?? '');
      checkActive();
      obj = placeBuilt(p.build!, p, baked, parts);
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
    if (p.live === 'person' && p.person) attachHair(obj, p.person);
    if (p.live === 'mover' && p.mover) { obj.rotation.order = 'YXZ'; live.movers.push({ obj, kind: p.mover, turn: (p.rot?.[1] ?? 0) * D, set }); }
    if (p.indoor) live.indoor.push({ obj, set, mode: p.indoor, kind: p.live === 'mover' ? 'mover' : p.live === 'city' ? 'backdrop' : 'prop' });
    if (p.cue && p.model) live.cues.push({ obj, p });
    if (p.rise) {
      // built from the ground up: a plane that rises through it a course at a time, and nothing over the plane is drawn
      obj.updateWorldMatrix(true, true);
      const box = new Box3().setFromObject(obj), plane = new Plane(new Vector3(0, -1, 0), box.min.y);
      obj.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        const list = (Array.isArray(o.material) ? o.material : [o.material]).map((m: Material) => { const c = m.clone(); c.clippingPlanes = [plane]; c.clipShadows = true; return c; });
        o.material = Array.isArray(o.material) ? list : list[0];
      });
      live.rises.push({ obj, plane, from: p.rise[0], to: p.rise[1], course: p.rise[2], y0: box.min.y, y1: box.max.y });
    }
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
    // the map and the mesh together: a baked room shown before its lightmap arrives draws black (its direct light is off by design)
    const [lightmap, g, env] = await Promise.all([texLoader.loadAsync(`/assets/stage/baked/set${i}_lm.webp`), gltf.loadAsync(`/assets/stage/baked/set${i}.glb`),
      S.bakedEnvironment ? texLoader.loadAsync(`/assets/stage/baked/set${i}_env.webp`) : undefined]);
    const lm: Texture<HTMLImageElement | HTMLCanvasElement> = lightmap;
    checkActive();
    // The phone tier does not need desktop-size room lightmaps resident in GPU memory.
    if (!tier && Math.max(lm.image.width, lm.image.height) > 1024) {
      const scale = 1024 / Math.max(lm.image.width, lm.image.height);
      const image = canvas2d(Math.round(lm.image.width * scale), Math.round(lm.image.height * scale));
      image.getContext('2d')!.drawImage(lm.image, 0, 0, image.width, image.height);
      lm.image = image;
      lm.needsUpdate = true;
    }
    if (env) {
      env.colorSpace = SRGBColorSpace;
      roomEnvironments.set(i, pmrem.fromEquirectangular(env)); // radiance / LM_SCALE: enter() multiplies back
      env.dispose();
      if (curSet === i) scene.environment = roomEnvironments.get(i)!.texture;
    }
    lm.flipY = false;
    lm.channel = 1;
    lm.colorSpace = SRGBColorSpace;
    const meshes: Mesh[] = [];
    g.scene.traverse((o) => { if (o instanceof Mesh) meshes.push(o); });
    for (const o of meshes) {
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
      await breathe();
    }
    groups[i].add(g.scene);
    // every built prop is offered: its live pieces (painted faces, glass, cloth) are built, the rest was baked; models only when live
    await placeProps(S.props.filter((p) => p.build || placementIsLive(p)), i, true);
  };

  const placeProps = async (props: Placement[], set: number, baked = false) => {
    // Start the independent worker/network jobs together; attach props in small, deterministic slices.
    await Promise.all(props.map((p) => p.build ? geometrySource.load(p.build, baked, p.live ?? '')
      : p.model && !(baked && (p.live === 'tv' || p.live === 'monitor')) ? loadModel(p.model) : undefined));
    for (const p of props) { checkActive(); await place(p, set, baked); await breathe(); }
  };

  /**
   * The hall's crowd (crowd.ts, docs/rebuild/39-crowd-research.md): every person a card cut from a render of a real
   * figure, turned about its own upright to face the eye, all of them in two draw calls (the near rows' atlas, the far
   * rows'). Each plays its loop at its own pace from its own start, one frame running into the next; the stage's
   * light falls away row by row and the back of the house goes into the hall's dark air.
   */
  const buildCrowd = async (set: number): Promise<void> => {
    const res = await fetch(deliveryUrl('/assets/stage/crowd/people.json'));
    if (!res.ok) return;
    const sheet = (await res.json()) as CrowdSheet, seats = crowdSeats(), loops = new Map<string, number>();
    checkActive();
    for (const name of ['near', 'far'] as const) {
      const A = sheet.atlases[name], mine = seats.filter((s) => s.near === (name === 'near'));
      if (!A || !mine.length) continue;
      const map = await texLoader.loadAsync(`/assets/stage/crowd/${A.file}`);
      checkActive();
      map.colorSpace = SRGBColorSpace;
      map.anisotropy = maxAniso;
      const n = mine.length, at = new Float32Array(n * 3), cell = new Float32Array(n * 4), anim = new Float32Array(n * 4), look = new Float32Array(n * 4);
      mine.forEach((s, i) => {
        const beside = (row: number, seat: number) => loops.get(`${row}:${seat}`) ?? -1;
        const k = crowdLoop(sheet, s, [beside(s.row, s.seat - 1), beside(s.row, s.seat - 2), beside(s.row - 1, s.seat), beside(s.row - 1, s.seat + 1)]);
        loops.set(`${s.row}:${s.seat}`, k);
        const p = sheet.people[k];
        at.set(s.at, i * 3);
        cell.set([p.x / A.size[0], 1 - (p.y + A.cell[1]) / A.size[1], A.cell[0] / A.size[0], A.cell[1] / A.size[1]], i * 4);
        anim.set([p.frames, (p.frames / CROWD.period[p.action]) * s.rate, s.phase, s.mirror ? -1 : 1], i * 4);
        look.set([sheet.metres[0] * s.size, sheet.metres[1] * s.size, s.light, s.haze], i * 4);
      });
      const g = new InstancedBufferGeometry();
      g.setAttribute('position', new Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
      g.setAttribute('uv', new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aAt', new InstancedBufferAttribute(at, 3));
      g.setAttribute('aCell', new InstancedBufferAttribute(cell, 4));
      g.setAttribute('aAnim', new InstancedBufferAttribute(anim, 4));
      g.setAttribute('aLook', new InstancedBufferAttribute(look, 4));
      g.instanceCount = n;
      const m = new MeshBasicMaterial({ map, alphaTest: 0.4, fog: false, side: DoubleSide });
      m.onBeforeCompile = (sh) => {
        sh.uniforms.uTime = timeU; sh.uniforms.uFeet = { value: sheet.feet }; sh.uniforms.uKey = { value: new Color('#FFE9CF') }; sh.uniforms.uAir = { value: new Color('#16141A') };
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uFeet; attribute vec3 aAt; attribute vec4 aCell; attribute vec4 aAnim; attribute vec4 aLook; varying vec2 vNext; varying float vBlend; varying vec2 vAir;')
          // the frame of the loop this instant and the one after it, each a cell of the atlas; a mirrored card reads its cell the other way
          .replace('#include <uv_vertex>', '#include <uv_vertex>\n float fr = mod(uTime * aAnim.y + aAnim.z, aAnim.x), f0 = floor(fr), f1 = mod(f0 + 1.0, aAnim.x), ux = aAnim.w > 0.0 ? uv.x : 1.0 - uv.x;\n vMapUv = vec2(aCell.x + (f0 + ux) * aCell.z, aCell.y + uv.y * aCell.w); vNext = vec2(aCell.x + (f1 + ux) * aCell.z, aCell.y + uv.y * aCell.w); vBlend = fract(fr); vAir = aLook.zw;')
          // the card stands on its feet where its seat is and turns about its upright to the eye's place, so a turn of the head moves nothing
          .replace('#include <project_vertex>', ' vec4 seat = modelMatrix * vec4(aAt, 1.0); vec3 eye = (inverse(viewMatrix) * vec4(0.0, 0.0, 0.0, 1.0)).xyz; vec2 to = normalize(eye.xz - seat.xz);\n float sway = sin(uTime * 0.8 + aAnim.z * 2.7) * 0.01 * position.y;\n vec3 stood = seat.xyz + vec3(to.y, 0.0, -to.x) * (position.x * aLook.x + sway) + vec3(0.0, (position.y - uFeet) * aLook.y, 0.0);\n vec4 mvPosition = viewMatrix * vec4(stood, 1.0); gl_Position = projectionMatrix * mvPosition;');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nuniform vec3 uKey; uniform vec3 uAir; varying vec2 vNext; varying float vBlend; varying vec2 vAir;')
          .replace('#include <map_fragment>', ' vec4 sampledDiffuseColor = mix(texture2D(map, vMapUv), texture2D(map, vNext), smoothstep(0.3, 0.7, vBlend));\n diffuseColor *= sampledDiffuseColor;\n diffuseColor.rgb = mix(diffuseColor.rgb * uKey * vAir.x, uAir, vAir.y);');
      };
      m.customProgramCacheKey = () => 'crowd';
      const mesh = new Mesh(g, m);
      mesh.frustumCulled = false; // its cards stand all over the house, not where the one quad of its geometry is
      mesh.name = `crowd:${name}`;
      groups[set].add(mesh);
      await breathe();
    }
    kick();
  };

  const loadSet = async (i: number): Promise<void> => {
    const S = SETS[i];
    if (S.baked && exportSet !== i && !LIVE_ALL) {
      await loadBaked(i);
      if (S.id === 'convocation') await buildCrowd(i);
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
    await placeProps(S.props, i);
    if (S.id === 'convocation' && exportSet !== i) await buildCrowd(i); // never in the bake: it is drawn, not lit
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
    const stands = groups[i].position.clone(), turned = groups[i].rotation.y;
    groups[i].position.set(0, 0, 0); // a set that stands off its origin (StageSet.at, HOME, DELHI) is baked about its own: its meshes, its lights, the view it is seen from
    groups[i].rotation.y = 0;
    groups[i].updateWorldMatrix(true, true);
    const home = (p: number[]): number[] => { const x = p[0] - stands.x, z = p[2] - stands.z, c = Math.cos(turned), n = Math.sin(turned); return [x * c - z * n, p[1] - stands.y, x * n + z * c]; };
    const own = (k: { cam: number[]; look: number[]; fov: number } | undefined) => (k ? { cam: home(k.cam), look: home(k.look), fov: k.fov } : null);
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
    groups[i].position.copy(stands);
    groups[i].updateWorldMatrix(true, true);
    for (const [o, m] of swapped) o.material = m;
    const bytes = new Uint8Array(buf);
    let bin = '';
    for (let k = 0; k < bytes.length; k += 0x8000) bin += String.fromCharCode.apply(null, Array.from(bytes.subarray(k, k + 0x8000)));
    (window as unknown as { __export: unknown }).__export = {
      glb: btoa(bin),
      manifest: { set: i, id: S.id, env: S.bake?.env ?? S.env, envPower: S.bake?.envPower ?? S.envPower, exposure: S.exposure, tint: S.bake?.tint ?? S.tint, sun: S.bake?.sun ?? S.sun, fog: S.fog, shell: S.shell ?? null, lights,
        view: own(S.bake ? S.bake.view : DOLLY.find((k) => k.set === i && k.blend === undefined)) },
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
  const diagnostics = { yFor, renderer, composer, ao, bloom, scene, camera, Raycaster, Vector3, readyMs: 0, q: 0 };
  if (AUDIT) (window as unknown as { __stage: unknown }).__stage = diagnostics;

  // assets that arrive later repaint what uses them
  const artwork = [
    loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster', 'jobsPoster']); }),
    loadImage('/assets/story/cc.jpg').then((i) => { images.clan = i; repaint(['poster']); }),
    loadImage('/assets/stage/bean-logo.png').then((i) => { images.bean = i; repaint(['beanSign', 'whiteboardBean', 'screenBeanPhone', 'screenProductHunt', 'beanPoster', 'boothFront', 'boothBack', 'boothMontreal', 'screenTour', 'signVancouver', 'signToronto', 'signMontreal', 'signHalifax', 'certificateInvestNS']); }),
    ...(['websummit', 'elevate', 'volta', 'investns', 'producthunt', 'dalhousie'] as const).map((key) => loadImage(`/assets/stage/logos/${key}.png`).then((i) => { images[key] = i; repaint(['logo', 'signWebsummit', 'signElevate', 'signInvestns', 'signVolta', 'voltaLetters']); })),
    loadImage('/assets/stage/logos/floqer.png').then((i) => { images.floqer = i; repaint(['floqer']); }),
    ...([['elevatePhoto', 'elevate'], ['demodayPhoto', 'demoday']] as const).map(([key, file]) => loadImage(`/assets/stage/photos/${file}.jpg`).then((i) => { images[key] = i; repaint(['photo']); })),
    ...([['tripAward', 'google-award'], ['tripSign', 'google-sign']] as const).map(([key, file]) => loadImage(`/assets/stage/photos/${file}.jpg`).then((i) => { images[key] = i; repaint(['trip']); })),
    loadImage('/assets/stage/collect/slide.webp').then((i) => { images.collect = i; repaint(['screenCollect']); }),
    document.fonts.load('700 40px "Product Sans"').then(() => repaint(['sign'])).catch(() => {}),
  ];

  /**
   * The numbers on the paving (walk.ts MARKS): each a panel of lettering lying on the walk's own line, 2.6 m across and
   * 3.6 m long so it reads from the eye's height, the number over its name. By day it is white paint, lit and shadowed
   * with the paving; in Halifax, on the snow, it is light thrown down. It counts up as he comes to it.
   */
  const marks: Array<{ mesh: Mesh; tex: CanvasTexture; c: HTMLCanvasElement; text: string; night: boolean }> = [];
  const paintMark = (k: (typeof marks)[number], text: string, m: Mark) => {
    const x = k.c.getContext('2d')!, w = k.c.width, h = k.c.height, u = w / 512, face = '"Space Grotesk", \'Helvetica Neue\', Helvetica, Arial, sans-serif';
    const spaced = (t: string) => t.toUpperCase().split('').join('\u200A');
    x.clearRect(0, 0, w, h);
    x.fillStyle = x.strokeStyle = m.device ? '#FFFFFF' : k.night ? '#FFE1B0' : '#F6F4EE'; // an honour is brass: its colour is the material's
    x.textAlign = 'center'; x.textBaseline = 'alphabetic';
    // the ground foreshortens what lies along the walk: everything is drawn tall, the way a road's letters are
    const tall = (y: number, s: number, draw: () => void) => { x.save(); x.translate(w / 2, h * y); x.scale(u, u * s); draw(); x.restore(); };
    const number = (y: number, top: number) => tall(y, 2.5, () => {
      let size = top;
      x.font = `700 ${size}px ${face}`;
      while (x.measureText(text).width > 512 * 0.92 && size > 60) { size -= 10; x.font = `700 ${size}px ${face}`; }
      x.fillText(text, 0, 0);
    });
    if (!m.device) {
      number(0.7, 250);
      tall(0.95, 2.1, () => { x.font = `500 50px ${face}`; x.fillText(spaced(m.label), 0, 0); });
    } else {
      // an honour: the number in its device, its name under it, a line under that
      if (m.device === 'laurel') tall(0.33, 2.3, () => {
        // a wreath of two branches wide round the number, open at the top, all of it over the name
        const RX = 228, RY = 92;
        for (const side of [-1, 1]) for (let i = 0; i < 11; i++) {
          const a = Math.PI * (0.1 + (i / 10) * 0.66), px = side * RX * Math.sin(a), py = RY * Math.cos(a), along = Math.atan2(-RY * Math.sin(a), side * RX * Math.cos(a));
          for (const lean of [-0.5, 0.45]) { x.save(); x.translate(px, py); x.rotate(along + lean * side); x.beginPath(); x.ellipse(24, 0, 28, 6.5, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
        }
        x.lineWidth = 4; x.beginPath(); x.moveTo(-30, RY + 6); x.lineTo(0, RY - 2); x.lineTo(30, RY + 6); x.stroke(); // the tie
      });
      else for (const y of [0.115, 0.625]) tall(y, 2.3, () => x.fillRect(-170, 0, 340, 4)); // a rule over the sum and one under it
      number(m.device === 'laurel' ? 0.5 : 0.555, m.device === 'laurel' ? 150 : 215);
      tall(m.sub ? 0.845 : 0.88, 2.1, () => { x.font = `600 40px ${face}`; x.fillText(spaced(m.label), 0, 0); });
      if (m.sub) tall(0.96, 2.1, () => { x.font = `500 27px ${face}`; x.globalAlpha = 0.8; x.fillText(spaced(m.sub!), 0, 0); });
    }
    k.text = text;
    k.tex.needsUpdate = true;
  };
  const buildMarks = () => {
    for (const m of MARKS) {
      const c = m.device ? canvas2d(1024, 1600) : canvas2d(512, 800), tex = new CanvasTexture(c), night = m.city === 'halifax'; // an honour is painted once, and finely
      tex.colorSpace = SRGBColorSpace; tex.anisotropy = maxAniso;
      const lies = { map: tex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12 };
      // a count is lettered on the paving, or thrown on the snow as light; an honour is brass let into the walk, warm under the lamps
      const material = m.device ? new MeshStandardMaterial({ ...lies, color: '#D8A544', roughness: 0.34, metalness: 0.85, envMapIntensity: 1.3, emissive: '#8A5410', emissiveIntensity: 0.55 })
        : night ? new MeshBasicMaterial({ ...lies, blending: AdditiveBlending, toneMapped: false })
        : new MeshStandardMaterial({ ...lies, roughness: 0.8, metalness: 0, envMapIntensity: 0.4 });
      const mesh = new Mesh(new PlaneGeometry(2.6, 3.6), material);
      mesh.rotation.set(-Math.PI / 2, 0, Math.PI); // lying on the paving, its top away up the walk, its left on his left
      mesh.position.set(WALK.x, 0.03, m.z);
      mesh.receiveShadow = !night;
      mesh.name = 'b|walkMark|paint:mark|walk';
      mesh.renderOrder = 2;
      const k = { mesh, tex, c, text: '', night: night && !m.device };
      paintMark(k, markAt(WALK.to.c, m).text, m);
      marks.push(k);
      groups[8].add(mesh);
    }
  };
  const dolly = makeDolly(DOLLY);
  let walkAir: Air | undefined; // the air of the walk while the frame is on it
  let atHome = false; // whether the apartment stands behind Floqer's stair door
  let delhiAway: boolean | undefined; // whether the 2020 room stands behind the door in Google's block (DELHI)
  let homeNight = false; // whether what is outside is the apartment's own night (on the stair, his door about to open)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, visible = false, target = 0, cur = 0, vel = 0, lastT = 0, curSet = -1, shown = false;
  const kick = () => { if (!stopped && !raf) raf = requestAnimationFrame(tick); };

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
    const c = Math.min(1, Math.max(0, q)) * STAGE_SPAN, last = articles.length - 1;
    const tops = articles.map((a) => a.offsetTop), base = root.getBoundingClientRect().top + scrollY;
    const lastStart = chapterStart(last);
    if (c >= lastStart) return base + tops[last] + (c - lastStart) * (tops[last] - tops[last - 1]); // the last card runs LAST_SPAN chapter lengths down its own height (it is a viewport taller than that, so the stage stays pinned to its end)
    let i = 0;
    while (i < last - 1 && c >= chapterStart(i + 1)) i++;
    return base + tops[i] + ((c - chapterStart(i)) / (CARD_SPAN[i] ?? 1)) * (tops[i + 1] - tops[i]); // a card that runs two chapters spends its height on both
  }
  const progress = () => {
    if (articles.length < 2) return 0;
    const y = -root.getBoundingClientRect().top;
    const tops = articles.map((a) => a.offsetTop), last = tops.length - 1;
    let c: number;
    if (y >= tops[last]) c = chapterStart(last) + Math.min(LAST_SPAN, Math.max(0, (y - tops[last]) / Math.max(1, tops[last] - tops[last - 1]))); // the last card: LAST_SPAN chapter lengths down its own height
    else {
      let i = 0;
      while (i < last - 1 && y >= tops[i + 1]) i++;
      const span = Math.max(1, tops[i + 1] - tops[i]);
      c = chapterStart(i) + (CARD_SPAN[i] ?? 1) * Math.min(1, Math.max(0, (y - tops[i]) / span));
    }
    return Math.max(0, c / (chapters - 1)); // in units of (chapters - 1), as stageProgress expects; above 1 inside the last card
  };

  /** Switches the light to a set: environment, tint, exposure, fog. Called while the frame is in a doorway. */
  const enter = (i: number) => {
    curSet = i;
    showSetBackdrops(live.backdrops, homeNight ? 0 : i);
    // one sky dome for every open-air set, in the scene itself (an object can only have one parent: adding it to each
    // set's group in turn left it in the last one, and the plaza's sky went black in dark mode). It shows whenever the
    // set, the one before (seen back through the door) or the one ahead (seen through the exit) is open-air
    sky.visible = !homeNight && !SETS[i].sky && (SETS[i].outlook === true || [i - 1, i, i + 1].some((k) => SETS[k]?.env === 'sky'));
    dome.visible = !!SETS[i].sky; // the walk is under its own skies
    // the sets share one scene in a ring; only a neighbour can be seen through a door, so the rest are
    // hidden. A neighbour stays visible through the doorway both ways, so a door is never a void that
    // pops: the plaza's daylight shows through the lab's south door before the walk reaches it
    groups.forEach((g, k) => {
      const d = Math.min(Math.abs(k - i), groups.length - Math.abs(k - i));
      g.visible = d <= 1 || (SETS[i].also ?? []).includes(k); // `also`: a set that keeps a farther one in view (the terrace, two doors long)
    });
    const S = SETS[i];
    ao.configuration.intensity = S.baked ? 1.4 : 2.6; // the lightmap already holds the soft occlusion
    scene.environment = roomEnvironments.get(i)?.texture ?? (i === 5 && flightEnvironment ? flightEnvironment.texture : S.env === 'sky' ? skyEnv : studioEnv);
    const span = i === 5 ? 140 : WALK_SETS.has(i) ? 17 : 7; // out on the walk the low sun throws the rail and the lamps a long way across the paving
    Object.assign(sun.shadow.camera, { left: -span, right: span, top: span, bottom: -span, far: i === 5 ? 450 : WALK_SETS.has(i) ? 150 : 80 });
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

    // on the stair, before his door opens, the house's street and sky give way to the apartment's city and night: neither
    // is in the frame there, and through the door the apartment's glass is on its own night from the first
    const night = f.set === 0 || (f.set === 12 && f.q * STAGE_SPAN >= HOME.night);
    if (night !== homeNight) { homeNight = night; if (f.set === curSet) enter(curSet); }
    if (f.set !== curSet) enter(f.set);
    // the apartment is one set in two places: from the hall on it stands behind the door at the top of Floqer's stair (HOME)
    const home = f.q * STAGE_SPAN >= HOME.from;
    if (home !== atHome) {
      atHome = home;
      groups[0].position.set(...(home ? HOME.at : ([0, 0, 0] as [number, number, number])));
      groups[0].rotation.y = home ? Math.PI : 0;
      groups[0].updateMatrixWorld(true);
    }
    // the 2020 room is one set in two places too: behind the door in Google's block until the walk is well inside it (DELHI)
    const away = f.q < DELHI.back;
    if (away !== delhiAway) {
      delhiAway = away;
      groups[4].position.set(...(away ? DELHI.at : ([0, 0, 0] as [number, number, number])));
      groups[4].rotation.y = away ? DELHI.turn * D : 0;
      groups[4].updateMatrixWorld(true);
    }
    if (f.set === 4) groups[5].visible = !away; // the jet bridge is on the room's west door only where the room was built
    // These neighbours connect by the phone, not their shared wall. Keep cabin trim out of
    // the theatre; its boarding corridor becomes visible again beyond the rear exit.
    if (f.set === 6) groups[5].visible = f.cam[2] > -2;
    // through a doorway the light of one set becomes the light of the next by degrees: exposure, fog,
    // sky and sun cross over the length of the passage, so the eye never sees a cut or a blink. Only
    // the environment map and the shadow strength switch, at the midpoint, inside enter()
    // on the tour's walk the light is the walk's script, a function of the chapter (walk.ts): every set of the walk
    // answers with the same air, so a threshold between two of them changes nothing the script has not already changed
    const chapter = f.q * STAGE_SPAN, air: Air | undefined = WALK_SETS.has(f.from) || WALK_SETS.has(f.into) ? airAt(chapter) : undefined;
    type Lit = Pick<StageSet, 'tint' | 'exposure' | 'envPower' | 'sun' | 'fog'>;
    const lightOf = (k: number): Lit => (air && WALK_SETS.has(k) ? air : SETS[k]);
    const A: Lit = lightOf(f.from), B: Lit = lightOf(f.into);
    const t = f.from === f.into ? 0 : f.blend * f.blend * (3 - 2 * f.blend);
    const mix = (a: number, b: number) => a + (b - a) * t;
    // the environment's strength belongs to the map that is showing: a room's own map (radiance / LM_SCALE) runs LM_SCALE times a
    // studio's, and mixed across the blend the hall's studio map ran at the house's strength and washed the room white at the door
    const envOf = (k: number) => lightOf(k).envPower * (roomEnvironments.has(k) && !(air && WALK_SETS.has(k) && air.inside < 0.5) ? LM_SCALE : 1);
    scene.environmentIntensity = roomEnvironments.has(f.from) === roomEnvironments.has(f.into) ? mix(envOf(f.from), envOf(f.into)) : envOf(curSet);
    hemi.intensity = mix(A.tint.power, B.tint.power);
    hemi.color.set(A.tint.sky).lerp(new Color(B.tint.sky), t);
    hemi.groundColor.set(A.tint.ground).lerp(new Color(B.tint.ground), t);
    sun.intensity = mix(A.sun.power, B.sun.power);
    sun.color.set(A.sun.color).lerp(new Color(B.sun.color), t);
    fog.color.set(A.fog.color).lerp(new Color(B.fog.color), t);
    if (!VOID) renderer.setClearColor(fog.color); // what is not built is the air's colour, never the page's: a hairline between two walls is lost in it
    fog.near = mix(A.fog.near, B.fog.near);
    fog.far = mix(A.fog.far, B.fog.far);
    renderer.toneMappingExposure = mix(A.exposure, B.exposure);
    sun.shadow.intensity = mix(A.sun.shadow, B.sun.shadow);
    const sunDir = new Vector3(...A.sun.dir).normalize().lerp(new Vector3(...B.sun.dir).normalize(), t).normalize(); // the shadows swing round with the light, never jump
    // the sun follows the look, so the shadow map stays tight around what is in frame
    const fl = flightAt(f.q, reduce.matches);
    const look = f.set === 5 ? new Vector3(flightRoll.position.x + HALIFAX_CAMPUS[0], -fl.altitude, flightRoll.position.z + HALIFAX_CAMPUS[1] + fl.travel - FLIGHT.distance) : new Vector3(...f.look);
    sun.position.copy(look).addScaledVector(sunDir, f.set === 5 ? 600 : WALK_SETS.has(f.set) ? 70 : 30);
    sun.target.position.copy(look);
    sun.target.updateMatrixWorld();
    walkAir = air && WALK_SETS.has(f.set) ? air : undefined;
    if (walkAir) {
      const a = walkAir, showing: SkyName = a.mix < 0.5 ? a.sky : a.into;
      domeU.mapA.value = skyMaps[a.sky] ?? null;
      domeU.mapB.value = skyMaps[a.into] ?? domeU.mapA.value;
      domeU.turnA.value = skyTurn(a.sky); domeU.turnB.value = skyTurn(a.into);
      domeU.lookA.value.set(...SKY_LOOK[a.sky]); domeU.lookB.value.set(...SKY_LOOK[a.into]);
      domeU.mixAB.value = a.mix; domeU.dim.value = a.dim; domeU.mist.value = a.mist;
      domeU.mistColor.value.set(a.fog.color);
      dome.visible = domeU.mapA.value !== null;
      dome.position.copy(camera.position);
      const env = a.inside > 0.5 ? roomEnvironments.get(f.set)?.texture ?? studioEnv : skyEnvs[showing]?.texture ?? skyEnv;
      if (scene.environment !== env) scene.environment = env;
      // in the hall beyond Volta's far wall the crowd is on its feet: the door into the wing fits its case, so nothing of
      // the hall is drawn until the door is about to open
      if (f.set === 10) groups[11].visible = chapter > VOLTA_DOOR[0] - 0.08;
      // a walk, not a glide: the eye rises and falls a centimetre with each step and the head rolls a breath, by the distance walked, so it rests when the scroll does
      if (a.inside < 0.5 && !reduce.matches && !pinned) {
        const step = (walkZ(chapter) / 0.75) * Math.PI;
        camera.position.y += 0.011 * Math.sin(step * 2) * (1 - a.inside);
        camera.rotateZ(0.0022 * Math.sin(step));
      }
    }
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
    if (!ready || stopped) return;
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
    if (AUDIT) diagnostics.q = q;
    const mainFrame = dolly(q);
    root.classList.toggle('phone-focus', phoneAt(q, reduce.matches).visible);
    frame(mainFrame);
    for (const d of live.doors) {
      const k = Math.min(1, Math.max(0, (q - d.from) / (d.to - d.from))), s = d.shut ? Math.min(1, Math.max(0, (q - d.shut[0]) / (d.shut[1] - d.shut[0]))) : 0;
      d.obj.rotation.y = d.base + (Math.PI / 2) * k * k * (3 - 2 * k) * (1 - s * s * (3 - 2 * s));
    }
    for (const d of live.drops) { const k = Math.min(1, Math.max(0, (q - d.from) / (d.to - d.from))); d.obj.position.y = d.base - d.by * k * k * (3 - 2 * k); }
    { // the walk's things: what arrives, what goes up, what moves, what lights
      const c = q * STAGE_SPAN, clock = reduce.matches ? 0 : now / 1000;
      for (const k of live.cues) {
        const cue = k.p.cue!, e = cueAt(c, cue), rest = 1 - e, at = k.p.at, base = typeof k.p.scale === 'number' ? k.p.scale : 1;
        k.obj.visible = e > 0.001;
        k.obj.position.set(at[0] + (cue.move?.[0] ?? 0) * rest, at[1] + (cue.move?.[1] ?? 0) * rest, at[2] + (cue.move?.[2] ?? 0) * rest);
        if (cue.turn) k.obj.rotation.set(((k.p.rot?.[0] ?? 0) + cue.turn[0] * rest) * D, ((k.p.rot?.[1] ?? 0) + cue.turn[1] * rest) * D, ((k.p.rot?.[2] ?? 0) + cue.turn[2] * rest) * D);
        if (cue.scale !== undefined) k.obj.scale.setScalar(base * (cue.scale + (1 - cue.scale) * e));
      }
      for (const r of live.rises) {
        const t = Math.min(1, Math.max(0, (c - r.from) / (r.to - r.from))), h = r.y1 - r.y0 + r.course;
        r.plane.constant = t >= 1 ? r.y1 + 1 : r.y0 + Math.floor((t * h) / r.course) * r.course;
        r.obj.visible = t > 0;
      }
      for (const m of live.movers) {
        const pose: Pose = m.kind === 'seaplane' ? seaplaneAt(c, clock) : m.kind === 'streetcar' ? streetcarAt(c) : ferryAt(c, clock);
        m.obj.visible = pose.on;
        m.obj.position.set(...pose.at);
        m.obj.rotation.set(-pose.pitch * D, m.turn + pose.yaw * D, pose.roll * D);
      }
      // at Volta's door the harbour gives way to the city out of its glass; the building's front fills the frame then
      const view = voltaViewAt(c);
      for (const v of live.indoor) if (view !== (v.mode === 'in')) v.obj.visible = false; else if (v.kind !== 'mover') v.obj.visible = v.kind === 'prop' || curSet === v.set; // a mover keeps its own; a backdrop shows with its set; a prop with its group
      const year = onWalk(c) ? airAt(c) : undefined, lamps = year?.lamps ?? 0;
      seasonU.value = year?.season ?? 0;
      coverU.value = year?.cover ?? 0;
      fallU.value = Math.min(1, Math.max(0, (seasonU.value - 1.02) / 0.9));
      for (const l of live.lamps) {
        const on = Math.min(1, Math.max(0, (lamps * 1.5 - l.rank * 0.09) / 0.2)), lit = on * on * (3 - 2 * on);
        l.mat.emissiveIntensity = 9 * lit;
        l.glow.opacity = 0.85 * lit;
        l.pool.opacity = 0.2 * lit;
        if (l.light) l.light.intensity = 17 * lit;
      }
      for (const g of glowing) g.emissiveIntensity = 3.2 * Math.min(1, Math.max(0, (lamps - 0.12) / 0.6));
      for (const g of signs) g.emissiveIntensity = 0.85 * Math.min(1, Math.max(0, (lamps - 0.12) / 0.6));
      MARKS.forEach((m, i) => {
        const k = marks[i], at = markAt(c, m);
        if (!k) return;
        k.mesh.visible = at.shown > 0.002;
        (k.mesh.material as MeshBasicMaterial).opacity = (k.night ? 0.55 * lamps : 0.9) * Math.min(1, at.shown * 1.6);
        if (at.text !== k.text && k.mesh.visible) paintMark(k, at.text, m);
      });
      weather.update(walkAir, clock, camera.position);
      domeU.drift.value = clock * 0.00022;
    }
    const flight = flightAt(q, reduce.matches);
    flightWorld.position.set(0, -flight.altitude - flightRoll.position.y, flight.travel - FLIGHT.distance);
    flightRoll.rotation.z = flight.bank * D;
    veil.style.opacity = String(mainFrame.set === 5 ? 0.7 * flight.veil : 0); // the puffs on the track do most of it; the veil adds the glow
    const lap = laptopAt(q * STAGE_SPAN), page = lap.view;
    if (page !== tourPage) { tourFrom = tourPage; tourSwitched = now; tourPage = page; } // the laptop's page follows the city, the last page fading out over half a second: a cut on the screen read as a flash
    if (mainFrame.set === 11 && live.crowd.length) { // the crowd waves: the rows swap between the two frames three times a second, out of step with each other
      if (!crowdFrames) crowdFrames = [paintTex('crowd', 0), paintTex('crowd', 1)];
      const f = Math.floor(now / 330) % 2;
      for (const c of live.crowd) { c.mat.map = crowdFrames[(c.base + f) % 2]; c.mat.emissiveMap = c.mat.map; }
    }
    if (tourScreen && heldLaptop.visible && now - tourLast > 80) { // repaint the live screen at about twelve a second
      tourLast = now;
      const x2 = tourCanvas.getContext('2d')!, fade = tourFrom < 0 ? 1 : Math.min(1, (now - tourSwitched) / 500);
      tourLive(x2, tourCanvas.width, tourCanvas.height, (now - tourShown) / 1000, tourPage, images.bean); // its bars fill over the first seconds it is in hand
      if (fade < 1) { x2.globalAlpha = 1 - fade; tourLive(x2, tourCanvas.width, tourCanvas.height, 8, tourFrom, images.bean); x2.globalAlpha = 1; } else tourFrom = -1;
      tourTex.needsUpdate = true;
    }
    // the laptop: raised into the frame over the doorway out of the Bean house, with the scroll (it appeared at once at the midpoint: a pop)
    const lift = lap.lift, showLaptop = lift > 0.001; // up for the numbers as a city begins, down again so the city has the frame
    if (showLaptop && !heldLaptop.visible) tourShown = now;
    heldLaptop.visible = showLaptop;
    heldLaptop.position.y = -0.45 * (1 - lift * lift * (3 - 2 * lift));
    { // the coffee: into the hand at Volta's bar, set down before the wing's door
      const q = mainFrame.q, up = Math.max(0, Math.min(1, (q - COFFEE.raise) / (COFFEE.held - COFFEE.raise))), down = Math.max(0, Math.min(1, (q - COFFEE.down) / (COFFEE.gone - COFFEE.down)));
      const t = up * (1 - down), e = t * t * (3 - 2 * t);
      heldCoffee.visible = mainFrame.set === 10 && t > 0;
      heldCoffee.position.set(0.25, -0.3 + 0.09 * e, -0.58); // low right, an arm's length out
      heldCoffee.rotation.set(0.12, -0.5, 0.06);
    }
    { // the degree: raised into the hand over the last steps to the centre and held up to the hall; crushed in the fist on the way off; thrown into the bin backstage
      const q = mainFrame.q, unit = (v: number) => Math.max(0, Math.min(1, v)), ease = (v: number) => v * v * (3 - 2 * v);
      const e = ease(unit((q - DEGREE.raise) / (DEGREE.held - DEGREE.raise))), crush = ease(unit((q - DEGREE.crush[0]) / (DEGREE.crush[1] - DEGREE.crush[0]))), thrown = unit((q - DEGREE.thrown[0]) / (DEGREE.thrown[1] - DEGREE.thrown[0]));
      const inHall = mainFrame.set === 11 || mainFrame.from === 11 || mainFrame.into === 11;
      heldDegree.visible = mainFrame.set === 11 && e > 0 && thrown <= 0;
      heldDegree.position.set(0.16 - 0.03 * crush, -0.5 + 0.4 * e - 0.05 * crush, -0.42);
      heldDegree.rotation.set(0.35 + 0.25 * (1 - e), 0.35, -0.75);
      if (degreeScroll && degreeBall) {
        const fist = Math.sin(now / 45) * 0.04 * Math.sin(Math.PI * crush); // the fist working at it
        degreeScroll.visible = crush < 0.55;
        degreeScroll.scale.set(1 - 0.72 * Math.min(1, crush / 0.55), 1 + 0.9 * crush + fist, 1 + 0.9 * crush - fist);
        degreeScroll.rotation.set(crush * 1.4, 0, 0);
        degreeBall.visible = crush >= 0.55;
        degreeBall.scale.setScalar(1.35 - 0.35 * unit((crush - 0.55) / 0.45) + fist);
        degreeBall.rotation.set(crush * 3, crush * 2, 0);
      }
      if (thrownBall) {
        thrownBall.visible = inHall && groups[11].visible && thrown > 0;
        if (thrownBall.visible) {
          const t = thrown, rest = t >= 1;
          thrownBall.position.lerpVectors(release, binMouth, t);
          thrownBall.position.y += rest ? -0.5 : 0.55 * 4 * t * (1 - t); // an easy lob; then it lies in the bin
          thrownBall.rotation.set(t * 9, t * 6, t * 4);
        }
      }
    }

    // things on their own clock
    const t = now / 1000;
    const still = reduce.matches;
    if (!still) {
      for (const { mixer, set } of live.mixers) if (groups[set].visible) mixer.update(dt);
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
    else if (running) { raf = -1; setTimeout(() => { if (!stopped) raf = requestAnimationFrame(tick); }, 33); }
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

  const prepare = async () => {
    if (Number.isInteger(exportSet) && SETS[exportSet]) { await loadSet(exportSet); return; }
    let loaded = 0;
    await loadInOrder(SETS.map((_, i) => i), async (i) => {
      checkActive();
      await loadSet(i);
      report(`Loading the journey · ${++loaded} of ${SETS.length}`);
    });
    await Promise.all(artwork);
    const [laptop, degree, coffee, ball] = await Promise.all([geometrySource.load('laptopTour'), geometrySource.load('degreeScroll'), geometrySource.load('paperCup'), geometrySource.load('degreeBall')]);
    buildMarks();
    checkActive();
    buildHeldLaptop(laptop);
    degreeScroll = placeBuilt('degreeScroll', { build: 'degreeScroll', at: [0, 0, 0] }, false, degree);
    degreeBall = placeBuilt('degreeBall', { build: 'degreeBall', at: [0, 0, 0] }, false, ball);
    degreeBall.visible = false;
    heldDegree.add(degreeScroll, degreeBall);
    thrownBall = placeBuilt('degreeBall', { build: 'degreeBall', at: [0, 0, 0] }, false, ball);
    thrownBall.visible = false;
    scene.add(thrownBall);
    { // where it leaves the hand: the held place at the chapter the throw begins, in the world
      const f = dolly(DEGREE.thrown[0]), eye = new PerspectiveCamera();
      eye.position.set(...f.cam); eye.lookAt(new Vector3(...f.look)); eye.updateMatrixWorld();
      release.set(0.13, -0.15, -0.42).applyMatrix4(eye.matrixWorld);
    }
    const mug = placeBuilt('paperCup', { build: 'paperCup', at: [0, 0, 0] }, false, coffee);
    mug.scale.setScalar(0.82);
    mug.traverse((o) => { if (o instanceof Mesh) { o.castShadow = false; o.receiveShadow = false; } });
    heldCoffee.add(mug);
    crowdFrames = [paintTex('crowd', 0), paintTex('crowd', 1)];

    // Warm small batches in each room's actual lighting. Disable frustum culling on the proxies:
    // a single render from the opening camera left unseen geometry cold until the visitor turned.
    const warmTarget = new WebGLRenderTarget(8, 8);
    const uploaded = new Set<Texture>();
    try {
      // Include animation frames not yet referenced by a visible material.
      for (const texture of paintCache.values()) { renderer.initTexture(texture); uploaded.add(texture); await breathe(); }
      for (let i = 0; i < SETS.length; i++) {
        checkActive();
        report(`Preparing the walk · ${i + 1} of ${SETS.length}`);
        frame(dolly(DOLLY.find((key) => key.set === i && key.blend === undefined)!.q));
        heldLaptop.visible = TOUR_SETS.has(i); heldDegree.visible = i === 11; heldCoffee.visible = i === 10;
        // what the walk brings in later is warmed now: the whale under its rising plane, the movers, the hall beyond Volta's far wall, the leaves and the snow in the air
        for (const r of live.rises) r.obj.visible = r.obj.parent?.visible ?? false;
        for (const m of live.movers) m.obj.visible = groups[m.set].visible;
        for (const k of live.cues) k.obj.visible = true;
        for (const k of marks) { k.mesh.visible = true; (k.mesh.material as MeshBasicMaterial).opacity = 0.9; }
        if (thrownBall) thrownBall.visible = i === 11;
        if (i === 10) groups[11].visible = true;
        if (WALK_SETS.has(i)) weather.update({ ...airAt(i === 8 ? 9.6 : i === 9 ? 11 : 12), leaves: 1, snow: 1 }, 0, camera.position); else weather.update(undefined, 0, camera.position);
        scene.updateMatrixWorld(true);
        const warmScene = new Scene();
        warmScene.environment = scene.environment; warmScene.fog = scene.fog;
        const objects: Object3D[] = [];
        scene.traverseVisible((object) => {
          if (object instanceof Light) {
            const light = object.clone(); light.position.setFromMatrixPosition(object.matrixWorld);
            warmScene.add(light);
            if (light instanceof DirectionalLight) { light.target.position.copy(sun.target.position); warmScene.add(light.target); }
          } else if (object instanceof Mesh || object instanceof Points) objects.push(object);
        });
        for (let offset = 0; offset < objects.length; offset += 16) {
          const batch = objects.slice(offset, offset + 16).map((object) => {
            const proxy = object.clone(false); proxy.matrixAutoUpdate = false; proxy.matrix.copy(object.matrixWorld); proxy.frustumCulled = false;
            return proxy;
          });
          for (const object of batch) {
            const material = (object as Mesh).material;
            for (const m of Array.isArray(material) ? material : [material]) for (const value of Object.values(m)) {
              if (value instanceof Texture && !value.isRenderTargetTexture && !(value instanceof VideoTexture) && !uploaded.has(value)) {
                renderer.initTexture(value); uploaded.add(value); await breathe();
              }
            }
          }
          warmScene.add(...batch);
          await renderer.compileAsync(warmScene, camera);
          checkActive();
          const shadowUpdate = renderer.shadowMap.autoUpdate;
          // Each cloned light needs a real depth map before its shadow sampler can be used.
          renderer.shadowMap.autoUpdate = offset === 0;
          renderer.setRenderTarget(warmTarget);
          renderer.render(warmScene, camera);
          renderer.setRenderTarget(null);
          renderer.shadowMap.autoUpdate = shadowUpdate;
          warmScene.remove(...batch);
          await yieldToBrowser();
        }
        warmScene.traverse((object) => { if (object instanceof DirectionalLight || object instanceof PointLight) object.shadow.dispose(); });
        // Prime shadow and postprocessing variants too, while the static opening still covers the canvas.
        composer.render();
        await yieldToBrowser();
      }
      await phone.prepare();
    } finally { renderer.setRenderTarget(null); warmTarget.dispose(); }
    checkActive();
    heldLaptop.visible = heldDegree.visible = heldCoffee.visible = false;
    geometrySource.dispose();
    MeshoptDecoder.useWorkers(0);
    cur = target; vel = 0; lastT = performance.now();
    ready = true;
    diagnostics.readyMs = Math.round(performance.now());
    root.dataset.stage = 'ready';
    report('Journey ready');
    kick();
  };
  const dispose = () => {
    if (stopped) return;
    stopped = true;
    geometrySource.dispose();
    MeshoptDecoder.useWorkers(0);
    loadingManager.abort();
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
    video.removeAttribute('src');
    video.load();
    pmrem.dispose();
    flightEnvironment?.dispose();
    roomEnvironments.forEach((r) => r.dispose());
    mats.get('flightSky')?.map?.dispose();
    phone.dispose();
    weather.dispose();
    Object.values(skyMaps).forEach((t) => t?.dispose());
    Object.values(skyEnvs).forEach((t) => t?.dispose());
    composer.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.classList.remove('on');
    cap.remove();
    root.classList.remove('phone-focus');
  };
  void prepare().catch((err) => {
    if (stopped) return;
    dispose();
    root.dataset.stage = 'error';
    report('The 3D journey could not load. You can still read the story.');
    console.warn('[journey] a set did not load', err);
  });
  return dispose;
}
