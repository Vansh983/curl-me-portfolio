// Ported from the old site (curl-era branch: data/projects.ts + data/archive.ts).
// Fixes applied on migration: placeholder ["tag1","tag2","tag3"] tags replaced with the
// real ones from archive.ts, the Prodigy Music entry no longer points at lumenore.com,
// dead "#" links are null, and two typos are corrected. Where the two old files
// disagreed on a year, archive.ts wins.

export type Project = {
  title: string;
  year: string;
  url: string | null;
  tags: string[];
  category: string[];
  featured?: boolean;
  description?: string;
};

export const projects: Project[] = [
  {
    title: 'The Good Neighbour App',
    year: '2023',
    url: 'https://apps.apple.com/us/app/good-neighbour-app/id1672741728',
    tags: ['React Native', 'Expo', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
    category: ['Mobile', 'Web', 'Cloud'],
    featured: true,
    description:
      'Raised $45k, launched on both stores with 200+ active users, and cut server costs 40% with a rebuilt AWS backend.',
  },
  {
    title: 'Re-New: AI mental health app',
    year: '2023',
    url: 'https://devpost.com/software/uofthacks-x',
    tags: ['NLP', 'React Native', 'TypeScript', 'Python', 'Flask', 'AWS'],
    category: ['Mobile', 'Machine Learning', 'Cloud'],
    featured: true,
    description:
      'Built at UofT Hacks with Cohere NLP. Recognised as the most stable MVP among 150+ teams.',
  },
  {
    title: 'Atlantic Canada data analysis tool',
    year: '2023',
    url: 'https://foh-dashboard.vercel.app/',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL', 'Python'],
    category: ['Web'],
    featured: true,
    description:
      'Tracks 15,000 medical student placements across Nova Scotia for Dalhousie, behind faculty-only access.',
  },
  {
    title: 'Re-defined',
    year: '2023',
    url: 'https://redefined.social/',
    tags: ['Next.js', 'TypeScript', 'Sanity', 'Vercel'],
    category: ['Web'],
    featured: true,
    description:
      'Platform for a Canadian non-profit reaching 30,000 people across five countries and 1,600 students.',
  },
  {
    title: 'Waqalat: legal document generator',
    year: '2022',
    url: 'https://waqalat-web.vercel.app/',
    tags: ['Next.js', 'TypeScript', 'Redux', 'PostgreSQL', 'AWS'],
    category: ['Web', 'Cloud'],
    featured: true,
    description: 'Generates personal legal documents as PDFs, with S3 storage behind it.',
  },
  {
    title: 'Multiplayer terminal RPG',
    year: '2022',
    url: 'https://github.com/Vansh983/clash-rpg',
    tags: ['Java', 'CLI'],
    category: ['CLI'],
    featured: true,
    description: 'Two player role playing game in the terminal. Character select, attacks, all in Java.',
  },
  {
    title: 'Q-learning 3D maze solver',
    year: '2022',
    url: 'https://github.com/Vansh983/room-problem',
    tags: ['C#', 'Machine Learning', 'Blender'],
    category: ['Machine Learning'],
  },
  {
    title: 'Anatomy Guru',
    year: '2021',
    url: 'https://anatomyguru.in/',
    tags: ['Node.js', 'JavaScript', 'Docker', 'Nginx', 'MongoDB'],
    category: ['Web'],
    featured: true,
    description: 'Full LMS for an MBBS and BDS coaching centre, shipped on Docker and Digital Ocean.',
  },
  {
    title: 'Urbanwoven: AR virtual try-on',
    year: '2021',
    url: 'https://utique-web.vercel.app/',
    tags: ['React Native', 'Node.js', 'Python', 'Flask', 'Computer Vision', 'AWS'],
    category: ['Web', 'Machine Learning', 'Mobile', 'Cloud'],
  },
  {
    title: 'Nutrition Defined',
    year: '2020',
    url: 'https://www.nutritiondefined.in/',
    tags: ['Next.js', 'TypeScript', 'Firebase', 'Vercel'],
    category: ['Web', 'Mobile'],
    featured: true,
    description: 'Nutritionist platform with a reward-based health score and a custom admin panel.',
  },
  {
    title: 'Covid-19 resource platform',
    year: '2020',
    url: 'https://covidleads-delhi.vercel.app/',
    tags: ['Next.js', 'JavaScript', 'Firebase', 'GCP'],
    category: ['Web'],
    featured: true,
    description:
      'Live verified leads for essentials during the Delhi wave. 20,000+ people reached, 52 volunteers.',
  },
  {
    title: 'Tech and Drupal blog',
    year: '2020',
    url: 'https://blog.vanshsood.com/',
    tags: ['Drupal', 'PHP', 'MySQL', 'JavaScript'],
    category: ['Web'],
    featured: true,
    description: 'Notes on open source modules and whatever I was breaking at the time.',
  },
  {
    title: 'Dalhousie CS Leaders Society site',
    year: '2023',
    url: 'https://csl-dal.vercel.app/',
    tags: ['Next.js', 'TypeScript', 'Tailwind'],
    category: ['Web'],
  },
  {
    title: 'Thapar University permissions platform',
    year: '2023',
    url: 'https://thapar-permissions.vercel.app/',
    tags: ['Next.js', 'TypeScript', 'PostgreSQL'],
    category: ['Web'],
  },
  {
    title: 'Cancer risk prediction dashboard',
    year: '2023',
    url: null,
    tags: ['React', 'Java', 'JHipster', 'MariaDB', 'Docker'],
    category: ['Web', 'Machine Learning'],
  },
  {
    title: 'EduLeague: career counselling concept',
    year: '2023',
    url: null,
    tags: ['Figma', 'Design'],
    category: ['Web'],
  },
  {
    title: 'Applicant tracking system, Hindu College',
    year: '2019',
    url: 'https://abhyas-web.vercel.app/',
    tags: ['React', 'JavaScript', 'Firebase', 'Redux', 'GCP'],
    category: ['Web'],
  },
  {
    title: 'Chemistsmart',
    year: '2019',
    url: 'https://chemistsmart.com/',
    tags: ['Next.js', 'JavaScript', 'Redux', 'AWS', 'Jenkins'],
    category: ['Web', 'Cloud'],
  },
  {
    title: 'Lumenore BI dashboard',
    year: '2019',
    url: 'https://lumenore.com/',
    tags: ['JavaScript', 'Bootstrap', 'REST'],
    category: ['Web'],
  },
  {
    title: 'Prodigy Music',
    year: '2019',
    url: null, // old data pointed this at lumenore.com
    tags: ['React', 'JavaScript', 'Node.js', 'MongoDB'],
    category: ['Web'],
  },
  {
    title: 'FlipX: sneaker bidding platform',
    year: '2019',
    url: 'https://flipx.vanshsood.com/',
    tags: ['PHP', 'JavaScript', 'MySQL', 'Apache'],
    category: ['Web'],
  },
  {
    title: 'Gateway 2019 tech fest',
    year: '2019',
    url: 'https://gateway.vanshsood.com',
    tags: ['JavaScript', 'HTML', 'CSS', 'Bootstrap'],
    category: ['Web'],
  },
  {
    title: 'High school LMS with assistant',
    year: '2019',
    url: 'https://e-school.vanshsood.com',
    tags: ['Python', 'Django', 'JavaScript', 'Bootstrap'],
    category: ['Web'],
  },
  {
    title: 'ELXR: emergency response app',
    year: '2019',
    url: 'https://www.behance.net/gallery/96726605/P2P-Emergency-app-UIUX-design-concept',
    tags: ['Figma', 'Design'],
    category: ['Mobile'],
  },
  {
    title: 'Stellar: modular smartphone landing page',
    year: '2018',
    url: 'https://stellar.vanshsood.com',
    tags: ['HTML', 'CSS', 'JavaScript', 'jQuery'],
    category: ['Web'],
  },
  {
    title: 'Flutter world clock',
    year: '2018',
    url: 'https://github.com/Vansh983/world-clock',
    tags: ['Flutter', 'Dart', 'REST'],
    category: ['Mobile'],
  },
  {
    title: 'ClarOS: digital learning platform',
    year: '2018',
    url: 'https://claros.vanshsood.com/',
    tags: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
    category: ['Web'],
  },
  {
    title: 'Vintage portfolio',
    year: '2018',
    url: null,
    tags: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
    category: ['Web'],
  },
  {
    title: 'Toony: animated video streaming',
    year: '2017',
    url: 'https://toony.vanshsood.com/',
    tags: ['JavaScript', 'Bootstrap', 'jQuery', 'REST'],
    category: ['Web'],
  },
  {
    title: 'macOS High Sierra landing page concept',
    year: '2017',
    url: 'https://macos.vanshsood.com/',
    tags: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
    category: ['Web'],
  },
  {
    title: 'Taurus: search engine interface',
    year: '2017',
    url: 'https://taurus.vanshsood.com/',
    tags: ['JavaScript', 'HTML', 'CSS', 'jQuery'],
    category: ['Web'],
  },
];

export const featured = projects.filter((p) => p.featured);
export const byYear = [...projects].sort((a, b) => Number(b.year) - Number(a.year));
export const categories = ['Web', 'Mobile', 'Cloud', 'Machine Learning', 'CLI'] as const;
