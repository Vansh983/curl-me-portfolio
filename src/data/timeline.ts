// Drives the scroll-driven timeline. Adding a year is one entry here.
// No SVG paths, no pixel coordinates: that was what broke the old one.

export type Milestone = {
  year: string;
  title: string;
  body: string;
};

export const timeline: Milestone[] = [
  {
    year: '2018',
    title: 'Google Code-in',
    body: 'Won Google Code-in at 17. Google flew me to San Francisco. That trip is why I moved to Canada for computer science.',
  },
  {
    year: '2020',
    title: 'Webcube',
    body: 'Founded Webcube. Twenty five developers, six products in production, and MVPs that helped startups raise over $100,000.',
  },
  {
    year: '2022',
    title: 'Dalhousie',
    body: 'Moved to Halifax to study computer science. Student ambassador at Shiftkey Labs, then research in the Emerging Wireless Technologies Lab.',
  },
  {
    year: '2023',
    title: 'Research and shipping',
    body: 'Software developer on Dalhousie research projects, including a tool tracking 15,000 medical placements across Nova Scotia.',
  },
  {
    year: '2024', // TODO confirm the year you joined
    title: 'Floqer',
    body: 'Working on AI for go to market.',
  },
];
