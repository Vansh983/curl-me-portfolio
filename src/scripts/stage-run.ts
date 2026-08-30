// The renderer. Loaded lazily by Journey.astro when the section is near the viewport.
// Builds one mesh per actor with station keys as morph targets, an ink outline as an
// inverted hull sharing the geometry (constant width on screen), painted textures (some
// with one frame per station, blended by the actor's own progress), shadows from one sun,
// distance fog outdoors, motion on its own clock (fan, boats, clouds, the rolling ball),
// a spring-damped camera, and hotspots that caption what you point at.
import {
  WebGLRenderer, Scene, PerspectiveCamera, Mesh, BufferGeometry, Float32BufferAttribute, BoxGeometry,
  MeshBasicMaterial, MeshStandardMaterial, DataTexture, RGBAFormat, UnsignedByteType, LinearFilter,
  LinearMipmapLinearFilter, RepeatWrapping, PMREMGenerator, HemisphereLight, DirectionalLight,
  ACESFilmicToneMapping, Color, BackSide, FrontSide, DoubleSide, CanvasTexture, SRGBColorSpace, Vector3, Vector2,
  Raycaster, Fog, PCFShadowMap, type Material, type Texture, type WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { FXAAPass } from 'three/examples/jsm/postprocessing/FXAAPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ACTORS, STATIONS, type Actor } from '../lib/stage/world.ts';
import { makeShot, stageProgress, type Frame } from '../lib/stage/shot.ts';
import { smoothNormals } from '../lib/stage/rig.ts';
import { BOOKS } from '../lib/stage/props.ts';
import { timed } from '../lib/stage/ease.ts';
import { SURFACE, detailMap, type Kind, type Surface } from '../lib/stage/surface.ts';
import { ENVS, envAt, type EnvSpec } from '../lib/stage/env.ts';

const OUTLINE = 0.0022; // metres pushed along the normal, per metre of distance (constant width on screen)
const INK_OUTLINE = false; // the drawn look: an ink hull on everything. Off, the render carries the edges itself
const DETAIL = 256; // the detail maps are 256 square; power of two, so they mip
const D = Math.PI / 180;

type Mat = Material & { color: Color };
/** The uniforms one lit material needs; they move with the story, so they are held, not re-made. */
interface Det { map: { value: Texture }; tile: { value: number }; bump: { value: number }; ramp: { value: number } }
interface Built { actor: Actor; mesh: Mesh; outline?: Mesh; a: Color[]; mat: Mat; e: number; surf: Surface[]; det?: Det }
type Ctx = CanvasRenderingContext2D;
type Painter = (x: Ctx, w: number, h: number) => void;
interface Paint { w: number; h: number; frames: Painter[] } // one frame per station for 'mix', one frame for 'tex'
interface Mixer { cv: HTMLCanvasElement[]; out: HTMLCanvasElement; tex: CanvasTexture; last: string; live: boolean }

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
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function geometryFor(actor: Actor): BufferGeometry {
  const g = new BufferGeometry();
  const [base, ...rest] = actor.keys;
  g.setAttribute('position', new Float32BufferAttribute(base, 3));
  g.setAttribute('normal', new Float32BufferAttribute(smoothNormals(base), 3));
  g.setAttribute('uv', new Float32BufferAttribute(actor.uv, 2));
  g.setAttribute('color', new Float32BufferAttribute(actor.col, 3));
  g.morphAttributes.position = rest.map((k) => new Float32BufferAttribute(k, 3));
  g.morphAttributes.normal = rest.map((k) => new Float32BufferAttribute(smoothNormals(k), 3));
  return g;
}

/** Inverted hull: same geometry, back faces, pushed out along the (morphed) normal by an amount that grows with distance. */
function outlineMaterial(ink: Color): MeshBasicMaterial {
  const m = new MeshBasicMaterial({ color: ink, side: BackSide, fog: false, toneMapped: false });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uOut = { value: OUTLINE };
    shader.vertexShader = 'uniform float uOut;\n' + shader.vertexShader.replace(
      '#include <morphtarget_vertex>',
      '#include <morphtarget_vertex>\n\tvec4 mvp0 = modelViewMatrix * vec4(transformed, 1.0);\n\ttransformed += objectNormal * uOut * clamp(-mvp0.z, 0.6, 120.0);',
    );
  };
  return m;
}

/**
 * Surface detail, sampled triplanar. The map holds a tangent-space normal in rgb and the height
 * in alpha; three projections are taken by world position, blended by which way the face points
 * (so nothing stretches on a slope), and the result both tilts the shading normal and moves the
 * roughness: a peak takes a polish, a pit holds the light. World position means no rig needs a
 * second uv set, and one plaster grain stays the same millimetres wherever it lands.
 */
const DET_PARS = `
uniform sampler2D uDet;
uniform float uTile;
uniform float uBump;
uniform float uRamp;
varying vec3 vDetP;
varying vec3 vDetN;
vec3 detailNormal( out float hOut ) {
	vec3 n = normalize( vDetN );
	vec3 w = abs( n ); w *= w; w *= w; w /= ( w.x + w.y + w.z );
	vec4 tx = texture2D( uDet, vDetP.zy * uTile );
	vec4 ty = texture2D( uDet, vDetP.xz * uTile );
	vec4 tz = texture2D( uDet, vDetP.xy * uTile );
	hOut = tx.a * w.x + ty.a * w.y + tz.a * w.z;
	vec3 mx = mix( vec3( 0.0, 0.0, 1.0 ), tx.xyz * 2.0 - 1.0, uBump );
	vec3 my = mix( vec3( 0.0, 0.0, 1.0 ), ty.xyz * 2.0 - 1.0, uBump );
	vec3 mz = mix( vec3( 0.0, 0.0, 1.0 ), tz.xyz * 2.0 - 1.0, uBump );
	vec3 nx = vec3( mx.xy + n.zy, abs( mx.z ) * n.x ).zyx;
	vec3 ny = vec3( my.xy + n.xz, abs( my.z ) * n.y ).xzy;
	vec3 nz = vec3( mz.xy + n.xy, abs( mz.z ) * n.z ).xyz;
	return normalize( nx * w.x + ny * w.y + nz * w.z );
}
`;

