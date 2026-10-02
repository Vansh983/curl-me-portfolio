// What comes down on the walk: October's leaves in Toronto, January's snow in Halifax. Each is one draw call: a box of
// air that travels with the eye, every flake or leaf a seed in it, fallen and blown by the clock and wrapped back
// into the box as it leaves, so the air is as full behind a step as ahead of it. How much of it shows is the walk's
// script (walk.ts `Air.snow`, `Air.leaves`): the first flakes come one by one. Indoors at Volta it keeps falling outside
// the glass, as it was on the walk; nothing falls in the room, nor in the wing and the hall behind its north wall.
import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Fog, InstancedBufferAttribute, InstancedBufferGeometry, Mesh, PlaneGeometry, Points, Scene, ShaderMaterial, Vector3,
  CanvasTexture, SRGBColorSpace,
} from 'three';
import { WALK, CITY_AIR, type Air } from '../lib/stage/walk.ts';

const FOG = `
  uniform vec3 fogColor; uniform float fogNear; uniform float fogFar;
  vec3 fogged(vec3 c, float depth) { return mix(c, fogColor, smoothstep(fogNear, fogFar, depth) * 0.85); }`;
const WRAP = `
  uniform float uTime; uniform vec3 uEye; uniform vec3 uBox; uniform vec3 uAhead;
  vec3 wrapped(vec3 p) { vec3 c = uEye + uAhead; return mod(p - c + uBox * 0.5, uBox) - uBox * 0.5 + c; }
  uniform vec3 uRoomMin; uniform vec3 uRoomMax; uniform float uIndoor;
  // 0 where nothing falls: Volta's room, and while the eye is in it, north of its north wall on the land side of its glass
  float open(vec3 w) {
    vec3 a = step(uRoomMin, w) * step(w, uRoomMax);
    return (1.0 - a.x * a.y * a.z) * (1.0 - uIndoor * step(uRoomMax.z, w.z) * step(uRoomMin.x, w.x));
  }`;
/** Volta's room, where nothing falls: from the floor to its slab. */
const ROOM = { min: new Vector3(WALK.volta.x[0], -1, WALK.volta.z[0]), max: new Vector3(WALK.volta.x[1], WALK.volta.h + 0.05, WALK.volta.z[1]) };
const inRoom = (e: Vector3): boolean => e.x > ROOM.min.x && e.x < ROOM.max.x && e.z > ROOM.min.z && e.z < ROOM.max.z && e.y < ROOM.max.y;

export interface Weather { update(air: Air | undefined, clock: number, eye: Vector3): void; dispose(): void }

