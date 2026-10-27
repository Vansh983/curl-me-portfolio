# 57. One continuous phone path

2026-10-26. Round 56 was too much: gaps between paragraphs, repeated places, and too many individual moments. He asked for one continuous walk, grouped by parts of his life. University, ShiftKey and Floqer should each be one place; Disrupt belongs inside Floqer, not at a separate ending.

## Direction contract

THESIS: One connected landscape under a continuous reading column. Walking moves past permanent landmarks; nothing morphs or dissolves.

OWN-WORLD: Keep the personal SVG drawings, light background, dark ink and existing character. One pavement joins the whole route, with no panels, scene swaps or repeated company rooms.

STORY: Eight categories: Delhi, Google Code-in, Webcube, university, ShiftKey, Bean, Collect., Floqer. Regroup existing paragraphs on this route only. All source words appear once, unchanged. Arrival and graduation sit together; Bean's travel and launch stay with Bean; Disrupt and the current-work summary stay with Floqer.

FIRST VIEWPORT: Name, role and the first paragraphs flow naturally above the Delhi bedroom. The lower 30% shows the path with the character. Ordinary paragraph spacing replaces viewport-sized gaps.

FORM: The user's specified continuous walking path, refining the existing SVG work. One camera translation, with a shorter physical stretch for ShiftKey. No paragraph-specific animation or new design-world exercise.

FINISH: Inspect the joined route, category boundaries, final Floqer stretch and mobile reading at narrow widths. Check reverse scrolling, reduced motion, no JavaScript and source coverage. Run checks and tests, no build or commit, and obtain the skill's scoped finish review.

## What changed

- `src/lib/phone/story-path.ts` groups all 22 source paragraphs into eight places: Delhi, Google, Webcube, university, ShiftKey, Bean, Collect., Floqer. Every paragraph appears verbatim once. Arrival and the degree are together; all ShiftKey work is together; Bean's travel, accelerator and launch are together. Floqer's first visit, work, Disrupt and current-work summary occupy the final place. The summary moves from the opening to Floqer; the name and role stay at the top. This is the mobile page's presentation order, not a rewrite of his biography. `src/data/story.ts` is unchanged.
- `src/pages/v/walk.astro` renders eight permanent landmarks on one pavement. `src/scripts/phone-walk.ts` moves their shared landscape with one translation; the landmarks keep their markup, shapes, opacity and relative positions. There are no morphs, dissolves or paragraph scenes. Scroll distance follows the category blocks in either direction, with 180 ms damping. At the end, the camera stays at Floqer while the character finishes walking inside that stretch.
- Paragraphs use ordinary 18px gaps, with no minimum-height spacers. At 390 × 844 the page is 4,236px high. ShiftKey occupies 350 drawing units at 0.8 scale; the other stretches are 440 units, with Bean at 460. The path remains in the lower 30% of the viewport.
- `src/lib/phone/artwork.ts` keeps the personal objects from [56](./56-phone-svg-story.md): Delhi's Xbox, Drupal on the Google campus, Bean between Halifax and Sydney, Volta's glass and rings, and Floqer's foam mark, garden window, white PC and notes. The university landmark uses the saved `public/assets/scenes/dalhousie-goldberg.webp` reference; the degree is a small detail beside the building. Disrupt is a small plaque inside Floqer's workspace. These are stylised illustrations, not literal replicas of rooms or events.
- Reduced motion moves directly to the current category without walking or jumping. Without JavaScript, all the text and links remain readable. The labelled character button still jumps after a completed tap; address-bar height changes do not reflow the route. The character returns to its idle pose when the movement settles.

## Finish review

The independent finish review's disposition was **ship**, with no material fixes. The reviewer inspected the phone, boundary, end, reduced-motion and no-JavaScript captures and confirmed one continuous pavement, fixed landmarks moved by one translation, normal text flow, compact ShiftKey, grouped university and Floqer, and Disrupt inside Floqer. The motion conclusion comes from the source and measured report, not live observation. The passing source-coverage test proves that all 22 paragraphs appear once with their exact wording.

## Verification and limits

- `.cache/walk-path/report.json`: all eight landmarks' markup and individual transforms unchanged across scrolling; 22 paragraphs with 18px margins; forward and reverse travel; the end remains Floqer; all four footer links visible. Widths 320, 375, 390 and 430px have no horizontal overflow. Reduced motion, no JavaScript and the jump passed; no runtime errors.
- Headless evidence: `.cache/walk-path/sheet.png`, `between-0.png`, `between-3.png`, `between-4.png`, `between-6.png`, `end.png`, `mobile-320.png`, `reduced.png` and `no-js.png`. At 4x CPU throttle: 239 frames, 16.67 ms average, 16.8 ms p95, none over 34 ms.
- `npm test`: 101 passed. `npm run check`: 0 errors, 0 warnings, 25 hints. No build, commit or push. These checks and screenshots are headless; his Chrome and a physical phone were not inspected in this round.

Round 56 remains the history of the superseded paragraph scenes. This revision is confined to the mobile walk; the global site identity and design documents are unchanged.
