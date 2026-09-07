// Everything painted onto a canvas and used as a texture: the TV and the Notepad screen, the view
// out of the window, the Jobs poster and the team photo, the banner, the whiteboard, the sign.
// Canvas y runs down, texture v runs up, so "top" in the world is y = 0 here.
export type Ctx = CanvasRenderingContext2D;
export type Painter = (x: Ctx, w: number, h: number) => void;
export interface Paint { w: number; h: number; frames: Painter[] }
export interface Images { jobs: HTMLImageElement | null; xbox: HTMLImageElement | null; clan: HTMLImageElement | null }

export const canvas2d = (w: number, h: number): HTMLCanvasElement => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export const loadImage = (src: string): Promise<HTMLImageElement | null> => new Promise((res) => {
  const i = new Image();
  i.onload = () => res(i);
  i.onerror = () => res(null);
  i.src = src;
});

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
export function painters(images: Images, video: HTMLVideoElement): Record<string, Paint> {
  const mono = '15px ui-monospace, Menlo, monospace';
  return {
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
      }, (x, w, h) => {
        // a Windows 7 desktop, the way the lab's machines sat between classes
        const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2C74C4'); g.addColorStop(1, '#0A2C58');
        x.fillStyle = g; x.fillRect(0, 0, w, h);
        x.fillStyle = 'rgba(255,255,255,0.10)'; x.beginPath(); x.ellipse(w * 0.58, h * 0.56, 170, 95, -0.35, 0, Math.PI * 2); x.fill();
        const icons: Array<[string, string]> = [['#E8E8E8', 'Computer'], ['#7AC142', 'Recycle Bin'], ['#5DA9E9', 'Notepad'], ['#F2C94C', 'Chrome']];
        icons.forEach(([c, label], i) => {
          x.fillStyle = c; x.fillRect(16, 16 + i * 46, 24, 24);
          x.fillStyle = '#FFFFFF'; x.font = '10px Inter, system-ui, sans-serif'; x.fillText(label, 8, 52 + i * 46);
        });
        x.fillStyle = 'rgba(16,34,64,0.9)'; x.fillRect(0, h - 30, w, 30);
        x.fillStyle = '#4C9BE8'; x.beginPath(); x.arc(22, h - 15, 11, 0, Math.PI * 2); x.fill();
        x.fillStyle = '#FFFFFF'; x.font = '11px Inter, system-ui, sans-serif'; x.textAlign = 'right'; x.fillText('11:42 AM', w - 10, h - 11); x.textAlign = 'left';
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
  };
}

/**
 * Designed surface colour maps, one tile each, drawn at runtime: teak planks, pale lab tiles,
 * plaza pavers. Tiled in metres by the material's `tile`; the grain comes from a normal map.
 */
