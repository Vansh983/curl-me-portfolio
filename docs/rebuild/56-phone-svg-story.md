# 56. The mobile walk, drawn in SVG

2026-10-26. Scope: `/v/walk`, the mobile front end. The request is for recognisable 2D SVG scenes that follow the words, with much slower, smoother morphing, explicit online research, and then: "very customized for my sake".

## Direction contract

THESIS: Keep the established continuous reading page and the small walking character. Make the illustration describe the paragraph being read, rather than a generic room standing for a whole chapter.

OWN-WORLD: Retain black text, Space Grotesk/Inter, full-screen changing wall/sky colours, and a scene along the foot. Lighten the backgrounds for legibility. Draw precise architectural SVGs with windows, screen content, furniture, and recognisable landmarks. No new people, banners, or invented biographical claims.

STORY: Follow `src/data/story.ts` without rewriting it. Bean starts between Halifax and Sydney; the Google visit follows the open-source work; Halifax's accelerator, Collect., and launch are separate moments. The opening paragraphs remain the existing drafts.

FIRST VIEWPORT: Name and role at the upper left, the existing first paragraph beneath, a detailed Toronto workspace at the bottom. Text occupies at most the upper 70%; SVG fills the rest without a separate panel or seam. The existing walking character remains the only playful control.

FORM: Experience, refining the established mobile walk. Code-led SVG as explicitly requested, with a stable reading interval and a slow, reversible transition between paragraph illustrations. No concept lottery or raster comp: the user has already specified the form.

FINISH: Inspect phone widths, reverse scroll, fast scroll, reduced motion and no-JavaScript text; check and test without a build. Obtain the skill's independent finish review and record its verdict here. Preserve the existing site design system.

## References

- [The Pudding: responsive scrollytelling](https://pudding.cool/process/responsive-scrollytelling/): stable measured mobile heights, meaningful transitions, and avoiding accidental interactions while scrolling.
- [The Pudding: storytelling](https://pudding.cool/process/how-to-make-dope-shit-part-3/): explicit visual states that still work when the reader skips forward or reverses.
- [Nicky Case: it's a(door)able](https://ncase.me/door/): small readable 2D environments and a simple character-led interaction. Used as a reference, no assets copied.

## Before

At 390 × 844, the Delhi room had 108px between scene triggers and the lab 132px. Three chapters were visible in the first viewport, on an almost black wall with black type. The skyline was behind an opaque window; the Google Androids were three unrecognisable ovals. Captures: `.cache/walk-svg/before-now.png`, `before-google.png`, isolated headless Chrome.

## What was built

- `src/lib/phone/artwork.ts`: 22 authored SVG scenes, one for each source paragraph in its existing order. Delhi's Xbox and barred window, the school lab, Drupal and the Google lawn are distinct. Bean begins with Halifax and Sydney across two desks; the product, Vancouver, Socratica, Toronto, accelerator, Collect., launch, degree and Floqer each have their own moment. These are stylised illustrations of his story, not literal reconstructions of every room.
- The personal details outrank generic room cues. Floqer's orange acoustic-foam mark, white tower PC, garden window and sticky-note board come from the saved photographs in [43](./43-hacker-house-reference.md). Volta's sloping glass, suspended rings and white tables come from [40](./40-volta-interior-reference.md). The final Floqer interior uses those details, not the earlier brick wall and stair shorthand. No reference photograph or other raster asset ships on this page.
- `src/pages/v/walk.astro` retains the existing words, including the draft opening, Space Grotesk/Inter, native text scrolling and the walking character. Light wall and sky colours make the dark ink readable. The SVG occupies the bottom 30%, using `meet` so narrow phones keep the whole scene. Artwork strings render into the page once; the runtime receives only serialised scene metadata and transition geometry.
- `src/lib/phone/pacing.ts` and `src/scripts/phone-walk.ts`: each paragraph gets at least 0.66 viewport height, the opening 0.82. The picture holds between transitions. A transition spans up to 0.38 viewport height, capped at 55% of the gap between paragraph tops, with 180 ms time-based damping. Reverse scrolling reverses the picture; large jumps skip unrelated intervening scenes.
- Reduced motion changes scenes immediately and disables the character's jump. Without JavaScript, every paragraph and the footer remain plain text. Height-only browser chrome changes do not remeasure the page; width and orientation changes can. The labelled character button responds to a completed click or tap, not `touchstart` during a scroll.

## Finish review

The first review requested one midpoint fix: detailed scenes had fallen to about 14% opacity each while a plain morph outline reached 80%, producing a detached dark block at morph 4 and a tan polygon at morph 7. The final blend keeps the two detailed scenes at 50% each at halfway. Supporting outlines peak at 18% and only interpolate where comparable bounds overlap; unrelated objects leave and arrive with their complete artwork.

The independent finish review's final disposition was **ship**, with that scored fix resolved. Recognisable detailed scenes remain, both detached shapes are gone, and the transition sheet showed no regression. This verdict covers the scored midpoint fix and static states; the reviewer did not observe live motion. The skill launcher and detector were unavailable with a permission-denied error, so review was manual.

## Verification and limits

- Headless Chrome: 320, 375, 390 and 430px widths; all 22 scenes forward and backward; reduced motion, no JavaScript, character click, four footer links, and the desktop `/v` frame. No runtime errors. Evidence: `.cache/walk-svg/report.json`, `sheet-1.png` to `sheet-3.png`, `morph-sheet.png`, `final-mobile.png`, `final-mobile-320.png`, `reduced-motion.png`, `no-js.png` and `footer.png`.
- At 4x CPU throttle: 239 frames, 16.736 ms average, 16.7 ms p95, none over 34 ms. This is headless evidence, not a guarantee for an old phone or an in-app browser.
- `npm test`: 100 passed. `npm run check`: 0 errors, 0 warnings, 25 hints. Logs are in `.cache/walk-svg/`. No build, commit or push.
- The preview was opened in his Chrome using the full application path after the initial name lookup failed. His Chrome was not inspected; visual verification was headless. Preview: `http://localhost:4321/v`.

This round changes the mobile walk only. The established global site identity stays in place; no global `PRODUCT.md`, `DESIGN.md` or design sidecar was introduced. The draft words still need his own content decisions.
