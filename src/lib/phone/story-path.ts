// Places graphic landmarks and their shared paragraphs along one path.
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
  { id: 'toronto-cafe', name: 'Toronto cafe', width: 780, scale: 1, description: 'The pale Floqer house stands on the left, with its sign above a window where Vansh works at two monitors in a hoodie and headphones. The Toronto skyline, CN Tower, Rogers Centre, elevated GO train, red streetcar, stop and tree sit in the middle. On the right, a cafe has an empty outdoor table and chair, with a raccoon beside a green bin.' },
  { id: 'delhi', name: 'Delhi', width: 440, scale: 1, description: 'The Delhi bedroom, Xbox and first website, with a large Spider-Man mask poster and Steve Jobs in a black turtleneck holding up a phone on a dark keynote stage, with a screen glowing behind him.' },
  { id: 'google', name: 'Google Code-in', width: 390, scale: 1, description: 'The Google San Francisco sign stands beside the Bay Bridge and a swaying tree, with planting in the foreground.' },
  { id: 'webcube', name: 'Webcube', width: 440, scale: 1, description: 'A Webcube workspace with a handwritten whiteboard showing $140k, 25+ and 7 countries, a CRT, a flat monitor, two Red Bull cans and desk clutter. Day turns to night outside while the flat monitor cycles through a big meeting, code, the Webcube page, a small meeting, a kanban board and a spreadsheet.' },
  { id: 'university', name: 'Dalhousie', width: 610, scale: 1, gapBefore: 800, description: 'A low ironstone wall sign bearing the Dalhousie University crest and wordmark stands before the blue-glass Goldberg Computer Science Building. The building’s name is centred below its window grid, while three students with backpacks walk past in both directions.' },
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
// Empty pavement lets the last landmark and walker stop before the fixed links.
export const PATH_LENGTH = distance + 180;
export const WALK_END = distance - 60;
const university = STOPS.find(stop => stop.id === 'university')!;
export const TRANSIT = { start: university.x - university.gapBefore!, end: university.x };

export function paragraphsFor(stop: PathStop): readonly AboutParagraph[] {
  return [...stop.paragraphs];
}
