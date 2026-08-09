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
    body: 'Software developer on Dalhousie research projects, including a tool tracking 15,000 medical placements across Nova Scotia. TA for computer science courses through 2025.',
  },
  {
    year: '2024', // TODO confirm the year you joined
    title: 'Floqer',
    body: 'Joined Floqer to run engineering. AI for go to market.',
  },
  {
    year: '2025',
    title: 'Bean',
    body: "Co-founded Bean with Pankrit Jindal: an AI cooking assistant that started as 'What's in your fridge?'. Backed by Invest Nova Scotia's Accelerate program. Also coordinated AI2Market, Dalhousie's applied AI program.",
  },
  {
    year: '2026',
    title: 'Web Summit',
    body: 'Took Bean to Web Summit Vancouver with the Nova Scotia delegation. Rebuilt this site.',
  },
];
