# The flight into Halifax

- Halifax under the window: buildings, streets, parks, lakes and the sea (from the coastline) are [OpenStreetMap](https://www.openstreetmap.org/copyright) data, © OpenStreetMap contributors, ODbL. `scripts/stage-halifax.mjs` writes `src/lib/stage/halifax.json`; the runtime extrudes it (`src/lib/stage/halifax.ts`). Heights come from the tags where there are any and from the building's kind and footprint where there are not.
- Sky: [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Greg Zaal (photography), Jarod Guest (sky edits), CC0. Tonemapped panorama resized to 4096 × 2048 WebP. The cloud deck the aircraft sinks through is painted at runtime (`stage-paint.ts`).
- `dalhousie_campus.glb`: project-authored geometry made in Blender with `scripts/stage-flight-campus.py`: the Goldberg Computer Science Building alone, zinc-panel façade, recessed blue glazing, four-storey massing, rooftop equipment, entrance and forecourt, based on [Dalhousie's Goldberg reference](https://www.dal.ca/campus-maps/building-directory/studley-campus/goldberg-computer-science.html). An architectural interpretation, not a survey or an official model. It stands on its OpenStreetMap footprint; the footprints under it are left out of the data.
- The aircraft, its wing and engine, the jet bridge and the seats are built in code (`src/lib/stage/built.ts`). The route on the seat-back screens is drawn, not a real flight plan.
- Trees, furnishings and surfaces retain their [existing credits](./CREDITS.md).

Rebuild: `node scripts/stage-halifax.mjs` for the city, `node scripts/stage-flight-assets.mjs` for the sky and the building. No authentication is required.
