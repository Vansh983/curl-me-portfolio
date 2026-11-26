# 96-seat lecture auditorium

2026-09-08. Replaces the small theatre layout in [22-airborne-back-row.md](./22-airborne-back-row.md). The airborne campus and phone sequence are unchanged.

## Delivered

The room is 12.6 × 15.4 m, with a 6.6 m ceiling, eight tiers and 12 fixed seats per tier. Two banks of six flank a 1.4 m central aisle; two side aisles each have sixteen 180 mm steps. The highest tier and rear landing are 2.88 m high.

The loose SchoolChair models and writing benches are no longer placed here. Authored auditorium seats have burgundy scanned-wool upholstery, rounded timber backs and armrests, a bolted steel pedestal and continuous row beam. Empty seats have folded pans and stowed writing tablets. The viewer's seat has an open pan and tablet carrying the existing laptop. No avatar is rendered.

The teaching end has a low timber dais, lectern, larger CS board, acoustic timber fins and speakers. Side-wall absorption panels and step lights follow the rake. Ceiling lights are baked by Blender, not twelve additional runtime lights.

`sets.ts` owns `AUDITORIUM`, `LECTURE_ROWS` and `TOP_ROW`; geometry and the destination camera consume these shared dimensions. `CLASSROOM_VIEW` remains seated 1.28 m above the highest tier. The phone uses that same destination, including the portrait crop. The lean-build skill kept this revision in the existing geometry/material/placement/bake seams, without new dependencies or render subsystems.

## References and assets

- [Ferco FT10 Wrimatic](https://fercoseating.com/products/education/lecture-series/wrimatictm-ft10): upholstered lecture seating and integrated writing tablet reference.
- [Hussey Quattro Art](https://www.husseyseating.com/products/quattro-art-series/): fixed auditorium seating and tablet-arm reference.
- Existing licensed Poly Haven wool, carpet and oak textures are reused. No manufacturer model was downloaded or copied. This is an original scene interpretation, not a surveyed Dalhousie room or an egress-compliance design.

## Rebuild and proof

Run `npm run stage:bake -- 6 128 2048 512 0.002`. Blender 5.2.1 LTS performs the lighting/UV bake; the standard glTF optimizer simplifies and compresses the result. The initial zero-simplification export was 7.1 MB, exceeding the 5 MB file budget. Re-optimizing the same Blender bake with 0.002 error brings it to 4,126,988 bytes. The lightmap is approximately 188 KB. Retain this simplification setting for this large seating scene; set 5's close-up aircraft can still use zero.

79 tests pass after the optimized asset is written. Type check: zero errors/warnings, five existing hints. Production build and whitespace check pass; the existing bundle-size advisory remains. Browser checks at q=.793, .829, .831 and 1 passed on desktop; portrait checks at .793, .831 and 1 also report no browser errors. Ignored evidence: `.cache/auditorium-desktop`, `.cache/auditorium-mobile`, `.cache/bake/set6_render.png`.

The subsequent requested teaching/Bean/travel/graduation continuation is recorded in [24-bean-journey-continuation.md](./24-bean-journey-continuation.md); it is not implemented by this auditorium revision.
