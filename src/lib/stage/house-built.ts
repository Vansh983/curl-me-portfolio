// Floqer's hacker house, built from the photographs of the real one (docs/rebuild/43-hacker-house-reference.md,
// docs/rebuild/ref/hacker-house/floqer-*): a desk for each person on white trestles, a black standing desk among
// them, a white tower on a desk, cans, cases of drinks on the floor, the whiteboard on wheels thick with sticky
// notes, the mark made of acoustic foam tiles, a torchiere in the corner, air beds with the duvet thrown back, and
// the leads that run off the back of every desk. Each stands at its own origin unless it says otherwise.
import { Sink, type V3 } from './rig.ts';
import { piece, M, type BuiltPart } from './part.ts';
import { rng } from './dalhousie.ts';
import { FLOQER, FLOQER_T } from './sets.ts';

/** A surface over a grid, facing up when u runs along x and v along z; `both` gives it an underside too (cloth seen from below its hem). */
function sheet(s: Sink, nu: number, nv: number, at: (u: number, v: number) => V3, both = false): void {
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    const a = at(i / nu, j / nv), b = at((i + 1) / nu, j / nv), c = at((i + 1) / nu, (j + 1) / nv), d = at(i / nu, (j + 1) / nv);
    s.quad(a, d, c, b);
    if (both) s.quad(a, b, c, d);
  }
}
const smooth = (t: number): number => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

/**
 * An air bed on the floor, its length along x, the head toward -x. Not a box: one or two air chambers with rounded
 * sides and a seam between, a flocked top a shade lighter inside a raised rim (rows of dimples, or ribs along it), the
 * pump's black panel in the side at the foot, a duvet thrown back in a heap with deep folds and hanging over one
 * side, pillows that do not match.
 */
function airBed(o: { high: boolean; side: string; top: string; ribs: boolean; duvet: string; pillows: Array<[string, number, number, number]>; seed: number }): BuiltPart {
  const L = 1.91, W = 0.99, H = o.high ? 0.42 : 0.24, rnd = rng(o.seed);
  const body = new Sink(), top = new Sink(), black = new Sink(), duvet = new Sink(), parts: BuiltPart = [];
  if (o.high) body.rbox(0, H * 0.25, 0, L, H / 2, W, 0.085, 3).rbox(0, H * 0.75, 0, L, H / 2, W, 0.085, 3); else body.rbox(0, H / 2, 0, L, H, W, 0.085, 3);
  const tx = L / 2 - 0.085, tz = W / 2 - 0.08;
  sheet(top, 44, 24, (u, v) => {
    const x = (u * 2 - 1) * tx, z = (v * 2 - 1) * tz, edge = Math.min(tx - Math.abs(x), tz - Math.abs(z));
    const rim = smooth(1 - edge / 0.09), iu = (Math.abs(x) < tx - 0.09 && Math.abs(z) < tz - 0.09 ? 1 : 0) * smooth((edge - 0.09) / 0.05);
    const dimple = o.ribs ? 0.5 + 0.5 * Math.cos((z / (tz - 0.09)) * Math.PI * 5) : (0.5 + 0.5 * Math.cos((x / (tx - 0.09)) * Math.PI * 8)) * (0.5 + 0.5 * Math.cos((z / (tz - 0.09)) * Math.PI * 5));
    return [x, H + 0.002 + 0.012 * rim - 0.016 * iu * (1 - dimple), z];
  });
  black.rbox(L / 2 - 0.004, H - 0.13, 0.18, 0.02, 0.13, 0.16, 0.008, 1); // the pump
  const dial = black.count; black.cylinder(0, 0, 0, 0.028, 0.012, 16).rotateZ(0, 0, Math.PI / 2, dial).translate(L / 2 + 0.012, H - 0.12, 0.16, dial);
  for (let k = 0; k < 8; k++) black.bone([L / 2 + 0.01 + k * 0.03, Math.max(0.006, H - 0.19 - k * 0.05), 0.24 + 0.012 * Math.sin(k * 1.7)], [L / 2 + 0.04 + k * 0.03, Math.max(0.006, H - 0.24 - k * 0.05), 0.24 + 0.012 * Math.sin((k + 1) * 1.7)], 0.004, 0.004); // its lead, down to the floor and away
  // the duvet: over the foot two thirds, its head end rolled back on itself, one side hanging to the floor
  const p1 = rnd() * 6, p2 = rnd() * 6, hang = o.high ? 0.3 : 0.16;
  sheet(duvet, 40, 30, (u, v) => {
    const x = -0.42 + u * 1.3, zz = -0.74 + v * 1.2, over = Math.max(0, -tz - 0.06 - zz), z = Math.max(zz, -W / 2 - 0.035 - over * 0.25);
    const e = smooth(Math.min(u, 1 - u, 1 - v) / 0.12), roll = 0.085 * Math.exp(-(((u - 0.12) / 0.11) ** 2));
    const fold = 0.03 + 0.045 * Math.abs(Math.sin(5.1 * u + 2.3 * v + p1)) + 0.03 * Math.sin(10.7 * u - 6.9 * v + p2) + 0.018 * Math.sin(17 * v + 9 * u);
    return [x + 0.03 * Math.sin(8 * v + p1), H + 0.012 + (Math.max(0, fold) + roll) * e - Math.min(hang, over * 2.6) + (over > 0 ? 0.012 * Math.sin(22 * u + p2) : 0), z];
  }, true);
  parts.push(piece(body.out(), M(o.side), { smooth: true }), piece(top.out(), M(o.top), { smooth: true }), piece(black.out(), M('bezel'), { smooth: true }), piece(duvet.out(), M(o.duvet), { smooth: true, metres: 'xz' }));
  for (const [mat, x, z, turn] of o.pillows) {
    const p = new Sink().rbox(0, 0, 0, 0.42, 0.13, 0.66, 0.062, 3).rotateZ(0, 0, 0.1 + 0.1 * rnd()).rotateY(0, 0, turn).translate(x, H + 0.075, z);
    parts.push(piece(p.out(), M(mat), { smooth: true, metres: 'xz' }));
  }
  return parts;
}