/**
 * The grade. ACES rolls the highlights off beautifully and takes some colour with them, so a
 * last pass puts the saturation back, adds a little contrast, and closes the corners down a
 * touch: the eye lands on him rather than on the brightest wall in the frame.
 */
const GRADE = {
  uniforms: {
    tDiffuse: { value: null as Texture | null },
    uSat: { value: 1.08 },
    uCon: { value: 1.02 },
    uVig: { value: 0.1 },
  },
  vertexShader: `
varying vec2 vUv;
void main() {
	vUv = uv;
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,
  fragmentShader: `
uniform sampler2D tDiffuse;
uniform float uSat;
uniform float uCon;
uniform float uVig;
varying vec2 vUv;
void main() {
	vec4 c = texture2D( tDiffuse, vUv );
	float l = dot( c.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
	c.rgb = mix( vec3( l ), c.rgb, uSat );
	c.rgb = clamp( ( c.rgb - 0.5 ) * uCon + 0.5, 0.0, 1.0 );
	c.rgb *= 1.0 - uVig * smoothstep( 0.34, 0.98, distance( vUv, vec2( 0.5 ) ) );
	gl_FragColor = c;
}`,
};

function withDetail(m: MeshStandardMaterial, det: Det): MeshStandardMaterial {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDet = det.map;
    sh.uniforms.uTile = det.tile;
    sh.uniforms.uBump = det.bump;
    sh.uniforms.uRamp = det.ramp;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vDetP;\nvarying vec3 vDetN;')
      .replace(
        '#include <worldpos_vertex>',
        '#include <worldpos_vertex>\n\tvDetP = ( modelMatrix * vec4( transformed, 1.0 ) ).xyz;\n\tvDetN = normalize( mat3( modelMatrix ) * objectNormal );',
      );
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>' + DET_PARS)
      .replace(
        '#include <roughnessmap_fragment>',
        'float detH;\n\tvec3 detN = detailNormal( detH );\n\t#include <roughnessmap_fragment>\n\troughnessFactor = clamp( roughnessFactor + uRamp * ( detH - 0.5 ) * 2.0, 0.045, 1.0 );',
      )
      .replace(
        '#include <normal_fragment_maps>',
        '#include <normal_fragment_maps>\n\tnormal = normalize( ( viewMatrix * vec4( detN, 0.0 ) ).xyz );',
      );
  };
  m.customProgramCacheKey = () => 'stage-detail';
  return m;
}

/** Fills the canvas white first: every rig's default uv points at the corner, which must read white. */
const white = (x: Ctx, w: number, h: number) => { x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); };

/** "Google" in the four colours, centred at cx with the baseline at y. The current font must be set. */
function googleWord(x: Ctx, cx: number, y: number, size: number): void {
  const letters: Array<[string, string]> = [['G', '#4285F4'], ['o', '#EA4335'], ['o', '#FBBC05'], ['g', '#4285F4'], ['l', '#34A853'], ['e', '#EA4335']];
  const widths = letters.map(([l]) => x.measureText(l).width);
  const total = widths.reduce((a, b) => a + b, 0) - size * 0.02 * letters.length;
  let px = cx - total / 2;
  const align = x.textAlign;
  x.textAlign = 'left';
  letters.forEach(([l, c], i) => { x.fillStyle = c; x.fillText(l, px, y); px += widths[i] - size * 0.02; });
  x.textAlign = align;
}

/**
 * Everything painted. Canvas y runs down, texture v runs up, so "top" in the world is y = 0 here.
 * Images (the portrait, the Xbox logo, the team photo) are drawn once they load and the texture is re-uploaded.
 */
function painters(images: { jobs: HTMLImageElement | null; xbox: HTMLImageElement | null; clan: HTMLImageElement | null }, video: HTMLVideoElement): Record<string, Paint> {
  const mono = '15px ui-monospace, Menlo, monospace';
  return {
    // the Barcelona 2013 home shirt from the back, the white school shirt, the black Google tee. u: 0 front seam, 0.5 the back.
    'figure-shirt': {
      w: 512, h: 512,
      frames: [(x, w, h) => {
        const stripes = ['#A50044', '#004D98', '#A50044', '#004D98', '#A50044', '#004D98', '#A50044', '#004D98'];
        stripes.forEach((c, i) => { x.fillStyle = c; x.fillRect((i * w) / stripes.length, 0, w / stripes.length + 1, h); });
        x.fillStyle = '#F4C542'; x.fillRect(0, 0, w, 22); // collar
        x.textAlign = 'center'; x.fillStyle = '#F4C542';
        x.font = '700 44px Inter, system-ui, sans-serif'; x.fillText('MESSI', w / 2, 215);
        x.font = '700 140px Inter, system-ui, sans-serif'; x.fillText('10', w / 2, 360);
        x.textAlign = 'left';
      }, (x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#E3E3DF'; x.fillRect(0, 0, w, 26); // collar
        x.fillStyle = '#D9D9D5'; x.fillRect(0, 0, 3, h); x.fillRect(w - 3, 0, 3, h); // the placket at the front seam
      }, (x, w, h) => {
        // the black Google tee: the logo sits on the chest, across the front seam (u = 0 and u = 1)
        x.fillStyle = '#1A1A1A'; x.fillRect(0, 0, w, h);
        x.font = '700 58px "Product Sans", "Google Sans", Arial, sans-serif'; x.textAlign = 'center';
        for (const cx of [0, w]) googleWord(x, cx, 200, 58);
        x.textAlign = 'left';
      }],
    },
    // the TV picture with the Call of Duty HUD, then Notepad with the first website
    screen: {
      w: 512, h: 320,
      frames: [(x, w, h) => {
        x.fillStyle = '#101815'; x.fillRect(0, 0, w, h);
        if (video.readyState >= 2) x.drawImage(video, 0, 0, w, h);
        x.textAlign = 'right';
        x.fillStyle = 'rgba(245,245,245,0.9)'; x.font = '26px "Bebas Neue", Impact, "Arial Narrow", sans-serif'; x.fillText('CALL·OF·DUTY', w - 18, 40);
        x.fillStyle = '#7AC142'; x.font = '17px "Bebas Neue", Impact, "Arial Narrow", sans-serif'; x.fillText('ZOMBIES · ROUND 12', w - 18, 62);
        x.textAlign = 'left';
      }, (x, w, h) => {
        x.fillStyle = '#F4F4F2'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#245EDC'; x.fillRect(0, 0, w, 30);
        x.fillStyle = '#FFFFFF'; x.font = 'bold 15px Inter, system-ui, sans-serif'; x.fillText('index.html - Notepad', 10, 20);
        x.fillStyle = '#E9E9E6'; x.fillRect(0, 30, w, 22);
        x.fillStyle = '#2B2B2B'; x.font = '13px Inter, system-ui, sans-serif'; x.fillText('File   Edit   Format   View   Help', 10, 46);
        x.font = mono;
        const lines = ['<!DOCTYPE html>', '<html>', '<head>', '  <title>My first website</title>', '</head>', '<body>', '  <h1>Hello world</h1>', '  <p>Made by Vansh, 2013</p>', '</body>', '</html>'];
        lines.forEach((l, i) => x.fillText(l, 12, 76 + i * 20));
        x.fillStyle = '#2B2B2B'; x.fillRect(12 + 7 * 9.1, 76 + 9 * 20 - 13, 2, 16); // the caret after </html>
      }],
    },
    // the window: dusk over the Delhi rooftops, then daylight over the school trees
    window: {
      w: 512, h: 512,
      frames: [(x, w, h) => {
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
      }, (x, w, h) => {
        x.fillStyle = '#CFE7F5'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#E8F3FA'; x.fillRect(0, 0, w, h * 0.3);
        x.fillStyle = '#9FB7A0';
        for (const [cx, r] of [[60, 70], [170, 90], [300, 60], [420, 85]] as const) { x.beginPath(); x.arc(cx, h * 0.78, r, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = '#B9C4C9'; x.fillRect(230, h * 0.55, 90, h * 0.45); x.fillRect(360, h * 0.62, 60, h * 0.38);
        x.fillStyle = '#7F9A80'; x.fillRect(0, h * 0.9, w, h * 0.1);
      }],
    },
    // the poster: the portrait on the left, the quote on the right, four drawing pins; then the Converge Clan team photo
    poster: {
      w: 800, h: 444,
      frames: [(x, w, h) => {
        x.fillStyle = '#111111'; x.fillRect(0, 0, w, h);
        x.save(); x.translate(0, (h - 340) / 2);
        if (images.jobs) {
          const iw = images.jobs.naturalWidth, ih = images.jobs.naturalHeight, s = Math.max(240 / iw, 292 / ih);
          x.save(); x.beginPath(); x.rect(24, 24, 240, 292); x.clip();
          x.drawImage(images.jobs, 24 + (240 - iw * s) / 2, 24 + (292 - ih * s) / 2, iw * s, ih * s); x.restore();
        } else { x.fillStyle = '#2B2B2B'; x.fillRect(24, 24, 240, 292); }
        x.fillStyle = '#3B3B3B'; x.fillRect(296, 56, 3, 228);
        x.fillStyle = '#F5F5F5'; x.font = '600 44px Inter, system-ui, sans-serif';
        x.fillText("Here's to the", 340, 152); x.fillText('crazy ones.', 340, 212);
        x.restore();
        x.fillStyle = '#F7D44C';
        for (const [px, py] of [[20, 20], [780, 20], [20, h - 20], [780, h - 20]] as const) { x.beginPath(); x.arc(px, py, 10, 0, Math.PI * 2); x.fill(); }
      }, (x, w, h) => {
        x.fillStyle = '#F4F4F2'; x.fillRect(0, 0, w, h);
        if (images.clan) {
          // crop the 4:3 photo to the board's 1.8:1, keeping the faces
          const iw = images.clan.naturalWidth, ih = images.clan.naturalHeight, ch = iw / (w / h);
          x.drawImage(images.clan, 0, Math.max(0, ih * 0.14), iw, Math.min(ch, ih), 0, 0, w, h);
        }
      }],
    },
    // the Converge Clan banner: the hexagonal C on black, the name in teal
    banner: {
      w: 1024, h: 220,
      frames: [(x, w, h) => {
        x.fillStyle = '#111111'; x.fillRect(0, 0, w, h);
        const cx = 110, cy = h / 2, r = 70;
        x.strokeStyle = '#2EE6C5'; x.lineWidth = 22; x.lineJoin = 'miter'; x.lineCap = 'butt';
        x.beginPath();
        for (let k = 0; k <= 4; k++) { const a = Math.PI / 6 + (k * Math.PI) / 3; const px = cx + r * Math.cos(a + Math.PI / 2), py = cy + r * Math.sin(a + Math.PI / 2); k ? x.lineTo(px, py) : x.moveTo(px, py); }
        x.stroke();
        x.fillStyle = '#2EE6C5'; x.fillRect(cx - 6, cy - 12, 52, 24);
        x.font = '700 92px Inter, system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText('CONVERGE CLAN', 230, cy + 4);
        x.textBaseline = 'alphabetic';
      }],
    },
    // the whiteboard: marker writing from a club session
    whiteboard: {
      w: 1024, h: 640,
      frames: [(x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#B8BFC4'; x.fillRect(0, h - 26, w, 26);
        x.fillStyle = '#245EDC'; x.font = '600 52px "Comic Sans MS", "Chalkboard SE", cursive';
        x.fillText('Web Dev 101', 60, 96);
        x.fillStyle = '#2B2B2B'; x.font = '44px "Comic Sans MS", "Chalkboard SE", cursive';
        ['<html>', '  <head> <title>', '  <body>', '    <h1> hello </h1>'].forEach((l, i) => x.fillText(l, 60, 180 + i * 60));
        x.strokeStyle = '#D62828'; x.lineWidth = 6;
        x.strokeRect(600, 150, 360, 260); x.strokeRect(620, 170, 320, 50); x.strokeRect(620, 240, 150, 150); x.strokeRect(790, 240, 150, 40); x.strokeRect(790, 300, 150, 40);
        x.fillStyle = '#D62828'; x.font = '30px "Comic Sans MS", "Chalkboard SE", cursive'; x.fillText('wireframe', 600, 450);
        x.strokeStyle = '#2E8B57'; x.beginPath(); x.moveTo(60, 470); x.lineTo(420, 470); x.stroke();
        x.fillStyle = '#2E8B57'; x.fillText('meeting: fri 3pm', 60, 530);
        for (const [cx2, c] of [[900, '#2B2B2B'], [940, '#245EDC'], [980, '#D62828']] as const) { x.fillStyle = c; x.fillRect(cx2 - 14, h - 22, 28, 12); }
      }],
    },
    // the spine titles, one cell per book, transparent elsewhere
    shelfLabels: {
      w: 1536, h: 256,
      frames: [(x, w, h) => {
        x.clearRect(0, 0, w, h);
        x.fillStyle = '#F9F4EC'; x.textAlign = 'center'; x.textBaseline = 'middle';
        BOOKS.forEach((b, i) => {
          x.save(); x.translate((i + 0.5) * (w / 12), h / 2); x.rotate(-Math.PI / 2);
          x.font = `600 ${b.title === 'FAMOUS FIVE' ? 34 : 40}px Inter, system-ui, sans-serif`;
          x.fillText(b.title, 0, 0); x.restore();
        });
        x.textAlign = 'left'; x.textBaseline = 'alphabetic';
      }],
    },
    xboxLogo: {
      w: 256, h: 64,
      frames: [(x, w, h) => {
        x.clearRect(0, 0, w, h);
        if (images.xbox) x.drawImage(images.xbox, 0, 0, w, h);
      }],
    },
    // the football: white with the black panels
    ball: {
      w: 512, h: 256,
      frames: [(x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#17282F';
        for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
          const cx = ((c + (r % 2) * 0.5) * w) / 6, cy = (r + 0.5) * (h / 3);
          x.beginPath();
          for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * Math.PI * 2) / 5; x.lineTo(cx + 26 * Math.cos(a), cy + 26 * Math.sin(a)); }
          x.closePath(); x.fill();
        }
      }],
    },
    // the keyboard: a dark slab with rows of keys
    keyboard: {
      w: 512, h: 192,
      frames: [(x, w, h) => {
        x.fillStyle = '#2B2B2B'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#4A4A4A';
        for (let r = 0; r < 5; r++) {
          const n = r === 4 ? 6 : 14 - r, kw = (w - 24) / 14;
          for (let c = 0; c < n; c++) {
            const width = r === 4 && c === 2 ? kw * 5 : kw, off = r === 4 && c > 2 ? kw * 4 : 0;
            x.fillRect(12 + c * kw + off + 2 + (r === 4 ? 0 : r * kw * 0.3), 12 + r * (h - 24) / 5, width - 4, (h - 24) / 5 - 4);
          }
        }
      }],
    },
    // the floor: wood planks in the bedroom, lino tiles in the lab, plaza slabs by the bay
    floor: {
      w: 1024, h: 1024,
      frames: [(x, w, h) => {
        x.fillStyle = '#D9B994'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#C9A57E';
        for (let r = 0; r < 24; r++) { x.fillRect(0, r * (h / 24), w, 2); const off = (r % 2) * 180; for (let c = -1; c < 4; c++) x.fillRect(c * 360 + off, r * (h / 24), 2, h / 24); }
      }, (x, w, h) => {
        x.fillStyle = '#C9CFD3'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#BFC6CB';
        for (let r = 0; r < 12; r++) for (let c = 0; c < 12; c++) if ((r + c) % 2 === 0) x.fillRect(c * (w / 12), r * (h / 12), w / 12, h / 12);
        x.fillStyle = '#AEB6BC';
        for (let k = 0; k <= 12; k++) { x.fillRect(k * (w / 12), 0, 2, h); x.fillRect(0, k * (h / 12), w, 2); }
      }, (x, w, h) => {
        x.fillStyle = '#C9C4BA'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#B9B3A8';
        for (let k = 0; k <= 16; k++) { x.fillRect(k * (w / 16), 0, 3, h); x.fillRect(0, k * (h / 16), w, 3); }
      }],
    },
    // the sky: blue above, pale at the horizon (v = 0.5), a few thin clouds
    sky: {
      w: 1024, h: 512,
      frames: [(x, w, h) => {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#2F7FD0'); g.addColorStop(0.35, '#6FB1E8'); g.addColorStop(0.5, '#DCEEF8'); g.addColorStop(0.52, '#CFE3EE'); g.addColorStop(1, '#B9CFDA');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,255,255,0.85)';
        for (const [cx, cy, rx, ry] of [[150, 150, 90, 12], [420, 120, 70, 9], [700, 170, 120, 14], [900, 140, 60, 8]] as const) { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); x.fill(); }
      }],
    },
    // the Google San Francisco sign
    sign: {
      w: 1024, h: 490,
      frames: [(x, w, h) => {
        white(x, w, h);
        x.textAlign = 'center';
        x.font = '700 190px "Product Sans", "Google Sans", Arial, sans-serif';
        googleWord(x, w / 2, 250, 190);
        x.fillStyle = '#5F6368'; x.font = '500 62px Inter, system-ui, sans-serif'; x.fillText('San Francisco', w / 2, 400);
        x.textAlign = 'left';
      }],
    },
    // the Google Code-in badge on the lanyard
    'figure-badge': {
      w: 256, h: 360,
      frames: [(x, w, h) => {
        white(x, w, h);
        x.fillStyle = '#FBBC05'; x.fillRect(0, 0, w, 54);
        x.fillStyle = '#202124'; x.font = '700 30px Inter, system-ui, sans-serif'; x.fillText('Google Code-in', 14, 38);
        x.font = '700 56px Inter, system-ui, sans-serif'; x.fillText('Vansh', 14, 130);
        x.font = '500 34px Inter, system-ui, sans-serif'; x.fillText('Sood', 14, 172);
        x.fillStyle = '#EA4335'; x.fillRect(14, 200, 228, 60);
        x.fillStyle = '#FFFFFF'; x.font = '700 30px Inter, system-ui, sans-serif'; x.fillText('GRAND PRIZE', 22, 241);
        x.fillStyle = '#5F6368'; x.font = '500 28px Inter, system-ui, sans-serif'; x.fillText('06/25  San Francisco', 14, 320);
      }],
    },
  };
}

export function mount(root: HTMLElement, canvas: HTMLCanvasElement, chapters: number): () => void {
  const renderer = new WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  // the pipeline costs real milliseconds per pixel: measured on this machine, the full chain
  // runs at 45 fps over 2880x1800 and 90 over 2160x1350, so a retina display is rendered at
  // one and a half rather than two. Anti-aliasing is a pass, not a sample count, so the edges
  // do not suffer for it. Below that the pacer takes over.
  const dprCap = Math.min(devicePixelRatio, 1.5);
  let dpr = dprCap;
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping; // the composer's OutputPass applies it
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const scene = new Scene();
  const fog = new Fog(new Color('#D6E6EF'), 30, 420);
  scene.fog = fog;
  const camera = new PerspectiveCamera(50, 1, 0.05, 900);

  // the lights are the same four everywhere; what changes is their colour, power and angle,
  // read every frame from the blended environment spec, so the light travels instead of cutting
  const hemi = new HemisphereLight(0xffffff, 0x888888, 1);
  const sun = new DirectionalLight(0xffffff, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 40 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.022;
  sun.shadow.radius = 4;
  const fillA = new DirectionalLight(0xffffff, 0);
  const fillB = new DirectionalLight(0xffffff, 0);
  scene.add(hemi, sun, sun.target, fillA, fillA.target, fillB, fillB.target);

  // ---- the environment: a handful of emissive panels convolved into an image-based light, so
  // every rough surface has a room to reflect and every metal one a window to catch
  const pmrem = new PMREMGenerator(renderer);
  const envScene = new Scene();
  const unit = new BoxGeometry(1, 1, 1);
  const domeMat = new MeshBasicMaterial({ side: BackSide });
  envScene.add(new Mesh(new BoxGeometry(120, 120, 120), domeMat));
  const panelMats = ENVS[0].panels.map(() => new MeshBasicMaterial());
  const panels = panelMats.map((m) => {
    const mesh = new Mesh(unit, m);
    envScene.add(mesh);
    return mesh;
  });
  let envRT: WebGLRenderTarget | null = null;
  let envKey = -1;
  const buildEnv = (spec: EnvSpec) => {
    domeMat.color.set(spec.dome);
    spec.panels.forEach((q, i) => {
      panelMats[i].color.set(q.color).multiplyScalar(q.power); // an emitter, so it may go past white
      panels[i].position.set(...q.at);
      panels[i].scale.set(...q.size);
    });
    const rt = pmrem.fromScene(envScene, 0.035);
    envRT?.dispose();
    envRT = rt;
    scene.environment = rt.texture;
  };
  /** Rebuilds the image-based light in steps: it is low frequency, so sixteen a gap is invisible. */
  const stepEnv = (i: number, e: number, spec: EnvSpec) => {
    const q = Math.round((i + e) * 16);
    if (q === envKey) return;
    envKey = q;
    buildEnv(spec);
  };

  // ---- one detail map per kind of surface, shared by everything made of it
  const details = new Map<Kind, Texture>();
  const detailFor = (kind: Kind): Texture => {
    let t = details.get(kind);
    if (!t) {
      t = new DataTexture(detailMap(kind, DETAIL), DETAIL, DETAIL, RGBAFormat, UnsignedByteType);
      t.wrapS = t.wrapT = RepeatWrapping;
      t.magFilter = LinearFilter;
      t.minFilter = LinearMipmapLinearFilter;
      t.generateMipmaps = true;
      t.anisotropy = maxAniso;
      t.needsUpdate = true;
      details.set(kind, t);
    }
    return t;
  };

  const outlineMat = outlineMaterial(new Color('#17282f'));
  const hotMat = outlineMaterial(new Color(cssVar('--acc')));

  const video = document.createElement('video');
  Object.assign(video, { src: '/assets/scenes/zombies-gameplay.mp4', muted: true, loop: true, playsInline: true, preload: 'auto' });
  video.setAttribute('playsinline', '');
  const images = { jobs: null as HTMLImageElement | null, xbox: null as HTMLImageElement | null, clan: null as HTMLImageElement | null };
  const PAINT = painters(images, video);

  let needs = true, raf = 0;
  const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

  // textures: static ones painted once, mixed ones blended when the actor's progress moves
  const statics: Array<{ id: string; c: HTMLCanvasElement; tex: CanvasTexture }> = [];
  const mixers: Record<string, Mixer> = {};
  const textureFor = (id: string): Texture | undefined => {
    const p = PAINT[id];
    if (!p) return undefined;
    if (p.frames.length > 1) {
      const cv = p.frames.map((f) => { const c = canvas2d(p.w, p.h); f(c.getContext('2d')!, p.w, p.h); return c; });
      const out = canvas2d(p.w, p.h);
      const tex = new CanvasTexture(out);
      tex.colorSpace = SRGBColorSpace;
      mixers[id] = { cv, out, tex, last: '', live: id === 'screen' };
      return tex;
    }
    const c = canvas2d(p.w, p.h);
    p.frames[0](c.getContext('2d')!, p.w, p.h);
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    statics.push({ id, c, tex });
    return tex;
  };
  const repaint = (ids: string[]) => {
    for (const s of statics) if (ids.includes(s.id)) { PAINT[s.id].frames[0](s.c.getContext('2d')!, s.c.width, s.c.height); s.tex.needsUpdate = true; }
    for (const id of ids) if (mixers[id]) { const m = mixers[id]; m.cv.forEach((c, k) => PAINT[id].frames[k](c.getContext('2d')!, c.width, c.height)); m.last = ''; }
    needs = true; kick();
  };
  /** Blends frame i into frame i+1 by e (clamped to the frames that exist). */
  const blend = (id: string, i: number, e: number) => {
    const m = mixers[id];
    if (!m) return;
    const n = m.cv.length, a = Math.min(i, n - 1), b = Math.min(i + 1, n - 1), tt = a === b ? 0 : e;
    const key = `${a}:${tt.toFixed(3)}`;
    if (m.last === key && !(m.live && a === 0)) return;
    m.last = key;
    if (m.live && a === 0) PAINT[id].frames[0](m.cv[0].getContext('2d')!, m.cv[0].width, m.cv[0].height);
    const x = m.out.getContext('2d')!;
    x.globalAlpha = 1; x.drawImage(m.cv[a], 0, 0);
    if (tt > 0) { x.globalAlpha = tt; x.drawImage(m.cv[b], 0, 0); x.globalAlpha = 1; }
    m.tex.needsUpdate = true;
  };

  const built: Built[] = [];
  const byId: Record<string, Built> = {};
  for (const actor of ACTORS) {
    const g = geometryFor(actor);
    const colors = actor.colors.map((c) => new Color(c).multiplyScalar(actor.glow ?? 1));
    const map = actor.tex ? textureFor(actor.id) : undefined;
    if (map) map.anisotropy = maxAniso;
    const common = { color: colors[0], vertexColors: actor.vc, transparent: actor.transparent ?? false, ...(map ? { map } : {}) };
    const surf = actor.surface.map((n) => SURFACE[n]);
    let det: Det | undefined;
    let mat: Mat;
    if (actor.shade === 'unlit') {
      mat = new MeshBasicMaterial({ ...common, side: DoubleSide, fog: actor.id !== 'sky' });
    } else {
      const s0 = surf[0];
      det = {
        map: { value: detailFor(s0.kind) },
        tile: { value: 1 / s0.tile },
        bump: { value: s0.bump },
        ramp: { value: s0.roughAmp },
      };
      mat = withDetail(new MeshStandardMaterial({
        ...common,
        roughness: s0.rough,
        metalness: s0.metal,
        envMapIntensity: s0.env,
        // floors, walls and ceilings are single sheets: the camera passes through them, so both faces light
        side: actor.shade === 'shell' ? DoubleSide : FrontSide,
      }), det);
    }
    const mesh = new Mesh(g, mat);
    if (actor.at) mesh.position.set(...actor.at);
    if (actor.path) mesh.position.set(...actor.path[0]);
    const big = actor.id === 'sky' || actor.id === 'water' || actor.id === 'hills' || actor.id === 'floor';
    mesh.castShadow = actor.shade !== 'unlit' && !big && actor.id !== 'walls' && actor.id !== 'ceiling';
    mesh.receiveShadow = actor.shade !== 'unlit' && actor.id !== 'sky';
    scene.add(mesh);
    let outline: Mesh | undefined;
    if (actor.outline) {
      outline = new Mesh(g, outlineMat);
      outline.position.copy(mesh.position);
      outline.visible = INK_OUTLINE; // otherwise it is only the hull the hover highlight uses
      outline.castShadow = false;
      outline.receiveShadow = false;
      scene.add(outline);
    }
    const b: Built = { actor, mesh, outline, a: colors, mat, e: 0, surf, det };
    built.push(b);
    byId[actor.id] = b;
  }
  const fan = byId.fan, boats = byId.boats, clouds = byId.clouds;
  const hot = built.filter((b) => b.actor.cap);

  // ---- the pipeline. The scene goes to a half-float buffer, ambient occlusion is traced from
  // its depth and normals (which is what stops a pile of solids reading as a pile of solids),
  // the few pixels above white bloom, then one pass tone maps to sRGB and one anti-aliases.
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const gtao = new GTAOPass(scene, camera, 1, 1);
  gtao.updateGtaoMaterial({ radius: 0.22, distanceExponent: 1.4, thickness: 0.5, scale: 1.0, samples: 16, screenSpaceRadius: false });
  gtao.updatePdMaterial({ lumaPhi: 8, depthPhi: 2.5, normalPhi: 3.5, radius: 3, rings: 2, samples: 12 });
  gtao.blendIntensity = 0.5;
  composer.addPass(gtao);
  composer.addPass(new UnrealBloomPass(new Vector2(1, 1), 0.35, 0.8, 1.0));
  composer.addPass(new OutputPass());
  composer.addPass(new ShaderPass(GRADE)); // graded in display space, after the tone map
  composer.addPass(new FXAAPass());

  // assets that arrive later repaint what uses them
  loadImage('/assets/scenes/jobs.jpg').then((i) => { images.jobs = i; repaint(['poster']); });
  loadImage('/assets/scenes/xbox-360-logo.png').then((i) => { images.xbox = i; repaint(['xboxLogo']); });
  loadImage('/assets/story/cc.jpg').then((i) => { images.clan = i; repaint(['poster']); });
  const bebas = new FontFace('Bebas Neue', 'url(/fonts/bebas-neue.ttf)');
  document.fonts.add(bebas);
  bebas.load().then(() => repaint(['screen'])).catch(() => {});
  document.fonts.load('700 40px "Product Sans"').then(() => repaint(['sign', 'figure-shirt'])).catch(() => {});

  const shot = makeShot(STATIONS);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, target = 0, cur = 0, vel = 0, lastT = 0, station = 0, last: Frame | undefined;

  const applyTheme = () => {
    renderer.setClearColor(new Color(cssVar('--bg')));
    hotMat.color.set(cssVar('--acc'));
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
    composer.setSize(w, h);
    camera.aspect = w / h;
    needs = true;
    kick();
  };
  const ro = new ResizeObserver(fit);
  ro.observe(canvas);

  /**
   * Adaptive resolution, downwards only, and only when it actually buys something. Ambient
   * occlusion, the bloom chain and the grade are paid per pixel, so a weak GPU wants a smaller
   * buffer. But a frame can also be lost to the page compositor rather than to us, and there
   * shrinking the render costs sharpness and wins nothing: so each drop is measured, and if the
   * frame did not get at least a tenth faster the step is put back and the pacer stands down.
   */
  let ema = 1 / 60, paced = 0, pacing = true, tried = 0;
  const pace = (dt: number) => {
    if (!pacing) return;
    ema += (dt - ema) * 0.08;
    if (++paced < 60) return;
    paced = 0;
    const apply = (next: number) => {
      dpr = next;
      renderer.setPixelRatio(dpr);
      composer.setPixelRatio(dpr);
      fit();
    };
    if (tried) {
      // the verdict on the last step down
      if (ema > tried * 0.9) {
        apply(Math.min(dprCap, dpr + 0.25));
        pacing = false;
      }
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

  /** Puts every actor where the frame says, with its own timing inside the gap. */
  const frame = (f: Frame) => {
    last = f;
    const w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
    // portrait: the text owns the lower half, so the look pulls toward the subject and the frustum is
    // cropped from a taller one (setViewOffset), landing the subject in the upper part without a tilt
    const portrait = Math.min(1, Math.max(0, (1 - camera.aspect) / 0.5));
    const look = new Vector3(...f.look).lerp(new Vector3(...f.subject), portrait * 0.85);
    camera.position.set(...f.cam);
    camera.lookAt(look);
    const v = 2 * Math.atan(Math.tan((f.fov * D) / 2) / camera.aspect);
    camera.fov = Math.min(78, Math.max(35, v / D));
    const shift = Math.max(0, 1 - camera.aspect) * 0.9;
    if (shift > 0.01) camera.setViewOffset(w, h * (1 + shift), 0, h * shift, w, h);
    else camera.clearViewOffset();
    camera.updateProjectionMatrix();
    // the light of the place he is in, blended with the place he is going to
    const spec = envAt(f.i, f.t);
    hemi.color.set(spec.hemi.sky);
    hemi.groundColor.set(spec.hemi.ground);
    hemi.intensity = spec.hemi.power;
    // the sun follows the subject, so its shadow map stays tight around what matters
    for (const [light, dir] of [[sun, spec.sun], [fillA, spec.fills[0]], [fillB, spec.fills[1]]] as const) {
      light.color.set(dir.color);
      light.intensity = dir.power;
      light.position.set(f.subject[0] + dir.from[0], f.subject[1] + dir.from[1], f.subject[2] + dir.from[2]);
      light.target.position.set(...f.subject);
      light.target.updateMatrixWorld();
    }
    sun.shadow.intensity = spec.sun.shadow;
    fog.color.set(spec.fog.color);
    fog.near = spec.fog.near;
    fog.far = spec.fog.far;
    renderer.toneMappingExposure = spec.exposure;
    scene.environmentIntensity = spec.envPower;
    stepEnv(f.i, f.t, spec);

    const gap = Math.min(f.i, STATIONS.length - 2);
    for (const b of built) {
      // at the last station there is no gap to progress in: rest fully on it
      const e = f.i >= STATIONS.length - 1 ? 0 : timed(f.raw, b.actor.timing?.[gap]);
      b.e = e;
      const inf = b.mesh.morphTargetInfluences;
      if (inf) {
        for (let k = 0; k < inf.length; k++) inf[k] = 0;
        // station 0 is the base; between i and i+1 the two neighbours share the weight
        if (f.i >= 1) inf[f.i - 1] = 1 - e;
        if (f.i + 1 <= STATIONS.length - 1) inf[f.i] = e;
        const oinf = b.outline?.morphTargetInfluences;
        if (oinf) for (let k = 0; k < oinf.length; k++) oinf[k] = inf[k];
      }
      const j = Math.min(f.i + 1, b.a.length - 1);
      b.mat.color.copy(b.a[f.i]).lerp(b.a[j], e);
      if (b.actor.bounce && b.det) (b.mat as MeshStandardMaterial).emissive.copy(b.mat.color).multiplyScalar(b.actor.bounce);
      if (b.det) {
        // the material travels too: a plank floor turning to plaza concrete gets rougher and
        // coarser on the way. The numbers cross-fade; the detail map itself changes hands at halfway.
        const s0 = b.surf[f.i], s1 = b.surf[j];
        const std = b.mat as MeshStandardMaterial;
        std.roughness = lerp(s0.rough, s1.rough, e);
        std.metalness = lerp(s0.metal, s1.metal, e);
        std.envMapIntensity = lerp(s0.env, s1.env, e);
        b.det.tile.value = 1 / lerp(s0.tile, s1.tile, e);
        b.det.bump.value = lerp(s0.bump, s1.bump, e);
        b.det.ramp.value = lerp(s0.roughAmp, s1.roughAmp, e);
        const kind = (e > 0.5 ? s1 : s0).kind;
        if (b.det.map.value !== details.get(kind)) b.det.map.value = detailFor(kind);
      }
      if (b.actor.path) {
        // travels along its path; a rolling ball turns by the distance covered over its radius
        const p0 = b.actor.path[f.i], p1 = b.actor.path[j];
        b.mesh.position.set(lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), lerp(p0[2], p1[2], e));
        if (b.actor.roll) b.mesh.rotation.x = (b.mesh.position.z - b.actor.path[0][2]) / b.actor.roll;
        if (b.outline) { b.outline.position.copy(b.mesh.position); b.outline.rotation.copy(b.mesh.rotation); }
      }
      if (mixers[b.actor.id]) blend(b.actor.id, f.i, e);
    }
    station = f.i;
  };

  // ---- hotspots: point at something and it says what it is; click opens its link
  const cap = document.createElement('div');
  cap.className = 'cap';
  root.querySelector('.stage')!.appendChild(cap);
  const ray = new Raycaster();
  const ndc = new Vector2();
  let hovered: Built | undefined, pointer: { x: number; y: number } | undefined;
  const captionAt = (b: Built | undefined) => {
    if (!b || !last) return '';
    const idx = last.i + (last.t > 0.5 ? 1 : 0);
    return b.actor.cap?.[Math.min(idx, STATIONS.length - 1)] ?? '';
  };
  const setHover = (b: Built | undefined) => {
    if (hovered === b) return;
    if (hovered?.outline) { hovered.outline.material = outlineMat; hovered.outline.visible = INK_OUTLINE; }
    hovered = b;
    if (hovered?.outline) { hovered.outline.material = hotMat; hovered.outline.visible = true; }
    const text = captionAt(hovered);
    cap.textContent = text;
    cap.classList.toggle('on', !!text);
    canvas.style.cursor = text && hovered?.actor.href ? 'pointer' : text ? 'help' : '';
    needs = true; kick();
  };
  const pick = (x: number, y: number) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(hot.map((b) => b.mesh), false);
    for (const hit of hits) {
      const b = hot.find((h) => h.mesh === hit.object);
      if (b && captionAt(b)) return b;
    }
    return undefined;
  };
  const place = () => {
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
    place();
  };
  const onLeave = () => { pointer = undefined; setHover(undefined); };
  const onClick = (ev: PointerEvent) => {
    const b = pick(ev.clientX, ev.clientY);
    if (ev.pointerType === 'touch') {
      pointer = { x: ev.clientX, y: ev.clientY };
      if (b !== hovered) { setHover(b); place(); return; }
    }
    if (b?.actor.href && captionAt(b)) window.open(b.actor.href, '_blank', 'noopener');
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
      const k = 90, c = 2 * Math.sqrt(k);
      vel += (k * (target - cur) - c * vel) * dt;
      cur += vel * dt;
      if (Math.abs(target - cur) < 0.0004 && Math.abs(vel) < 0.002) { cur = target; vel = 0; }
    }
    let q = stageProgress(cur, chapters, STATIONS.length);
    if (reduce.matches) q = Math.round(q * (STATIONS.length - 1)) / Math.max(1, STATIONS.length - 1);
    frame(shot(q));
    // things on their own clock
    const t = now / 1000;
    if (fan && !reduce.matches && station < 2) { fan.mesh.rotation.y += dt * 5; if (fan.outline) fan.outline.rotation.y = fan.mesh.rotation.y; }
    if (boats && station >= 1) {
      // a hull on a gentle swell: heave and a little roll, out of phase
      const sw = reduce.matches ? 0 : 1;
      boats.mesh.position.y = 0.16 * Math.sin(t * 0.9) * sw;
      boats.mesh.rotation.z = 0.02 * Math.sin(t * 0.9 + 1.2) * sw;
      if (boats.outline) { boats.outline.position.copy(boats.mesh.position); boats.outline.rotation.copy(boats.mesh.rotation); }
    }
    if (clouds && station >= 1 && !reduce.matches) clouds.mesh.position.x = 8 * Math.sin(t * 0.03);
    if (hovered && pointer) setHover(pick(pointer.x, pointer.y));
    composer.render();
    needs = false;
    const live = visible && !reduce.matches;
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
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerup', onClick);
    ro.disconnect(); io.disconnect(); themeObs.disconnect();
    scheme.removeEventListener('change', applyTheme);
    video.pause(); video.src = '';
    cap.remove();
    for (const t of details.values()) t.dispose();
    envRT?.dispose();
    pmrem.dispose();
    composer.dispose();
    renderer.dispose();
  };
}
