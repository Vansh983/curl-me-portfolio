// The whole story in words, in the order the journey walks it. Drives /content
// and the phone variants under /v. First person, his facts only, in the voice
// of his LinkedIn posts; nothing here is invented. The starting (the 2010 room,
// the first website) is his to write and is not in this file yet.

export type Chapter = {
  id: string; // anchor
  year: string; // the big number
  span?: string; // "to 2024", "to now", "May"
  place: string; // city, company, programme
  title: string;
  paras: string[]; // short paragraphs, in order
  figures?: string[]; // one line of numbers and names, for the variants that show one
};

export const lead = {
  role: 'Head of Engineering at Floqer. Two-time founder. Toronto.',
  // "I currently do this": the slot the old site's first paragraph had, rewritten for now.
  now: "I'm the Head of Engineering at Floqer. Most of my time goes into building the agents that research companies and people so sales teams don't have to. The rest goes into hiring for the hacker house we work out of in downtown Toronto, and lately into writing here again.",
};

// The starting: the 2010 room and the 2013 lab. His to write; these placeholders
// stand in the rooms until he does. Not on /content, which begins at Code-in.
export const openings: Chapter[] = [
  {
    id: 'room',
    year: '2010',
    place: 'Delhi',
    title: 'Xbox 360 and zombies',
    paras: [
      'Before any code there was an Xbox 360 in a Delhi bedroom. Call of Duty zombies until the power cut, Spider-Man when it came back.',
    ],
  },
  {
    id: 'lab',
    year: '2013',
    place: 'Delhi',
    title: 'The first website',
    paras: [
      'Thirteen, white shirt and tie, the school computer lab. A W3Schools template with the colours changed, wireframes sketched in class, and it never really stopped.',
    ],
  },
];

