import { ABOUT_PARAGRAPHS, type AboutParagraph } from '../../data/about.ts';

export type PathStop = {
  id: string;
  name: string;
  x: number;
  width: number;
  scale: number;
  gapBefore?: number;
  description: string;
  paragraphs: readonly AboutParagraph[];
};

// The landmarks keep their geometry; both views now read the same about text.
const groups: Omit<PathStop, 'x' | 'paragraphs'>[] = [
  { id: 'delhi', name: 'Delhi', width: 440, scale: 1, description: 'The Delhi bedroom, Xbox and first website.' },
  { id: 'google', name: 'Google Code-in', width: 440, scale: 1, description: 'The Google San Francisco sign and Bay Bridge from Vansh’s visit, with his Code-in award.' },
  { id: 'webcube', name: 'Webcube', width: 440, scale: 1, description: 'One Webcube workspace, with Covid Leads Delhi on the wall.' },
  { id: 'university', name: 'Dalhousie', width: 440, scale: 1, gapBefore: 800, description: 'Arrival in Halifax and the blue glass of Dalhousie’s Goldberg Computer Science Building.' },
  { id: 'shiftkey', name: 'ShiftKey Labs', width: 350, scale: 0.8, description: 'Vansh teaches with a pointer at ShiftKey Labs, with students, the Generative AI diagram and a hackathon trophy.' },
  { id: 'bean', name: 'Bean', width: 460, scale: 1, description: 'Bean’s kitchen beginnings, the Halifax–Sydney connection and Web Summit Vancouver. $40k in funding from Invest Nova Scotia Accelerate. Vansh sells with a laptop in hand beside the demo counter and signed MOU.' },
  { id: 'collect', name: 'Collect.', width: 440, scale: 1, description: 'Vansh presents with a microphone at Collect.’s Demo Day, with an audience under Volta’s ring lights and sloping windows.' },
  { id: 'graduation', name: 'Graduation', width: 320, scale: 1, description: 'Vansh graduates from Dalhousie in 2026, wearing his cap and gown and carrying his computer science degree, just before the Floqer chapter.' },
  { id: 'floqer', name: 'Floqer', width: 440, scale: 1, description: 'Floqer’s hacker house and Vansh’s work now. TechCrunch Disrupt is a small memento inside the same workspace.' },
];

let distance = 0;
export const STOPS: PathStop[] = groups.map(group => {
  distance += group.gapBefore ?? 0;
  const stop = { ...group, x: distance, paragraphs: ABOUT_PARAGRAPHS.filter(paragraph => paragraph.stop === group.id) };
  distance += group.width;
  return stop;
});
export const PATH_LENGTH = distance;
const university = STOPS.find(stop => stop.id === 'university')!;
export const TRANSIT = { start: university.x - university.gapBefore!, end: university.x };

export function paragraphsFor(stop: PathStop): readonly AboutParagraph[] {
  return [...stop.paragraphs];
}
