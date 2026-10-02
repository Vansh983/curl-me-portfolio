# 41. Volta as it is, Collect.'s slide, and the hall's crowd (2026-10-02)

His words: "Collect Demo Day doesn't need to be there. It's basically just Collect can be fine, with a Socratica logo or something." "When I'm walking through Volta it doesn't seem like Volta... everything just looks kind of fake... more polish, more stuff in there, a proper Volta environment (coworking, proper coworking)." "The stage looks fine after that but the people underneath don't. I need you to do deep research on how we can actually do that with humans in the crowd. We don't need it to be detailed, just the crowd seems natural." Also: he really likes the walk before Volta.

Research first, then the build: `39-crowd-research.md`, `40-volta-interior-reference.md` (25 photographs of the real floor in `ref/volta/`).

## Collect.'s slide

- One slide, no cycle: Collect.'s banner (mint brushwork), the "collect." wordmark large, Socratica's asterisks and name under it. Collect. is Halifax's Socratica node.
- All of it is their own artwork: the banner from Collect.'s events page, the vector wordmark from collecthalifax.org, Socratica's marks from socratica.info. Put together by `scripts/look/collect.mjs` into `public/assets/stage/collect/slide.webp`; the originals stay in `.cache/collect/`.
- It is thrown on the wall by a ceiling projector, as at the real evenings. No screen, no frame (`voltaSlide`, paint `screenCollect`).
- Gone: the Demo Day poster of the day before, the three slides after it, `SLIDES` and `slideAt`.

## Volta's floor

What made the old room a box: white walls, a coffee counter that is not there in life, rows of chairs, nothing else. What the photographs show, now built:

- Black open ceiling, matt. Black ring lights 1.7 to 2.6 m across, warm on the inner face; slim black linear lights at loose angles; the projector on its pole.
- The west glass: a white mullion every 1.5 m, a white radiator sill along its foot, a black bulkhead over its head with a line of light.
- Two fat white columns, each with a red fire bell and a black speaker.
- Light warm grey walls, a dark baseboard, warm grey carpet.
- Reception on the east wall: maple planks laid flat in three tones, VOLTA on them in black (the mark itself, `voltaLetters`), a plank desk, a chair and a laptop behind it.
- Under the side window: the dark bar ledge, the coffee machine and cups, three white stools.
- The coworking floor: four white flip-top tables in two groups, eight white chairs pulled up, laptops, mugs, bottles, two backpacks.
- At the glass: two orange tub chairs round a low table, lime and teal cube ottomans, a white high table with stools.
- The north end: the slide on the wall, a white high table with a laptop where the podium stood (he still goes behind it and turns to the room), a stack of six red-orange event chairs, a black call booth, the door plaque.
- Collect.'s whiteboard on the south wall. Three fiddle leaf figs in black pots.

How:

- The side window moved to the south end of the east wall (`WALK.volta.east` 40.7 to 44.4), so the reception stands where he looks as he comes in.
- Builders in `walk-built.ts`: `voltaGlass`, `voltaCeiling`, `voltaColumn`, `ringPendant`, `voltaTable`, `voltaHighTable`, `voltaSideTable`, `voltaOttoman*`, `voltaBooth`, `voltaSlide`, `voltaFitout`. Layout in `VOLTA_FLOOR` (`sets.ts`) and `VOLTA_LINES`, `VOLTA_PROJECTOR`, `VOLTA_RECEPTION` (`walk.ts`).
- Seven free BlenderKit models (royalty free): `volta_chair`, `volta_stack_chair`, `volta_tub_chair`, `volta_fig`, `volta_stool`, `volta_backpack`, `volta_bottle`. Colours set by `skin`.
- The camera's keys are unchanged.
- No figures in the room: his rule of 2026-09-27 stands.

### Found on the way

- The black ceiling read pale from the door. Two causes: it took the room's reflection (now `env: 0.04`, a new field on a material), and the ring lights' bloom laid a veil over it. The rings are now drawn at 1.2 and light the bake at 1.9 (`bakePower`, a new field: a lamp's light in the bake apart from how bright it is drawn).
- The fig's leaves came back from the bake black. It is lit live now (`CONTEXT_MODEL`, both lists).
- The oak scan's own colour made the maple orange. The planks are plain colours with a grain.
- A BlenderKit file can come without its textures (a tub chair all black, a stool with a black seat). Render each model in Blender before placing it (`.cache/volta-models/render.py`), and set `map: false` in its skin.

## The hall's crowd

Why the old one read fake (from `39`): one athletic mannequin 72 times, clothes painted on by bone, lit by itself, one height, a wide action stance, nobody clapping, 2 m apart on bare floor.

Now:

- A full house, about 900 people: rows 0.9 m apart, three to a tier, seats 0.58 m, two aisles, a seat empty here and there in clusters (`crowd.ts`).
- Graduates in black gowns and Dalhousie hoods in a block at the front between the aisles (no caps: bachelor's graduands wear none), families round and behind them.
- Each person is a card cut from a Blender render of a real figure: Microsoft Rocketbox avatars (MIT), their own clap, cheer, wave and idle clips, lit warm from the stage side with a cool rim (`scripts/stage-crowd.mjs`, `scripts/stage-crowd.py`).
- Two atlases, 666 KB together: `near` for the four rows on the flat floor (18 loops, 10 of them graduates, each a different person), `far` for the rest (24 loops). 20 avatars in all, four frames a loop. `people.json` lists the loops.
- Drawn in two calls (`buildCrowd` in `stage-run.ts`): each card turns about its upright to the eye's place, plays its loop at its own pace from its own start, one frame fading into the next. A neighbour is never the same loop when another will do.
- The stage's light falls away row by row; the back of the house goes into the hall's dark air.
- The 72 rigged figures are gone from the set.

## Checked

- Frames with the text cards, 12.8 to 13.82 and 14.9 to 15.1; the clap in motion (`burst.mjs`).
- Gap audit 12.6 to 14.2: nothing unbuilt, the magenta is the sky through the glass.
- Frame rate 60 to 63 through the room and the hall.
- Headless Chrome only. His own Chrome's tab was hidden and the stage would not load in it.

## Not done

- The hall round the crowd is still black: he said the stage is fine.
- The gown's sleeves stand out a little on a graduate whose arms hang.
- The old rigged figure's code (`dressPerson`, `base_character`) is still in the runtime, unused.

## Tools added

- `scripts/look/burst.mjs`: a few frames a moment apart, side by side, to see what moves.
- `scripts/look/collect.mjs`, `scripts/stage-crowd.mjs`, `scripts/stage-crowd.py`.
