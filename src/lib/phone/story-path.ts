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
  { id: 'shiftkey', name: 'ShiftKey Labs', width: 590, scale: 0.7, description: 'Vansh teaches with a pointer in a packed ShiftKey Labs lecture hall. Four tiers seat 24 students at laptops, while a late student enters beside a rainy window. The projector cycles through Generative AI, Cloud Computing, live code and github.com/shiftkey-labs pull requests. A handwritten whiteboard reads 200+ certified, Generative AI, Cloud Computing, open source, hackathons and AI2Market. The room has the ShiftKey mark, a clock, a lectern with a laptop and certificates, a recording camera, a trophy shelf, bags and coffee cups.' },
  { id: 'bean', name: 'Bean', width: 674, scale: 0.7, description: 'A Sydney harbour mark leads into the room where Vansh and Pankrit build Bean. Vansh holds his open laptop beside their desk, with two laptops, mugs and cables. A compact stove steams beneath a pantry shelf beside the Bean mark, a door and suitcase. The handwritten whiteboard maps pantry, recipes, the week and shopping, lists the launch checklist and reads $100k pre seed. A harbour window changes from day to evening as a ferry passes, with a #4 Product of the Day, Product Hunt card below. A large phone cycles Recipes, This week, Pantry and Shopping. A plane flies from Sydney and bounces through Vancouver, Toronto and Montréal.' },
  { id: 'collect', name: 'Volta community', width: 552, scale: 0.65, description: 'Vansh hosts a community gathering at Volta with a microphone, beneath ring lights and sloping glass overlooking Halifax harbour. Builders work at shared tables, share a laptop, talk in pairs and arrive through the door. A small Collect. screen carries Socratica’s mark beside the Volta sign, with an Invest Nova Scotia Accelerate plaque, a ShiftKey lanyard and an AI2Market card in the room. The harbour turns to evening as a ferry passes.' },
  { id: 'graduation', name: 'Graduation', width: 440, scale: 1, description: 'Vansh stands alone on the convocation stage in cap and gown, holding a rolled degree tied with a gold bow. Dalhousie University’s crest and wordmark hang above Computer Science and 2026. Green curtains move gently in warm stage light, beside a lectern, steps and a potted plant.' },
  { id: 'floqer', name: 'Floqer', width: 420, scale: 0.68, description: 'Floqer’s open two-floor rooms. Upstairs, Vansh works from behind in a hoodie and headphones at two large monitors beside a small bed and a black floor lamp, with the Floqer logo on the inside wall. Downstairs, empty trestle desks and chairs face the garden, beside the foam F, a sticky-note whiteboard, sofa, bean bag, drink cases and one Floqer box. A stair and landing join the floors. The walker finishes on the ground just right of the rooms, in front of Toronto’s skyline. A rocket follows a dotted arc across the rooms and behind the CN Tower as night falls and a streetcar passes.' },
];

let distance = 0;
export const STOPS: PathStop[] = groups.map(group => {
  distance += group.gapBefore ?? 0;
  const stop = { ...group, x: distance, paragraphs: ABOUT_PARAGRAPHS.filter(paragraph => paragraph.stop === group.id) };
  distance += group.width;
  return stop;
});
// Floqer's skyline extends into the final pavement, leaving the fixed links
// clear of its upstairs desk and inside logo without moving the links post.
export const PATH_LENGTH = distance + 180;
const floqer = STOPS.find(stop => stop.id === 'floqer')!;
// The final text anchor ends on pavement beyond the room's x=594 right edge.
export const WALK_END = floqer.x + 20 + 650 * floqer.scale;
const university = STOPS.find(stop => stop.id === 'university')!;
export const TRANSIT = { start: university.x - university.gapBefore!, end: university.x };

export function paragraphsFor(stop: PathStop): readonly AboutParagraph[] {
  return [...stop.paragraphs];
}
