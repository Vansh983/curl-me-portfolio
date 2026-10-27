import { lead, openings, chapters } from '../../data/story.ts';

export type ParagraphRef = readonly [chapter: string, paragraph: number];
export type PathStop = {
  id: string;
  name: string;
  x: number;
  width: number;
  scale: number;
  gapBefore?: number;
  description: string;
  paragraphs: readonly ParagraphRef[];
};

// Categories, not paragraph-sized scenes. Every paragraph occurs once. The
// shared story stays untouched; this mobile reading order keeps related work
// together, with graduation just before Floqer and Disrupt inside Floqer.
const groups: Omit<PathStop, 'x'>[] = [
  { id: 'delhi', name: 'Delhi', width: 440, scale: 1, description: 'The Delhi bedroom, Xbox and first website.', paragraphs: [['room', 0], ['lab', 0]] },
  { id: 'google', name: 'Google Code-in', width: 440, scale: 1, description: 'The Google San Francisco sign and Bay Bridge from Vansh’s visit, with his Code-in award.', paragraphs: [['google-code-in', 0], ['google-code-in', 1]] },
  { id: 'webcube', name: 'Webcube', width: 440, scale: 1, description: 'One Webcube workspace, with Covid Leads Delhi on the wall.', paragraphs: [['webcube', 0], ['webcube', 1]] },
  { id: 'university', name: 'Dalhousie', width: 440, scale: 1, gapBefore: 800, description: 'Arrival in Halifax and the blue glass of Dalhousie’s Goldberg Computer Science Building.', paragraphs: [['halifax', 0]] },
  { id: 'shiftkey', name: 'ShiftKey Labs', width: 350, scale: 0.8, description: 'Vansh teaches with a pointer at ShiftKey Labs, with students, the Generative AI diagram and a hackathon trophy.', paragraphs: [['shiftkey', 0], ['shiftkey', 1]] },
  { id: 'bean', name: 'Bean', width: 460, scale: 1, description: 'Bean’s kitchen beginnings, the Halifax–Sydney connection and Web Summit Vancouver. $40k in funding from Invest Nova Scotia Accelerate. Vansh sells with a laptop in hand beside the demo counter and signed MOU.', paragraphs: [['bean', 0], ['bean', 1], ['vancouver', 0], ['toronto', 0], ['volta', 0], ['volta', 2]] },
  { id: 'collect', name: 'Collect.', width: 440, scale: 1, description: 'Vansh presents with a microphone at Collect.’s Demo Day, with an audience under Volta’s ring lights and sloping windows.', paragraphs: [['vancouver', 1], ['volta', 1]] },
  { id: 'graduation', name: 'Graduation', width: 320, scale: 1, description: 'Vansh graduates from Dalhousie in 2026, wearing his cap and gown and carrying his computer science degree, just before the Floqer chapter.', paragraphs: [['degree', 0]] },
  { id: 'floqer', name: 'Floqer', width: 440, scale: 1, description: 'Floqer’s hacker house and Vansh’s work now. TechCrunch Disrupt is a small memento inside the same workspace.', paragraphs: [['toronto', 1], ['floqer', 0], ['floqer', 1], ['now', 0]] },
];

let distance = 0;
export const STOPS: PathStop[] = groups.map(group => {
  distance += group.gapBefore ?? 0;
  const stop = { ...group, x: distance };
  distance += group.width;
  return stop;
});
export const PATH_LENGTH = distance;
const university = STOPS.find(stop => stop.id === 'university')!;
export const TRANSIT = { start: university.x - university.gapBefore!, end: university.x };

const byId = new Map([...openings, ...chapters].map(chapter => [chapter.id, chapter.paras]));
export function paragraphsFor(stop: PathStop): string[] {
  return stop.paragraphs.map(([chapter, index]) => {
    const text = chapter === 'now' ? [lead.now][index] : byId.get(chapter)?.[index];
    if (!text) throw new Error(`Missing paragraph ${chapter}:${index} in ${stop.id}`);
    return text;
  });
}
