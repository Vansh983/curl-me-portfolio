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

## The full path (2026-09-09, night)

He said: no time at the Sydney window, walk straight out; he hates the painted mountains; every stop needs to say where he is and what he is doing; keep it compact; the whole path; real models; the laptop more visible, walking while working.

- **Sydney** now exits at chapter 7.42: from the monitors straight along the north side, down the gap by the window (a glance out on the way), out of the south door beside it at 7.9. No hold at the glass.
- **Four cities in a row along +x, 11 m each,** joined by glass gateways across the sidewalk with a lit sign over the doorway ("to Calgary", "to Toronto", "to Halifax"): Vancouver x −7..4, Calgary 4..15, Toronto 15..26, Halifax 26..37. One chapter per city (`STAGE_SPAN` 12; the road card became four city cards in timeline.ts). Each city: a wayfinding totem at its start (city, event, date, "you are here"), the shop band and fronts in its own colour, the laptop's page turning to the city (`screenTour` frames, `TOUR_PAGE` in stage-run.ts), and the landmark dead ahead at the end of the street, this set only.
- **Vancouver**: the seawall, the Convention Centre glass with the Socratica session painted inside it, the booth, Web Summit banners, a coffee cart (Outlier Spa, CC BY), Canada Place's sails on the water. The mountains are gone; sky and water.
- **Calgary**: sandstone fronts (Stephen Avenue), the Calgary Tower authored as a lathe (no licensed model exists). What he did there is still his to say; the totem and card say "on the road".
- **Toronto**: the DMZ door, the café with churn on the whiteboard, the Floqer hacker house door, Elevate banners, a streetcar on the road, a hot dog cart (Outlier Spa, CC BY), the CN Tower at the end of the street.
- **Halifax**: Volta's door, Collect. Demo Day banners, ironstone fronts (Barrington Books, Halifax Donair), Saint Mary's Cathedral Basilica across the street: Air Digital's scan (CC BY), 2.8 M faces simplified to 650 KB, its west front to the street. The walk ends here.
- **The laptop** rides low centre in both hands, lid up, the screen square to the eye.
- **Cards**: the tour's articles (data-i 8 to 11) get `padding-top: 72svh` so each card comes up while its city is walked; stage progress is now read off the article positions (`progress()` and `yFor()` in stage-run.ts), so uneven articles do not skew the keys, and the audit scripts scroll with `window.__stage.yFor(q)`.

Frames: `.cache/tour4/sheet.png`.

## Booths and offices (2026-09-09, late)

He found the streets cluttered and the painted banners and fonts fake, asked for simple booths and offices, no cafés, Calgary out and Montréal in after Toronto (LinkedIn: two days at ALL IN, September 2025, representing Bean with the Nova Scotia startups, Digital Nova Scotia and Volta; "4 cities for 4 different conferences over the last 4 months"), everything accurate, and the laptop fully visible with code running and the screen changing.

