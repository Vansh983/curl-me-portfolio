import { profile } from './profile.ts';

export type AboutStop = 'delhi' | 'google' | 'webcube' | 'university' | 'shiftkey' | 'bean' | 'collect' | 'graduation' | 'floqer';
export type AboutTag = 'google' | 'cafe' | 'book' | 'artist' | 'games' | 'shows' | 'food';
export type AboutLink = 'floqer' | 'bean' | 'good-neighbour' | 'covid-leads' | 'webcube' | 'shiftkey' | 'shiftkey-community' | 'linkedin' | 'x' | 're-defined' | 'pankrit' | 'collect';
export type AboutPart =
  | { text: string; tag?: never; link?: never; rotating?: never }
  | { tag: AboutTag; text?: never; link?: never; rotating?: never }
  | { link: AboutLink; text?: never; tag?: never; rotating?: never }
  | { rotating: readonly [string, ...string[]]; text?: never; tag?: never; link?: never };
export type AboutParagraph = { id: string; stop: AboutStop; parts: readonly AboutPart[] };
type AboutCard = { name: string; image?: never; alt?: never } | { image: string; alt: string; name?: never };
type AboutRow = { label: string; shape: 'poster' | 'wide' | 'square'; cards: readonly AboutCard[]; note?: string };

export const ABOUT_LINKS: Record<AboutLink, { label: string; href: string; fill: string; ink: string }> = {
  // URL: profile.ts:11. Colour: stage/materials.ts, foamOrange on Floqer's mark.
  floqer: { label: 'Floqer', href: profile.company.url, fill: '#F83903', ink: '#111111' },
  // URL: profile.ts:12. Colour: stage-paint.ts, BEAN_ORANGE.
  bean: { label: 'Bean', href: profile.bean.url, fill: '#F26722', ink: '#111111' },
  // URL: projects.ts:31. Colour: curl-era:data/projects.ts:16, the darker end of its gradient.
  'good-neighbour': { label: 'The Good Neighbour App', href: 'https://apps.apple.com/us/app/good-neighbour-app/id1672741728', fill: '#058078', ink: '#FFFFFF' },
  // URL: projects.ts:121. Fill: curl-era:data/projects.ts:100, its darker pink; ink: tokens.css, the page's neutral #111111.
  'covid-leads': { label: 'Covid Leads Delhi', href: 'https://covidleads-delhi.vercel.app/', fill: '#FF9F9F', ink: '#111111' },
  // URL: owner, 2026-11-19. Colour: curl-era:public/assets/timeline/webcube.png, the logo's blue.
  webcube: { label: 'Webcube', href: 'https://webcube.in', fill: '#15499F', ink: '#FFFFFF' },
  // URL: checked 2026-11-19 (loads). Colour: stage-paint.ts, shiftkeyLabs mark's dark blue fold.
  shiftkey: { label: 'Shiftkey Labs', href: 'https://shiftkeylabs.ca/', fill: '#1C3D8C', ink: '#FFFFFF' },
  // URL: checked 2026-11-19 (loads), Shiftkey Labs open source organisation on GitHub. Colours: tokens.css, the page's neutral raised surface and text.
  'shiftkey-community': { label: 'open source', href: 'https://github.com/shiftkey-labs', fill: 'var(--raise)', ink: 'var(--tx)' },
  // URL: profile.ts:20. Fill: curl-era:public/assets/icons/linkedin.png, blue at (90, 178); ink: tokens.css, neutral #111111.
  linkedin: { label: 'LinkedIn', href: profile.links.find(link => link.label === 'LinkedIn')!.href, fill: '#3081ED', ink: '#111111' },
  // URL: profile.ts, handle from the owner 2026-11-21. Colours: X's own black and white.
  x: { label: 'X', href: profile.links.find(link => link.label === 'X')!.href, fill: '#000000', ink: '#FFFFFF' },
  // URL: projects.ts, Re-defined. Colours: tokens.css, the page's neutral raised surface and text.
  're-defined': { label: 'Re-defined', href: 'https://redefined.social/', fill: 'var(--raise)', ink: 'var(--tx)' },
  // URL: owner, 2026-11-24. Colours: tokens.css, the page's neutral raised surface and text.
  pankrit: { label: 'Pankrit', href: 'https://www.linkedin.com/in/pankrit-jindal/', fill: 'var(--raise)', ink: 'var(--tx)' },
  // URL: owner, 2026-11-24. Colours: tokens.css, the page's neutral raised surface and text.
  collect: { label: 'Collect.', href: 'https://www.collecthalifax.org/', fill: 'var(--raise)', ink: 'var(--tx)' },
};

export const ABOUT_GREETING = "Hi I'm Vansh,";
export const ABOUT_INTRO_PARAGRAPHS: readonly (readonly AboutPart[])[] = [[
  { text: 'a builder who likes to solve problems and turn them into products me and my friends wish we had.' },
], [
  { text: 'I currently lead Product and Engineering at ' }, { link: 'floqer' }, { text: ", building the knowledge layer for enterprise GTM teams and scaling it to millions of agents." },
], [
  { text: "You'll find me with my laptop at random cafes in Toronto every weekend. I brain dump on " }, { link: 'linkedin' }, { text: ' and automate my life more and more everyday.' },
]];
export const ABOUT_INTRO_PARTS: readonly AboutPart[] = ABOUT_INTRO_PARAGRAPHS.flatMap<AboutPart>((parts, index) => index === 0 ? parts : [{ text: ' ' }, ...parts]);
export const ABOUT_OPENING_PARTS: readonly AboutPart[] = [{ text: `${ABOUT_GREETING} ` }, ...ABOUT_INTRO_PARTS];

