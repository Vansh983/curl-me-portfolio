// Single source of truth for identity. Used by the HTML, the curl response,
// llms.txt, RSS, JSON-LD and the OG images, so none of them can drift.

export const profile = {
  name: 'Vansh Sood',
  role: 'Engineer and founder',
  // One sentence. Shows up in the hero, the meta description and the curl response.
  summary:
    'I build software companies. Started at 17 by winning Google Code-in, ran a studio through university, now working on AI for go to market at Floqer.',
  location: 'Halifax, Canada', // TODO confirm for 2026
  company: { name: 'Floqer', url: 'https://floqer.com' },

  // TODO confirm. docs/rebuild/05 flags this as likely outdated (vansh@floqer.com?).
  email: 'vanshsood@dal.ca',

  links: [
    { label: 'GitHub', href: 'https://github.com/Vansh983', handle: 'Vansh983' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/vanshsood/', handle: 'in/vanshsood' },
    { label: 'Resume', href: '/resume.pdf', handle: 'resume.pdf' },
  ],

  // sameAs for Person JSON-LD. Keep identical to the profiles that link back here.
  sameAs: [
    'https://github.com/Vansh983',
    'https://www.linkedin.com/in/vanshsood/',
  ],
} as const;

export const site = {
  url: 'https://vanshsood.com',
  title: `${profile.name}`,
  description: `${profile.name}. ${profile.role}. ${profile.summary}`,
} as const;
