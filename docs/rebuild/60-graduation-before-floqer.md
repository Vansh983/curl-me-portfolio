# 60. Graduation before Floqer

2026-10-27. Move graduation to immediately before Floqer, show Bean's funding in its illustration, and commit the mobile work so far.

The mobile path now has a compact graduation stretch between Collect. and Floqer. The existing degree paragraph moves there verbatim. The arrival in Halifax stays earlier, with its single flight and Goldberg building. The cap and diploma leave that arrival scene; the character wears a cap and gown and carries the degree at graduation instead. All 22 source paragraphs still appear exactly once, with ordinary paragraph spacing.

Bean's existing easel now reads **$40k funding**, with **Invest Nova Scotia Accelerate** underneath. This is the amount in the current `src/data/story.ts` and its accelerator paragraph, rather than the older, disputed $70k in `timeline.ts`. The Product Hunt detail stays on the same easel. No shared biography text changes.

The flight's arrival anchor now follows the end of the university paragraph rather than depending on the degree being its second paragraph. The continuous camera, one flight, one childhood hop, company grouping and existing visual style stay intact.

## Verification

104 tests pass; Astro check has no errors or warnings. Headless Chrome checks cover the reordered flight, Bean funding, graduation, Floqer and grounded endings at 320, 390 and 430px, plus reduced motion and reading without JavaScript. The dev server initially served stale character CSS; refreshing the server and checking the actual computed styles confirmed the graduation outfit. Captures are under `.cache/walk-refined/commit-*`. No build or push. The live Chrome window was opened, but visual inspection was headless.
