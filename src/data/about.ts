import { profile } from './profile.ts';

export type AboutStop = 'delhi' | 'google' | 'webcube' | 'university' | 'shiftkey' | 'bean' | 'collect' | 'graduation' | 'floqer';
export type AboutTag = 'football' | 'google' | 'cafe' | 'book' | 'artist' | 'games' | 'shows' | 'food';
export type AboutLink = 'floqer' | 'bean' | 'good-neighbour';
export type AboutPart = { text: string; tag?: never; link?: never } | { tag: AboutTag; text?: never; link?: never } | { link: AboutLink; text?: never; tag?: never };
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
};

export const ABOUT_GREETING = "Hi I'm Vansh,";
export const ABOUT_INTRO_PARTS: readonly AboutPart[] = [
  { text: "I'm currently the Head of Engineering at " }, { link: 'floqer' },
  { text: ". I build agents that research companies and people so sales teams don't have to." },
];
export const ABOUT_OPENING_PARTS: readonly AboutPart[] = [{ text: `${ABOUT_GREETING} ` }, ...ABOUT_INTRO_PARTS];

export const ABOUT_ROWS: Record<AboutTag, AboutRow> = {
  football: { label: 'football', shape: 'poster', cards: [{ name: '[photo of me playing]' }, { name: '[photo of me playing]' }, { name: '[Messi]' }] },
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
  { id: 'first-code', stop: 'delhi', parts: [{ text: 'I started writing code when I was like 13. I went to hackathons, won competitions and used to play ' }, { tag: 'football' }, { text: ' at that point in time.' }] },
  { id: 'code-in', stop: 'google', parts: [{ text: 'Winning those led to me becoming the Winner of ' }, { tag: 'google' }, { text: ' at the age of 17. This achievement, recognized by a fully sponsored trip to San Francisco by Google, ignited my passion for coding and catalyzed my decision to move to Canada for studying Computer Science.' }] },
  { id: 'webcube', stop: 'webcube', parts: [{ text: "Then I started my first company. My entrepreneurial endeavors started with Webcube, transforming startups' ideas into business solutions via software, managing a team of 25+ developers and six production-level projects. I've assisted over 20 startups, aiding in securing $100,000+ in funding through MVP development." }] },
  { id: 'covid-leads', stop: 'webcube', parts: [{ text: 'During Covid I developed a full-stack application with live updates across India for 20k+ users and deployed a digital platform with 52 volunteers providing verified leads for essentials.' }] },
  { id: 'dalhousie', stop: 'university', parts: [{ text: 'I moved to Canada to study Computer Science at Dalhousie University. I soon became the Student Ambassador for Shiftkey Labs, where I began hosting enriching workshops for fellow university students. The year culminated in me joining the Emerging Wireless Technologies Lab at Dalhousie University under the esteemed guidance of Dr. Srinivas Sampalli.' }] },
  { id: 'shiftkey', stop: 'shiftkey', parts: [{ text: 'As an intern and Software Developer at Dalhousie University, I contributed to various research projects and built a community to help students worldwide leverage freelancing for financial independence. I barely managed to attend classes.' }] },
  { id: 'along-the-way', stop: 'shiftkey', parts: [{ text: 'Along the way I led the development of ' }, { link: 'good-neighbour' }, { text: ', which raised $45k and launched on Android and iOS, built an online platform for a non-profit impacting over 30k people across 5 countries, and a data analysis tool for Dalhousie managing over 15,000 medical student placements across Nova Scotia. I also travelled to [places].' }] },
  { id: 'bean-beginnings', stop: 'bean', parts: [{ text: 'In 2024 Pankrit Jindal and I started ' }, { link: 'bean' }, { text: ', him in Sydney and me in Halifax. It began as "what is in your fridge" and became a cooking assistant for busy parents who were tired of deciding what to make. 700 parents, 250 interviews, thousands of users.' }] },
  { id: 'bean-launch', stop: 'collect', parts: [{ text: "We got into Invest Nova Scotia's Accelerate and showed " }, { link: 'bean' }, { text: ' at Web Summit Vancouver, my first tech conference: more than 500 conversations in a day, 120 signups and an MOU signed. We hit number four on Product Hunt. Two years, then an exit.' }] },
  { id: 'floqer', stop: 'floqer', parts: [{ text: 'In October 2025 I joined ' }, { link: 'floqer' }, { text: ' as a founding engineer and moved into its hacker house in downtown Toronto. I have been Head of Engineering since April 2026.' }] },
  { id: 'cafes', stop: 'floqer', parts: [{ text: 'When I need out of the house I work from ' }, { tag: 'cafe' }, { text: ' or [cafe].' }] },
  { id: 'reading', stop: 'floqer', parts: [{ text: "I'm reading " }, { tag: 'book' }, { text: '.' }] },
  { id: 'listening', stop: 'floqer', parts: [{ text: 'I listen to a lot of ' }, { tag: 'artist' }, { text: '.' }] },
  { id: 'playing', stop: 'floqer', parts: [{ text: 'I play ' }, { tag: 'games' }, { text: ' a couple hours a week to wind down.' }] },
  { id: 'watching', stop: 'floqer', parts: [{ text: "I'm watching " }, { tag: 'shows' }, { text: '. The last movie I loved was [movie].' }] },
  { id: 'eating', stop: 'floqer', parts: [{ text: 'I will always say yes to ' }, { tag: 'food' }, { text: '.' }] },
];
