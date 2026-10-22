// The things he picks up or looks at in the Walk (docs/rebuild/50). A placement in sets.ts names one by its `thing` key;
// the words here are his own, from the captions and the cards (timeline.ts). `hand`: lifted into the hand and turned;
// `look`: the eye eases to it. `photos` are the real files in public/assets/stage/photos. Nothing is written at run time.
export interface Thing {
  title: string;
  lane: string; // a small mono line: the place and the year
  lines: string[]; // two to five lines, his words
  photos?: string[];
  href?: string;
  kind: 'hand' | 'look';
  back?: string; // what the back of a lifted thing says, when it has one
}

export const THINGS: Record<string, Thing> = {
  // 0: the apartment, Toronto, now
  award: {
    title: 'Google Code-in 2018. Grand prize.', lane: 'Toronto · now', kind: 'hand',
    lines: ['Months of open source work for the Drupal Association, then one of 52 winners worldwide.', 'Google flew me and my dad to San Francisco: Mountain View, the Cloud office in Sunnyvale, Stanford.', 'My first flight out of India, and the reason I moved across the world for computer science.'],
    photos: ['/assets/stage/photos/google-award.jpg'], href: 'https://codein.withgoogle.com/archive/2018/',
  },
  floqerDesk: {
    title: 'Building Floqer. Most days, most nights.', lane: 'Toronto · now', kind: 'look',
    lines: ['Founding engineer in October 2025, head of engineering since April 2026.', 'The orchestration engine behind enterprise go to market automation, from a hacker house in downtown Toronto.', 'A $2M pre seed, customers like Wise and Perplexity, and a seat at TechCrunch Disrupt Startup Battlefield.'],
  },
  // 1: the 2010 room, Delhi
  xboxPad: {
    title: 'The pad. Zombies until the power cut.', lane: 'Delhi · 2010', kind: 'hand',
    lines: ['Before any code there was an Xbox 360 in a Delhi bedroom.', 'Call of Duty zombies until the power cut, Spider-Man when it came back.'],
  },
  xbox360: {
    title: 'The Xbox 360. White, standing, always on.', lane: 'Delhi · 2010', kind: 'hand',
    lines: ['Call of Duty: World at War, Nazi Zombies. Every evening.'],
    href: 'https://www.youtube.com/results?search_query=nazi+zombies+world+at+war',
  },
  figures: {
    title: 'The shelf.', lane: 'Delhi · 2010', kind: 'hand',
    lines: ['Naruto, Goku, Luffy, Ichigo, Saitama, Levi, Vegeta.'],
  },
  football: {
    title: 'Barcelona. Messi.', lane: 'Delhi · 2010', kind: 'hand',
    lines: ['The ball in the corner by the shelf.'],
  },
  jobsPrint: {
    title: "Here's to the crazy ones.", lane: 'Delhi · 2010', kind: 'look',
    lines: ['Think different, 1997: the whole of it, framed over the bed.'],
  },
  // 2: the lab, Delhi, 2013
  firstWebsite: {
    title: 'index.html in Notepad. The first website.', lane: 'Delhi · 2013', kind: 'look',
    lines: ['Thirteen, white shirt and tie, the school computer lab.', 'A W3Schools template with the colours changed, wireframes sketched in class, and it never really stopped.'],
  },
  wireframes: {
    title: 'Wireframes sketched in class.', lane: 'Delhi · 2013', kind: 'look',
    lines: ['The whiteboard at the front of the lab: the page in boxes before it was a page.'],
  },
  // 3: the lawn, Mountain View, June 2019
  tripAward: {
    title: 'The award.', lane: 'Mountain View · June 2019', kind: 'hand',
    lines: ['Google Code-in 2018, grand prize winner, June 27, 2019.', 'One of 52 winners worldwide, for months of open source work for the Drupal Association.'],
    photos: ['/assets/stage/photos/google-award.jpg'], href: 'https://codein.withgoogle.com/archive/2018/',
  },
  tripSign: {
    title: 'Google, San Francisco. June 2019.', lane: 'San Francisco · June 2019', kind: 'hand',
    lines: ['Google flew me and my dad to San Francisco: Mountain View, the Cloud office in Sunnyvale, Stanford.', 'My first flight out of India.'],
    photos: ['/assets/stage/photos/google-sign.jpg'],
  },
  gbike: {
    title: 'A Google bike.', lane: 'Mountain View · June 2019', kind: 'look',
    lines: ['The Googleplex, one June afternoon: the Android lawn, the bikes by the mouth, the letters at the end of the path.'],
  },
  honeycomb: {
    title: 'Honeycomb, on the lawn since 2011.', lane: 'Mountain View · June 2019', kind: 'look',
    lines: ['The Android lawn at the Googleplex: the statues in a row, each facing the path.'],
  },
  // 4: the 2020 room, Delhi
  webcubeDesk: {
    title: 'Webcube. From this desk.', lane: 'Webcube · 2020 to 24', kind: 'look',
    lines: ['45 companies, six countries, 25 people, from this desk.', 'Startups brought ideas, we shipped the software. Solo founded in New Delhi at 17 and run through university.', '$200K revenue, 45 companies, 6 countries.'],
  },
  covidLeads: {
    title: 'Covid Leads Delhi.', lane: 'Delhi · 2020', kind: 'look',
    lines: ['20,000 people, beds and oxygen, two months.'],
  },
  awards: {
    title: 'Awards of different shapes and sizes, on the top shelf.', lane: 'Delhi · 2020', kind: 'hand',
    lines: ['Above the books, above the desk Webcube was run from.'],
  },
  // 6: the hall, Halifax, 2022
  lecture: {
    title: 'Generative AI. The lecture.', lane: 'Halifax · 2022', kind: 'look',
    lines: ['Transformers, attention, what a model is and is not.', 'Computer science at Dalhousie University. Halifax, Nova Scotia.'],
  },
  shiftkey: {
    title: 'The lectern. ShiftKey Labs.', lane: 'Halifax · 2022 to 25', kind: 'look',
    lines: ['Technical lead at ShiftKey Labs for three years: the biggest open source community in Atlantic Canada.', 'Curriculums that put certificates in hundreds of hands, hackathons, and AI2Market.'],
  },
  // 7: the Bean house, Sydney, 2024
  beanBoard: {
    title: 'The whiteboard. How Bean works, and launch week.', lane: 'Bean · 2024 to 26', kind: 'look',
    lines: ['Co-founder and CTO with Pankrit Jindal.', 'Started as "what is in your fridge", became a cooking assistant thousands of people used.'],
  },
  beanPhone: {
    title: 'Bean on the phone: your kitchen assistant.', lane: 'Bean · 2024 to 26', kind: 'hand',
    lines: ['Pantry, recipes, the week, the shopping list.', '10k users. Number four on Product Hunt. $70k investment.'],
  },
  productHunt: {
    title: 'Launch day on Product Hunt.', lane: 'Bean · 2024 to 26', kind: 'look',
    lines: ['Number four Product of the Day.'],
  },
  airMattress: {
    title: 'An air mattress.', lane: 'Sydney · 2024', kind: 'look',
    lines: ['A hacker house: you sleep where you ship.'],
  },
  // 8 to 10: the walk's marks
  sign0: { title: 'Web Summit Vancouver, May 2025', lane: 'Vancouver · 2025', kind: 'look', lines: ['Bean on the road. One day at the booth: 500 conversations, 120 signups and an investor MOU.', 'A first Sunday at Socratica, builders working on their own things, the idea that came home to Halifax.'] },
  sign1: { title: 'Elevate Festival, Toronto, October 2025', lane: 'Toronto · 2025', kind: 'look', lines: ['Elevate with the Startup Atlantic delegation: every investor in reach messaged on day zero, eight calls booked.', 'Then a cafe instead of the shiny meetings, the churn problem on the table, feedback calls with parents.', 'Startup Open House: DMZ, and a hacker house downtown called Floqer.'] },
  sign2: { title: 'Invest Nova Scotia: Accelerate, 2025 to 2026', lane: 'Halifax · 2025 to 26', kind: 'look', lines: ['Invest Nova Scotia Accelerate: one of twelve, one of two consumer companies.'] },
  sign3: { title: 'Volta, Halifax', lane: 'Halifax · 2026', kind: 'look', lines: ['Collect. at Volta every Thursday with Noah and Sam, from a handful of builders to almost a hundred, then a Demo Day that packed the space.'] },
  // 10: Volta
  collect: {
    title: "Collect. at Volta: Halifax's Socratica node.", lane: 'Halifax · 2026', kind: 'look',
    lines: ['Collect. every Thursday at Volta with Noah and Sam, from a handful of builders to almost a hundred.', 'Then a Demo Day that packed the space.'],
  },
  highTable: {
    title: 'The high table he spoke at.', lane: 'Halifax · 2026', kind: 'look',
    lines: ['Volta, 1800 Argyle Street, Suite 801.'],
  },
  // 11: the stage
  stageLectern: {
    title: 'The lectern.', lane: 'Dalhousie', kind: 'look',
    lines: ['Computer science, Dalhousie University: the reason for Halifax in the first place.', 'The degree, then the hall on its feet.'],
  },
  // 12: Floqer's house, Toronto
  floqerBoardA: {
    title: 'The whiteboard: the engine and who runs on it.', lane: 'Floqer · 2025 to now', kind: 'look',
    lines: ['The orchestration engine behind enterprise go to market automation.', 'Customers like Wise and Perplexity.'],
  },
  foamF: {
    title: 'The F, in acoustic foam tiles, as it hangs in the house.', lane: 'Floqer · 2025 to now', kind: 'look',
    lines: ['A hacker house in downtown Toronto. Small team, hard problems.'],
  },
  rollingBoard: {
    title: 'The whiteboard on wheels: to do, failed, passed, prod.', lane: 'Floqer · 2025 to now', kind: 'look',
    lines: ['Thick with sticky notes, against the brick past the mark, on the way to the stair.'],
  },
  floqerBox: {
    title: "Floqer's box.", lane: 'Floqer · 2025 to now', kind: 'hand',
    lines: ['The box the kit came in, on the desk by the stem of the T.'],
  },
};