export function createWeather(scene: Scene, fog: Fog): Weather {
  let seed = 8191;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  const shared = { fogColor: { value: fog.color }, fogNear: { value: 1 }, fogFar: { value: 100 }, uTime: { value: 0 }, uEye: { value: new Vector3() }, uRoomMin: { value: ROOM.min }, uRoomMax: { value: ROOM.max }, uIndoor: { value: 0 } };

  // ---- snow: soft round flakes, the near ones large
  const N = 1600, at: number[] = [], k: number[] = [];
  for (let i = 0; i < N; i++) { at.push(rnd(), rnd(), rnd()); k.push(rnd(), rnd()); }
  const snowGeo = new BufferGeometry();
  snowGeo.setAttribute('position', new Float32BufferAttribute(at, 3));
  snowGeo.setAttribute('k', new Float32BufferAttribute(k, 2));
  const snowU = { ...shared, uBox: { value: new Vector3(28, 11, 36) }, uAhead: { value: new Vector3(0, 3.2, 10) }, uAmount: { value: 0 }, uSize: { value: 1 }, uTint: { value: new Color('#FFFFFF') } };
  const snow = new Points(snowGeo, new ShaderMaterial({
    uniforms: snowU, transparent: true, depthWrite: false,
    vertexShader: `
      attribute vec2 k; varying float vAlpha; varying float vDepth; uniform float uAmount; uniform float uSize;
      ${WRAP}
      void main() {
        vec3 p = position * uBox;
        p.y -= uTime * (0.75 + k.x * 0.55);
        p.x += sin(uTime * 0.6 + k.x * 40.0) * 0.4 + uTime * 0.32;
        p.z += cos(uTime * 0.47 + k.y * 27.0) * 0.35 - uTime * 0.12;
        vec3 w = wrapped(p);
        vec4 mv = viewMatrix * vec4(w, 1.0);
        gl_Position = projectionMatrix * mv;
        float show = step(k.y, uAmount) * open(w);
        vDepth = -mv.z;
        gl_PointSize = uSize * (0.55 + k.x * 0.9) / max(0.6, vDepth) * show;
        vAlpha = smoothstep(0.3, 1.6, vDepth) * (0.5 + 0.5 * k.x) * show;
      }`,
    fragmentShader: `
      varying float vAlpha; varying float vDepth; uniform vec3 uTint;
      ${FOG}
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = (1.0 - smoothstep(0.35, 1.0, d)) * vAlpha;
        if (a < 0.01) discard;
        gl_FragColor = vec4(fogged(uTint, vDepth), a);
      }`,
  }));
  snow.frustumCulled = false;
  snow.visible = false;
  snow.renderOrder = 5;
  snow.name = 'b|weather|mat:snowfall|walk';

  // ---- leaves: a card each, tumbling as it falls, in October's colours
  const L = 110, leafSeed: number[] = [], leafTone: number[] = [];
  const tones = [[0.86, 0.6, 0.12], [0.84, 0.42, 0.1], [0.72, 0.22, 0.09], [0.9, 0.7, 0.2], [0.78, 0.33, 0.08], [0.55, 0.32, 0.12]];
  for (let i = 0; i < L; i++) { leafSeed.push(rnd(), rnd(), rnd(), rnd()); const t = tones[Math.floor(rnd() * tones.length)], s = 0.8 + rnd() * 0.3; leafTone.push(t[0] * s, t[1] * s, t[2] * s); }
  const quad = new PlaneGeometry(1, 1);
  const leafGeo = new InstancedBufferGeometry();
  leafGeo.index = quad.index;
  leafGeo.setAttribute('position', quad.getAttribute('position'));
  leafGeo.setAttribute('uv', quad.getAttribute('uv'));
  leafGeo.setAttribute('seed', new InstancedBufferAttribute(new Float32Array(leafSeed), 4));
  leafGeo.setAttribute('tone', new InstancedBufferAttribute(new Float32Array(leafTone), 3));
  leafGeo.instanceCount = L;
  const blade = document.createElement('canvas');
  blade.width = blade.height = 64;
  { // one maple leaf, white on clear
    const x = blade.getContext('2d')!;
    x.translate(32, 60); x.scale(54, 54);
    x.beginPath(); x.moveTo(0, 0.04);
    const lobes: Array<[number, number]> = [[0.34, -0.06], [0.26, -0.28], [0.52, -0.42], [0.34, -0.56], [0.4, -0.84], [0.16, -0.72], [0, -1.06]];
    for (const [lx, ly] of lobes) x.lineTo(lx, ly);
    for (const [lx, ly] of [...lobes].reverse().slice(1)) x.lineTo(-lx, ly);
    x.closePath(); x.fillStyle = '#FFFFFF'; x.fill();
    x.strokeStyle = 'rgba(190,190,190,1)'; x.lineWidth = 0.04; x.beginPath(); x.moveTo(0, 0.04); x.lineTo(0, -0.98); x.stroke();
  }
  const bladeTex = new CanvasTexture(blade);
  bladeTex.colorSpace = SRGBColorSpace;
  const leafU = { ...shared, uBox: { value: new Vector3(22, 7.5, 30) }, uAhead: { value: new Vector3(1.5, 1.6, 9) }, uAmount: { value: 0 }, uLight: { value: new Color('#FFFFFF') }, map: { value: bladeTex } };
  const leaves = new Mesh(leafGeo, new ShaderMaterial({
    uniforms: leafU, side: DoubleSide, transparent: false,
    vertexShader: `
      attribute vec4 seed; attribute vec3 tone; varying vec2 vUv; varying vec3 vTone; varying float vDepth; varying float vFace; uniform float uAmount;
      ${WRAP}
      void main() {
        vec3 c = seed.xyz * uBox;
        float t = uTime * (0.7 + seed.w * 0.6);
        c.y -= uTime * (0.5 + seed.w * 0.45);
        c.x += sin(t * 1.3 + seed.x * 31.0) * 0.7 + uTime * 0.5;
        c.z += cos(t * 1.1 + seed.y * 17.0) * 0.5;
        c = wrapped(c);
        float a = t * 2.4 + seed.z * 6.283, b = t * 1.7 + seed.x * 6.283;
        float size = (0.085 + seed.w * 0.06) * step(seed.z, uAmount) * open(c);
        vec3 q = vec3(position.xy * size, 0.0);
        q = vec3(q.x, q.y * cos(a) - q.z * sin(a), q.y * sin(a) + q.z * cos(a));
        q = vec3(q.x * cos(b) + q.z * sin(b), q.y, -q.x * sin(b) + q.z * cos(b));
        vec4 mv = viewMatrix * vec4(c + q, 1.0);
        gl_Position = projectionMatrix * mv;
        vUv = uv; vTone = tone; vDepth = -mv.z;
        vFace = 0.62 + 0.38 * abs(cos(a) * cos(b));
      }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 uLight; varying vec2 vUv; varying vec3 vTone; varying float vDepth; varying float vFace;
      ${FOG}
      void main() {
        if (texture2D(map, vUv).a < 0.5) discard;
        gl_FragColor = vec4(fogged(vTone * uLight * vFace, vDepth), 1.0);
      }`,
  }));
  leaves.frustumCulled = false;
  leaves.visible = false;
  leaves.name = 'b|weather|mat:leaffall|walk';
  scene.add(snow, leaves);

  const light = new Color(), sky = new Color(), outside = new Color(CITY_AIR.halifax.tint.sky);
  return {
    update(air, clock, eye) {
      const on = air !== undefined && eye.z < WALK.door; // through Volta's north door into the wing, the weather stays outside
      snow.visible = on && air.snow > 0.01;
      leaves.visible = on && air.leaves > 0.01;
      if (!on) return;
      shared.uTime.value = clock;
      shared.uEye.value.copy(eye);
      shared.uIndoor.value = inRoom(eye) ? 1 : 0;
      shared.fogNear.value = fog.near;
      shared.fogFar.value = fog.far;
      snowU.uAmount.value = air.snow;
      snowU.uSize.value = 34 * Math.min(2, window.devicePixelRatio || 1);
      // a flake takes the sky's light and the lamps': near white at dusk, never brighter than the snow on the ground; seen
      // from inside Volta it is still the dusk's, not the room's
      sky.set(air.tint.sky).lerp(outside, air.inside);
      snowU.uTint.value.set('#FFFFFF').lerp(sky, 0.35).multiplyScalar(0.62 + 0.3 * air.lamps);
      leafU.uAmount.value = air.leaves;
      light.set(air.sun.color);
      leafU.uLight.value.set('#FFFFFF').lerp(light, 0.6).multiplyScalar(0.55 + 0.12 * air.sun.power);
    },
    dispose() {
      scene.remove(snow, leaves);
      snowGeo.dispose(); leafGeo.dispose(); quad.dispose(); bladeTex.dispose();
      (snow.material as ShaderMaterial).dispose(); (leaves.material as ShaderMaterial).dispose();
    },
  };
}
