# 73. Restore the project archive

The original `/archive` is preserved on the `curl-era` branch in `pages/archive.tsx`, `components/archive` and `data/archive.ts`. The Astro route uses its 31 projects in their original order, with the original screenshots compressed as WebP. The gallery brings back the navy background, Bebas Neue heading, Montserrat card captions, hover tags and fixed link home.

The desktop and tablet layouts have three columns and category tabs. Phones have one column. The year picker and reset button work at both sizes. The Prodigy Music card keeps the corrected spelling and has no link because the old URL led to Lumenore.

Before and after captures are in `.cache/archive-restore/`. Headless Chrome checks covered the filters together, reset, hover tags, the home link, all 31 images and the gallery with JavaScript disabled.
