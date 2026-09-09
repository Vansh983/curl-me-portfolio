// Drives the journey on the homepage. One entry per chapter, in order.
// Words are placeholders until the LinkedIn export lands; the shape is what matters.
// The 3D stage's sets live in src/lib/stage/sets.ts and sit on the first chapters.

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
    // now: the hero slot replaces these words on the page; the stage's first set is this desk
    year: 'Now',
    lane: 'Toronto',
    title: 'Building Floqer',
    body: 'A desk by a big window, thirty floors up. Two screens, a laptop, the CN Tower.',
  },
  {
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
    body: 'Months of open source work for the Drupal Association, then one of 52 winners worldwide. Google flew me and my dad to San Francisco: Mountain View, the Cloud office in Sunnyvale, Stanford. My first flight out of India, and the reason I moved across the world for computer science.',
    stat: '52 winners · Drupal · Mountain View, June 2019',
    mark: '/assets/timeline/google.png',
  },
  {
    year: '2020',
    span: 'to 24',
    lane: 'Webcube',
    title: 'A studio, founded at 17',
    body: 'Startups brought ideas, we shipped the software. Solo founded in New Delhi at 17 and run through university: 45 portfolio companies across six countries, 25 developers at the peak. The same year, Covid Leads Delhi connected 20,000 people with beds and oxygen in two months.',
    stat: '$200K revenue · 45 companies · 6 countries · 20,000 people helped',
    mark: '/assets/timeline/webcube.png',
  },
  {
    year: '2022',
    span: 'to 25',
    lane: 'Halifax',
    title: 'Dalhousie and ShiftKey Labs',
    body: 'Moved to Halifax for computer science. Technical lead at ShiftKey Labs for three years: the biggest open source community in Atlantic Canada, curriculums that put certificates in hundreds of hands, hackathons, and AI2Market. Research in the Emerging Wireless Technologies Lab on the side.',
    stat: '3 years · hundreds certified · Atlantic Canada',
    mark: '/assets/timeline/dal.png',
  },
  {
    year: '2023',
    span: 'to 24',
    lane: 'Research, product, community',
    title: 'Everything at once',
    body: 'A placement dashboard for the School of Health Administration that 30 professors use daily. A cancer risk prediction system moved off legacy code. A community app scaled to thousands. Interim CTO at Re-Defined, reaching 30,000 people in five countries. Gig Empower, so international students could freelance instead of waiting for internships: LinkedIn made me a Top Voice for it.',
    stat: '30 profs · 30,000 people · 7 placements · Top Voice',
  },
  {
    year: '2024',
    span: 'to 26',
    lane: 'Bean',
    title: 'Co-founded Bean',
    body: 'Co-founder and CTO with Pankrit Jindal. Started as "what is in your fridge", became a cooking assistant thousands of people used. Number four on Product Hunt, backed by Invest Nova Scotia, showcased at Web Summit Vancouver: 500 conversations, 120 signups and an investor MOU in a day. Two years, start to finish.',
    stat: '#4 Product Hunt · Invest NS Accelerate · Web Summit Vancouver',
  },
  {
    year: '2025',
    lane: 'Vancouver · Toronto · Halifax',
    title: 'Bean on the road',
    body: 'Laptop in hand across Canada. Web Summit Vancouver: 500 conversations, 120 signups and an investor MOU in a day, and a first taste of Socratica. Elevate in Toronto with the Startup Atlantic delegation: eight investor calls booked in a day, then a cafe and the churn problem instead of the shiny meetings. Invest Nova Scotia Accelerate, one of twelve. Collect. at Volta every Thursday, from a handful of builders to a packed Demo Day.',
    stat: 'Web Summit · Elevate · Invest NS Accelerate · Collect. Demo Day',
  },
  {
    year: '2025',
    span: 'to now',
    lane: 'Floqer',
    title: 'Head of Engineering at Floqer',
    body: 'Founding engineer in October 2025, head of engineering since April 2026, building the orchestration engine behind enterprise go to market automation from a hacker house in downtown Toronto. A $2M pre seed, customers like Wise and Perplexity, and a seat at TechCrunch Disrupt Startup Battlefield. Small team, hard problems.',
    stat: '$2M pre seed · Wise, Perplexity, AngelList · Disrupt 2026',
  },
];