export const SURFACE_PAINT: Record<string, Paint> = {
  planksPale: {
    w: 512, h: 512,
    frames: [(x, w, h) => {
      // pale engineered oak, wide boards, for the condo
      const rows = 6, ph = h / rows;
      for (let r = 0; r < rows; r++) {
        const off = (r % 3) * (w / 3);
        for (let c = -2; c < 3; c++) {
          const t = ((r * 7 + c * 3 + 5) % 9) / 9;
          x.fillStyle = `hsl(${34 + t * 6} ${28 + t * 8}% ${66 + t * 7}%)`;
          x.fillRect(c * (w / 2) + off, r * ph, w / 2, ph);
        }
        x.fillStyle = 'rgba(90,70,45,0.35)';
        x.fillRect(0, r * ph, w, 2);
        for (let c = -2; c < 3; c++) x.fillRect(c * (w / 2) + off, r * ph, 2, ph);
      }
    }],
  },
  planks: {
    w: 512, h: 512,
    frames: [(x, w, h) => {
      // eight planks across a 2.4 m tile, staggered, each its own warm teak
      const rows = 8, ph = h / rows;
      for (let r = 0; r < rows; r++) {
        const off = (r % 3) * (w / 3);
        for (let c = -2; c < 3; c++) {
          const t = ((r * 7 + c * 3 + 5) % 9) / 9;
          x.fillStyle = `hsl(${26 + t * 6} ${46 + t * 10}% ${34 + t * 9}%)`;
          x.fillRect(c * (w / 2) + off, r * ph, w / 2, ph);
        }
        x.fillStyle = 'rgba(60,35,15,0.55)';
        x.fillRect(0, r * ph, w, 2);
        for (let c = -2; c < 3; c++) x.fillRect(c * (w / 2) + off, r * ph, 2, ph);
      }
      // faint grain lines along each plank
      x.strokeStyle = 'rgba(70,40,20,0.10)';
      x.lineWidth = 1;
      for (let i = 0; i < 160; i++) {
        const y = (i * 37) % h, len = 60 + ((i * 53) % 200);
        x.beginPath(); x.moveTo((i * 91) % w, y); x.lineTo(((i * 91) % w) + len, y + ((i % 3) - 1)); x.stroke();
      }
    }],
  },
  tiles: {
    w: 512, h: 512,
    frames: [(x, w, h) => {
      // four 30 cm tiles across a 1.2 m tile, a soft grey with a hint of variation and a fine joint
      const n = 4, s = w / n;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const t = ((r * 5 + c * 3) % 7) / 7;
        x.fillStyle = `hsl(210 8% ${82 + t * 5}%)`;
        x.fillRect(c * s, r * s, s, s);
      }
      x.fillStyle = 'rgba(90,95,100,0.5)';
      for (let k = 0; k <= n; k++) { x.fillRect(k * s - 1, 0, 3, h); x.fillRect(0, k * s - 1, w, 3); }
    }],
  },
  pavers: {
    w: 512, h: 512,
    frames: [(x, w, h) => {
      // three 60 cm pavers across a 1.8 m tile, warm pale concrete, wider joints
      const n = 3, s = w / n;
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
        const t = ((r * 4 + c * 5) % 6) / 6;
        x.fillStyle = `hsl(38 ${12 + t * 6}% ${64 + t * 6}%)`;
        x.fillRect(c * s, r * s, s, s);
      }
      x.fillStyle = 'rgba(120,110,95,0.55)';
      for (let k = 0; k <= n; k++) { x.fillRect(k * s - 2, 0, 5, h); x.fillRect(0, k * s - 2, w, 5); }
    }],
  },
};

