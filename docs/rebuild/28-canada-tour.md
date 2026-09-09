# 28. The Canada tour: Vancouver, Calgary, Toronto, Halifax, laptop in hand

2026-09-09. Plan for the flow after Sydney. Facts from his LinkedIn (profile, experience, own posts), read in Chrome this session; nothing here is invented. Dates are relative to September 2026 as LinkedIn showed them.

## What LinkedIn says

- **Bean.** Co-founder/CTO, May 2024 to Apr 2026, Halifax. "solved decision fatigue in food for busy parents." #4 on Product Hunt (Dec 2025: 242 upvotes against 19 the launch before; the scheduled launch fired a week early on a Saturday; team Bean with Md Adnan Sami and Liza Zahid; Pankrit Jindal co-founder in Australia). Invest Nova Scotia Accelerate (Oct 2025): one of 12 startups, $40k over 5 months, one of only 2 B2C; thanks to Kaitlin Webb, Alex Liot, Volta's Lindsay. Blackbird Giants (Australia) at the same time: "two founders in Australia and Canada", "24/7 founder customer service". Retention fixed with daily pings (3x week over week); help from Brian and Volta.
- **Vancouver.** Web Summit Vancouver 2025 with Bean (the timeline: 500 conversations, 120 signups, an investor MOU in a day). There he "experienced Socratica for the first time" and posted that Halifax needed that builder mindset. Web Summit Vancouver again in May 2026, with Floqer, to hire.
- **Calgary.** Nothing on LinkedIn: no post mentions Calgary, Alberta, YYC, Inventures or Platform Calgary. **Needs his facts before it is built.**
- **Toronto.** Elevate (Nov 2025) as part of the Startup Atlantic delegation: day 0 DM'd every investor in his network and booked 8 calls; day 1 the conference and dinner with Alex; day 2 got annoyed at "shiny meetings", went to a cafe and worked on churn; day 3 feedback calls with parents instead of fundraising, Startup Open House at DMZ and at Floqer's hacker house. October: visited Floqer's office ("literally a hacker house in dt Toronto"); Zaaheda: "if someone offers you a seat on a rocket, you take it"; booked flights and moved within 10 days. Founding Engineer Oct 2025, Head of Engineering Apr 2026. Toronto Tech Week house party (Jun 2026). Floqer $2M pre-seed; TechCrunch Disrupt Startup Battlefield, SF, Oct 2026.
- **Halifax.** Volta; Collect. (Socratica in Halifax) with Noah and Sam: Thursday sessions at Volta from a handful to almost 100; Demo Day at Volta, Feb 2026, "the entire space PACKED", he demoed. ShiftKey Labs technical lead to Aug 2025; research assistant at Dalhousie to Aug 2025.
- No graduation or convocation post exists. The degree beat stays as he described it, without a date.

## The flow (proposed)

First person, his laptop in hand: a held laptop in the lower left of the frame, lid open, the Bean app and pitch on it, carried through every street (the way the phone is carried in the flight). Each city is an outdoor street set in the plaza's manner (kerbs, facades, planters, street furniture), joined by short flight cuts (the cabin exists: a seat, a window, a card), and each street has the things he did on it.

1. **Vancouver, May 2025.** Out of the Sydney room into a Vancouver street at the waterfront: the Convention Centre's white sails and Canada Place, the seawall, the North Shore mountains painted behind. Web Summit banners on the lampposts; a booth stand with the Bean logo and a counter of conversations (500), signups (120), the MOU; a Socratica session in a café window (people building on laptops). Card 2024 "Co-founded Bean" continues.
2. **Calgary.** A street under the Calgary Tower (Stephen Avenue). What he did there is unknown. **Blocked on him.**
3. **Toronto, Nov 2025.** A downtown street with a streetcar and the CN Tower behind: Elevate's banners at the venue, a café window where he worked on churn instead of the meetings, the DMZ door, and the Floqer hacker house front door with its sign (the seat on the rocket). The 2025 card "Head of Engineering at Floqer" lands here.
4. **Halifax, Oct 2025 to Feb 2026.** Barrington Street at Volta and the waterfront: Invest NS Accelerate (12 startups, $40k), the Thursday Collect. sessions, Demo Day packed, the Product Hunt #4 on the laptop.
5. Then the degree, then the Toronto studio (the loop closes at set 0 with an explicit neighbour).

