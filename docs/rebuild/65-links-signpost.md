# 65. Links signpost (2026-11-24)

Vansh approved round nine: "yes this works implement this". The chosen option is Mixed from `.cache/links-options/index.html`: the brown direction post overlays the graphic at the bottom right while the world moves behind it. Empty space at the end replaces the rejected fixed paper patch.

`artwork.ts` now owns the approved post and five board drawings. `phone/LinksPost.astro` supplies the real links and states: Writing goes to `/blog` in the same tab; GitHub, LinkedIn and X use `profile.links` with the laptop pill's new-tab behavior. Cafes is not a link, has the amber dot and is named "Cafes, coming soon". The post is 104×244px, inset 8px from the right. Board directions, lengths, offsets, rotations, tans, stroke and lettering match Mixed. Targets are 40px high with 2px gaps and 12px type. Focus has an ink ring; hover, focus and press nudge 2px along the arrow, with no nudge under reduced motion. The generic site link underline and hover fill are suppressed on these boards.

The live path was 5,470 units, rather than the older mock capture's 5,350. It is now **5,650**, adding **180 units** of plain sky and pavement after the last landmark. `WALK_END` keeps the walker at the original **5,410** endpoint. Landmarks, activities, flight and the interpolation/damping functions are unchanged. No city posts or new landmarks were added. The existing path-length assertion was updated; no tests were added.

`GraphicWalk.astro` removes the footer links and their CSS. The final scroll anchor now uses the last story block's bottom. Padding keeps the final line above the picture and fade; the picture clips the moving artwork separately so the fixed post can rise slightly above it. The laptop links pill is hidden only when the home view is Graphic. Scroll and Walk keep it.

## Headless checks

Captured on `http://localhost:4321` with system Chrome and Playwright, at 390×844 and 1440×900 after selecting Graphic. Only the Astro development toolbar was hidden for captures. All final images were opened and inspected:

- `.cache/links-post/phone-start.png`: Toronto opening, walker on the left, Mixed post on the right, heading clear and picture full width.
- `phone-mid.png`: ShiftKey teaching scene, with the Bean scenery passing behind the readable, opaque boards.
- `phone-end.png`: final text line fully visible, Floqer and the walker left of the post, empty ground behind it, no footer links.
- `laptop-start.png`: full-width opening with the view switch present and the dark links pill absent.
- `laptop-mid.png`: the teaching, Bean, Collect and degree scenery moves behind the fixed post; labels stay readable.
- `laptop-end.png`: final text remains above the picture; the last landmark and walker clear the post on empty pavement.
- `phone-post.png`: 3× close-up at halfway, showing the five fitted boards, slight rotations and muted Cafes dot.

The post's coordinates are unchanged across the three captures. A 202-sample sweep in both directions on each viewport included the walker's painted SVG bounds and held props: minimum post clearance was 84.9px on phone and 98.1px on laptop. At the end, landmark clearance was 105.0px / 119.6px; the final text line was 44.5px / 36.5px above the picture, outside its fade. Board bounds, target separation, link attributes, all four links' hover/focus/press/reduced-motion states, actual Writing navigation, smaller-height resize and view switching were checked. The pill is present in Scroll and Walk and absent in Graphic. No graphic page errors were recorded. Measurements and verification output are in the same cache folder.

Writing navigates to the existing laptop pill's `/blog` destination in the same tab, but that route returns HTTP 404 on the current canary dev server. This is a pre-existing missing route; no blog page was added in this scope.

`npm run check && npm run build && npm test` completed without failure. These observations are headless only; Vansh's interactive Chrome was not used. No changes to the 3D stage, `TextJourney.astro`, text routes, profile data, home words or other artwork. No commit, push or PR.