/** The city at night out of the Toronto window: a navy sky, towers with lit windows, the CN Tower. 2:1, drawn once. */
export const CITY_PAINT: Record<string, Paint> = {
  toronto: {
    w: 2048, h: 1024,
    frames: [(x, w, h) => {
      const sky = x.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, '#070B1A'); sky.addColorStop(0.55, '#101A3A'); sky.addColorStop(1, '#2A3358');
      x.fillStyle = sky; x.fillRect(0, 0, w, h);
      // a few stars
      x.fillStyle = 'rgba(255,255,255,0.5)';
      for (let i = 0; i < 90; i++) x.fillRect((i * 733) % w, (i * 197) % (h * 0.45), 1.5, 1.5);
      // the lake at the bottom, and a horizon glow
      const glow = x.createLinearGradient(0, h * 0.62, 0, h * 0.8);
      glow.addColorStop(0, 'rgba(255,170,90,0)'); glow.addColorStop(1, 'rgba(255,170,90,0.18)');
      x.fillStyle = glow; x.fillRect(0, h * 0.62, w, h * 0.18);
      x.fillStyle = '#0B1226'; x.fillRect(0, h * 0.8, w, h * 0.2);
      // towers: a skyline of rectangles, each with a grid of lit windows
      const towers: Array<[number, number, number]> = [];
      let cx = 0, i = 0;
      while (cx < w) {
        const tw = 40 + ((i * 47) % 90), th = 120 + ((i * 131) % 380);
        towers.push([cx, tw, th]);
        cx += tw + 6 + ((i * 13) % 30);
        i++;
      }
      for (const [tx, tw, th] of towers) {
        const top = h * 0.8 - th;
        x.fillStyle = '#141B33'; x.fillRect(tx, top, tw, th);
        x.fillStyle = 'rgba(255,214,150,0.85)';
        const cols = Math.max(2, Math.floor(tw / 9)), rows = Math.floor(th / 11);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          if (((r * 31 + c * 17 + tx) % 7) < 4) x.fillRect(tx + 3 + c * (tw - 6) / cols, top + 4 + r * 11, 4, 6);
        }
        // reflection in the lake
        x.fillStyle = 'rgba(255,214,150,0.08)'; x.fillRect(tx, h * 0.8, tw, Math.min(th * 0.5, h * 0.2));
      }
      // the CN Tower: a tapering shaft, the pod, the antenna; lit
      const bx = w * 0.62, base = h * 0.8, tall = h * 0.72;
      x.fillStyle = '#23294A';
      x.beginPath(); x.moveTo(bx - 22, base); x.lineTo(bx - 8, base - tall * 0.66); x.lineTo(bx + 8, base - tall * 0.66); x.lineTo(bx + 22, base); x.closePath(); x.fill();
      x.fillStyle = '#2E3560';
      x.beginPath(); x.ellipse(bx, base - tall * 0.68, 54, 22, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#3A4270'; x.fillRect(bx - 44, base - tall * 0.72, 88, 26);
      x.fillStyle = 'rgba(255,220,160,0.9)';
      for (let c = 0; c < 14; c++) x.fillRect(bx - 40 + c * 6, base - tall * 0.71, 3, 5);
      x.fillStyle = '#23294A';
      x.beginPath(); x.moveTo(bx - 7, base - tall * 0.72); x.lineTo(bx - 3, base - tall * 0.9); x.lineTo(bx + 3, base - tall * 0.9); x.lineTo(bx + 7, base - tall * 0.72); x.closePath(); x.fill();
      x.fillStyle = '#4A5288'; x.beginPath(); x.ellipse(bx, base - tall * 0.9, 18, 8, 0, 0, Math.PI * 2); x.fill();
      x.fillStyle = '#1C2140'; x.fillRect(bx - 2, base - tall, 4, tall * 0.1);
      x.fillStyle = '#FF4A4A'; x.beginPath(); x.arc(bx, base - tall, 4, 0, Math.PI * 2); x.fill();
      // the tower's coloured lighting: a soft violet along the shaft
      const lit = x.createLinearGradient(bx - 22, 0, bx + 22, 0);
      lit.addColorStop(0, 'rgba(120,110,255,0)'); lit.addColorStop(0.5, 'rgba(120,110,255,0.35)'); lit.addColorStop(1, 'rgba(120,110,255,0)');
      x.fillStyle = lit; x.fillRect(bx - 22, base - tall * 0.66, 44, tall * 0.66);
    }],
  },
};

/**
 * One tile of a tower at night: 24 bays by 20 floors (96 m by 70 m; city.ts WINDOW_TILE says which
 * quarter a building takes). Floors come in kinds, as an evening does: a few lit end to end (an
 * office working late), a quarter dark, the rest a scatter of warm homes and a few cool screens.
 */