export const ABOUT_ROWS: Record<AboutTag, AboutRow> = {
  google: { label: 'Google Code In', shape: 'wide', cards: [
    { image: '/assets/stage/photos/google-award.jpg', alt: 'Vansh holding his Google Code-in grand prize award beside a screen with his name.' },
    { image: '/assets/stage/photos/google-sign.jpg', alt: 'Vansh beside the Google San Francisco sign, with the Bay Bridge behind him.' },
  ] },
  cafe: { label: '[cafe]', shape: 'wide', cards: [{ name: '[cafe]' }, { name: '[cafe]' }, { name: '[cafe]' }] },
  book: { label: '[book]', shape: 'poster', cards: [{ name: '[book]' }, { name: '[book]' }, { name: '[book]' }] },
  artist: { label: '[artist]', shape: 'square', cards: [{ name: '[artist]' }, { name: '[artist]' }, { name: '[album]' }] },
  games: { label: 'Call of Duty', shape: 'poster', cards: [{ name: 'Call of Duty' }, { name: '[game]' }, { name: '[game]' }], note: 'PlayStation: [id]' },
  shows: { label: '[show]', shape: 'poster', cards: [{ name: '[show]' }, { name: '[show]' }, { name: '[movie]' }, { name: '[movie]' }] },
  food: { label: '[food]', shape: 'wide', cards: [{ name: '[food]' }, { name: '[food]' }, { name: '[food]' }] },
};

export const ABOUT_PARAGRAPHS: readonly AboutParagraph[] = [
  { id: 'first-code', stop: 'delhi', parts: [{ text: 'I built my first website at 13, and started losing at hackathons after that. Then I became the Winner of ' }, { tag: 'google' }, { text: ' at 17.' }] },
  { id: 'webcube', stop: 'webcube', parts: [{ text: 'My entrepreneurial journey started at 17 with ' }, { link: 'webcube' }, { text: ", turning startups' ideas into software. In the two years I worked on it we made $140k in revenue, hired 25+ people and worked across 7 countries. It paid for my international tuition." }] },
  { id: 'dalhousie', stop: 'university', parts: [{ text: 'So I moved to Canada to study Computer Science at Dalhousie University. I was the teaching assistant for more than 8 courses. Every waking minute I was either working or studying.' }] },
  { id: 'uni-software', stop: 'university', parts: [{ text: 'In the first couple years of uni I worked as a freelance or contract developer for many teams: ' }, { link: 'good-neighbour' }, { text: ', ' }, { link: 're-defined' }, { text: ', Faculty of Computer Science, School of Health at Dalhousie and a bunch of startups in Halifax. I also did research on wearable tech at MyTech Lab and on Applied AI around education.' }] },
  { id: 'shiftkey', stop: 'shiftkey', parts: [{ text: 'I was the Student Ambassador for ' }, { link: 'shiftkey' }, { text: ', built the biggest ' }, { link: 'shiftkey-community' }, { text: ' community in Atlantic Canada and led entire courses around Generative AI and Cloud Computing, with more than 200 students attending and getting certified.' }] },
  { id: 'bean-beginnings', stop: 'bean', parts: [{ text: 'During all this ' }, { link: 'pankrit' }, { text: ' and I started ' }, { link: 'bean' }, { text: '. I travelled to Australia and spent two months in Sydney building it with him. Was growing and building it by living in different parts of Canada.' }] },
  { id: 'bean-launch', stop: 'collect', parts: [{ text: 'We raised a pre seed of a bit under $100k and made it to Product Hunt, Blackbird VC, Invest NS etc. We grew it to 10k users and had an okay exit.' }] },
  { id: 'startups-community', stop: 'collect', parts: [{ text: 'Before Bean I had built a bunch of failed products like GigEmpowr (100k impressions), ' }, { link: 'covid-leads' }, { text: ' (15k users), Acadri (AI Teaching Assistant), DoomStudy. I learnt a ton from them. I also hosted a lot of community events with Halifax as my playground and was part of Socratica as ' }, { link: 'collect' }] },
  { id: 'graduation', stop: 'graduation', parts: [{ text: 'I somehow graduated, and did not know what to do with my degree. I gained a lot from my university and most of it outside the piece of paper.' }] },
  { id: 'floqer', stop: 'floqer', parts: [{ text: 'I joined ' }, { link: 'floqer' }, { text: " as the Founding Engineer after school. I was offered a seat on a rocket and I took it. From the early days of building the initial infrastructure to growing to millions of requests, we're growing a ton." }] },
  { id: 'say-hi', stop: 'floqer', parts: [{ text: "If you see me working at your cafe, please come say hi, or shoot me a message on " }, { link: 'linkedin' }, { text: ' or ' }, { link: 'x' }, { text: ". I'm always happy to hop on a call." }] },
];
