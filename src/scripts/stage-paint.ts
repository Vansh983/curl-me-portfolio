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