export const WINDOW_PAINT: Record<string, Paint> = {
  windows: {
    w: 1024, h: 896,
    frames: [(x, w, h) => {
      x.fillStyle = '#0F1424'; x.fillRect(0, 0, w, h);
      const cols = 24, rows = 20, bw = w / cols, bh = h / rows;
      let seed = 7;
      const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
      for (let r = 0; r < rows; r++) {
        const kind = rnd();
        const floorLit = kind < 0.1 ? 0.92 : kind < 0.36 ? 0.08 : 0.42; // an office floor, a dark floor, a floor of homes
        const office = kind < 0.1;
        for (let c = 0; c < cols; c++) {
          const u = rnd();
          if (u > floorLit) continue;
          const warm = office ? rnd() < 0.25 : rnd() < 0.82;
          const l = 60 + rnd() * 28;
          x.fillStyle = warm ? `hsl(${34 + rnd() * 10} ${62 + rnd() * 22}% ${l}%)` : `hsl(${205 + rnd() * 20} 45% ${l + 4}%)`;
          x.globalAlpha = office ? 0.75 + rnd() * 0.25 : 0.5 + rnd() * 0.5;
          x.fillRect(c * bw + bw * 0.2, r * bh + bh * 0.2, bw * 0.6, bh * 0.52);
        }
      }
      x.globalAlpha = 1;
      // the floor slabs, a faint line between rows; the mullions, fainter
      x.fillStyle = 'rgba(255,255,255,0.045)';
      for (let r = 0; r <= rows; r++) x.fillRect(0, r * bh - 1, w, 2);
      x.fillStyle = 'rgba(255,255,255,0.02)';
      for (let c = 0; c <= cols; c++) x.fillRect(c * bw - 1, 0, 2, h);
    }],
  },
  nightSky: {
    w: 16, h: 512,
    frames: [(x, w, h) => {
      // v runs bottom to top on the dome: horizon glow at the bottom, deep navy overhead
      const g = x.createLinearGradient(0, h, 0, 0);
      g.addColorStop(0, '#2A2A3E'); g.addColorStop(0.08, '#1C2240'); g.addColorStop(0.3, '#0E1530'); g.addColorStop(1, '#05070F');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
    }],
  },
};

/** The Google Code-in 2018 grand prize winner badge. */
export const BADGE_PAINT: Record<string, Paint> = {
  badge: {
    w: 256, h: 360,
    frames: [(x, w, h) => {
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#FBBC05'; x.fillRect(0, 0, w, 54);
      x.fillStyle = '#202124'; x.font = '700 30px Inter, system-ui, sans-serif'; x.fillText('Google Code-in', 14, 38);
      x.font = '700 56px Inter, system-ui, sans-serif'; x.fillText('Vansh', 14, 130);
      x.font = '500 34px Inter, system-ui, sans-serif'; x.fillText('Sood', 14, 172);
      x.fillStyle = '#EA4335'; x.fillRect(14, 200, 228, 60);
      x.fillStyle = '#FFFFFF'; x.font = '700 30px Inter, system-ui, sans-serif'; x.fillText('GRAND PRIZE', 22, 241);
      x.fillStyle = '#5F6368'; x.font = '500 26px Inter, system-ui, sans-serif'; x.fillText('2018 · San Francisco', 14, 320);
    }],
  },
};