export const chapters: Chapter[] = [
  {
    id: 'google-code-in',
    year: '2018',
    span: 'to 2019',
    place: 'Google Code-in',
    title: 'Grand prize at 17',
    paras: [
      'The journey began when I won Google Code-in at 17. For three months after school I did open source tasks for Drupal: a t-shirt and a logo first, then modules, Twig themes, a blog distribution, patches. Out of 3,500 students Drupal picked two grand prize winners and I was one of them.',
      'Google flew me and my dad to San Francisco in June 2019. Mountain View, the Cloud office in Sunnyvale, Stanford. It was my first flight out of India, and it is the reason I moved across the world to study computer science.',
    ],
    figures: ['Drupal', '3,500 students', 'Mountain View, June 2019'],
  },
  {
    id: 'webcube',
    year: '2020',
    span: 'to 2024',
    place: 'Webcube, Delhi',
    title: 'Dropped out to build Webcube',
    paras: [
      'Back in Delhi I started a B.Tech at MSIT and dropped out six months in to build Webcube. Startups brought the ideas, we built the software. I was 17 and solo. It grew to 45 companies across seven countries, $140K in revenue and 25 developers at the peak, and I kept running it through university.',
      'When Covid hit Delhi we built Covid Leads Delhi: 52 volunteers connecting patients with beds, oxygen and plasma. 20,000 people used it in two months.',
    ],
    figures: ['$140K revenue', '45 companies', '7 countries', '20,000 people'],
  },
  {
    id: 'halifax',
    year: '2022',
    place: 'Halifax',
    title: 'Dalhousie',
    paras: [
      'In January 2022 I moved to Halifax for computer science at Dalhousie. Within the year I was a Student Ambassador at ShiftKey Labs, a research assistant in the Emerging Wireless Technologies Lab under Dr. Srinivas Sampalli, and interim CTO at Re-Defined, which reached 30,000 people in five countries.',
    ],
    figures: ['Dalhousie', 'ShiftKey Labs', 'Re-Defined'],
  },
  {
    id: 'shiftkey',
    year: '2022',
    span: 'to 2025',
    place: 'ShiftKey Labs',
    title: 'Everything tech, AI, teaching, open source',
    paras: [
      'I stayed at ShiftKey Labs for three years doing everything tech, AI, teaching and open source. We built the biggest open source tech community in Atlantic Canada: 8 hackathons, 45 workshops, 3,500 people, and a Generative AI course I taught to 130 students.',
      'On the side I built a placement dashboard 30 professors use daily, a cancer risk system off legacy code, a community app for a few thousand people, and Gig Empower so international students could freelance. LinkedIn made me a Top Voice for that one. I also won 10 of the 25 hackathons I entered.',
    ],
    figures: ['3,500 taught', '10 hackathon wins', 'Top Voice 2024'],
  },
  {
    id: 'bean',
    year: '2024',
    span: 'to 2026',
    place: 'Bean',
    title: 'Co-founded Bean',
    paras: [
      'In 2024 Pankrit Jindal and I started Bean, him in Sydney and me in Halifax. It began as "what is in your fridge" and became a cooking assistant for busy parents who were tired of deciding what to make. 700 parents, 250 interviews, thousands of users.',
      "We got into Invest Nova Scotia's Accelerate and hit number four on Product Hunt. Two years, then an exit.",
    ],
    figures: ['10k users', '#4 Product Hunt', '$40k Invest NS'],
  },
  {
    id: 'vancouver',
    year: '2025',
    span: 'May',
    place: 'Vancouver',
    title: 'Web Summit, laptop in hand',
    paras: [
      'May 2025, Web Summit Vancouver, my first tech conference. We showed Bean for a day: more than 500 conversations, 120 signups, three investors interested, an MOU signed, bugs fixed in every queue.',
      'I also sat in on my first Socratica session and left thinking Halifax needed one.',
    ],
    figures: ['500 conversations', '120 signups', '1 MOU'],
  },
  {
    id: 'toronto',
    year: '2025',
    span: 'October',
    place: 'Toronto',
    title: 'Elevate, and a seat on a rocket',
    paras: [
      'October 2025, Elevate in Toronto with the Startup Atlantic delegation. On day zero I messaged every investor in reach and booked eight calls. By day two I was tired of the shiny meetings and went to a cafe to work on churn instead.',
      'Then Startup Open House: DMZ, and a hacker house downtown called Floqer. Zaaheda told me if someone offers you a seat on a rocket, you take it. I booked flights and moved in ten days.',
    ],
    figures: ['Startup Atlantic', 'DMZ', 'Floqer, October 2025'],
  },
  {
    id: 'volta',
    year: '2025',
    span: 'to 2026',
    place: 'Halifax',
    title: 'Invest NS, Volta, Collect.',
    paras: [
      'Back in Halifax, Bean got into Invest Nova Scotia Accelerate: one of twelve startups, one of two consumer companies, $40k over five months.',
      "Noah, Sam and I started Collect., Halifax's Socratica node, at Volta every Thursday. It went from a handful of builders to almost a hundred, and the Demo Day packed the space.",
      "Bean's Product Hunt launch fired a week early on a Saturday and still finished at number four with 242 upvotes.",
    ],
    figures: ['Invest NS Accelerate', 'Collect.', '#4 Product Hunt'],
  },
  {
    id: 'degree',
    year: '2026',
    place: 'Dalhousie',
    title: 'The degree',
    paras: [
      'In 2026 I walked the stage at Dalhousie with Tobi, Prannat and Théo. Four and a half years, not many classes, and I did not learn much CS from the degree. It was never about that. Every opportunity I got started with "I\'m doing CS at Dal", and the degree is the reason I came to Halifax in the first place.',
    ],
    figures: ['BSc Computer Science', 'Dalhousie', '2026'],
  },
  {
    id: 'floqer',
    year: '2025',
    span: 'to now',
    place: 'Floqer, Toronto',
    title: 'Head of Engineering at Floqer',
    paras: [
      'I joined Floqer as a founding engineer in October 2025 and have been Head of Engineering since April 2026. Floqer started in Halifax, two Dal grads, and is now the autonomous customer knowledge platform: a $2M pre seed, a thousand customers including Perplexity, Wise and AngelList, cash flow positive, eight of us in the house.',
      'This October we made the Top 20 at TechCrunch Disrupt Startup Battlefield and pitched in San Francisco, my first time back in six years.',
    ],
    figures: ['$2M pre seed', '1,000+ customers', 'Disrupt Top 20'],
  },
];
