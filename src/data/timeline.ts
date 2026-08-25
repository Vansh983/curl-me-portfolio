// Drives the timeline stage on the homepage. One entry per chapter, in order.
// Words are placeholders until the LinkedIn export lands; the shape is what matters.
// Adding a chapter is one entry here: the curve, the markers and the pacing follow.

import type { FigureParams } from '../lib/figure';

export type Place = 'delhi' | 'sf' | 'halifax' | 'room';
export type Scene = { place: Place; scenery: string; figure: FigureParams; enter?: FigureParams }; // enter: pose he arrives from as the chapter scrolls in

export type Milestone = {
  year: string; // the big number in the gutter
  span?: string; // "to 22", "to now": shown under the year
  lane?: string; // small mono label above the title: place, company, theme
  title: string;
  body: string;
  stat?: string; // one line of numbers, mono, optional
  mark?: string; // small logo in the gutter, /assets/timeline/*.png, optional
  scene?: Scene; // the journey stage: place background, scenery file stem, figure keyframe
};

// 2018: seventeen, Google Code-in grand prize, the trip to San Francisco.
// Trophy held up, Golden Gate behind, suitcase at the feet.
const teen2018: FigureParams = {
  height: 0.86, headRatio: 0.19, shoulder: 0.12, hairTop: 0.7, hairSide: 0.35,
  glasses: 0, beard: 0, sleeve: 0.4, collar: 0.2, lean: 0,
  armL: { shoulder: -18, elbow: 8 }, armR: { shoulder: 150, elbow: 10 },
  legStance: 0.45,
  prop: { show: 1, w: 0.1, h: 0.085, stem: 0.05, x: 0, y: -0.075, rot: 0, taper: 0.7 },
  face: { smile: 1, browL: 0.5, browR: 0.5, eyeOpen: 1 },
  x: 1080, facing: 1, turn: 0.2, walk: 0,
};
// He walks in from the left with the trophy at his side, then raises it.
const arrive2018: FigureParams = {
  ...teen2018,
  x: 560, turn: 0.6, walk: -12.566,
  armL: { shoulder: -10, elbow: 6 }, armR: { shoulder: 14, elbow: -24 },
  prop: { ...teen2018.prop, x: 0.02, y: 0.03, rot: 10 },
  face: { smile: 0.6, browL: 0.2, browR: 0.2, eyeOpen: 1 },
};
// 2020: Webcube in first year, a laptop on the desk, twenty five developers on the wall,
// Covid Leads Delhi pinned beside the monitor. Leaning in, focused.
const studio2020: FigureParams = {
  height: 0.93, headRatio: 0.175, shoulder: 0.13, hairTop: 0.55, hairSide: 0.3,
  glasses: 0, beard: 0, sleeve: 0.9, collar: 0.5, lean: 0.25,
  armL: { shoulder: -12, elbow: 6 }, armR: { shoulder: 30, elbow: -20 },
  legStance: 0.4,
  prop: { show: 1, w: 0.22, h: 0.13, stem: 0, x: 0.05, y: 0.04, rot: -4, taper: 0 },
  face: { smile: 0.2, browL: -0.3, browR: -0.3, eyeOpen: 0.8 },
  // walks two full strides to the desk between the chapters (walk goes 0 to 4 pi)
  x: 1120, facing: 1, turn: 0.6, walk: 12.566,
};

export const timeline: Milestone[] = [
  {
    year: '2013',
    lane: 'Delhi',
    title: 'The first website',
    body: 'A W3Schools template with the colours changed. I was 13. Wireframes sketched in class, coded when I got home, and it never really stopped.',
  },
  {
    year: '2018',
    lane: 'Google Code-in',
    title: 'Grand prize at 17',
    body: 'Google flew me to San Francisco. That trip is the reason I moved across the world for computer science.',
    mark: '/assets/timeline/google.png',
    scene: { place: 'sf', scenery: 'sc-2018', figure: teen2018, enter: arrive2018 },
  },
  {
    year: '2020',
    span: 'to 22',
    lane: 'Webcube',
    title: 'A studio in first year',
    body: 'Startups brought ideas, we shipped the software. Twenty five developers at the peak. The same year a Covid resource platform for Delhi reached 20,000 people with 52 volunteers.',
    stat: '25 developers · 6 products live · $100K+ raised on our MVPs',
    mark: '/assets/timeline/webcube.png',
    scene: { place: 'delhi', scenery: 'sc-2020', figure: studio2020 },
  },
  {
    year: '2022',
    lane: 'Halifax',
    title: 'Dalhousie',
    body: 'Moved to Halifax. Shiftkey Labs first, then research in the Emerging Wireless Technologies Lab, then a developer on Dal research projects.',
    stat: '15,000 medical placements tracked in one tool',
    mark: '/assets/timeline/dal.png',
  },
  {
    year: '2023',
    span: 'to 25',
    lane: 'Research, teaching, community',
    title: 'Three things at once',
    body: 'TA for computer science courses. Research on the side. A community for international students who wanted to freelance instead of waiting for internships. LinkedIn named me a Top Voice for it.',
    stat: '74 web apps · 18 mobile apps · placeholder: Australia',
  },
  {
    year: '2024',
    span: 'to 26',
    lane: 'Bean',
    title: 'Co-founded Bean',
    body: 'With Pankrit Jindal. Started as "what\'s in your fridge", became a cooking assistant thousands of people used. Invest Nova Scotia backed it, we took it to Web Summit Vancouver. Two years, start to finish.',
    stat: 'thousands of users · $40K Invest NS · Web Summit 2026',
  },
  {
    year: '2025',
    span: 'to now',
    lane: 'Floqer',
    title: 'Building Floqer',
    body: 'The orchestration engine behind enterprise go to market automation. Small team, hard problems, and the lesson so far: nothing is harder than assembling a strong team.',
    stat: '$2M pre seed · placeholder: your numbers',
  },
];
