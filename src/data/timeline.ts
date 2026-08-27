// Drives the journey on the homepage. One entry per chapter, in order.
// Words are placeholders until the LinkedIn export lands; the shape is what matters.
// The 3D stage's stations live in src/lib/stage/world.ts and sit on the first chapters.

export type Milestone = {
  year: string; // the big number in the gutter
  span?: string; // "to 22", "to now": shown under the year
  lane?: string; // small mono label above the title: place, company, theme
  title: string;
  body: string;
  stat?: string; // one line of numbers, mono, optional
  mark?: string; // small logo in the gutter, /assets/timeline/*.png, optional
};

export const timeline: Milestone[] = [
  {
    // Placeholder words until the story markdown lands; the scene is the point.
    year: '2010',
    lane: 'Delhi',
    title: 'Xbox 360 and zombies',
    body: 'Before any code there was an Xbox 360 in a Delhi bedroom. Call of Duty zombies until the power cut, Spider-Man when it came back.',
  },
  {
    year: '2013',
    lane: 'Delhi',
    title: 'The first website',
    body: 'Thirteen, white shirt and tie, the school computer lab. A W3Schools template with the colours changed, wireframes sketched in class, and it never really stopped.',
  },
  {
    year: '2018',
    lane: 'Google Code-in',
    title: 'Grand prize at 17',
    body: 'Google flew me to San Francisco. That trip is the reason I moved across the world for computer science.',
    mark: '/assets/timeline/google.png',
  },
  {
    year: '2020',
    span: 'to 22',
    lane: 'Webcube',
    title: 'A studio in first year',
    body: 'Startups brought ideas, we shipped the software. Twenty five developers at the peak. The same year a Covid resource platform for Delhi reached 20,000 people with 52 volunteers.',
    stat: '25 developers · 6 products live · $100K+ raised on our MVPs',
    mark: '/assets/timeline/webcube.png',
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