/** What is on his screens now: an editor, the Floqer app, a terminal on the laptop. */
export const SCREEN_PAINT: Record<string, Paint> = {
  screenCode: {
    w: 768, h: 432,
    frames: [(x, w, h) => {
      x.fillStyle = '#1E1F26'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#16171C'; x.fillRect(0, 0, 190, h);
      x.font = '13px ui-monospace, Menlo, monospace';
      const tree = ['src/', '  lib/', '    stage/', '      sets.ts', '      dolly.ts', '      built.ts', '  scripts/', '    stage-run.ts', 'tests/', 'package.json'];
      tree.forEach((l, i) => { x.fillStyle = i === 3 ? '#E6E6E6' : '#8A8F9E'; x.fillText(l, 14, 30 + i * 20); });
      const code = [
        ['export const ', '#C792EA'], ['SETS', '#82AAFF'], [': StageSet[] = [', '#E6E6E6'],
      ];
      const lines = [
        "import { type V3 } from './rig.ts';", '', 'export const SETS: StageSet[] = [', "  { id: 'now', env: 'studio',", "    tint: { sky: '#5A6E96', power: 0.3 },",
        '    props: [', "      { build: 'desk', at: [-9.0, 0, 0.4] },", "      { build: 'officeChair', at: [-5.3, 0, -0.4] },", '    ],', '  },', '];',
        '', 'export function makeDolly(keys) {', '  const cam = new CatmullRomCurve3(', "    keys.map((k) => new Vector3(...k.cam)), false, 'centripetal');",
      ];
      x.font = '14px ui-monospace, Menlo, monospace';
      lines.forEach((l, i) => {
        const y = 30 + i * 22;
        x.fillStyle = '#4A4F60'; x.fillText(String(i + 1).padStart(2, ' '), 204, y);
        x.fillStyle = /^(import|export)/.test(l) ? '#C792EA' : /'[^']*'/.test(l) ? '#C3E88D' : '#D6DAE6';
        x.fillText(l, 236, y);
      });
      void code;
      x.fillStyle = '#82AAFF'; x.fillRect(236 + 8 * 26, 30 + 7 * 22 - 13, 2, 17);
    }],
  },
  screenFloqer: {
    w: 768, h: 432,
    frames: [(x, w, h) => {
      x.fillStyle = '#F7F7F8'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, 176, h);
      x.fillStyle = '#E8E8EC'; x.fillRect(176, 0, 1, h);
      x.fillStyle = '#111111'; x.font = '700 18px Inter, system-ui, sans-serif'; x.fillText('Floqer', 20, 34);
      x.font = '13px Inter, system-ui, sans-serif';
      ['Workflows', 'Sources', 'Shortcuts', 'Runs', 'Settings'].forEach((l, i) => { x.fillStyle = i === 0 ? '#111111' : '#6B6F7A'; x.fillText(l, 20, 76 + i * 28); });
      x.fillStyle = '#111111'; x.font = '600 16px Inter, system-ui, sans-serif'; x.fillText('Lead enrichment', 200, 36);
      // a table of rows with a status pill
      for (let r = 0; r < 9; r++) {
        const y = 62 + r * 38;
        x.fillStyle = r % 2 ? '#F1F1F4' : '#FFFFFF'; x.fillRect(196, y - 14, w - 216, 34);
        x.fillStyle = '#2B2D33'; x.font = '13px Inter, system-ui, sans-serif'; x.fillText(`row ${1041 + r * 7}`, 210, y + 7);
        x.fillStyle = '#6B6F7A'; x.fillText(['acme.io', 'north.co', 'lumen.app', 'bay.dev', 'kite.so', 'pier.ai', 'orbit.gg', 'mesa.ly', 'vale.io'][r], 330, y + 7);
        x.fillStyle = r < 6 ? '#DDF5E3' : '#FFF1D6'; x.fillRect(560, y - 6, 74, 20);
        x.fillStyle = r < 6 ? '#1B7F3B' : '#9A5B00'; x.font = '600 11px Inter, system-ui, sans-serif'; x.fillText(r < 6 ? 'ENRICHED' : 'RUNNING', 568, y + 8);
      }
      x.fillStyle = '#111111'; x.fillRect(640, 22, 108, 30);
      x.fillStyle = '#FFFFFF'; x.font = '600 12px Inter, system-ui, sans-serif'; x.fillText('Run workflow', 655, 41);
    }],
  },
  screenTerminal: {
    w: 640, h: 400,
    frames: [(x, w, h) => {
      x.fillStyle = '#0F1117'; x.fillRect(0, 0, w, h);
      x.font = '13px ui-monospace, Menlo, monospace';
      const lines = ['$ npm test', '', '✔ four sets and a dolly', '✔ every placement sits somewhere finite', '✔ the camera never jumps', '✔ the whole set stays under 4 MB', '', 'ℹ pass 57', 'ℹ fail 0', '', '$ git log --oneline -1', 'feat(stage): the desk, now', '$ '];
      lines.forEach((l, i) => { x.fillStyle = l.startsWith('✔') ? '#7BD88F' : l.startsWith('$') ? '#E6E6E6' : '#9AA0B0'; x.fillText(l, 16, 28 + i * 22); });
      x.fillStyle = '#E6E6E6'; x.fillRect(34, 28 + 12 * 22 - 12, 8, 15);
    }],
  },
};
