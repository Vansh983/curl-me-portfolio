// The journey stage, client side. Four sets along +x, lit by a soft studio environment indoors
// and a clear sky outdoors (both made in code, nothing downloaded), dressed with a few scanned
// models and designed materials on code-built shells, joined by one camera dolly that changes set
// while the frame is inside a doorway. Spec: docs/rebuild/13-journey-real-spec.md.
//
// Everything here touches the DOM or the renderer. The world (sets.ts), the camera path (dolly.ts),
// the shells (shell.ts), the props (built.ts) and the materials (materials.ts) are pure and tested.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, DirectionalLight, HemisphereLight, PointLight, Mesh, Group, Object3D,
  BufferGeometry, BufferAttribute, MeshStandardMaterial, MeshBasicMaterial, PlaneGeometry, Texture, CanvasTexture, VideoTexture,
  DataTexture, RepeatWrapping, SRGBColorSpace, ACESFilmicToneMapping, PCFShadowMap, PMREMGenerator, Raycaster, Vector2, Vector3,
  RGBAFormat, UnsignedByteType, LinearFilter, LinearMipmapLinearFilter, Material, SphereGeometry, BackSide, Float32BufferAttribute,
  AnimationMixer, AnimationClip, SkinnedMesh, Box3, Quaternion,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { SETS, type Placement, type StageSet, type Live } from '../lib/stage/sets.ts';
import { DOLLY, makeDolly, type Frame } from '../lib/stage/dolly.ts';
import { buildShell, type Slab } from '../lib/stage/shell.ts';
import { BUILT, type Built, type BuiltSurface } from '../lib/stage/built.ts';
import { mat as matSpec, type Mat } from '../lib/stage/materials.ts';
import { asset, assetUrl } from '../lib/stage/assets.ts';
import { stageProgress } from '../lib/stage/shot.ts';
import { loadAllSets, showSetBackdrops, type SetScoped } from '../lib/stage/lifecycle.ts';
import { detailMap, type Kind } from '../lib/stage/surface.ts';
import { painters, loadImage, canvas2d, SURFACE_PAINT, CITY_PAINT, SCREEN_PAINT, WINDOW_PAINT, BADGE_PAINT, type Paint } from './stage-paint.ts';

const D = Math.PI / 180;
const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
const cssVar = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';

/** A placed thing: its root in the scene and the placement it came from. */
interface Placed { root: Object3D; p: Placement; set: number }

/** The screen face of television_02 in its own metres: where the glass is, seen from the front. */
const TV_SCREEN = { w: 0.3, h: 0.24, at: [0, 0.2, 0.178] as const };
const GRAIN = 128; // pixels per grain tile: a faint normal, never a texture you would look at