/** A trestle of white wood under one end of a desk, across z at `x`: two splayed legs each side under a beam, a shelf 20 cm up. */
function trestle(s: Sink, x: number, h: number): void {
  s.box(x, h - 0.03, 0, 0.05, 0.06, 0.68);
  for (const z of [-0.3, 0.3]) for (const k of [-1, 1]) s.bone([x + k * 0.17, 0, z], [x + k * 0.02, h - 0.06, z], 0.02, 0.02);
  s.box(x, 0.2, 0, 0.3, 0.018, 0.62).box(x, 0.19, -0.3, 0.3, 0.03, 0.02).box(x, 0.19, 0.3, 0.3, 0.03, 0.02);
}

/** A lead laid through `pts` with a little slack between them, 6 mm thick. */
function lead(s: Sink, pts: V3[], rnd: () => number, wobble = 0.012, r = 0.003): void {
  for (let i = 0; i + 1 < pts.length; i++) {
    const a = pts[i], b = pts[i + 1], n = Math.max(2, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 0.12));
    let p: V3 = a;
    for (let k = 1; k <= n; k++) {
      const t = k / n, flat = Math.abs(b[1] - a[1]) < 0.05, q: V3 = [a[0] + (b[0] - a[0]) * t + (k < n ? (rnd() - 0.5) * 2 * wobble : 0), a[1] + (b[1] - a[1]) * t - (flat ? 0 : Math.sin(Math.PI * t) * 0.03), a[2] + (b[2] - a[2]) * t + (k < n ? (rnd() - 0.5) * 2 * wobble : 0)];
      s.bone(p, q, r, r);
      p = q;
    }
  }
}

/** A drinks can, 6.6 cm across and 12.2 tall (or the tall slim kind), standing at (x, y, z). */
const can = (s: Sink, x: number, y: number, z: number, slim = false): Sink => (slim
  ? s.lathe([[0.001, 0], [0.024, 0], [0.0265, 0.006], [0.0265, 0.146], [0.022, 0.157], [0.001, 0.157]], x, y, z, 1, 1, 0, 16)
  : s.lathe([[0.001, 0], [0.029, 0], [0.033, 0.007], [0.033, 0.11], [0.027, 0.122], [0.001, 0.122]], x, y, z, 1, 1, 0, 16));

const hex = (c: number[]): string => '#' + c.map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, '0')).join('');