- The street kit is gone (builders, paints, materials, the three Sketchfab street models). Four plain rooms in a row east of the hacker house, doors between them, one chapter each: **Vancouver** an expo hall (carpet, 5 m ceiling, the Bean booth between two blank booths, one banner reading only "Web Summit, Vancouver, May 2025"); **Toronto** an office (two desks, a monitor, a laptop, the Elevate banner, the churn whiteboard in his own words); **Montréal** a conference floor (the booth with "Nova Scotia startups at ALL IN", rows of chairs, a screen with the event's name); **Halifax** Volta's floor (two long tables, laptops, the Collect. whiteboard, the Invest NS letter). Each room has a plain wall sign: the city, the event, the date, the logo.
- Signage is facts only in a plain sans; no slogans, no invented copy. The whiteboards quote his posts.
- The laptop is held in both hands, lid and the top keys in frame, its screen a canvas repainted twelve times a second (`tourLive` in stage-paint.ts): a terminal running tests and a deploy line by line, the editor typing the adapt endpoint, the app's home scrolling, the city's numbers filling in; four views cycling every eight seconds, the numbers page per city.
- The CN Tower is not rebuilt: it stands in the Toronto skyline of the first set only.

Frames: `.cache/rooms0/sheet.png`.

## The promenade (2026-09-09, night)

He rejected the rooms (should be outside) and the outdoor draft (the walk turned; not his vision), then answered: sidewalk past real fronts, a continuous walk with a sign marking each city, one real landmark per city, keep walking straight, no turning; Montréal skipped, three cities; after Halifax, straight through a door into his convocation at Dalhousie. A real-streets build (OpenStreetMap footprints with cut windows, Overpass boxes for Canada Place, Front Street East at Meridian Hall, Barrington Street at Volta, the Basilica scan) was then rejected as overdone: "it could just have been me walking with water on one side and the other side we just have things", "on the left we can have simple things represent the city".

- **One promenade** (`promenade`, `harbourWide` in built.ts): straight out of the hacker house's south door and on down -z for 42 m at one pace, 13 m a chapter, never turning. Paving 7 m wide, a granite seawall on the left and the water beyond it to the fog, a lawn on the right with the Poly Haven trees and the plaza's lamp posts. Every tour set holds its own copy (`live: 'city'`, `promenade()` in sets.ts), so nothing but the sky and the things changes at a threshold; the thresholds are `soft` keys (dolly.ts): the light crossfades without the doorway's dip.
- **The left, over the water, the city in one simple thing:** Vancouver, Canada Place's pier and five sails at their real size (`canadaPlaceSails`, authored; no licensed model exists); Toronto, the CN Tower across the water (`cnTowerFar`: the condo's tower from city.ts, by day); Halifax, the Angus L. Macdonald Bridge across the harbour (`macdonaldBridge`: 1.3 km, towers 96 m, 441 m apart, the deck at 47 m, authored).
- **The right, his thing:** the Bean booth with the day's numbers (Vancouver); a plain sign on two posts per city (`signPost*`, the sign paints: city, event, date, the logo). Nothing else.
- **The Cohn** (set 11 `convocation`): the promenade ends at a concrete vestibule with the hall's name over the door (`cohnLobby`, seen from Halifax's set), the door swings in (`doorLeafWide`, `door: [ch(10.76), ch(10.9)]`), and the hall opens: six rows of stalls either side of the aisle, oak walls, the balcony front, the proscenium, the stage a metre up with the lectern, seven chairs and a black-and-gold banner reading only "Dalhousie University / Convocation" (`cohnHall`, `cohnStage`, `convocationBanner`). The walk goes down the aisle and up the four steps at one pace to the end of the scroll (`walk()` in dolly.ts, the rise spread over 5 m so the step bound holds); the laptop goes away at the door and the degree comes up into the hand over the last steps (`degreeScroll`, `heldDegree` in stage-run.ts, `DEGREE` in flight.ts). No people: the seats are empty until licensed models exist. The venue is Dalhousie's usual one, not a confirmed reconstruction of his ceremony; LinkedIn lists no education section, so the card names no degree title or date (timeline.ts: `year: 'Dal'`).
- **Cards**: Vancouver, Toronto, Halifax, the degree, Floqer (Montréal's card removed). `TOUR_SETS` 8 to 10; the laptop's pages 0, 1, 3 of `screenTour`.
- Open: the laptop's look (he will revisit); the Floqer return to Toronto (chapter 12 holds on the stage); baking sets 8 to 11; people in the hall.

Frames: `.cache/prom0/sheet.png`, `.cache/prom1/sheet.png`.

## The terrace (2026-09-10)

He rejected the promenade: not smooth (hitches at every threshold), the city things not seen, text in the world pointless; the walk should be right outside his place, along its side, and back in through a different door; the graduation entered from the side of the stage, across it for the degree, then a turn to a cheering crowd. No Rebecca Cohn building.

- **The terrace** (`terrace`, `terraceWall`, `harbourAround`; `TERRACE` in sets.ts): out of the hacker house's south door, right along the south wall, right again at the corner, and north along the harbour side of the house for 42 m at 16.7 m a chapter, 30 m over the water on a cliff. The house's west wall runs north of the room with a window every 4.2 m, planters against it, the Bean booth in Vancouver; the parapet and the water on the other side. The same terrace in all three sets (`live: 'city'`); soft thresholds (dolly.ts `soft`), no dip.
- **The city on the water, ahead:** Canada Place's sails 230 m out, the CN Tower 640 m out, the Macdonald Bridge across the harbour 360 m out. No signs, no text anywhere in the world.
- **Back in:** the door in the wing across the terrace's north end (`doorLeafWide`, `door: [ch(10.78), ch(10.92)]`, swings away), then set 11: the wing (`stageWing`, lit), four steps up, and straight along the stage from its side (`stageHall`: the stage a metre up, black drapes with a gold band, the proscenium, the raked house) to the centre by 11.66, the degree into the hand (`DEGREE` 11.56..11.7), then a quarter chapter turning right to the hall: the crowd on its feet (`crowdRows`: nine painted cut-out rows, paint `crowd` in two frames, arms and phones up; the runtime alternates the frames three times a second while set 11 is on). Painted, not primitives; no real people models.
- **Smooth:** every set's geometry and shaders are warmed once at load (an off-screen 8 px render with everything visible, stage-run.ts), and the held laptop and degree are built then too; the 100 to 140 ms hitches at each threshold are gone (`.cache/perf.mjs` measures frame times along the scroll).
- Frames: `.cache/ter1/sheet.png`, `.cache/ter2/sheet.png`.

## Baked (2026-09-10, later)

He asked why everything after Sydney was glitchy, laggy and not rendering, and whether Blender had been dropped. Two causes, both real:

- **A texture leak.** The crowd's waving asked `paintTex` for a fresh 2048 px canvas and texture three times a second (nearly two hundred textures in a minute); the two frames are now painted once and swapped (`crowdFrames` in stage-run.ts).
- **The sets after Sydney were never baked.** Now they are, the way the rooms are: set 8 (the booth), set 9 (the terrace, its wall, the cliff: these stand in the middle set and show from both neighbours, so the whole walk sees them and the Sydney window never does), set 11 (the wing, the stage, the hall, the lectern and chairs, lit by its seven downlights). Set 10 holds only the bridge, the water and the door, all live, so it stays unbaked. `npm run stage:bake -- <set> 128 2048 512 0`: the simplify error is 0 for these, since 0.002 of a 50 m footprint is 10 cm and swallowed the 8 cm paving; the paving also sits 2 cm proud of the headland's top, which it had shared (a z-fight that read as flicker). The hall is built with its faces turned inward (`inward` in built.ts) so its box never shows over the house from the terrace. The water, the sails, the tower and the bridge are `DROP_PROP`, live in every set.
- The Blender previews: `.cache/bake/set8_render.png`, `set9_render.png`, `set11_render.png`. Frames: `.cache/bk2/sheet.png`, `.cache/bk1/sheet.png`. Frame times at retina scale: 60 fps end to end, no hitch over 18 ms (`.cache/perf.mjs`).

## Seen in his browser (2026-09-10, afternoon)

He reported a black sky and glitches; the headless captures had not shown them. Driving his own Chrome (dark mode, 2× DPR) through the whole scroll found:

- **The sky was black in every open-air set, in dark mode.** One sky dome was added to each open-air set's group in turn; an object has one parent, so it ended up only in the last set (Halifax) and the plaza, Vancouver and Toronto showed the page's clear colour: white in light mode (why the captures looked fine), black in dark. Now one dome in the scene, shown by `enter()` for the set and its neighbours.
- **The terrace blew out white.** The house's wall was `sydneyWall` (near white) under the baked sun, and the booth pure white: `terraceWall` (a shade darker) and `boothOff` now, the tour's exposure 0.72.
- **A white pool on the stage.** Not the lightmap (the floor's texels average 12/255): the veneer's roughness map is glossy, and the studio environment map reflected as a broad streak in a dark hall. The stage boards are `stageOak` (plank_flooring_02, rough 0.9), the hall's `envPower` 0.05, the stage lit by three downlights in the bake, the crowd's cut-outs a little self-lit (`emissiveMap`).
- Frame times in his Chrome were fine once the two earlier faults were fixed; the 18 fps in the footer widget is the site's own ASCII field, not the stage.

## The Bean fame walk (2026-09-12)

He wanted mountains for Vancouver, the city for Toronto, then Halifax, and the real marks of the things he did along the way: Volta, Invest NS, "all those things". Research, not invention:

- **The North Shore** (`northShore`, northshore.ts, `scripts/stage-northshore.mjs`): real elevation from Mapzen Terrarium tiles (AWS open data, SRTM) over Cypress, Grouse and Seymour, 220 by 90 samples about the Convention Centre, built at 1:6 so the range fits the sky dome (now 2,400 m), coloured by height: forest, rock, snow on the tops. Across the water to the right of the terrace, the sails in front of it.
- **Downtown Toronto by day** (`torontoDay`): the condo's OpenStreetMap footprints and heights (toronto.json) within 1.1 km of the CN Tower, turned so the skyline reads as from the lake (real north away over the water, east to the right), the tower as city.ts builds it, in a day window tile (`windowsDay`); only the far shore. Across the water in Toronto's chapter.
- **Downtown Halifax** (`halifaxDay`): the flight's OpenStreetMap buildings (halifax.json) within 700 m of the Maritime Centre, turned so the waterfront faces the viewer as from Dartmouth, with the Macdonald Bridge.
- **The marks** (`logo*` boards, paint `logo` frames, `public/assets/stage/logos/`): the organisations' own logos fetched from their sites (Web Summit Vancouver, Elevate Festival, Volta, Invest Nova Scotia, Product Hunt, Dalhousie), each on a board in a thin frame between the windows of the house: Web Summit by the booth in Vancouver, Elevate in Toronto, Volta, Invest NS and Product Hunt along Halifax, Dalhousie on the drape behind the stage. Credited in CREDITS.md.
- **The terrace from the window**: the terrace, its wall and the cliff now live in Vancouver's set (baked there) so Sydney's window looks across them, with a glass balustrade on steel posts instead of the solid parapet (the harbour and the Opera House stay in view); Halifax keeps set 8 in view with a new `also` field on the set. No pop at the door any more.
- Vite: `optimizeDeps.include` carries the GLTFExporter so the bake's export no longer answers 504 (Outdated Optimize Dep).
- Frames: `.cache/fame/sheet.png`, `.cache/v.png`, `.cache/v2.png`.
