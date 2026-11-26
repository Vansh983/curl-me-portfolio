# 44. The degree, Floqer's house, and Toronto out of its windows (2026-10-02)

His words: "On the stage the degree kind of doesn't seem the best. Just modify the degree thing and then the crushing, and then it goes in the bin." "The Floqer office: it is a good approach. Things are mostly good but the details are kind of not good. The monitors are facing the wrong way... Some of the tables and the air mattress need to be fixed. It needs to look more like a hacker house than it is right now. Most of it is not bad though." "Even the city that looks outside, it doesn't seem like Toronto because I don't see things outside properly... need to make it very obvious that it's Toronto. Do some deep research on that."

He liked Volta and the crowd of doc 41 and had them committed.

Research first: `42-toronto-view-research.md` (photographs in `ref/toronto/`), `43-hacker-house-reference.md` (16 photographs of the real house in `ref/hacker-house/`).

## The degree

- It was a plain tube with two bands. First try: Dalhousie's parchment as a flat printed sheet. He did not like it: "it could be a scroll, just might need to look better".
- Now a scroll done properly (`makeDegree` in `stage-run.ts`): a sheet of parchment rolled two and a half turns, the turns stepping out at one end so the spiral shows, mottled cream paper (paint `degreeParchment`), tied round the middle with a gold ribbon edged in black (Dalhousie's colours) in a bow with two tails.
- The paper is a grid of facets: as the fist closes the ribbon slips off and the roll creases and crumples into a ball. The same ball flies to the bin.
- The throw: a lob to the mouth of the bin over four fifths of the way, then down inside. The bin has a rolled rim and a liner.
- A little of its own light: in the hall's dark the cream read khaki.
- Gone: `degreeScroll`, `degreeBall`, the printed sheet.

## Floqer's house

The real house is public, in his and the team's posts. What they show and the room now has:

- A desk for each seat, pale tops on white trestles, pushed together back to back into the T; one black standing desk among them (`trestleDesk`, `standingDesk`, `FLOQER_T`).
- Every screen faces its own chair. They stood face to face before, each chair looking at a monitor's back: his "facing the wrong way".
- The stem of the T meets the bar. A gap of 0.6 m stood between them.
- No two seats the same: monitor and keyboard, an open laptop beside it or alone, one wide screen, the white tower on a desk.
- Cans, mugs, bottles, Floqer's orange box. Leads off the back of every desk to the seam, along it and down to power strips; a white extension lead across the floor.
- The whiteboard on wheels with its sticky notes: to do, failed, passed, prod, and only his own name (`rollingWhiteboard`, paint `whiteboardSticky`).
- The mark as the house has it: acoustic foam tiles, the F in orange, on the east wall by the stair (`foamMark`). The painted mark on the brick stays.
- Two air beds, each its own kind and angle: a raised grey one and a low navy one, rounded sides, a flocked top inside a rim, the pump and its lead, a duvet thrown back in folds and hanging over the side, pillows that do not match (`airBedRaised`, `airBedLow`).
- A grey sofa and a brown bean bag (BlenderKit, royalty free), cases of drinks stacked against the wall, a black torchiere, backpacks at desk legs, white office chairs among the mismatched ones.
- The windows are 4.4 by 2.0 (were 3.2 by 1.55).

Not taken from the photographs, on purpose (he likes the room): the parquet, the brick wall, the pendants. Not added without asking: his teammates' names, the fridge, the street address.

Bean's house (set 7) keeps its old mattress: he did not name it.

## Toronto out of the windows

Why it failed (doc 42): nothing in it was a real thing. One grid on every block, the CN Tower a thin stick behind boxes.

Now:

- The skyline is a photograph: Riverdale Park East, 11 April 2026, by Dillan Payne, CC BY-SA 4.0. The CN Tower stands clear, red Scotia Plaza and white First Canadian Place beside it.
- `scripts/stage-skyline.mjs` cuts it to a strip (sky and skyline down to the tree tops), grades it as a view through glass, fades its head to clear and its foot to haze. 6144 px for the desktop, 4096 for phones; 0.39 and 0.20 MB.
- The runtime hangs it on a curved wall 2 km out, fixed in the world (`buildSkyline`, `TORONTO_SKYLINE`): magnified 1.85 so the tower is 13 degrees tall, as from Old Town's roofs, 16 degrees left of straight out of the first window.
- In front of it, built (`torontoStreet`): the house's own street, a street running straight out toward the towers with streetcar tracks, poles and wire, a TTC streetcar on it, parked cars, brick blocks of three to six storeys with their own windows, tar roofs with their boxes. The eye is 15.6 m over the street: the near roofs are under it, the far ones just over the horizon, hiding the photograph's foot.
- The street and roofs slide across the skyline as he walks; the skyline does not.
- Gone: `torontoView` (the OSM boxes and the coded tower).

The house is in Old Town, east of the core, its street front facing west: the view is true to the neighbourhood from roof height, not to the house's own ground floor glass, which looks at a garden.

## The page ends in his room

His words (later the same day): "there is some random area at the end, we can get rid of it; the scroll needs to end in my room".

- Under the journey the home page still had the dot field, the writing list, the footer and 90 px of padding. All four are gone from the home page (`index.astro`; `footer` is now a prop of `Base.astro`, on everywhere else).
- The last scroll position is the journey's last frame: his room, the whole screen.
- The blog, RSS and the text files are still reached from the command menu and their own pages.

## Checked

- Frames with the text cards through the hall and the house; the crumple and the throw step by step.
- Headless Chrome only.

## Credits owed

- The skyline strip: Dillan Payne, CC BY-SA 4.0, changes noted; the strip itself stays BY-SA (in `CREDITS.md`).
- `floqer_sofa`, `floqer_beanbag`: BlenderKit, royalty free.
