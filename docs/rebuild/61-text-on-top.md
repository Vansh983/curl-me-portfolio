# 61. Text on top

2026-11-15. The complete first about text, shared by the phone walk and the new `/v/journey` draft. All 18 paragraphs and every bracketed gap use the supplied words. The opening stays in the phone header.

"only one wall of text would be boring so within that wall we will have things"; "the text on top can be different than the background"; "Complete the content first and then we will fix it line over line."

One shared component renders inline buttons and their horizontal card rows. Only one row opens at a time. The two Google trip photographs are the existing files; all other cards keep their supplied placeholder names. Music cards are square, photographs retain their full 4:3 frame, and the other shapes follow the sketch.

The phone re-measures its text anchors when a row changes, keeping its walk, flight, footer and type sizes. The desktop draft pins the text at the upper left and moves it through the viewport over the full journey. Its empty chapter articles keep the home's exact heights, measured from invisible, inaccessible copies of the existing cards and hero because some cards exceed their CSS minimum. It uses the existing card treatment and follows the same Walk-mode scroll and visibility. The home route, stage runtime and stage assets are unchanged. `/v` remains its existing phone frame, not a variant list.

Files: `src/data/about.ts`, `src/components/AboutText.astro`, `src/components/Journey.astro`, `src/pages/v/walk.astro`, `src/pages/v/journey.astro`, `src/lib/phone/story-path.ts`, `src/scripts/phone-walk.ts`, `src/scripts/journey-text.ts`, `tests/phone-story.test.ts` (existing paragraph counts and identity check), and this index entry.

Headless Chrome checks: identical rendered text in both views, one open row, Enter/Space, horizontal scrolling, visible focus, 320/390px phone layouts, re-measured anchors, reduced motion and legacy media-query listeners without ResizeObserver. Desktop checks cover exact home/spacer geometry, first and last lines, offscreen keyboard focus, Walk mode and Escape, and clicking the existing award to open its panel while the text hides. Captures are in `.cache/text-on-top/`. The draft was opened in his Chrome; visual inspection was headless only because AppleScript JavaScript access is disabled. Actual old WebKit was not available; its fallback paths were exercised in Chrome.

## Follow-up: the older walk speed

"Walk speed has increased too much. The older walk speed was perfect." Only his four levers changed: 18px padding above and below each paragraph (36px between paragraphs, shared with `/v/journey`), the phone route's column left aligned with its existing 7.2% gutter and 560px maximum width, 20px text (19px below 350px), and 30vh above / 90vh below the whole text, using the existing stable `--vh` and safe-area handling. The walk code, plane, rows and footer are unchanged.

HEAD `604a1f8` was rendered from `.claude/worktrees/walk-head` using the existing dependencies, without a `node_modules` directory or install there. The temporary server and worktree were removed afterward; the server on 4321 stayed running. Rates use the runtime's measured route anchors, including HEAD's extra flight anchors, and exclude the stationary tail below the final anchor. The route travels 4,410 units in every case. HEAD's rates were also checked against actual walker positions.

- At 390×844: HEAD 3,392px, 1.300 units/px overall, 4.344 fastest; before 2,067.43px, 2.133 overall, 3.915 fastest; after 3,438.58px, 1.283 overall, 2.719 fastest. Overall is 1.4% slower than HEAD.
- At 1456×902: HEAD 3,175px, 1.389 units/px overall, 4.065 fastest; before 2,031.08px, 2.171 overall, 4.306 fastest; after 3,348.38px, 1.317 overall, 2.719 fastest. Overall is 5.2% slower than HEAD.

The fastest stretch in HEAD is university arrival to ShiftKey; before and after it is Webcube to university. Measurements and headless captures are in `.cache/walk-speed/`.

## Follow-up: phone and laptop spacing

The split is 768px. Below it, `/v/walk` returns to a centred maximum-width column, left-aligned text and 7vh top padding plus the safe area. Bottom padding is the fixed graphic's 30vh height minus 24px: the unchanged footer already contributes 32px below its links, leaving an 8px gap above the graphic. The graphic's border box already contains its bottom safe-area padding. From 768px up, the left column and 30vh / 90vh outer padding stay as they were. Type sizes, paragraph padding and the walk code stay unchanged.

At 390×844 the walker reaches 4,510 path units at the scroll end in Floqer, both with rows closed and with the food row open; the footer gap measures 7.77px. A separate CSS simulation of 47px top / 34px bottom safe areas also reaches the endpoint with the same gap. Visual checks were headless Chrome only.

Current overall / fastest rates in units per pixel: 390×844 is **1.522 / 2.719** against HEAD's **1.300 / 4.344**; 1456×902 stays **1.317 / 2.719** against HEAD's **1.389 / 4.065**. No speed tuning accompanied this correction.

## Follow-up: put both views on the home page

"Change the entire homepage for all of this." "Mobile view will always stay the graphic one and the laptop view can be switched between the graphic and 3D." "For the laptop view I need the top and bottom spacing." "I told you to pick the text from my current website, like the deployed one, from how I wrote it there."

Home shares `GraphicWalk` with `/v/walk` and loads `TextJourney` through `/v/journey` for 3D. Laptop means at least 1024px, a fine pointer with hover, and zero touch points. Everything else stays graphic without a switch, including tablets with a mouse and touchscreen laptops. This replaces the earlier 768px split: phones/tablets keep the centred column, 7vh top and footer clearance. Laptops keep the left column and 30vh / 90vh spacing, now also applied to 3D text.