## Build

- One street kit in built.ts: kerb, road with markings, sidewalk, facades with the facade tile and shopfronts, lampposts (banners), benches, planters, trees (the canopy blobs at street scale), a streetcar, a booth, a café window with painted people at laptops (painted, never primitives). Landmarks: the Convention Centre sails (authored), the Calgary Tower (authored lathe), the CN Tower (exists), the Volta building, the Halifax waterfront.
- Backdrops painted per city (mountains, prairie sky, lake, harbour) as unlit quads like `sydneyHarbour`.
- The held laptop: a `heldLaptop` in stage-run.ts attached to the camera like the phone, with `screenBeanPhone`-style paints per city (the pitch, the conversations counter, the churn dashboard, the Product Hunt page).
- Sets 8 to 11, keys in `ch()` after 8.0, `STAGE_SPAN` to 12; chapter cards re-timed (the 2024 card spans the tour, 2025 the Toronto move).
- Flights between cities: reuse the cabin and the phone-style portal, no new descents.

## Questions for him

1. Calgary: what happened there, and when? (Nothing on LinkedIn.)
2. Vancouver 2025: is there a post or numbers beyond the timeline's 500 / 120 / MOU?
3. Does the tour end in Halifax before the degree, or after?

## Built so far (2026-09-09, evening)

- **Set 8 `vancouver`** (outdoor): out of the hacker house's new south door beside the window onto the seawall promenade (`promenade`, pavers, parapet, a west end wall), the harbour 3 m down (`harbour`), the Convention Centre's glass wall with its green roof (`conventionCentre`, 16 m, from the hacker house's corner to the café), Canada Place's five sails on their pier (`canadaPlace`), six lampposts with Web Summit banners (`bannerPost`, paint `bannerWebSummit`), the Bean booth with the logo on its counter and the day's numbers on its back panel (`beanBooth`, `boothFront`, `boothBack`), the Socratica café pavilion with its painted window (`socraticaCafe`, `cafeWindow`: tables, laptops, the sign, nobody drawn in), two cedar benches, two trees, a bin, and the North Shore painted 700 m off (`northShore`, `vancouver`). Nothing stands west of the hacker house's wall: it would show in its window over the Sydney harbour. Live, not baked.
- **The laptop in hand**: `laptopTour` (paint `screenTour`: the trip's numbers, the day, signups by hour) built once and hung on the camera low right (`heldLaptop` in stage-run.ts), on for the tour sets (`TOUR_SETS`) and through the door into them.
- **The walk**: keys ch(7.72) to ch(9): the glass, a quarter chapter to turn south to the door, the jamb at 8.06, out at 8.14, then 10 m east along the seawall past the banners to the booth (8.72), the café and the sails ahead at 9. Each 90° turn takes a quarter chapter: the turn-rate bound is 5.4° per thousandth and the spline peaks at about 1.45× the average.
- **Chapter card**: a 2025 "Bean on the road" card sits between the Bean card and the Floqer card (timeline.ts, `STAGE_SPAN` 9). Cards are centred on integer chapters, so the road card shows over the Sydney glass, the exit and the first steps on the seawall; the Floqer card takes the promenade's second half. To centre Vancouver on its card the beats before it would have to run faster than the walk bound allows; revisit when Toronto and Halifax add their cards (one per city).
- Sydney re-baked for the new door (the mattress moved to the east end of the south wall).

Still open: Calgary (no facts), Toronto, Halifax, the degree, Toronto.
