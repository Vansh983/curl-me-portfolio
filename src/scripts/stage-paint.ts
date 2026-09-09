// Everything painted onto a canvas and used as a texture: the TV and the Notepad screen, the view
// out of the window, the Jobs poster and the team photo, the banner, the whiteboard, the sign.
// Canvas y runs down, texture v runs up, so "top" in the world is y = 0 here.
export type Ctx = CanvasRenderingContext2D;
export type Painter = (x: Ctx, w: number, h: number) => void;
export interface Paint { w: number; h: number; frames: Painter[] }
export interface Images { jobs: HTMLImageElement | null; xbox: HTMLImageElement | null; clan: HTMLImageElement | null; dalhousie: HTMLImageElement | null; bean: HTMLImageElement | null }

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
    campusPhoto: { w: 1600, h: 941, frames: [(x, w, h) => {
      x.fillStyle = '#7F9AA9'; x.fillRect(0, 0, w, h);
      if (images.dalhousie) x.drawImage(images.dalhousie, 0, 0, w, h);
      x.fillStyle = '#142B3CDD'; x.fillRect(0, 0, w, 110);
      // Keep the location inside the portrait lens crop as well as the landscape window.
      x.textAlign = 'center';
      x.fillStyle = '#FFFFFF'; x.font = '600 40px Georgia, serif'; x.fillText('Dalhousie University', w / 2, 51);
      x.font = '22px Inter, sans-serif'; x.fillText('HALIFAX, NOVA SCOTIA', w / 2, 87);
      x.textAlign = 'left';
    }] },
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
  /** A storey of facade, 3.6 m square, white for the building's tint: a window with a sill and the slab line above. Halifax from the air. */
  facade: { w: 256, h: 256, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#D9D9D6'; x.fillRect(0, 0, w, 6); // the slab line at the top of the storey
    x.fillStyle = '#4E5E6C'; x.fillRect(78, 62, 100, 128); // the glass
    x.fillStyle = '#7D8C98'; x.fillRect(84, 68, 40, 54); // a lit pane, the sky in it
    x.fillStyle = '#EDEDEA'; x.fillRect(72, 190, 112, 8); // the sill
  }] },
  /** A football pitch for Wickwire Field, uv 0..1 across the whole field: turf in mown stripes with white lines. */
  pitch: { w: 1024, h: 640, frames: [(x, w, h) => {
    for (let i = 0; i < 16; i++) { x.fillStyle = i % 2 ? '#3D8A3A' : '#41933E'; x.fillRect((i * w) / 16, 0, w / 16 + 1, h); }
    x.strokeStyle = '#F2F5F0'; x.lineWidth = 6;
    x.strokeRect(40, 40, w - 80, h - 80); x.beginPath(); x.moveTo(w / 2, 40); x.lineTo(w / 2, h - 40); x.stroke();
    x.beginPath(); x.arc(w / 2, h / 2, 74, 0, Math.PI * 2); x.stroke();
    x.strokeRect(40, h / 2 - 150, 150, 300); x.strokeRect(w - 190, h / 2 - 150, 150, 300);
    x.strokeRect(40, h / 2 - 66, 56, 132); x.strokeRect(w - 96, h / 2 - 66, 56, 132);
  }] },
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
/** The cloud deck under the aircraft: soft cumulus on a transparent sheet, drawn once, tiled by the deck's 4 km. */
export const CLOUD_PAINT: Record<string, Paint> = {
  /** Four cumulus, 2 by 2: a cluster of soft lobes, the tops lit and the undersides shaded blue-grey, on clear alpha. Billboarded by the runtime. */
  cloudPuffs: { w: 1024, h: 1024, frames: [(x, w, h) => {
    x.clearRect(0, 0, w, h);
    let seed = 29;
    const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    const cell = w / 2;
    const lobe = (px: number, py: number, pr: number, a = 1) => {
      const g = x.createRadialGradient(px, py, 0, px, py, pr);
      g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(0.55, `rgba(255,255,255,${a * 0.9})`); g.addColorStop(0.82, `rgba(255,255,255,${a * 0.4})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.beginPath(); x.arc(px, py, pr, 0, Math.PI * 2); x.fill();
    };
    for (let k = 0; k < 4; k++) {
      const ox = (k % 2) * cell, oy = Math.floor(k / 2) * cell;
      const cx = ox + cell / 2, base = oy + cell * 0.7, half = cell * 0.5 - 6; // everything stays inside the cell: a lobe cut by its edge would draw a line across the sky
      const width = cell * (0.36 + rnd() * 0.06);
      // the body: a wide row of big lobes along a flat base, each pulled a little up or down
      const n = 7 + Math.floor(rnd() * 4);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n, px = cx + (t - 0.5) * 2 * width;
        const pr = Math.min(cell * (0.1 + rnd() * 0.05) + Math.sin(t * Math.PI) * cell * 0.04, half - Math.abs(px - cx));
        lobe(px, base - pr * (0.65 + rnd() * 0.2), pr);
      }
      // the crown: fewer, smaller bumps riding on the body, off centre, so the top is lumpy not domed
      const m = 4 + Math.floor(rnd() * 4);
      for (let i = 0; i < m; i++) {
        const px = cx + (rnd() - 0.5) * width * 1.5, pr = Math.min(cell * (0.06 + rnd() * 0.07), half - Math.abs(px - cx));
        const bump = Math.sin(((px - cx) / width + 1) * Math.PI * 0.5) ** 0.6;
        lobe(px, base - cell * (0.16 + rnd() * 0.14) * bump - pr * 0.3, pr, 0.95);
      }
      // a few faint wisps off the ends
      for (let i = 0; i < 3; i++) { const side = rnd() < 0.5 ? -1 : 1, px = cx + side * width * (0.9 + rnd() * 0.2); lobe(px, base - cell * (0.03 + rnd() * 0.05), Math.min(cell * 0.05, half - Math.abs(px - cx)), 0.45); }
      // shading: the crown lit, the base blue-grey
      x.save(); x.beginPath(); x.rect(ox, oy, cell, cell); x.clip();
      x.globalCompositeOperation = 'source-atop';
      const shade = x.createLinearGradient(0, oy + cell * 0.25, 0, base + cell * 0.04);
      shade.addColorStop(0, 'rgba(255,255,255,0)'); shade.addColorStop(0.5, 'rgba(196,208,220,0.22)'); shade.addColorStop(1, 'rgba(146,164,186,0.6)');
      x.fillStyle = shade; x.fillRect(ox, oy, cell, cell);
      x.globalCompositeOperation = 'source-over';
      x.restore();
    }
  }] },
};

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
export const BEAN_ORANGE = '#F26722';
/**
 * Bean's mark (the cloche with the bolt) from the logo image, `size` tall at (cx, cy); the wordmark too when `word` is set.
 * The logo file is orange on clear: it goes on light paper. Before the image has loaded, an orange ring stands in.
 */
export function beanLogo(x: Ctx, logo: HTMLImageElement | null, cx: number, cy: number, size: number, word = false): void {
  if (!logo) { x.strokeStyle = BEAN_ORANGE; x.lineWidth = size * 0.08; x.beginPath(); x.arc(cx, cy, size * 0.4, 0, Math.PI * 2); x.stroke(); return; }
  // the mark fills x 68..948 of 2228, the wordmark 950..2138; the whole is 1024 tall
  const sx = word ? 68 : 68, sw = word ? 2070 : 880, sy = 88, sh = 848;
  const scale = size / sh;
  x.drawImage(logo, sx, sy, sw, sh, cx - (sw * scale) / 2, cy - size / 2, sw * scale, size);
}

/** Sydney, 2024: the hacker house where Bean was built, and the harbour out of its window. The logo is drawn from `images.bean` once it has loaded. */
export const beanPaint = (images: Images): Record<string, Paint> => ({
  /** The harbour out of the west window: the bridge's arch, the city behind, a ferry crossing; the Opera House itself is the model in front. Unlit, daylight. */
  sydney: { w: 2048, h: 768, frames: [(x, w, h) => { // 8:3, laid over a 320 by 120 m quad
    const sky = x.createLinearGradient(0, 0, 0, h * 0.62); sky.addColorStop(0, '#6BA3DA'); sky.addColorStop(0.35, '#7FB0E0'); sky.addColorStop(1, '#C9DFF0'); // the top is the set's fog colour
    x.fillStyle = sky; x.fillRect(0, 0, w, h);
    // a few high clouds
    for (const [cx, cy, cw] of [[300, 150, 220], [900, 110, 300], [1500, 170, 260], [1900, 90, 180]]) {
      for (let i = 0; i < 5; i++) { const g = x.createRadialGradient(cx + (i - 2) * cw * 0.18, cy + (i % 2) * 10, 0, cx + (i - 2) * cw * 0.18, cy, cw * 0.16); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx + (i - 2) * cw * 0.18, cy, cw * 0.16, 0, Math.PI * 2); x.fill(); }
    }
    // the far shore and the city: towers behind the Quay
    x.fillStyle = '#8FA3B3';
    for (let i = 0; i < 26; i++) { const bw = 40 + ((i * 37) % 60), bh = 60 + ((i * 53) % 170); x.fillRect(1180 + i * 34, h * 0.62 - bh, bw, bh); }
    x.fillStyle = '#A9B9C6'; x.fillRect(0, h * 0.6, w, 6); x.fillStyle = '#6F8A6A'; x.fillRect(0, h * 0.58, 700, h * 0.04); // the north shore, wooded
    // the water
    const sea = x.createLinearGradient(0, h * 0.62, 0, h); sea.addColorStop(0, '#5F93B8'); sea.addColorStop(1, '#2F6489');
    x.fillStyle = sea; x.fillRect(0, h * 0.62, w, h * 0.38);
    x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 2;
    for (let i = 0; i < 40; i++) { const y = h * 0.64 + i * 7 + (i % 3) * 2; x.beginPath(); x.moveTo((i * 131) % w, y); x.lineTo(((i * 131) % w) + 60 + (i % 5) * 30, y); x.stroke(); }
    // the Harbour Bridge: two pylons, the arch, the deck, hangers
    const bx0 = 260, bx1 = 1180, deck = h * 0.5, top = h * 0.14;
    x.fillStyle = '#7B7469';
    for (const px of [bx0 - 46, bx1 + 6]) { x.fillRect(px, deck - 120, 40, 120 + h * 0.13); x.fillRect(px - 6, deck - 126, 52, 10); }
    x.strokeStyle = '#4E525A'; x.lineWidth = 16; x.beginPath(); x.moveTo(bx0, deck + 8); x.quadraticCurveTo((bx0 + bx1) / 2, top - 120, bx1, deck + 8); x.stroke();
    x.lineWidth = 8; x.beginPath(); x.moveTo(bx0, deck + 40); x.quadraticCurveTo((bx0 + bx1) / 2, top + 20, bx1, deck + 40); x.stroke();
    x.lineWidth = 3; x.strokeStyle = '#3F434A';
    for (let i = 1; i < 24; i++) { const t = i / 24, px = bx0 + (bx1 - bx0) * t, ay = (1 - t) * (1 - t) * (deck + 8) + 2 * (1 - t) * t * (top - 120) + t * t * (deck + 8); x.beginPath(); x.moveTo(px, ay); x.lineTo(px, deck); x.stroke(); }
    x.fillStyle = '#3F434A'; x.fillRect(bx0 - 46, deck - 4, bx1 - bx0 + 92, 14); x.fillRect(0, deck + 4, bx0, 8); x.fillRect(bx1, deck + 4, 200, 8);
    // a ferry crossing, green and cream
    x.fillStyle = '#F2EBD8'; x.fillRect(1500, h * 0.7, 120, 22); x.fillStyle = '#2E6B4F'; x.fillRect(1492, h * 0.7 + 22, 136, 14); x.fillStyle = '#F2EBD8'; x.fillRect(1520, h * 0.7 - 16, 70, 16);
    x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(1440, h * 0.7 + 38, 200, 4);
  }] },
  /** The whiteboard on the north wall: how Bean works, and the week the launch was planned on. */
  whiteboardBean: { w: 1024, h: 640, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#B8BFC4'; x.fillRect(0, h - 26, w, 26);
    const marker = (c: string, size = 28) => { x.strokeStyle = c; x.fillStyle = c; x.lineWidth = 4; x.font = `600 ${size}px "Comic Sans MS", "Chalkboard SE", cursive`; };
    beanLogo(x, images.bean, 150, 60, 74, true); marker('#1B4FBF', 30); x.fillText('what is in your fridge?', 290, 74);
    // the flow, left to right
    const boxes: Array<[number, string, string]> = [[60, 'pantry', 'photo + list'], [290, 'recipes', '28.6k, adapt live'], [520, 'the week', 'one click'], [750, 'shopping', 'shared list']];
    for (const [bx, t, sub] of boxes) { marker('#1B4FBF', 26); x.strokeRect(bx, 130, 200, 96); x.fillText(t, bx + 18, 168); marker('#5B6670', 20); x.fillText(sub, bx + 18, 204); }
    marker('#1B4FBF'); for (const bx of [260, 490, 720]) { x.beginPath(); x.moveTo(bx, 178); x.lineTo(bx + 30, 178); x.lineTo(bx + 22, 170); x.moveTo(bx + 30, 178); x.lineTo(bx + 22, 186); x.stroke(); }
    // the checklist
    marker('#C0392B', 30); x.fillText('launch week', 60, 290);
    const items: Array<[string, boolean]> = [['recipe adapt: streaming', true], ['pantry photo -> items', true], ['family plan sharing', true], ['PH assets + video', true], ['waitlist emails (550)', false], ['kid filter QA', false]];
    items.forEach(([t, done], i) => { const y = 330 + i * 44; marker('#1B4FBF', 24); x.strokeRect(70, y - 22, 26, 26); if (done) { x.beginPath(); x.moveTo(74, y - 8); x.lineTo(84, y); x.lineTo(98, y - 22); x.stroke(); } x.fillText(t, 112, y); });
    // the numbers, right
    marker('#2E7D32', 30); x.fillText('700+ parents cooking with it', 520, 300); x.fillText('250 interviews', 520, 344); x.fillText('#4 Product of the Day', 520, 388);
    marker('#C0392B', 26); x.fillText('ship. then sleep.', 520, 470);
    x.strokeStyle = '#C0392B'; x.lineWidth = 3; x.beginPath(); x.moveTo(516, 480); x.lineTo(760, 482); x.stroke();
  }] },
  /** The design laptop: three phone frames of the app in a design tool. */
  screenBeanApp: { w: 768, h: 480, frames: [(x, w, h) => {
    x.fillStyle = '#1E1E1E'; x.fillRect(0, 0, w, h); x.fillStyle = '#2C2C2C'; x.fillRect(0, 0, w, 36); x.fillRect(0, 36, 150, h);
    x.fillStyle = '#C8C8C8'; x.font = '500 15px Inter, system-ui, sans-serif'; x.fillText('bean-app / mobile / v0.9', 16, 24);
    ['Pages', '  Onboarding', '  Pantry', '  Recipes', '  Week', '  Shopping', 'Components'].forEach((t, i) => { x.fillStyle = i === 2 ? '#FFFFFF' : '#9A9A9A'; x.font = '13px Inter, system-ui, sans-serif'; x.fillText(t, 14, 66 + i * 24); });
    const phone = (px: number, title: string, rows: string[], accent: string) => {
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(px, 62, 170, 360, 18); x.fill();
      x.fillStyle = accent; x.beginPath(); x.roundRect(px, 62, 170, 70, [18, 18, 0, 0]); x.fill();
      x.fillStyle = '#FFFFFF'; x.font = '700 17px Inter, system-ui, sans-serif'; x.fillText(title, px + 14, 104);
      rows.forEach((r, i) => { x.fillStyle = '#F2F4F1'; x.beginPath(); x.roundRect(px + 12, 146 + i * 44, 146, 34, 8); x.fill(); x.fillStyle = '#2B2B2B'; x.font = '12px Inter, system-ui, sans-serif'; x.fillText(r, px + 22, 168 + i * 44); });
      x.fillStyle = accent; x.beginPath(); x.roundRect(px + 12, 372, 146, 34, 17); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '600 13px Inter, system-ui, sans-serif'; x.fillText('Plan my week', px + 44, 394);
    };
    phone(180, 'Pantry', ['eggs · 6', 'spinach', 'rice · 1 kg', 'chicken thighs', 'lemons · 3'], BEAN_ORANGE);
    phone(375, 'This week', ['Mon  lemon chicken', 'Tue  fried rice', 'Wed  shakshuka', 'Thu  leftovers', 'Fri  pizza night'], '#E07A3F');
    phone(570, 'Shopping', ['tomatoes · 4', 'feta', 'pizza dough', 'garlic', 'yoghurt'], '#2E3A4F');
  }] },
  /** The code laptop: the recipe adapt endpoint, streaming. */
  screenBeanCode: { w: 768, h: 480, frames: [(x, w, h) => {
    x.fillStyle = '#1E1F26'; x.fillRect(0, 0, w, h); x.fillStyle = '#2A2C36'; x.fillRect(0, 0, w, 30);
    x.fillStyle = '#B8BCC8'; x.font = '13px ui-monospace, Menlo, monospace'; x.fillText('bean-api / src / recipes / adapt.ts', 14, 20);
    const lines: Array<[string, string]> = [
      ['#C678DD', 'export async function adaptRecipe(recipe: Recipe, ask: string, pantry: Pantry) {'],
      ['#ABB2BF', '  const prompt = adaptPrompt({ recipe, ask, pantry, kids: recipe.kidFriendly });'],
      ['#ABB2BF', '  const stream = await llm.stream({ model: MODEL, prompt, json: RecipeSchema });'],
      ['#7F848E', '  // the app rewrites the steps as tokens arrive: "no dairy" is live in under a second'],
      ['#C678DD', '  for await (const patch of stream) {'],
      ['#ABB2BF', '    yield applyPatch(recipe, patch);'],
      ['#ABB2BF', '  }'],
      ['#ABB2BF', '  await pantry.reserve(recipe.ingredients);'],
      ['#ABB2BF', '  await shoppingList.add(missing(recipe.ingredients, pantry));'],
      ['#ABB2BF', '}'],
      ['#7F848E', ''],
      ['#98C379', "// tests: 28,612 recipes, 0 schema failures, p95 first token 380 ms"],
    ];
    x.font = '14px ui-monospace, Menlo, monospace';
    lines.forEach(([c, t], i) => { x.fillStyle = '#5C6370'; x.fillText(String(i + 41).padStart(3), 12, 60 + i * 26); x.fillStyle = c; x.fillText(t, 52, 60 + i * 26); });
    x.fillStyle = '#12141A'; x.fillRect(0, h - 90, w, 90); x.fillStyle = '#98C379'; x.font = '13px ui-monospace, Menlo, monospace';
    x.fillText('$ bun test  ✓ 214 passed   $ fly deploy bean-api --strategy rolling   ✓ v0.9.4 live in syd', 14, h - 58);
    x.fillStyle = '#E5C07B'; x.fillText('12:48  POST /recipes/adapt  200  412ms  stream  "swap chicken for tofu"', 14, h - 30);
  }] },
  /** The monitor: the Product Hunt page on launch day. */
  screenProductHunt: { w: 960, h: 600, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFF4EF'; x.fillRect(0, 0, w, 64);
    x.fillStyle = '#DA552F'; x.beginPath(); x.arc(40, 32, 18, 0, Math.PI * 2); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '700 22px Inter, system-ui, sans-serif'; x.fillText('P', 32, 40);
    x.fillStyle = '#21293C'; x.font = '600 18px Inter, system-ui, sans-serif'; x.fillText('Product Hunt', 70, 39);
    beanLogo(x, images.bean, 74, 128, 64); x.fillStyle = '#21293C'; x.font = '700 30px Inter, system-ui, sans-serif'; x.fillText('Bean Recipe Adapt', 130, 120);
    x.fillStyle = '#4B5563'; x.font = '18px Inter, system-ui, sans-serif'; x.fillText('Tell Bean what to change and it updates the recipe in realtime', 130, 150);
    x.fillStyle = '#DA552F'; x.beginPath(); x.roundRect(w - 200, 96, 150, 60, 8); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '700 22px Inter, system-ui, sans-serif'; x.fillText('▲ 412', w - 165, 134);
    x.fillStyle = '#F3F4F6'; x.beginPath(); x.roundRect(130, 176, 300, 30, 15); x.fill(); x.fillStyle = '#21293C'; x.font = '600 15px Inter, system-ui, sans-serif'; x.fillText('#4 Product of the Day', 152, 197);
    x.fillStyle = '#E5E7EB'; x.fillRect(60, 230, w - 120, 2);
    const cards = ['"no dairy"', '"make it for 6"', '"20 minutes, please"'];
    cards.forEach((t, i) => { const cx = 60 + i * 290; x.fillStyle = '#F9FAFB'; x.beginPath(); x.roundRect(cx, 254, 260, 170, 12); x.fill(); x.fillStyle = BEAN_ORANGE; x.fillRect(cx + 16, 274, 6, 40); x.fillStyle = '#21293C'; x.font = '600 20px Inter, system-ui, sans-serif'; x.fillText(t, cx + 34, 302); x.fillStyle = '#6B7280'; x.font = '14px Inter, system-ui, sans-serif'; x.fillText('recipe rewritten as you type', cx + 34, 332); x.fillText('pantry checked, list updated', cx + 34, 356); });
    x.fillStyle = '#6B7280'; x.font = '15px Inter, system-ui, sans-serif'; x.fillText('Made by Vansh Sood and Pankrit Jindal  ·  Halifax and Sydney  ·  beantheapp.com', 60, 470);
    x.fillText('187 comments  ·  Cooking, Productivity, Artificial Intelligence', 60, 500);
  }] },
  /** The phone on the table: the app's home. */
  screenBeanPhone: { w: 360, h: 720, frames: [(x, w, h) => {
    x.fillStyle = '#FBF8F4'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, 150); beanLogo(x, images.bean, 150, 70, 60, true);
    x.fillStyle = '#7A8290'; x.font = '500 15px Inter, system-ui, sans-serif'; x.fillText('Your Kitchen Assistant', 96, 122);
    x.fillStyle = '#21293C'; x.font = '600 20px Inter, system-ui, sans-serif'; x.fillText('Tonight, from your pantry', 24, 200);
    ['Lemon chicken with rice  ·  25 min', 'Spinach shakshuka  ·  20 min', 'Egg fried rice  ·  15 min'].forEach((t, i) => { x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(20, 222 + i * 92, w - 40, 76, 14); x.fill(); x.fillStyle = '#FDE7DA'; x.beginPath(); x.roundRect(32, 234 + i * 92, 52, 52, 10); x.fill(); x.fillStyle = '#21293C'; x.font = '500 15px Inter, system-ui, sans-serif'; x.fillText(t, 98, 266 + i * 92); });
    x.fillStyle = BEAN_ORANGE; x.beginPath(); x.roundRect(24, 540, w - 48, 56, 28); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '600 18px Inter, system-ui, sans-serif'; x.fillText('Plan my week', 118, 575);
    x.fillStyle = '#9CA3AF'; x.font = '13px Inter, system-ui, sans-serif'; x.fillText('pantry  ·  recipes  ·  week  ·  shopping', 60, 680);
  }] },
  /** The sign above the window: the mark and the wordmark on the wall's own colour. */
  beanSign: { w: 1440, h: 300, frames: [(x, w, h) => {
    x.fillStyle = '#F1ECE3'; x.fillRect(0, 0, w, h);
    beanLogo(x, images.bean, w / 2, h / 2, 250, true);
  }] },
  /** A poster by the door: the mark and the line. */
  beanPoster: { w: 600, h: 850, frames: [(x, w, h) => {
    x.fillStyle = '#F4F1E8'; x.fillRect(0, 0, w, h);
    beanLogo(x, images.bean, w / 2, 300, 260); beanLogo(x, images.bean, w / 2, 560, 130, true);
    x.textAlign = 'center';
    x.fillStyle = '#4B5563'; x.font = '500 30px Inter, system-ui, sans-serif'; x.fillText('The last meal planner', w / 2, 660); x.fillText("you'll ever need", w / 2, 700);
    x.fillStyle = '#9CA3AF'; x.font = '22px Inter, system-ui, sans-serif'; x.fillText('beantheapp.com', w / 2, 790); x.textAlign = 'left';
  }] },
});

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
/**
 * The ShiftKey Labs mark and wordmark: a ribbon folded into an S, two blue folds and a cyan band across the middle,
 * parted by a hairline in the slide's background colour; "SHIFTKEY" heavy and "LABS" light beside it.
 * `size` is the mark's height; the wordmark scales with it.
 */
export function shiftkeyLabs(x: Ctx, left: number, top: number, size: number, ground: string): void {
  const s = size / 380, X = (u: number) => left + u * s, Y = (v: number) => top + v * s;
  const poly = (pts: [number, number][], fill: string | CanvasGradient) => { x.beginPath(); pts.forEach(([u, v], i) => (i ? x.lineTo(X(u), Y(v)) : x.moveTo(X(u), Y(v)))); x.closePath(); x.fillStyle = fill; x.fill(); };
  const grad = (u0: number, v0: number, u1: number, v1: number, c0: string, c1: string) => { const g = x.createLinearGradient(X(u0), Y(v0), X(u1), Y(v1)); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  poly([[160, 0], [160, 140], [0, 90]], grad(0, 90, 160, 0, '#1C3D8C', '#2C74CC')); // the top fold, tapering to the left
  poly([[75, 240], [75, 380], [235, 290]], grad(235, 290, 75, 380, '#2C74CC', '#1CA9E2')); // the bottom fold
  x.lineJoin = 'miter'; x.strokeStyle = ground; x.lineWidth = 7 * s;
  x.beginPath(); x.moveTo(X(0), Y(90)); x.lineTo(X(235), Y(175)); x.lineTo(X(235), Y(280)); x.lineTo(X(0), Y(185)); x.closePath(); x.stroke(); // the hairline parting the band from the folds
  poly([[0, 90], [235, 175], [235, 280], [0, 185]], grad(0, 137, 235, 227, '#1FB4E6', '#3FD3F4')); // the band
  const tx = X(235) + size * 0.22;
  x.fillStyle = '#F7F8FA'; x.font = `800 ${Math.round(size * 0.4)}px Inter, system-ui, sans-serif`; x.fillText('SHIFTKEY', tx, Y(150));
  x.fillStyle = '#B9C4CF'; x.font = `300 ${Math.round(size * 0.33)}px Inter, system-ui, sans-serif`; x.fillText('LABS', tx + size * 0.44, Y(330));
}

export const SCREEN_PAINT: Record<string, Paint> = {
  flightSign: { w: 920, h: 256, frames: [(x, w, h) => {
    x.fillStyle = '#142C3C'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#AAC1CF'; x.font = '24px Inter, sans-serif'; x.fillText('2022  /  A NEW CHAPTER', 38, 53);
    x.fillStyle = '#FFFFFF'; x.font = '600 65px Inter, sans-serif'; x.fillText('DELHI  →  HALIFAX', 38, 139);
    x.fillStyle = '#AAC1CF'; x.font = '26px Inter, sans-serif'; x.fillText('CANADA                         WELCOME ABOARD', 38, 206);
  }] },
  halifaxSign: { w: 900, h: 330, frames: [(x, w, h) => {
    x.fillStyle = '#182C35'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#DB5148'; x.fillRect(34, 37, 8, 250);
    x.fillStyle = '#A5C0CD'; x.font = '26px Inter, sans-serif'; x.fillText('CANADA  /  NOVA SCOTIA', 68, 72);
    x.fillStyle = '#FFFFFF'; x.font = '600 93px Inter, sans-serif'; x.fillText('HALIFAX', 65, 183);
    x.fillStyle = '#D3DFE5'; x.font = '32px Inter, sans-serif'; x.fillText('Arrivals  →  Dalhousie University', 68, 268);
  }] },
  dalhousieSign: { w: 1400, h: 155, frames: [(x, w, h) => {
    x.fillStyle = '#252722'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#EAC54C'; x.fillRect(0, 0, 10, h);
    x.font = '600 56px Georgia, serif'; x.fillText('Dalhousie University', 40, 75);
    x.fillStyle = '#E7E7DC'; x.font = '23px Inter, sans-serif'; x.fillText('FACULTY OF COMPUTER SCIENCE  ·  HALIFAX, NOVA SCOTIA', 44, 124);
  }] },
  lectureBoard: { w: 1480, h: 720, frames: [(x, w, h) => {
    x.fillStyle = '#18352E'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#F0EEE0'; x.font = '45px Georgia, serif'; x.fillText('Data structures & algorithms', 60, 86);
    x.strokeStyle = '#82968A'; x.lineWidth = 2; x.beginPath(); x.moveTo(60, 112); x.lineTo(w - 60, 112); x.stroke();
    x.font = '28px ui-monospace, monospace';
    ['Binary search', '', 'lo = 0; hi = n - 1', 'while lo <= hi:', '  mid = (lo + hi) // 2', '  if a[mid] == target: return mid', '  if a[mid] < target: lo = mid + 1', '  else: hi = mid - 1'].forEach((s, i) => x.fillText(s, 60, 176 + i * 46));
    const nodes = [[1110, 232, '32'], [965, 345, '16'], [1255, 345, '48'], [905, 458, '8'], [1025, 458, '24'], [1195, 458, '40'], [1315, 458, '56']] as const;
    x.strokeStyle = '#D8DCCC'; x.lineWidth = 3;
    for (const [a, b] of [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6]]) { x.beginPath(); x.moveTo(nodes[a][0], nodes[a][1]); x.lineTo(nodes[b][0], nodes[b][1]); x.stroke(); }
    for (const [cx, cy, label] of nodes) { x.fillStyle = '#18352E'; x.beginPath(); x.arc(cx, cy, 31, 0, 2 * Math.PI); x.fill(); x.stroke(); x.fillStyle = '#EFEBDC'; x.fillText(label, cx - 17, cy + 10); }
    x.fillStyle = '#E9D38A'; x.font = '33px Georgia, serif'; x.fillText('O(log n) time   ·   O(1) space', 65, 644);
    x.font = '25px Georgia, serif'; x.fillText('Halve the search space.', 920, 570);
  }] },
  studyNotes: { w: 900, h: 620, frames: [(x, w, h) => {
    x.fillStyle = '#F2ECDD'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#C4CFCD'; x.lineWidth = 1;
    for (let y = 95; y < h; y += 42) { x.beginPath(); x.moveTo(35, y); x.lineTo(w - 35, y); x.stroke(); }
    x.fillStyle = '#30434D'; x.font = '32px Georgia, serif';
    ['Computer Science', 'Binary search — sorted arrays', '', '1. Find the middle element', '2. Compare with target', '3. Keep the matching half', '', 'n → n/2 → n/4 → … → 1', 'Number of steps: log₂(n)'].forEach((s, i) => x.fillText(s, 55, 70 + i * 54));
  }] },
  /** The moving map on the seat backs: the route from Delhi over Europe and the Atlantic into Halifax, the aircraft on the last leg. */
  screenMap: { w: 880, h: 540, frames: [(x, w, h) => {
    x.fillStyle = '#0B1A2B'; x.fillRect(0, 0, w, h);
    // an ocean, a few land masses roughed in: India, the Gulf, Europe, Greenland, the eastern seaboard
    x.fillStyle = '#1D3A52';
    const land = (pts: number[][]) => { x.beginPath(); pts.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill(); };
    land([[760, 300], [840, 330], [880, 420], [880, 540], [700, 540], [690, 420], [730, 340]]); // India
    land([[600, 250], [700, 290], [720, 380], [640, 420], [560, 380], [540, 300]]); // the Gulf and Arabia
    land([[430, 120], [620, 90], [700, 200], [660, 280], [520, 300], [430, 250], [400, 180]]); // Europe
    land([[180, 30], [300, 20], [330, 120], [260, 190], [180, 150]]); // Greenland
    land([[0, 160], [150, 200], [200, 300], [160, 420], [80, 540], [0, 540]]); // the seaboard
    x.strokeStyle = '#F6C453'; x.lineWidth = 4; x.setLineDash([12, 10]);
    x.beginPath(); x.moveTo(790, 400); x.quadraticCurveTo(560, 120, 172, 268); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#F6C453'; x.beginPath(); x.arc(790, 400, 9, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(172, 268, 9, 0, Math.PI * 2); x.fill();
    x.save(); x.translate(212, 245); x.rotate(-2.55); x.beginPath(); x.moveTo(18, 0); x.lineTo(-10, 8); x.lineTo(-6, 0); x.lineTo(-10, -8); x.closePath(); x.fill(); x.restore(); // the aircraft
    x.font = '600 22px Inter, system-ui, sans-serif'; x.fillStyle = '#E8EEF4';
    x.fillText('DEL  Delhi', 700, 470); x.fillText('YHZ  Halifax', 30, 320);
    x.fillStyle = '#0F2233AA'; x.fillRect(0, h - 74, w, 74);
    x.fillStyle = '#E8EEF4'; x.font = '600 24px Inter, system-ui, sans-serif';
    x.fillText('Time to destination   0:14', 26, h - 44); x.fillText('Altitude   1,250 ft', 460, h - 44);
    x.font = '20px Inter, system-ui, sans-serif'; x.fillStyle = '#A9B8C6';
    x.fillText('Ground speed 210 kt  ·  Outside 9 °C  ·  Local time 15:42', 26, h - 14);
  }] },
  /** The Generative AI lecture: the title slide on the projection screen and the presenter's laptop, with the ShiftKey Labs mark. */
  screenSlide: { w: 1408, h: 800, frames: [(x, w, h) => {
    x.fillStyle = '#101418'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#22C4EE'; x.fillRect(0, 0, 14, h);
    x.fillStyle = '#F7F8FA'; x.font = '700 112px Inter, system-ui, sans-serif'; x.fillText('Generative AI', 108, 356);
    x.fillStyle = '#B9C4CF'; x.font = '500 44px Inter, system-ui, sans-serif'; x.fillText('Taught by Vansh Sood', 112, 434);
    shiftkeyLabs(x, 112, 572, 148, '#101418');
  }] },
  studyScreen: { w: 960, h: 600, frames: [(x, w, h) => {
    x.fillStyle = '#14212B'; x.fillRect(0, 0, w, h); x.fillStyle = '#263A48'; x.fillRect(0, 0, w, 57);
    x.fillStyle = '#DBE6EA'; x.font = '24px ui-monospace, monospace'; x.fillText('binary_search.py  ·  Computer Science', 25, 38);
    ['def binary_search(values, target):', '    lo, hi = 0, len(values) - 1', '    while lo <= hi:', '        mid = (lo + hi) // 2', '        if values[mid] == target:', '            return mid', '        if values[mid] < target:', '            lo = mid + 1', '        else:', '            hi = mid - 1', '    return -1', '', '>>> binary_search([8, 16, 24, 32], 24)', '2'].forEach((s, i) => { x.fillStyle = i > 11 ? '#A1D5A2' : '#D0DDEA'; x.fillText(s, 35, 99 + i * 35); });
  }] },
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
  /** 2020: the Webcube board, five columns of cards for a team of 25 in six countries. */
  screenBoard: {
    w: 768, h: 432,
    frames: [(x, w, h) => {
      x.fillStyle = '#0F1419'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#161C23'; x.fillRect(0, 0, w, 44);
      x.fillStyle = '#F2F4F7'; x.font = '700 16px Inter, system-ui, sans-serif'; x.fillText('Webcube', 16, 28);
      x.fillStyle = '#8A93A3'; x.font = '12px Inter, system-ui, sans-serif'; x.fillText('Sprint 31 · 45 clients · 25 people · IST PST GMT', 96, 28);
      const cols = ['Backlog', 'This week', 'In progress', 'Review', 'Shipped'], counts = [6, 5, 4, 3, 5];
      const cw = (w - 16 * 6) / 5;
      cols.forEach((c, i) => {
        const cx = 16 + i * (cw + 16);
        x.fillStyle = '#8A93A3'; x.font = '600 11px Inter, system-ui, sans-serif'; x.fillText(c.toUpperCase(), cx, 68);
        for (let r = 0; r < counts[i]; r++) {
          const y = 78 + r * 64;
          x.fillStyle = '#1B222B'; x.fillRect(cx, y, cw, 54);
          x.fillStyle = ['#4F8CF7', '#F2A33A', '#5BC27A', '#C864E0', '#E05A5A'][(i + r) % 5]; x.fillRect(cx, y, 4, 54);
          x.fillStyle = '#D6DAE6'; x.font = '12px Inter, system-ui, sans-serif';
          x.fillText(['Stripe webhooks', 'Onboarding flow', 'Vendor portal', 'Inventory sync', 'Landing page v3', 'Admin roles', 'Push notifications', 'Search indexing', 'Invoice PDFs', 'Chat widget'][(i * 3 + r) % 10], cx + 12, y + 20);
          x.fillStyle = '#5E6675'; x.font = '11px Inter, system-ui, sans-serif';
          x.fillText(['Design', 'Development', 'QA', 'Client review', 'Delivery', 'Support'][(i + r * 2) % 6], cx + 12, y + 40);
          x.fillStyle = ['#4F8CF7', '#F2A33A', '#5BC27A'][(i + r) % 3]; x.beginPath(); x.arc(cx + cw - 16, y + 36, 7, 0, Math.PI * 2); x.fill();
        }
      });
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