Graphic / 3D sits top right, 16px down. Scroll / Walk stays top centre; keys stay bottom centre, 20px up. Removing the hidden iframe stops rendering even in Walk mode. Returning recreates 3D in Scroll mode at its saved scroll position; graphic scroll is also preserved. The renderer preload moves from `/` to `/v/journey`. The stage runtime and assets stay untouched; old cards and hero remain invisible sizing copies.

The exact 16 replacement paragraphs include the Google Code In label. Opening and rows stay. Graduation's empty stop gets an anchor interpolated between Collect. and Floqer. Only the existing paragraph-count expectation changed.

Headless production checks, not his Chrome: identical phone/draft geometry and text; Floqer at 4510 units with a 7.77px footer gap; empty graduation still performs its activity; award opens on click; hidden renderer frame count stops; controls remain separate at 1024px. Phone/tablet loads request no 3D files. Evidence and the clean phone request list are in `.cache/home-views/`. Port 4321 remains running but serves stale home CSS and 504 Outdated Optimize Dep responses, so verification used a temporary production preview.

The default-home look callers now break because the stage and its diagnostics live in the iframe: `burst`, `leaks`, `marks`, `perf`, `pin`, `pins`, `poster`, `rays`, `roam`, `roam-bot`, `seams`, `shots`, `stream`, `void` (all `.mjs`), plus their `stage.mjs` helper. Their old card-hiding/card-measurement assumptions also no longer describe the continuous text. No look tools changed.

Files for this follow-up: `src/pages/index.astro`, `src/components/GraphicWalk.astro`, `src/components/TextJourney.astro`, `src/pages/v/walk.astro`, `src/pages/v/journey.astro`, `src/scripts/home-view.ts`, `src/lib/view-mode.ts`, `src/scripts/phone-walk.ts`, `src/scripts/journey-text.ts`, `src/layouts/Base.astro`, `src/data/about.ts`, `scripts/stage-delivery.mjs`, `tests/phone-story.test.ts`, and this doc.

## Follow-up: one page, width only

"It should just be a simple one-page homepage now. Just divide it by the width of the screen. It should view different things."

Removed all three `src/pages/v/` routes and the renderer modulepreload build hook. Home renders the graphic below 1025px; at 1025px and above it starts in 3D with Graphic / 3D at the top right. No pointer or touch checks. The actual Journey markup stays in an inert template until first shown, then lives in the home document. No iframe. Tags have distinct IDs per view and one page-level handler. Words and spacing stay.

The existing hidden-tab handler only released keys, and `off` only disabled effects. The added `setActive` hook cancels animation/idle callbacks, pauses video and pending preparation, and ignores hidden-stage input. Resume retains the renderer, scroll and Walk state without requesting the assets again. No stage geometry, camera behavior or assets changed.

Exact `stage-run.ts` changed lines: 70–78, 84, 87, 91–98, 349–350, 425–426, 1076, 1457, 1502, 1514, 1891, 1991, 2169, 2172, 2208, 2210, 2224, 2248, 2271, 2285, **2297–2313** (the hook), 2329, 2377, 2481, 2517–2518, 2573. Preparation gates include environment-map draws and the handset's async shader preparation, so hiding during loading also draws no frames.

Headless production evidence is in `.cache/one-page/`: 390px and 1024px request no stage files; 1025px opens 3D even with touch and no hover. Frame counts remain fixed while hidden during loading, Walk and resize. Resume uses the same renderer with zero new requests. Tags work in both views; phone still reaches Floqer with an 8px footer gap. The unchanged laptop look helper reaches the stage on `/` again. Port 4321 was left running for Vansh to restart; these were not checks in his Chrome.

Remaining look limitations: `seams.mjs` uses 640px, so gets graphic and cannot find the stage. `marks.mjs` measures old chapter cards, missing the continuous text. `shots`/`burst` without CARDS, `pin`, `void`, and `poster` still leave the new text visible when trying to hide it; `void`'s pixel results and `poster`'s output are therefore unsuitable. No look tool changed.

Other touched files: home/view scripts and components, `view-mode.ts`, `stage-delivery.mjs`, and the old route link in `docs/phone-opener-research.md`. Added `about-text.ts` and `journey-view.ts` for the single document's handlers. No tests changed in this follow-up.

"Just put it alongside in the same tab as scroll, walk, and graphic": at 1025px and up, one top-centre Scroll / Walk / Graphic row replaces the two switches; Scroll opens first, each 3D button returns in its named mode, and Graphic keeps the stage paused. The selected button always uses dark ink with light text in both themes. Existing stage handlers are reused without further changes to `stage-run.ts`; below 1025px remains graphic with no row or 3D requests.

"This is way too big a text": dropped the scroll-speed target. Laptop 3D paragraphs use `--reading-size: clamp(26px, 2.05vw, 34px)` in `Journey.astro`, 1.5 line height, a 620px reading area at 1456px, and one line of padding above and below each paragraph. The name, tags, cards and existing contact links scale with it in `TextJourney.astro`. Kept the 74% backing, 30svh/90svh outer space and unchanged slide; phone-focus no longer hides the text, while holding a thing still does. Graphic, phone and stage code stay unchanged.