/** What each bone of the base character wears: skin, a black tee, jeans, shoes. Matched by name prefix. */
const OUTFIT: Array<[RegExp, string]> = [
  [/^DEF-(head|neck|hand|f_|thumb|forearm)/, 'skin'],
  [/^DEF-(spine|shoulder|upper_arm)/, 'tee'],
  [/^DEF-(hips|thigh|shin)/, 'jeans'],
  [/^DEF-(foot|toe)/, 'shoes'],
];
const OUTFIT_COLOR: Record<string, string> = { skin: '#C68E6A', tee: '#141416', jeans: '#26334A', shoes: '#1A1A1C' };

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const dprCap = Math.min(devicePixelRatio, 1.25);
  let dpr = dprCap;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const scene = new Scene();
  const fog = new Fog(new Color('#EFE3D0'), 12, 60);
  scene.fog = fog;
  const camera = new PerspectiveCamera(50, 1, 0.05, 2600); // the city outside the condo is a kilometre away

  // one sun that casts, one hemisphere that tints; the rest of the light is the environment
  const sun = new DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
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
        return { scene: g.scene, animations: g.animations };
      });
      modelCache.set(id, p);
    }
    return p;
  };

  /**
   * Dresses the base character: every vertex takes the colour of the bone that moves it most
   * (skin, tee, jeans, shoes), so one untextured mesh reads as a person in a black tee. Then hair
   * and glasses ride the head bone, and the sitting idle plays.
   */
  const dressHim = (loaded: Loaded): { root: Group; mixer: AnimationMixer } => {
    const root = loaded.scene;
    const skinned: SkinnedMesh[] = [];
    root.traverse((o) => { if (o instanceof SkinnedMesh) skinned.push(o); });
    for (const m of skinned) {
      m.frustumCulled = false;
      const bones = m.skeleton.bones;
      const colors = bones.map((b) => {
        const kind = OUTFIT.find(([re]) => re.test(b.name))?.[1] ?? 'tee';
        return new Color(OUTFIT_COLOR[kind]);
      });
      // under the hoodie the mannequin's torso and upper arms are not drawn at all: alpha 0 in the
      // colour array marks them, and the fragment discards
      const hidden = bones.map((b) => (/^DEF-(spine|shoulder|upper_arm|forearm)/.test(b.name) ? 1 : 0));
      const mat = new MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.85, metalness: 0, envMapIntensity: 0.8 });
      mat.onBeforeCompile = (sh) => {
        sh.uniforms.uBone = { value: colors };
        sh.uniforms.uHide = { value: hidden };
        sh.vertexShader = sh.vertexShader
          .replace('#include <common>', `#include <common>\nuniform vec3 uBone[${bones.length}];\nuniform float uHide[${bones.length}];\nvarying vec3 vBody;\nvarying float vHide;`)
          .replace('#include <skinbase_vertex>', '#include <skinbase_vertex>\n vBody = uBone[int(skinIndex.x)];\n vHide = uHide[int(skinIndex.x)];');
        sh.fragmentShader = sh.fragmentShader
          .replace('#include <common>', '#include <common>\nvarying vec3 vBody;\nvarying float vHide;')
          .replace('#include <color_fragment>', '#include <color_fragment>\n if (vHide > 0.5) discard;\n diffuseColor.rgb = vBody;');
      };
      m.material = mat;
      m.castShadow = true;
      m.receiveShadow = true;
    }
    // hair and glasses ride the head bone. Whatever units the rig is in, the parts are built in
    // metres, so they are scaled by the inverse of the bone's world scale and offset in bone units
    const mixer = new AnimationMixer(root);
    const clip = loaded.animations.find((a) => /Sitting_Idle/.test(a.name)) ?? loaded.animations[0];
    if (clip) mixer.clipAction(clip).play();
    mixer.update(0);
    // Clothes and hair are built in metres, upright, facing +z, and placed in world terms at the
    // rest pose; then each is handed to a bone (position via worldToLocal, orientation as the bone's
    // inverse times the wanted world orientation), so it follows the animation without inheriting
    // the bone's own axes or units.
    root.updateWorldMatrix(true, true);
    // the character faces -z in its own frame; the parts are built facing +z, so they are turned round
    const rootQuat = new Quaternion();
    root.getWorldQuaternion(rootQuat);
    const faceQuat = rootQuat.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI));
    const forward = new Vector3(0, 0, -1).applyQuaternion(rootQuat);
    // GLTFLoader strips dots from node names (DEF-spine.002 becomes DEF-spine002), so look up the same way
    const bone = (name: string) => root.getObjectByName(name.replace(/\./g, ''));
    const at = (name: string) => { const v = new Vector3(); bone(name)?.getWorldPosition(v); return v; };
    const hand = (part: Object3D, holder: Object3D, worldPos: Vector3, worldQuat: Quaternion, scale: Vector3) => {
      const bq = new Quaternion(), bs = new Vector3();
      holder.getWorldQuaternion(bq);
      holder.getWorldScale(bs);
      part.position.copy(holder.worldToLocal(worldPos.clone()));
      part.quaternion.copy(bq).invert().multiply(worldQuat);
      part.scale.set(scale.x / (bs.x || 1), scale.y / (bs.y || 1), scale.z / (bs.z || 1));
      holder.add(part);
    };
    const head = bone('DEF-head');
    if (head) {
      // the skull as skinned right now: hair and glasses are sized and placed from its box, not guessed
      const box = new Box3();
      const v = new Vector3();
      for (const m of skinned) {
        m.skeleton.update();
        const headIdx = m.skeleton.bones.indexOf(head as never);
        const idx = m.geometry.getAttribute('skinIndex'), n = m.geometry.getAttribute('position').count;
        for (let i = 0; i < n; i++) {
          if (idx.getX(i) !== headIdx) continue;
          m.getVertexPosition(i, v);
          box.expandByPoint(m.localToWorld(v));
        }
      }
      const c = box.getCenter(new Vector3()), size = box.getSize(new Vector3());
      const upV = new Vector3(0, 1, 0);
      // the box holds the neck too, so the skull is the upper part of it
      const skullH = size.y * 0.78, skullC = c.clone().addScaledVector(upV, size.y / 2 - skullH / 2);
      const hair = placeBuilt('hair', { build: 'hair', at: [0, 0, 0] });
      hand(hair, head, skullC.clone().addScaledVector(upV, skullH * 0.02).addScaledVector(forward, -0.004), faceQuat, new Vector3(size.x / 2 + 0.008, skullH / 2 + 0.008, size.z / 2 + 0.006));
      const glasses = placeBuilt('glasses', { build: 'glasses', at: [0, 0, 0] });
      hand(glasses, head, skullC.clone().addScaledVector(upV, skullH * 0.08).addScaledVector(forward, size.z / 2 - 0.095), faceQuat, new Vector3(size.x / 0.2, size.x / 0.2, size.x / 0.2));
    }
    // the hoodie: a torso from the hips to the collar, sized from the shoulders; a sleeve per arm
    // segment, aligned to the bone; the hood down behind the neck
    const chest = bone('DEF-spine.002'), neck = bone('DEF-neck');
    if (chest && neck) {
      // the shoulder joints are where the upper arms start; the shoulder bones themselves begin at the spine
      const hips = at('DEF-hips'), collar = at('DEF-neck'), sl = at('DEF-upper_arm.L'), sr = at('DEF-upper_arm.R');
      const halfW = sl.distanceTo(sr) / 2 + 0.075, halfD = halfW * 0.6, height = collar.y - hips.y + 0.14;
      const torso = placeBuilt('hoodieTorso', { build: 'hoodieTorso', at: [0, 0, 0] });
      hand(torso, chest, new Vector3(hips.x, hips.y - 0.08, hips.z), faceQuat, new Vector3(halfW, height, halfD));
      const hood = placeBuilt('hood', { build: 'hood', at: [0, 0, 0] });
      hand(hood, neck, collar.clone(), faceQuat, new Vector3(1, 1, 1));
      const up = new Vector3(0, 1, 0);
      for (const side of ['L', 'R'] as const) {
        for (const [a, b, r] of [[`DEF-upper_arm.${side}`, `DEF-forearm.${side}`, 0.075], [`DEF-forearm.${side}`, `DEF-hand.${side}`, 0.062]] as const) {
          const holder = bone(a);
          if (!holder) continue;
          const from = at(a), to = at(b);
          const dir = to.clone().sub(from), len = dir.length();
          if (len < 1e-3) continue;
          const q = new Quaternion().setFromUnitVectors(up, dir.normalize());
          const sleeve = placeBuilt('sleeve', { build: 'sleeve', at: [0, 0, 0] });
          hand(sleeve, holder, from.clone().addScaledVector(dir, -0.03), q, new Vector3(r, len + 0.05, r));
        }
      }
    }
    if (DEBUG) {
      root.updateWorldMatrix(true, true);
      // the skinned extent of the head: where the skull top, the chin and the face front really are
      for (const m of skinned) {
        const headIdx = m.skeleton.bones.findIndex((b) => b.name === 'DEF-head');
        const idx = m.geometry.getAttribute('skinIndex'), n = m.geometry.getAttribute('position').count;
        const v = new Vector3(), lo = new Vector3(Infinity, Infinity, Infinity), hi = new Vector3(-Infinity, -Infinity, -Infinity);
        for (let i = 0; i < n; i++) {
          if (idx.getX(i) !== headIdx) continue;
          m.getVertexPosition(i, v);
          lo.min(v); hi.max(v);
        }
        console.warn(`[him] head skin min ${lo.toArray().map((x) => x.toFixed(3))} max ${hi.toArray().map((x) => x.toFixed(3))} bone ${at('DEF-head').toArray().map((x) => x.toFixed(3))}`);
      }
      for (const name of ['DEF-hips', 'DEF-spine.002', 'DEF-neck', 'DEF-head', 'DEF-upper_arm.L', 'DEF-hand.L']) {
        const b = bone(name);
        if (!b) continue;
        const ws = new Vector3(); b.getWorldScale(ws);
        console.warn(`[him] ${name} at ${at(name).toArray().map((v) => v.toFixed(2))} scale ${ws.x.toFixed(3)}`);
      }
      root.traverse((o) => {
        if (o instanceof Mesh && !(o instanceof SkinnedMesh)) {
          const bb = new Box3().setFromObject(o);
          console.warn(`[him] part ${o.parent?.parent?.name}/${o.parent?.name} min ${bb.min.toArray().map((v) => v.toFixed(2))} max ${bb.max.toArray().map((v) => v.toFixed(2))}`);
        }
      });
    }
    return { root, mixer };
  };

  // ---- painted canvases
  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'metadata' });
  video.setAttribute('playsinline', '');
  const images = { jobs: null as HTMLImageElement | null, xbox: null as HTMLImageElement | null, clan: null as HTMLImageElement | null };
  const PAINT: Record<string, Paint> = { ...painters(images, video), ...SURFACE_PAINT, ...CITY_PAINT, ...SCREEN_PAINT, ...WINDOW_PAINT, ...BADGE_PAINT };
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
  const grains = new Map<Kind, DataTexture>();
  const grainFor = (kind: Kind): DataTexture => {
    let t = grains.get(kind);
    if (!t) {
      t = new DataTexture(detailMap(kind, GRAIN), GRAIN, GRAIN, RGBAFormat, UnsignedByteType);
      t.wrapS = t.wrapT = RepeatWrapping;
      t.magFilter = LinearFilter;
      t.minFilter = LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAniso;
      t.needsUpdate = true;
      grains.set(kind, t);
    }
    return t;
  };
  const surfacePaint = new Map<string, CanvasTexture>();
  const mats = new Map<string, MeshStandardMaterial>();
  const matFor = (name: string): MeshStandardMaterial => {
    let m = mats.get(name);
    if (m) return m;
    const s: Mat = matSpec(name);
    m = s.unlit
      ? (new MeshBasicMaterial({ color: s.color, fog: s.fog !== false }) as unknown as MeshStandardMaterial)
      : new MeshStandardMaterial({ color: s.color, roughness: s.rough, metalness: s.metal ?? 0, envMapIntensity: 1, fog: s.fog !== false });
    if (s.emissive && !s.unlit) { m.emissive.set(s.emissive); m.emissiveIntensity = s.emissivePower ?? 1; }
    if (s.inside) m.side = BackSide;
    if (s.paint) {
      let t = surfacePaint.get(s.paint);
      if (!t) { t = paintTex(s.paint); t.wrapS = t.wrapT = RepeatWrapping; surfacePaint.set(s.paint, t); }
      const map = t.clone();
      map.repeat.set(1 / s.tile, 1 / s.tile);
      m.map = map;
    }
    if (s.grain && !s.unlit) {
      const n = grainFor(s.grain).clone();
      n.repeat.set(1 / s.tile, 1 / s.tile);
      m.normalMap = n;
      m.normalScale.set(s.amp ?? 0.25, s.amp ?? 0.25);
    }
    mats.set(name, m);
    return m;
  };

  // ---- geometry helpers
  const slabGeometry = (s: Slab): BufferGeometry => {
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(s.pos, 3));
    g.setAttribute('normal', new BufferAttribute(s.nor, 3));
    g.setAttribute('uv', new BufferAttribute(s.uv, 2));
    return g;
  };
  const builtMaterial = (s: BuiltSurface, live?: Live): Material => {
    if ('paint' in s) {
      const [name, frame] = s.paint.split(':');
      // screens and the city at night give off their own light: unlit, not tone mapped, no fog on the city
      if (name.startsWith('screen') || name === 'toronto') return new MeshBasicMaterial({ map: paintTex(name, Number(frame ?? 0)), toneMapped: false, fog: name !== 'toronto' });
      return new MeshStandardMaterial({ map: paintTex(name, Number(frame ?? 0)), roughness: 0.6, metalness: 0, envMapIntensity: 0.6 });
    }
    // emitters and the water get their own copy so their state does not leak into the shared one
    if (live === 'bulb' && s.mat === 'bulb') { const m = matFor(s.mat).clone(); m.emissive.set('#FFC978'); m.emissiveIntensity = 6; return m; }
    if (live === 'tube' && s.mat === 'tubeGlass') { const m = matFor(s.mat).clone(); m.emissive.set('#EAF2FF'); m.emissiveIntensity = 0; return m; }
    if (live === 'water') { const m = matFor(s.mat).clone(); m.envMapIntensity = 0.25; return m; }
    return matFor(s.mat);
  };

  // ---- live things
  const live = {
    fans: [] as Object3D[],
    curtains: [] as MeshStandardMaterial[],
    water: [] as MeshStandardMaterial[],
    tubes: [] as { mat: MeshStandardMaterial; light: PointLight }[],
    mixers: [] as AnimationMixer[],
    backdrops: [] as SetScoped<Object3D>[],
  };
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
  };

  // ---- the sets
  const groups: Group[] = SETS.map(() => new Group());
  const hot: Placed[] = [];

  const placeBuilt = (name: string, p: Placement): Object3D => {
    const part: Built[] = BUILT[name]();
    const g = new Group();
    for (const piece of part) {
      const material = builtMaterial(piece.surface, p.live);
      const mesh = new Mesh(slabGeometry(piece), material);
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
        g.add(light);
        live.tubes.push({ mat: material as MeshStandardMaterial, light });
      }
      if (p.live === 'screen' && 'paint' in piece.surface && name === 'monitor') {
        // the screens light his face and the desk: one cool light for the pair
        const light = new PointLight('#9FB8FF', 1.6, 2.5, 1.8);
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
    return g;
  };

  const place = async (p: Placement, set: number): Promise<void> => {
    let obj: Object3D;
    if (p.model && p.live === 'him') {
      const him = dressHim(await loadModel(p.model));
      obj = him.root;
      live.mixers.push(him.mixer);
    } else if (p.model) {
      obj = (await loadModel(p.model)).scene.clone();
      if (p.live === 'fan') live.fans.push(obj);
      if (p.live === 'lamp') {
        const light = new PointLight('#FFC98A', 5, 4, 1.8);
        light.position.set(0.05, 0.78, 0.2);
        obj.add(light);
      }
      if (p.live === 'tv') addScreen(obj, p, videoTex);
      if (p.live === 'monitor') addScreen(obj, p, paintTex('screen', 1));
    } else {
      obj = placeBuilt(p.build!, p);
    }
    obj.position.set(...p.at);
    if (p.rot) obj.rotation.set(p.rot[0] * D, p.rot[1] * D, p.rot[2] * D);
    if (p.scale !== undefined) typeof p.scale === 'number' ? obj.scale.setScalar(p.scale) : obj.scale.set(...p.scale);
    if (p.live === 'city') {
      obj.visible = set === curSet;
      live.backdrops.push({ root: obj, sets: [set] });
    }
    groups[set].add(obj);
    if (p.cap) hot.push({ root: obj, p, set });
    if (DEBUG) {
      obj.updateWorldMatrix(true, true);
      const b = new Box3().setFromObject(obj);
      console.warn(`[stage] ${p.model ?? p.build} min ${b.min.toArray().map((v) => v.toFixed(2))} max ${b.max.toArray().map((v) => v.toFixed(2))}`);
    }
  };

  const loadSet = async (i: number): Promise<void> => {
    const S = SETS[i];
    if (S.shell) {
      const sh = buildShell(S.shell);
      const floor = new Mesh(slabGeometry(sh.floor), matFor(S.shell.floor));
      const walls = new Mesh(slabGeometry(sh.walls), matFor(S.shell.wall));
      const ceiling = new Mesh(slabGeometry(sh.ceiling), matFor(S.shell.ceiling ?? S.shell.wall));
      floor.receiveShadow = walls.receiveShadow = ceiling.receiveShadow = true;
      walls.castShadow = true;
      groups[i].add(floor, walls, ceiling);
    }
    if (S.env === 'sky') {
      const sets = [Math.max(0, i - 1), i]; // visible through the preceding set's exit before the environment swaps
      sky.visible = sets.includes(curSet);
      live.backdrops.push({ root: sky, sets });
      groups[i].add(sky);
    }
    await Promise.all(S.props.map((p) => place(p, i)));
    scene.add(groups[i]);
    kick();
  };

  // ---- pipeline: render, tone map, anti-alias. Nothing per pixel beyond that.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
  composer.addPass(new FXAAPass());

  // assets that arrive later repaint what uses them
  loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster']); });
  loadImage('/assets/story/cc.jpg').then((i) => { images.clan = i; repaint(['poster']); });
  document.fonts.load('700 40px "Product Sans"').then(() => repaint(['sign'])).catch(() => {});

  const dolly = makeDolly(DOLLY);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let raf = 0, visible = false, target = 0, cur = 0, vel = 0, lastT = 0, curSet = -1;
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
    if (dpr <= 1 || ema < 1 / 50) return;
    tried = ema;
    apply(Math.max(1, dpr - 0.25));
  };

  const progress = () => {
    const r = root.getBoundingClientRect();
    const total = r.height - innerHeight;
    return total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
  };

  /** Switches the light to a set: environment, tint, exposure, fog. Called while the frame is in a doorway. */
  const enter = (i: number) => {
    curSet = i;
    showSetBackdrops(live.backdrops, i);
    const S = SETS[i];
    scene.environment = S.env === 'sky' ? skyEnv : studioEnv;
    renderer.toneMappingExposure = S.exposure;
    hemi.color.set(S.tint.sky);
    hemi.groundColor.set(S.tint.ground);
    sun.color.set(S.sun.color);
    sun.shadow.intensity = S.sun.shadow;
    fog.color.set(S.fog.color);
    fog.near = S.fog.near;
    fog.far = S.fog.far;
    if (i === 1 && tubeClock < 0) tubeClock = 0;
  };

  // review only: ?cam=x,y,z,lx,ly,lz pins the camera anywhere, so a set can be looked at from outside the dolly
  const pinned = new URLSearchParams(location.search).get('cam')?.split(',').map(Number);
  const frame = (fIn: Frame) => {
    const f: Frame = pinned && pinned.length === 6 && pinned.every(Number.isFinite) ? { ...fIn, cam: [pinned[0], pinned[1], pinned[2]], look: [pinned[3], pinned[4], pinned[5]] } : fIn;
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
    scene.environmentIntensity = S.envPower * f.envDip;
    hemi.intensity = S.tint.power * f.envDip;
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
    let q = stageProgress(cur, chapters, SETS.length);
    if (reduce.matches) q = Math.round(q * (SETS.length - 1)) / Math.max(1, SETS.length - 1);
    frame(dolly(q));

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
    composer.render();
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
  loadAllSets(SETS.length, loadSet, () => {
    if (curSet < 0) enter(0);
    kick();
  }).catch((err) => console.warn('[journey] a set did not load', err));

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
    composer.dispose();
    renderer.dispose();
    cap.remove();
  };
}
