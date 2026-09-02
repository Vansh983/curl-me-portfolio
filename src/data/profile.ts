// Single source of truth for identity. Used by the HTML, the curl response,
// llms.txt, RSS, JSON-LD and the OG images, so none of them can drift.

export const profile = {
  name: 'Vansh Sood',
  role: 'Head of Engineering at Floqer. Two-time founder.',
  // One sentence. Shows up in the hero, the meta description and the curl response.
  summary:
    'Google Code-in grand prize at 17. Founded Webcube at 17 and grew it to $200K across 45 companies. Co-founded Bean, number four on Product Hunt. Now the orchestration engine behind enterprise GTM automation at Floqer.', // from LinkedIn, 2026-09-01
  location: 'Toronto, Canada', // Floqer's hacker house downtown, per LinkedIn 2026
  company: { name: 'Floqer', url: 'https://floqer.com' }, // head of engineering, not founder
  bean: { name: 'Bean', url: 'https://beantheapp.com' }, // co-founder and CTO, with Pankrit Jindal

  // TODO confirm. docs/rebuild/05 flags this as likely outdated (vansh@floqer.com?).
  email: 'vanshsood@dal.ca',

  links: [
    { label: 'GitHub', href: 'https://github.com/Vansh983', handle: 'Vansh983' },
    // TODO confirm handle: Vansh gave /in/vanshsood9, the web still shows /in/vanshsood
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