export const HOUSE_BUILT: Record<string, () => BuiltPart> = {
  /** The raised air bed: two chambers 42 cm tall, charcoal sides, a grey flocked top with rows of dimples, a white duvet thrown back, a white pillow and a grey one. */
  airBedRaised: () => airBed({ high: true, side: 'airBedCharcoal', top: 'airBedGrey', ribs: false, duvet: 'bedding', pillows: [['bedding', -0.7, 0.12, 0.12], ['beddingGrey', -0.62, -0.2, -0.35]], seed: 31 }),
  /** The low air bed: one chamber 24 cm tall, navy, ribs along its top, a grey duvet, one pillow askew. */
  airBedLow: () => airBed({ high: false, side: 'airBed', top: 'airBedFlock', ribs: true, duvet: 'beddingGrey', pillows: [['bedding', -0.66, -0.05, -0.2]], seed: 77 }),
  /** A desk as the house has them: a pale top 150 by 75 on two white trestles with a shelf each. Its length along x, at the origin. */
  trestleDesk: () => {
    const legs = new Sink();
    trestle(legs, -0.52, 0.71); trestle(legs, 0.52, 0.71);
    return [piece(new Sink().rbox(0, 0.724, 0, 1.5, 0.028, 0.75, 0.004, 1).out(), M('plywood'), { smooth: true, metres: 'xz' }), piece(legs.out(), M('trestleWhite'))];
  },
  /** The standing desk: an oak top 150 by 75 on a black frame of two T legs and a crossbar, raised a hand above the others, its paddle under the front edge. */
  standingDesk: () => {
    const frame = new Sink().box(0, 0.74, 0, 1.12, 0.05, 0.04).rbox(0.5, 0.762, 0.34, 0.1, 0.02, 0.03, 0.004, 1);
    for (const x of [-0.56, 0.56]) frame.box(x, 0.4, 0, 0.08, 0.72, 0.05).box(x, 0.02, 0, 0.08, 0.04, 0.7);
    return [piece(new Sink().rbox(0, 0.784, 0, 1.5, 0.026, 0.75, 0.004, 1).out(), M('deskOak'), { smooth: true, metres: 'xz' }), piece(frame.out(), M('bezel'))];
  },
  /** A white tower computer standing on a desk: rounded, 20 wide, 48 tall, 45 deep, a black oval in its face. Its face toward +z. */
  towerPC: () => [piece(new Sink().rbox(0, 0.24, 0, 0.2, 0.48, 0.45, 0.06, 3).out(), M('towerWhite'), { smooth: true }),
    piece(new Sink().rbox(0, 0.25, 0.222, 0.11, 0.36, 0.012, 0.05, 2).out(), M('bezel'), { smooth: true })],
  /** Cans on a desk, as they are left: a tall slim one, two ordinary ones, each its own colour, no two the same way up the desk. */
  deskCans: () => [piece(can(new Sink(), 0, 0, 0, true).out(), M('canSilver'), { smooth: true }), piece(can(new Sink(), 0.09, 0, 0.04).out(), M('canBlack'), { smooth: true }), piece(can(new Sink(), 0.03, 0, -0.085).out(), M('canRed'), { smooth: true })],
  deskCan: () => [piece(can(new Sink(), 0, 0, 0).out(), M('canBlack'), { smooth: true })],
  deskCanSlim: () => [piece(can(new Sink(), 0, 0, 0, true).out(), M('canSilver'), { smooth: true })],
  /** Cases of drinks stacked against a wall, three high and not square to each other: a red shrink-wrapped tray, a card one, a blue one, a loose case beside. */
  canCases: () => {
    const red = new Sink().rbox(0, 0.065, 0, 0.4, 0.13, 0.27, 0.012, 2), n = red.count;
    red.rbox(0.47, 0.065, 0.04, 0.4, 0.13, 0.27, 0.012, 2).rotateY(0.47, 0.04, 0.2, n); // the loose one beside the stack
    const card = new Sink().rbox(0.02, 0.2, 0.01, 0.41, 0.14, 0.275, 0.004, 1).rotateY(0.02, 0.01, -0.09);
    const blue = new Sink().rbox(-0.02, 0.36, 0.0, 0.33, 0.18, 0.22, 0.02, 2).rotateY(-0.02, 0, 0.16);
    return [piece(red.out(), M('caseRed'), { smooth: true }), piece(card.out(), M('cardboard'), { metres: 'xy' }), piece(blue.out(), M('caseBlue'), { smooth: true })];
  },
  /** The torchiere: a black floor lamp 1.8 m tall, its bowl turned up, the light thrown on the ceiling. */
  torchiere: () => [piece(new Sink().lathe([[0.001, 0], [0.15, 0], [0.15, 0.012], [0.03, 0.03], [0.012, 0.06], [0.012, 1.7], [0.035, 1.72], [0.17, 1.8], [0.175, 1.81], [0.16, 1.81], [0.03, 1.735], [0.001, 1.735]], 0, 0, 0, 1, 1, 0, 28).out(), M('bezel'), { smooth: true }),
    piece(new Sink().lathe([[0.001, 1.74], [0.03, 1.74], [0.155, 1.806], [0.001, 1.806]], 0, 0, 0, 1, 1, 0, 24).out(), M('ringLight'), { smooth: true })],
  /** The whiteboard on wheels: two boards one over the other in a steel frame on castors, 1.3 wide and 2.05 tall, marker and sticky notes on both (`whiteboardSticky`). Its face toward +z. */
  rollingWhiteboard: () => {
    const frame = new Sink(), wheels = new Sink(), back = new Sink();
    for (const x of [-0.66, 0.66]) { frame.box(x, 1.07, 0, 0.03, 2.0, 0.03).box(x, 0.07, 0, 0.04, 0.03, 0.56); for (const z of [-0.26, 0.26]) wheels.sphere(x, 0.03, z, 0.03, 0.03, 0.022, 10, 6); }
    for (const y of [0.3, 1.185, 2.06]) frame.box(0, y, 0, 1.32, 0.025, 0.03);
    back.box(0, 0.74, -0.008, 1.29, 0.86, 0.012).box(0, 1.62, -0.008, 1.29, 0.86, 0.012);
    const face = (y: number): Sink => new Sink().quad([-0.645, y - 0.43, 0], [0.645, y - 0.43, 0], [0.645, y + 0.43, 0], [-0.645, y + 0.43, 0], [[0, 0], [1, 0], [1, 1], [0, 1]]);
    return [piece(frame.out(), M('alu')), piece(wheels.out(), M('bezel'), { smooth: true }), piece(back.out(), M('icing')), piece(face(1.62).out(), { paint: 'whiteboardSticky:0' }), piece(face(0.74).out(), { paint: 'whiteboardSticky:1' })];
  },
  /**
   * The mark as the house has it: acoustic foam tiles on the wall, five across and six up, each 30 cm of small
   * pyramids, black, the F picked out in orange tiles. 1.5 wide, 1.8 tall, its foot at the origin, its face toward +z.
   */
  foamMark: () => {
    const F = ['.....', '.###.', '.#...', '.###.', '.#...', '.....'], black = new Sink(), orange = new Sink(), T = 0.3, n = 4, c = T / n;
    F.forEach((row, r) => [...row].forEach((ch, col) => {
      const s = ch === '#' ? orange : black, x0 = -0.75 + col * T, y0 = 1.8 - (r + 1) * T;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const xa = x0 + i * c, ya = y0 + j * c, p: V3[] = [[xa, ya, 0.012], [xa + c, ya, 0.012], [xa + c, ya + c, 0.012], [xa, ya + c, 0.012]], top: V3 = [xa + c / 2, ya + c / 2, 0.062];
        for (let k = 0; k < 4; k++) s.tri(p[k], p[(k + 1) % 4], top);
      }
    }));
    return [piece(black.out(), M('foamBlack')), piece(orange.out(), M('foamOrange'))];
  },
  /** Floqer's box, the one the team's kit came in: orange, its lid black. 36 by 26 by 12 cm. */
  floqerBox: () => [piece(new Sink().rbox(0, 0.06, 0, 0.36, 0.12, 0.26, 0.004, 1).out(), M('foamOrange'), { smooth: true }), piece(new Sink().box(0.04, 0.1215, 0, 0.26, 0.003, 0.26).out(), M('bezel'))],
  /** A power strip of the kind Toronto has: a white bar with six outlets in a row and a red switch, on the floor. Its length along x. */
  powerStrip: () => {
    const dark = new Sink();
    for (let i = 0; i < 6; i++) dark.box(-0.09 + i * 0.038, 0.0405, 0, 0.022, 0.002, 0.018);
    return [piece(new Sink().rbox(0, 0.02, 0, 0.3, 0.04, 0.05, 0.006, 1).out(), M('towerWhite'), { smooth: true }), piece(dark.out(), M('bezel')), piece(new Sink().box(0.13, 0.0415, 0, 0.018, 0.004, 0.012).out(), M('canRed'))];
  },
  /**
   * The leads of the T, in the house's own coordinates, the floor at the origin's height: off the back of every seat
   * to the seam between the two rows of desks, along it to the table's end and down to a power strip on the floor;
   * the white chargers of the laptops; one white extension lead across the floor from the foot of the stem to the wall.
   */
  floqerLeads: () => {
    const black = new Sink(), white = new Sink(), rnd = rng(75), { bar, stem, seats, x: sx } = FLOQER_T, y = 0.745, Z0 = FLOQER.z[0];
    for (const x of seats) for (const k of [-1, 1]) lead(black, [[x + 0.02 * k, y, bar + k * 0.2], [x + 0.1 * k, y, bar + k * 0.03], [x + 0.2, y, bar + k * 0.012]], rnd);
    for (const k of [-0.012, 0, 0.012]) lead(black, [[seats[0] - 0.4, y, bar + k], [seats[seats.length - 1] + 0.72, y, bar + k], [seats[seats.length - 1] + 0.8, 0.02, bar + 0.1 + k * 6], [seats[seats.length - 1] + 1.0, 0.012, bar + 0.25]], rnd, 0.006);
    for (const z of [stem - 0.75, stem + 0.75]) for (const k of [-1, 1]) lead(black, [[sx + k * 0.2, y, z], [sx + k * 0.03, y, z - 0.1], [sx + k * 0.012, y, z - 0.25]], rnd);
    for (const k of [-0.012, 0.012]) lead(black, [[sx + k, y, stem + 1.3], [sx + k, y, stem - 1.48], [sx + k * 4, 0.02, stem - 1.56], [sx + 0.18, 0.012, stem - 1.75]], rnd, 0.006);
    lead(white, [[seats[1] + 0.34, y, bar - 0.3], [seats[1] + 0.3, y, bar - 0.03]], rnd); lead(white, [[seats[2] - 0.36, y, bar + 0.3], [seats[2] - 0.3, y, bar + 0.03]], rnd);
    lead(white, [[sx + 0.3, 0.012, stem - 1.78], [sx + 0.7, 0.008, stem - 2.3], [sx - 0.2, 0.008, Z0 + 1.2], [sx - 0.5, 0.008, Z0 + 0.12], [sx - 0.5, 0.3, Z0 + 0.03]], rnd, 0.03, 0.004);
    return [piece(black.out(), M('cable')), piece(white.out(), M('towerWhite'))];
  },
  /**
   * Old Town under Floqer's windows, in front of the photograph of the skyline (docs/rebuild/42-toronto-view-research.md):
   * the house's own street along the wall, and a street running straight out from the first window toward the towers,
   * streetcar tracks down its middle under their wire, brick blocks of three to six storeys along it and behind it,
   * tar roofs with their boxes, parked cars. The origin at the foot of the wall under the first window, on the
   * street's ground; -x away from the house, z along the wall. Nothing near the house rises over the eye, so the
   * skyline stands whole above the roofs; the far blocks reach just over it and hide the photograph's foot.
   */
  torontoStreet: () => {
    const road = new Sink(), walk = new Sink(), rail = new Sink(), wire = new Sink(), walls = new Sink(), roofs = new Sink(), clutter = new Sink(), cars = new Sink(), rnd = rng(1793);
    const flat = (s: Sink, x0: number, x1: number, z0: number, z1: number, y: number) => s.quad([x0, y, z0], [x0, y, z1], [x1, y, z1], [x1, y, z0]);
    flat(road, -1100, 4, -700, 700, 0);
    flat(walk, -3.5, 0, -700, 700, 0.12); flat(walk, -17, -13.5, -700, -10.5, 0.12); flat(walk, -17, -13.5, 10.5, 700, 0.12); // the house's street: its two sidewalks
    for (const k of [-1, 1]) flat(walk, -900, -17, k > 0 ? 7 : -10.5, k > 0 ? 10.5 : -7, 0.12); // the street to the towers: a sidewalk each side
    for (const zc of [-1.75, 1.75]) { for (const k of [-0.72, 0.72]) flat(rail, -900, -4, zc + k - 0.06, zc + k + 0.06, 0.015); wire.box(-452, 5.6, zc, 896, 0.03, 0.03); }
    for (let x = -30; x > -700; x -= 42) { for (const k of [-1, 1]) wire.box(x, 3.6, k * 7.4, 0.16, 7.2, 0.16); wire.box(x, 6.4, 0, 0.03, 0.03, 14.8); } // the poles and the span wires the running wire hangs from
    const BRICK = [[0.56, 0.3, 0.24], [0.62, 0.36, 0.27], [0.46, 0.27, 0.22], [0.72, 0.62, 0.5], [0.66, 0.66, 0.64], [0.5, 0.33, 0.28], [0.78, 0.74, 0.68]];
    /** A block of buildings along x from `xa` to `xb`, its front on `zf` and its depth away from the street (`dir`). */
    const row = (xa: number, xb: number, zf: number, dir: 1 | -1, far: number) => {
      let x = xa;
      while (x > xb + 8) {
        const w = Math.min(x - xb, 13 + rnd() * 20), d = 20 + rnd() * 12, out = -x; // how far out from the house
        const top = out < 90 ? 10.5 + Math.floor(rnd() * 2) * 3.6 : out < 260 ? 10.5 + Math.floor(rnd() * 3) * 3.6 : 14 + Math.floor(rnd() * (far + 3)) * 3.6, h = top + 0.6;
        const t = BRICK[Math.floor(rnd() * BRICK.length)], k = 0.82 + rnd() * 0.3, z0 = Math.min(zf, zf + dir * d), z1 = Math.max(zf, zf + dir * d);
        walls.color(hex(t.map((v) => v * k)));
        walls.extrude([[x - w, z0], [x, z0], [x, z1], [x - w, z1]], 0, h, { u0: Math.floor(rnd() * 4) / 4, v0: 0, perU: 12, perV: 10.8 }, roofs);
        if (out < 420) { // what stands on a roof: an air handler or two, the head of a stair
          const n = 1 + Math.floor(rnd() * 3);
          for (let i = 0; i < n; i++) { const bw = 1.6 + rnd() * 2.4, bd = 1.4 + rnd() * 2, bh = 1 + rnd() * 1.6; clutter.box(x - 2 - rnd() * (w - 4), h + bh / 2, z0 + 2 + rnd() * (z1 - z0 - 4), bw, bh, bd); }
        }
        x -= w + (rnd() < 0.2 ? 3 + rnd() * 5 : 0.15);
      }
    };
    for (let band = 0; band < 7; band++) for (const side of [-1, 1] as const) {
      const near = 10.5 + band * 82; // a block: buildings front and back, an alley's width between them, a street beyond
      for (let x = band === 0 ? -17 : -17 - rnd() * 6; x > -760; x -= 118) { row(x, x - 104, side * near, side, band); row(x, x - 104, side * (near + 68), -side as 1 | -1, band); }
    }
    // parked along the kerbs, and a few on the move
    const PAINT = [[0.75, 0.76, 0.78], [0.12, 0.12, 0.14], [0.55, 0.08, 0.08], [0.16, 0.24, 0.4], [0.9, 0.9, 0.88], [0.35, 0.37, 0.38]];
    const car = (x: number, z: number, along: boolean) => {
      const n = cars.count;
      cars.color(hex(PAINT[Math.floor(rnd() * PAINT.length)]));
      cars.rbox(0, 0.62, 0, 4.4, 0.75, 1.8, 0.12, 1).rbox(-0.2, 1.22, 0, 2.3, 0.55, 1.6, 0.14, 1);
      if (!along) cars.rotateY(0, 0, Math.PI / 2, n);
      cars.translate(x, 0, z, n);
    };
    for (let x = -24; x > -520; x -= 6.2) { if (rnd() < 0.55) car(x, 5.9, true); if (rnd() < 0.5) car(x, -5.9, true); }
    for (let z = 14; z < 300; z += 6.2) { if (rnd() < 0.5) car(-4.6, z, false); if (rnd() < 0.5) car(-4.6, -z, false); if (rnd() < 0.35) car(-12.4, z, false); }
    car(-96, 3.6, true); car(-182, -3.7, true); car(-8.6, 62, false);
    return [piece(road.out(), M('torontoRoad')), piece(walk.out(), M('torontoWalk')), piece(rail.out(), M('trackRail')), piece(wire.out(), M('cable')), piece(walls.out(), M('torontoBrick'), { tint: true }),
      piece(roofs.out(), M('torontoRoof')), piece(clutter.out(), M('torontoWalk')), piece(cars.out(), M('torontoCar'), { smooth: true, tint: true })];
  },
};
