// Everything painted onto a canvas and used as a texture: the TV and the Notepad screen, the view
// out of the window, the Jobs poster and the team photo, the banner, the whiteboard, the sign.
// Canvas y runs down, texture v runs up, so "top" in the world is y = 0 here.
export type Ctx = CanvasRenderingContext2D;
export type Painter = (x: Ctx, w: number, h: number) => void;
export interface Paint { w: number; h: number; frames: Painter[] }
/** Apple's "Think different" text, 1997, as printed on the poster: the first sentence is the title, the rest the body. */
const JOBS_QUOTE = "The misfits. The rebels. The troublemakers. The round pegs in the square holes. The ones who see things differently. They're not fond of rules. And they have no respect for the status quo. You can quote them, disagree with them, glorify or vilify them. About the only thing you can't do is ignore them. Because they change things. They push the human race forward. And while some may see them as the crazy ones, we see genius. Because the people who are crazy enough to think they can change the world, are the ones who do.";

export interface Images { jobs: HTMLImageElement | null; xbox: HTMLImageElement | null; clan: HTMLImageElement | null; dalhousie: HTMLImageElement | null; bean: HTMLImageElement | null; websummit: HTMLImageElement | null; elevate: HTMLImageElement | null; volta: HTMLImageElement | null; investns: HTMLImageElement | null; producthunt: HTMLImageElement | null }

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
        // the haze of a Delhi afternoon, far behind the neighbour's house and the neem: sky to a warm horizon, nothing drawn on it
        const sky = x.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#A9BCCF'); sky.addColorStop(0.45, '#D5D4C8'); sky.addColorStop(0.7, '#E8DCC6'); sky.addColorStop(1, '#D8CDB9');
        x.fillStyle = sky; x.fillRect(0, 0, w, h);
        const glow = x.createRadialGradient(w * 0.35, h * 0.62, 10, w * 0.35, h * 0.62, w * 0.5); glow.addColorStop(0, 'rgba(255,240,210,0.5)'); glow.addColorStop(1, 'rgba(255,240,210,0)');
        x.fillStyle = glow; x.fillRect(0, 0, w, h);
      }, (x, w, h) => {
        x.fillStyle = '#CFE7F5'; x.fillRect(0, 0, w, h);
        x.fillStyle = '#E8F3FA'; x.fillRect(0, 0, w, h * 0.3);
        x.fillStyle = '#9FB7A0';
        for (const [cx, r] of [[60, 70], [170, 90], [300, 60], [420, 85]] as const) { x.beginPath(); x.arc(cx, h * 0.78, r, 0, Math.PI * 2); x.fill(); }
        x.fillStyle = '#B9C4C9'; x.fillRect(230, h * 0.55, 90, h * 0.45); x.fillRect(360, h * 0.62, 60, h * 0.38);
        x.fillStyle = '#7F9A80'; x.fillRect(0, h * 0.9, w, h * 0.1);
      }],
    },
    // the Jobs print in the bedroom's frame, portrait: the photograph in black and white over the top, fading to black, the
    // whole of Apple's text under it in a serif, "Think different." at the foot. A tribute print, the kind sold after 2011.
    jobsPoster: {
      w: 1000, h: 1480,
      frames: [(x, w, h) => {
        x.fillStyle = '#0B0B0B'; x.fillRect(0, 0, w, h);
        const ph = h * 0.58;
        if (images.jobs) {
          const iw = images.jobs.naturalWidth, ih = images.jobs.naturalHeight, s = Math.max(w / iw, ph / ih);
          x.save(); x.beginPath(); x.rect(0, 0, w, ph); x.clip(); x.filter = 'grayscale(1) contrast(1.05)';
          x.drawImage(images.jobs, (w - iw * s) / 2, (ph - ih * s) / 2 - ih * s * 0.04, iw * s, ih * s); x.restore();
        }
        const fade = x.createLinearGradient(0, ph * 0.6, 0, ph + 2); fade.addColorStop(0, 'rgba(11,11,11,0)'); fade.addColorStop(1, 'rgba(11,11,11,1)');
        x.fillStyle = fade; x.fillRect(0, ph * 0.6, w, ph * 0.4 + 2);
        const serif = 'Georgia, "Iowan Old Style", "Times New Roman", serif', left = 80, width = w - 160; let y = ph + 24;
        x.fillStyle = '#F2F2F2'; x.font = `400 46px ${serif}`; x.fillText("Here's to the crazy ones.", left, y); y += 62;
        x.fillStyle = '#D6D6D6'; x.font = `400 29px ${serif}`;
        let line = '';
        for (const word of JOBS_QUOTE.split(' ')) {
          const t = line ? `${line} ${word}` : word;
          if (x.measureText(t).width > width) { x.fillText(line, left, y); y += 40; line = word; } else line = t;
        }
        if (line) x.fillText(line, left, y);
        x.fillStyle = '#F2F2F2'; x.font = `400 44px ${serif}`; x.fillText('Think different.', left, h - 72);
      }],
    },
    // the poster: the portrait on the left, the quote on the right, four drawing pins; then the Converge Clan team photo
    poster: {
      w: 1600, h: 888,
      frames: [(x, w, h) => {
        x.fillStyle = '#0E0E0E'; x.fillRect(0, 0, w, h);
        // the portrait on the left, black and white
        const px = 44, py = 44, pw = 520, ph = h - 88;
        if (images.jobs) {
          const iw = images.jobs.naturalWidth, ih = images.jobs.naturalHeight, s = Math.max(pw / iw, ph / ih);
          x.save(); x.beginPath(); x.rect(px, py, pw, ph); x.clip(); x.filter = 'grayscale(1)';
          x.drawImage(images.jobs, px + (pw - iw * s) / 2, py + (ph - ih * s) / 2, iw * s, ih * s); x.restore();
        } else { x.fillStyle = '#2B2B2B'; x.fillRect(px, py, pw, ph); }
        x.fillStyle = '#3A3A3A'; x.fillRect(612, 60, 2, h - 120);
        // the whole text, wrapped to the column
        const left = 660, width = w - left - 60; let y = 118;
        x.fillStyle = '#F5F5F5'; x.font = '600 50px Inter, system-ui, sans-serif'; x.fillText("Here's to the crazy ones.", left, y); y += 66;
        x.fillStyle = '#E4E4E4'; x.font = '400 29px Inter, system-ui, sans-serif';
        let line = '';
        for (const word of JOBS_QUOTE.split(' ')) {
          const t = line ? `${line} ${word}` : word;
          if (x.measureText(t).width > width) { x.fillText(line, left, y); y += 40; line = word; } else line = t;
        }
        if (line) x.fillText(line, left, y);
        x.fillStyle = '#F5F5F5'; x.font = '600 44px Inter, system-ui, sans-serif'; x.fillText('Think different.', left, h - 70);
        x.fillStyle = '#F7D44C';
        for (const [qx, qy] of [[22, 22], [w - 22, 22], [22, h - 22], [w - 22, h - 22]] as const) { x.beginPath(); x.arc(qx, qy, 12, 0, Math.PI * 2); x.fill(); }
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
  /** A storey of a downtown tower by day, the night tile's grid: pale glass in a light frame, the slab line between floors. */
  windowsDay: { w: 1024, h: 896, frames: [(x, w, h) => {
    x.fillStyle = '#C6CBD2'; x.fillRect(0, 0, w, h);
    const cols = 24, rows = 20, bw = w / cols, bh = h / rows;
    let seed = 5;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const v = 0.52 + rnd() * 0.18;
      x.fillStyle = `rgb(${Math.round(255 * v * 0.86)}, ${Math.round(255 * v * 0.93)}, ${Math.round(255 * v)})`;
      x.fillRect(c * bw + 4, r * bh + 5, bw - 8, bh - 12);
    }
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
/** The plain face for signs on the tour: no display type, no slogans. */
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";
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

/**
 * The laptop in hand, live: what is on the screen at time t (seconds) in city `page`. Four views cycle every eight
 * seconds: a terminal with tests and a deploy running line by line, the editor with the adapt endpoint being typed,
 * the app's home scrolling through tonight's recipes, and the city's numbers with the day's signups filling in.
 */
export function tourLive(x: Ctx, w: number, h: number, t: number, page: number, logo: HTMLImageElement | null): void {
  const view = Math.floor(t / 8) % 4, u = (t % 8) / 8;
  const mono = "13px ui-monospace, Menlo, Consolas, monospace";
  const cities = ['Vancouver', 'Toronto', 'Montréal', 'Halifax'];
  if (view === 0) { // the terminal
    x.fillStyle = '#101216'; x.fillRect(0, 0, w, h); x.fillStyle = '#1C1F26'; x.fillRect(0, 0, w, 26);
    x.fillStyle = '#9AA3AE'; x.font = mono; x.fillText('bean-api  ·  zsh', 12, 18);
    const lines = ['$ bun test', '  recipes/adapt.test.ts  (12)  ✓', '  pantry/parse.test.ts    (9)   ✓', '  plans/week.test.ts      (7)   ✓', '  shopping/list.test.ts   (6)   ✓', '', '  34 pass, 0 fail  (2.1s)', '$ fly deploy bean-api --strategy rolling', '  ==> building image', '  ==> pushing image to fly', '  ==> deploying  v0.9.5', '  machine 1 of 2: updated ✓', '  machine 2 of 2: updated ✓', '  ✓ live in yyz', '$ curl -s https://api.beanmeals.com/health', '  {"ok":true,"recipes":28612}', '$ █'];
    const n = Math.min(lines.length, Math.floor(u * (lines.length + 2)));
    for (let i = 0; i < n; i++) { const l = lines[i]; x.fillStyle = l.startsWith('$') ? '#E6EDF3' : l.includes('✓') ? '#7EE787' : l.includes('==>') ? '#79C0FF' : '#B7C0CA'; x.fillText(l, 12, 50 + i * 24); }
    if (n === lines.length && Math.floor(t * 2) % 2 === 0) { x.fillStyle = '#E6EDF3'; x.fillRect(24, 40 + (lines.length - 1) * 24, 8, 16); }
  } else if (view === 1) { // the editor, typing
    x.fillStyle = '#1E1F26'; x.fillRect(0, 0, w, h); x.fillStyle = '#2A2C36'; x.fillRect(0, 0, w, 26);
    x.fillStyle = '#B8BCC8'; x.font = mono; x.fillText('bean-api / src / recipes / adapt.ts', 12, 18);
    const code: Array<[string, string]> = [['#C678DD', 'export async function* adaptRecipe(recipe: Recipe, ask: string, pantry: Pantry) {'], ['#ABB2BF', '  const prompt = adaptPrompt({ recipe, ask, pantry, kids: recipe.kidFriendly });'], ['#ABB2BF', '  const stream = await llm.stream({ model: MODEL, prompt, json: RecipeSchema });'], ['#7F848E', '  // the app rewrites the steps as tokens arrive'], ['#C678DD', '  for await (const patch of stream) {'], ['#ABB2BF', '    yield applyPatch(recipe, patch);'], ['#ABB2BF', '  }'], ['#ABB2BF', '  await pantry.reserve(recipe.ingredients);'], ['#ABB2BF', '  await shoppingList.add(missing(recipe.ingredients, pantry));'], ['#ABB2BF', '}'], ['#7F848E', ''], ['#C678DD', 'export function applyPatch(recipe: Recipe, patch: Patch): Recipe {'], ['#ABB2BF', '  return { ...recipe, steps: patch.steps ?? recipe.steps, ingredients: patch.ingredients ?? recipe.ingredients };'], ['#ABB2BF', '}']];
    const total = code.reduce((n, [, l]) => n + l.length + 1, 0), typed = Math.floor(u * total * 1.15);
    let left = typed;
    code.forEach(([c, l], i) => { const k = Math.max(0, Math.min(l.length, left)); left -= l.length + 1; x.fillStyle = '#5C6370'; x.fillText(String(i + 41).padStart(3), 10, 50 + i * 22); x.fillStyle = c; x.fillText(l.slice(0, k), 44, 50 + i * 22); if (k < l.length && k > 0 && Math.floor(t * 2) % 2 === 0) x.fillRect(44 + k * 7.8, 38 + i * 22, 7, 15); });
    x.fillStyle = '#12141A'; x.fillRect(0, h - 26, w, 26); x.fillStyle = '#98C379'; x.fillText('main*  ·  TypeScript  ·  Ln ' + (41 + Math.min(code.length - 1, Math.floor(u * code.length))) + '  ·  saved', 12, h - 9);
  } else if (view === 2) { // the app's home, scrolling
    x.fillStyle = '#FBF8F4'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, 56);
    beanLogo(x, logo, 96, 28, 36, true); x.fillStyle = '#7A8290'; x.font = '13px ' + SANS; x.fillText('bean  ·  ' + cities[page], w - 200, 34);
    x.fillStyle = '#21293C'; x.font = '600 20px ' + SANS; x.fillText('Tonight, from your pantry', 24, 92);
    const rows = ['Lemon chicken with rice  ·  25 min', 'Spinach shakshuka  ·  20 min', 'Egg fried rice  ·  15 min', 'Tofu green curry  ·  30 min', 'Tomato feta pasta  ·  18 min', 'Chickpea bowls  ·  15 min', 'Salmon and greens  ·  22 min'];
    const off = (u * 3) % 1;
    x.save(); x.beginPath(); x.rect(0, 104, w, h - 104); x.clip();
    rows.forEach((r, i) => { const y = 120 + i * 70 - off * 70; x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(24, y, w - 48, 56, 12); x.fill(); x.fillStyle = '#FDE7DA'; x.beginPath(); x.roundRect(36, y + 10, 36, 36, 8); x.fill(); x.fillStyle = '#21293C'; x.font = '500 15px ' + SANS; x.fillText(r, 88, y + 34); });
    x.restore();
    x.fillStyle = BEAN_ORANGE; x.beginPath(); x.roundRect(24, h - 60, w - 48, 44, 22); x.fill(); x.fillStyle = '#FFFFFF'; x.font = '600 16px ' + SANS; x.textAlign = 'center'; x.fillText('Plan my week', w / 2, h - 32); x.textAlign = 'left';
  } else { // the numbers for the city, filling in
    const pages: Array<[string, Array<[string, string]>]> = [['Web Summit, May 2025', [['500', 'conversations'], ['120', 'signups'], ['1', 'investor MOU'], ['700+', 'parents cooking']]], ['Elevate, October 2025', [['8', 'investor calls'], ['3', 'days'], ['2', 'open houses'], ['0', 'shiny meetings']]], ['ALL IN, September 2025', [['2', 'days'], ['100s', 'of people met'], ['4', 'cities in 4 months'], ['1', 'sore throat']]], ['Volta, 2025 to 2026', [['12', 'in Accelerate'], ['$40k', 'over 5 months'], ['~100', 'at Collect.'], ['#4', 'Product Hunt']]]];
    const [when, cells] = pages[page] ?? pages[0];
    x.fillStyle = '#FBF8F4'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, 56);
    beanLogo(x, logo, 96, 28, 36, true); x.fillStyle = '#7A8290'; x.font = '13px ' + SANS; x.textAlign = 'right'; x.fillText(when, w - 24, 34); x.textAlign = 'left';
    x.fillStyle = '#21293C'; x.font = '600 26px ' + SANS; x.fillText(cities[page] ?? '', 24, 100);
    cells.forEach(([n, t2], i) => { const cx = 24 + i * 182; x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(cx, 124, 166, 120, 12); x.fill(); x.fillStyle = BEAN_ORANGE; x.font = '700 44px ' + SANS; x.fillText(n, cx + 16, 186); x.fillStyle = '#4B5563'; x.font = '15px ' + SANS; x.fillText(t2, cx + 16, 222); });
    x.fillStyle = '#4B5563'; x.font = '600 14px ' + SANS; x.fillText('signups by hour', 24, 290);
    const bars = [3, 8, 14, 22, 19, 26, 17, 11, 9, 14, 20, 12];
    bars.forEach((v, i) => { const k = Math.max(0, Math.min(1, u * 14 - i)); x.fillStyle = BEAN_ORANGE; x.fillRect(24 + i * 60, 440 - v * 5 * k, 40, v * 5 * k); x.fillStyle = '#9CA3AF'; x.font = '11px ' + SANS; x.fillText(String(9 + i) + 'h', 30 + i * 60, 462); });
  }
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
  /** The laptop in hand on the road: Bean's numbers for the trip, live-looking, the logo top left. */
  screenTour: { w: 768, h: 480, frames: (([['Vancouver', 'Web Summit  ·  May 2025', [['500', 'conversations'], ['120', 'signups'], ['1', 'investor MOU'], ['700+', 'parents cooking']], ['09:00  booth open, Convention Centre West', '11:30  investor coffee, level 2', '14:00  Socratica, come work on your thing', '18:00  night summit, the seawall']],
    ['Toronto', 'Elevate  ·  Oct 2025', [['8', 'investor calls'], ['1', 'delegation'], ['2', 'open houses'], ['0', 'shiny meetings']], ['day 0  DM every investor in reach', 'day 1  the conference, dinner with Alex', 'day 2  a cafe. churn, not meetings', 'day 3  feedback calls; DMZ, Floqer house']],
    ['Montréal', 'ALL IN  ·  Sept 2025', [['2', 'days'], ['100s', 'of reps met'], ['4', 'cities in 4 months'], ['1', 'sore throat']], ['workshops in the morning', 'work the room, talk about Bean', 'eat and work in the breaks with Huy and Eduard', 'Nova Scotia startups with Digital NS']],
    ['Halifax', 'Invest NS  ·  Volta  ·  2025 to 26', [['12', 'startups picked'], ['$40k', 'over 5 months'], ['~100', 'at Collect.'], ['#4', 'Product Hunt']], ['Thursday  Collect. at Volta', 'pitch practice with Lindsay', 'Demo Day: the space packed', 'ship. then sleep.']]]) as Array<[string, string, Array<[string, string]>, string[]]>).map(([city, when, cells, plan]) => (x: Ctx, w: number, h: number) => {
    x.fillStyle = '#FBF8F4'; x.fillRect(0, 0, w, h); x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, 64);
    beanLogo(x, images.bean, 110, 32, 40, true);
    x.fillStyle = '#7A8290'; x.font = '500 16px Inter, system-ui, sans-serif'; x.textAlign = 'right'; x.fillText(when, w - 24, 40); x.textAlign = 'left';
    x.fillStyle = '#21293C'; x.font = '700 34px Inter, system-ui, sans-serif'; x.fillText(city, 32, 118);
    cells.forEach(([n, t], i) => { const cx = 32 + i * 180; x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(cx, 150, 164, 130, 14); x.fill(); x.fillStyle = BEAN_ORANGE; x.font = '800 48px Inter, system-ui, sans-serif'; x.fillText(n, cx + 16, 216); x.fillStyle = '#4B5563'; x.font = '500 17px Inter, system-ui, sans-serif'; x.fillText(t, cx + 16, 256); });
    x.fillStyle = '#21293C'; x.font = '600 18px Inter, system-ui, sans-serif'; x.fillText('Today', 32, 330);
    plan.forEach((t, i) => { x.fillStyle = i === 2 ? BEAN_ORANGE : '#4B5563'; x.font = '15px Inter, system-ui, sans-serif'; x.fillText(t, 32, 362 + i * 26); });
    x.fillStyle = '#E5E7EB'; x.fillRect(420, 316, 316, 150); x.fillStyle = '#4B5563'; x.font = '600 15px Inter, system-ui, sans-serif'; x.fillText('signups by hour', 436, 340);
    [3, 8, 14, 22, 19, 26, 17, 11].forEach((v, i) => { x.fillStyle = BEAN_ORANGE; x.fillRect(436 + i * 36, 456 - v * 4, 24, v * 4); });
  }) },
  /** The Web Summit banner, 1.2 by 3, hung in the hall: the name, the city, the year. Nothing else. */
  bannerWebSummit: { w: 340, h: 850, frames: [(x, w, h) => {
    x.fillStyle = '#FF6A13'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFFFFF'; x.font = `700 60px ${SANS}`; x.fillText('Web', 40, 200); x.fillText('Summit', 40, 270);
    x.fillStyle = '#1B1B1B'; x.font = `400 34px ${SANS}`; x.fillText('Vancouver', 40, 380); x.fillText('May 2025', 40, 426);
  }] },
  /** The booth's counter front, 2.3 by 0.7: the logo. */
  boothFront: { w: 1150, h: 350, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    beanLogo(x, images.bean, w / 2, 175, 220, true);
  }] },
  /** The booth's back panel, 2.4 by 2.2: the logo, the site, and the day's count as he posted it. */
  boothBack: { w: 1200, h: 1100, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    beanLogo(x, images.bean, 600, 260, 260, true);
    x.fillStyle = '#4B5563'; x.font = `400 40px ${SANS}`; x.textAlign = 'center'; x.fillText('beanmeals.com', 600, 440);
    const cells: Array<[string, string]> = [['500', 'conversations'], ['120', 'signups'], ['1', 'investor MOU']];
    cells.forEach(([n, t], i) => { const cx = 200 + i * 400; x.fillStyle = '#1B1B1B'; x.font = `700 120px ${SANS}`; x.fillText(n, cx, 720); x.fillStyle = '#4B5563'; x.font = `400 34px ${SANS}`; x.fillText(t, cx, 790); });
    x.fillStyle = '#7A8290'; x.font = `400 30px ${SANS}`; x.fillText('Web Summit Vancouver, one day', 600, 960);
    x.textAlign = 'left';
  }] },
  /** ALL IN's banner, 1.2 by 3: the name, the city, the month. */
  bannerAllIn: { w: 340, h: 850, frames: [(x, w, h) => {
    x.fillStyle = '#111114'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFFFFF'; x.font = `700 72px ${SANS}`; x.fillText('ALL IN', 40, 220);
    x.fillStyle = '#C9CDD3'; x.font = `400 34px ${SANS}`; x.fillText('Montréal', 40, 330); x.fillText('September 2025', 40, 376);
  }] },
  /** Toronto's Elevate banner, 1.2 by 3: the name, the city, the month. */
  bannerElevate: { w: 340, h: 850, frames: [(x, w, h) => {
    x.fillStyle = '#111114'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFFFFF'; x.font = `700 64px ${SANS}`; x.fillText('Elevate', 40, 220);
    x.fillStyle = '#C9CDD3'; x.font = `400 34px ${SANS}`; x.fillText('Toronto', 40, 330); x.fillText('October 2025', 40, 376);
  }] },
  /** The Montreal booth's back panel, 2.4 by 2.2: the logo, the site, the delegation. */
  boothMontreal: { w: 1200, h: 1100, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h);
    beanLogo(x, images.bean, 600, 300, 260, true);
    x.fillStyle = '#4B5563'; x.font = `400 40px ${SANS}`; x.textAlign = 'center'; x.fillText('beanmeals.com', 600, 480);
    x.fillStyle = '#1B1B1B'; x.font = `400 44px ${SANS}`; x.fillText('Nova Scotia startups at ALL IN', 600, 720);
    x.fillStyle = '#7A8290'; x.font = `400 34px ${SANS}`; x.fillText('with Digital Nova Scotia and Volta', 600, 790);
    x.textAlign = 'left';
  }] },
  /** The city signs on the walls, 2.4 by 0.6: the city, the event, the date. */
  ...Object.fromEntries((([['signVancouver', 'Vancouver', 'Web Summit, May 2025'], ['signToronto', 'Toronto', 'Elevate, October 2025'], ['signMontreal', 'Montréal', 'ALL IN, September 2025'], ['signHalifax', 'Halifax', 'Volta, 2025 to 2026']]) as Array<[string, string, string]>).map(([key, city, what]) => [key, { w: 1440, h: 360, frames: [(x: Ctx, w: number, h: number) => {
    x.fillStyle = '#F1ECE3'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1B1B1B'; x.font = `600 120px ${SANS}`; x.fillText(city, 70, 180);
    x.fillStyle = '#4B5563'; x.font = `400 50px ${SANS}`; x.fillText(what, 74, 280);
    beanLogo(x, images.bean, w - 220, 180, 150, true);
  }] }])),
  /**
   * A row of the crowd on its feet, 24 m across and 2.4 m tall, on a transparent ground: people of every height in dark
   * clothes and gowns, arms up, a few phones lit; the faces and shoulders catch the stage light. Two frames: the arms
   * move between them (the runtime alternates them while the hall is on). Painted, not modelled: seen from the stage.
   */
  crowd: { w: 2048, h: 205, frames: [0, 1].map((frame) => (x: Ctx, w: number, h: number) => {
    x.clearRect(0, 0, w, h);
    let seed = 41 + frame * 0; // the same people in both frames
    const r = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    const ground = h - 4, scale = h / 2.4; // px per metre
    for (let i = 0; i < 46; i++) {
      const cx = 16 + i * (w - 32) / 45 + (r() - 0.5) * 14, tall = 1.55 + r() * 0.3, shoulder = ground - (tall - 0.28) * scale, headR = 0.105 * scale;
      const gown = r() < 0.55, warm = 0.35 + r() * 0.35;
      const skin = `rgb(${Math.round(150 + warm * 90)}, ${Math.round(105 + warm * 60)}, ${Math.round(80 + warm * 45)})`;
      const cloth = gown ? `rgb(${18 + Math.round(r() * 10)}, ${16 + Math.round(r() * 8)}, ${20 + Math.round(r() * 10)})` : `hsl(${Math.round(r() * 360)}, ${20 + Math.round(r() * 30)}%, ${18 + Math.round(r() * 26)}%)`;
      // the body: a rounded torso from the shoulders to the ground, a little wider at the hips for the gown
      x.fillStyle = cloth; x.beginPath();
      x.moveTo(cx - 0.21 * scale, shoulder + 0.04 * scale); x.quadraticCurveTo(cx, shoulder - 0.06 * scale, cx + 0.21 * scale, shoulder + 0.04 * scale);
      x.lineTo(cx + (gown ? 0.27 : 0.2) * scale, ground); x.lineTo(cx - (gown ? 0.27 : 0.2) * scale, ground); x.closePath(); x.fill();
      // the arms: up and out, the elbows bent, waving between the frames; the hands pale
      const up = frame === 0 ? 0 : 1, lift = r() > 0.25;
      x.strokeStyle = cloth; x.lineWidth = 0.075 * scale; x.lineCap = 'round';
      for (const side of [-1, 1]) {
        const sway = (r() - 0.5) * 0.12 + (up ? side * 0.08 : -side * 0.05);
        const ex = cx + side * (lift ? 0.36 : 0.26) * scale, ey = shoulder - (lift ? 0.2 : -0.35) * scale, hx = cx + side * (lift ? 0.3 + sway : 0.3) * scale, hy = lift ? shoulder - (0.55 + (up ? 0.08 : 0)) * scale : shoulder + 0.5 * scale;
        x.beginPath(); x.moveTo(cx + side * 0.19 * scale, shoulder + 0.02 * scale); x.lineTo(ex, ey); x.lineTo(hx, hy); x.stroke();
        x.fillStyle = skin; x.beginPath(); x.arc(hx, hy, 0.045 * scale, 0, Math.PI * 2); x.fill();
        if (lift && r() < 0.22) { x.fillStyle = '#EAF2FF'; x.fillRect(hx - 0.03 * scale, hy - 0.09 * scale, 0.06 * scale, 0.11 * scale); } // a phone held up
      }
      // the head, a cap on the graduates, the light on the face's edge
      x.fillStyle = skin; x.beginPath(); x.arc(cx, shoulder - 0.15 * scale, headR, 0, Math.PI * 2); x.fill();
      x.fillStyle = `rgba(20, 16, 14, 0.55)`; x.beginPath(); x.arc(cx, shoulder - 0.15 * scale, headR, Math.PI * 0.6, Math.PI * 1.6); x.fill(); // hair, shadow side
      if (gown && r() < 0.8) { x.fillStyle = '#111114'; x.fillRect(cx - 0.16 * scale, shoulder - 0.27 * scale, 0.32 * scale, 0.03 * scale); } // the mortarboard
    }
  }) },
  /**
   * The marks of the tour on boards along the terrace and on the stage: each frame one organisation's own logo, drawn
   * from its site's file once it has loaded (stage-run repaints), centred with a margin. White logos sit on a dark board.
   */
  logo: { w: 1000, h: 600, frames: (['websummit', 'elevate', 'volta', 'investns', 'producthunt', 'dalhousie'] as const).map((key) => (x: Ctx, w: number, h: number) => {
    const dark = key === 'elevate' || key === 'volta' || key === 'investns';
    x.fillStyle = dark ? (key === 'volta' ? '#101A2E' : key === 'investns' ? '#0E2A4A' : '#141416') : '#F7F6F2'; x.fillRect(0, 0, w, h);
    const img = images[key];
    if (!img) return;
    const pad = 90, sw = w - 2 * pad, sh = h - 2 * pad, k = Math.min(sw / img.width, sh / img.height), dw = img.width * k, dh = img.height * k;
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }) },
  /** Toronto's whiteboard, in his words from the trip: churn instead of the meetings. */
  whiteboardChurn: { w: 1024, h: 640, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#B8BFC4'; x.fillRect(0, h - 26, w, 26);
    const marker = (c: string, size = 28) => { x.strokeStyle = c; x.fillStyle = c; x.lineWidth = 3; x.font = `500 ${size}px "Marker Felt", "Chalkboard SE", "Segoe Print", sans-serif`; };
    marker('#1B4FBF', 40); x.fillText('churn', 50, 80);
    marker('#1B1B1B', 28); ['"I don\'t remember to open the app"', '"I don\'t see my own recipes"'].forEach((t, i) => x.fillText(t, 60, 150 + i * 46));
    marker('#1B1B1B', 26); ['reminders, notifications, emails, every day', 'retention 3x week over week', 'feedback calls with parents'].forEach((t, i) => x.fillText('- ' + t, 60, 280 + i * 44));
    marker('#C0392B', 30); x.fillText('fix the product', 60, 470);
    marker('#1B4FBF', 22); x.fillText('day 0: 8 investor calls booked   ·   day 3: Startup Open House, DMZ, Floqer', 60, 570);
  }] },
  /** Halifax's whiteboard: Collect. at Volta, in his words. */
  whiteboardCollect: { w: 1024, h: 640, frames: [(x, w, h) => {
    x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, w, h); x.fillStyle = '#B8BFC4'; x.fillRect(0, h - 26, w, 26);
    const marker = (c: string, size = 28) => { x.strokeStyle = c; x.fillStyle = c; x.lineWidth = 3; x.font = `500 ${size}px "Marker Felt", "Chalkboard SE", "Segoe Print", sans-serif`; };
    marker('#2E7D32', 40); x.fillText('Collect.  Thursdays at Volta', 50, 80);
    marker('#1B1B1B', 26); ['with Noah and Sam', 'a handful of builders, then almost 100', 'Demo Day, Feb 15: booths, demos, pizza'].forEach((t, i) => x.fillText('- ' + t, 60, 160 + i * 46));
    marker('#1B4FBF', 26); x.fillText('Invest NS Accelerate: 1 of 12, $40k over 5 months', 60, 360);
    marker('#1B1B1B', 26); x.fillText('Product Hunt, Dec: #4 product of the day, 242 upvotes', 60, 410);
  }] },
  /** The Invest Nova Scotia Accelerate letter on the wall, 0.56 by 0.41. */
  certificateInvestNS: { w: 560, h: 410, frames: [(x, w, h) => {
    x.fillStyle = '#FBFAF6'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1B1B1B'; x.font = `600 26px ${SANS}`; x.textAlign = 'center'; x.fillText('Invest Nova Scotia', w / 2, 90); x.font = `400 22px ${SANS}`; x.fillText('Accelerate, 2025 to 2026', w / 2, 130);
    beanLogo(x, images.bean, w / 2, 220, 90, true);
    x.fillStyle = '#4B5563'; x.font = `400 17px ${SANS}`; x.fillText('one of twelve', w / 2, 320);
    x.textAlign = 'left';
  }] },
  /** The screen at ALL IN: the event's name, a session title card. */
  screenAllIn: { w: 1000, h: 575, frames: [(x, w, h) => {
    x.fillStyle = '#111114'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#FFFFFF'; x.font = `700 72px ${SANS}`; x.fillText('ALL IN', 60, 200);
    x.fillStyle = '#C9CDD3'; x.font = `400 32px ${SANS}`; x.fillText('Montréal, September 2025', 60, 260); x.fillText('Workshops, day two', 60, 310);
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
