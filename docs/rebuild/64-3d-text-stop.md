# 64. Stop the 3D text at the bottom (2026-11-22)

Vansh wanted the laptop Scroll view to hold its final text at the bottom while the remaining scroll finishes the 3D journey, as the Graphic view does.

Before editing, headless Chrome at 1440×900 on `http://localhost:4321` showed the contact links reaching the bottom at scroll 12,716px (stage progress 0.7253). At the journey-end capture, scroll 17,811px, those links had risen to 116.36px from the top. The cause was `journey-text.ts` translating the full padded text column over the entire journey, including the blank space after the links.

The only product change is in `src/scripts/journey-text.ts`: measure the contact links' bottom relative to the column and cap the existing translation when that edge reaches the viewport bottom. The original reading pace stays intact. Existing font, resize and expandable-row measurements also refresh this limit. Chapter spacers, journey length, camera keys, content, Walk mode and Graphic view are unchanged.

The four before/after captures have identical document height (18,880px), scroll range (17,980px), chapter tops, 21 sampled stage scroll positions, text content and camera positions. Start and middle text positions also match. After the fix, the links' bottom stays at 900px from the text-end capture to the journey-end capture, with zero drift. Reverse scrolling restores the original middle position. At 1280×800, the links stop at 800px; opening a card row remeasures the limit. Focusing the last link keeps it visible. Walk still hides the text, and returning from Walk or Graphic restores it.

PNGs and measurement JSON are in `.cache/3d-text-stop/`: `before-{start,middle,text-end,journey-end}.png` and `after-{start,middle,text-end,journey-end}.png`. These are headless Chrome observations only; the owner's Chrome was not used. No tests were added. Existing concurrent edits in `GraphicWalk.astro`, `artwork.ts` and `story-path.ts` were left untouched. No commit or push.

Follow-up: the pinned links now use the column's 36px side gutter as their bottom gap (36px at 1440×900, 36.125px with layout rounding at 1280×720), clearing the visible bottom-centre pill by at least 18px; headless captures are `pad-journey-end.png` and `pad-journey-end-1280x720.png` in the same cache directory, Graphic's pinned text bounds match exactly before and after, and the existing 1280×720 journey-end shortfall (progress 0.9916) is unchanged.
