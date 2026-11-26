# 42. The Toronto view out of Floqer's windows: research (2026-10-02)

Research only. Nothing built, nothing seen in the scene yet. Photographs in `ref/toronto/` (README there has every source and licence).

## Verdict

- The view fails because nothing in it is a real thing: one beige window grid on every block, and the CN Tower hidden behind boxes (only its pod shows in f16.5).
- **Primary:** a real photograph as the skyline, real Old Town blocks and a streetcar in front of it. Photo 02 (Riverdale Park, April 2026) cut to a strip, on a cylinder 2 km out, fixed in the world.
- CN Tower 13° tall, about 20° toward +z from the wall's normal: the middle of the screen as he walks up to the windows (c 16.5 to 16.6).
- Cost: strip 0.21 MB (4096 px) or 0.61 MB (8192 px), measured. With facade textures about 0.75 to 1.15 MB. About 10 draw calls, 6 today.
- **Fallback:** the same strip rendered in Blender from the City's 3D Massing. Same runtime, only the image changes.
- Licence of the photo: CC BY-SA 4.0. Credit, link, and the strip itself stays BY-SA.

## Why the current view does not read as Toronto

Read from `.cache/floqer-r0/f16.5.png`, `f16.7.png` and `torontoView` (walk-built.ts).

- No landmark in frame. The CN Tower stands 9.6° toward -z, behind the box towers. In f16.5 only its pod shows, between two boxes at the window's top right, cut by the window head.
- One material. Every block carries the same grid. Toronto's towers are told apart by colour: red, white, black, gold.
- Half the frame is invented brown infill and a bare ground quad. No street, no roof clutter, nothing moving.
- The lens is 74° tall: a true tower 2 km off is about 140 px on his 829 px frame, its shaft 5 px. A coded stick that thin has no detail to carry it. A photograph has.
- Flat sky, even light, hard edges at every distance.

## What reads as Toronto, ranked

| # | Thing | Facts to draw it | In a west window from Old Town? |
|---|---|---|---|
| 1 | CN Tower | 553.3 m. Concrete to 457.2 m, antenna 96.1 m. Main deck 346 m, glass floor 342 m, SkyPod 447 m. Hollow hexagonal core; three legs blend into it under the pod (a Y in plan at the ground). City model: shaft radius 24 m at the ground to 9 m, pod radius 23 m from 330 to 360 m. Pod, bottom up: white ring radome, dark glass band, pale metal decks. Antenna white with red bands. Pale warm grey concrete (ref-d, 01) | Yes |
| 2 | The core's colours | Scotia Plaza 274.9 m, red granite, a stepped notch down its top corner. First Canadian Place 298.1 m, white, BMO sign. TD Centre: black steel and bronze glass slabs to 223 m. Royal Bank Plaza: gold glass, 180 and 114 m. Commerce Court West 239 m, silver. Brookfield Place 263 m with spire, and 208 m. CIBC Square 241.3 m, diamond faceted blue glass. L Tower 205 m, curved top. St. Regis 276.9 m with spire. One Yonge 351.4 m, 106 floors, topped out: the tallest building now, on the waterfront | Yes |
| 3 | Streetcar | Red and white Flexity Outlook, five sections (count UNVERIFIED), about 30 m (the tender asked 27 to 30), 3.84 m tall, tracks mid street, overhead wire on span wires (ref-b). In the repo: `ttc_flexity` | Yes, on the street below |
| 4 | Red brick Old Town | Five storey brick warehouses on stone bases (ref-b), tar roofs with air handlers and ducts (ref-c), St James's green copper spire (04) | Yes, the foreground |
| 5 | Rogers Centre | White dome 86 m, four roof panels, 256 by 243 m, at the tower's south-west foot | No. Hidden from the east; south and west views only |
| 6 | Lake and islands | Water under the skyline (05, 06, 07) | No. South views only |
| 7 | Gooderham flatiron | 1892, five storeys, red brick wedge, green copper roof, Brookfield Place behind it (ref-a) | No. A street level view on Front Street; no free model found |
| 8 | City Hall | Two curved towers, 99.7 m and lower (27 and 20 floors), round a saucer | No. Hidden behind taller towers |
| 9 | Union Station, the Gardiner | Low. Read only from beside them. UNVERIFIED, no source checked | No |

- The One (308.6 m, 85 floors, topped out) and Aura (272 m) stand north at Bloor and Gerrard, outside a view of the core.
- **The four that do it:** the whole CN Tower against sky; red Scotia and white First Canadian Place beside it; a red streetcar under its wire below; red brick in front. Photo 02 holds the first two by itself.

## Vantages

Angles from coordinates, tower base to tip.

| View | Tower | Where the tower sits | Foreground |
|---|---|---|---|
| East, Riverdale Park East (01, 02, 03) | 4.0 km, 7.4° | Middle of the cluster, Scotia right of it | Park, Don Valley trees |
| East, an Old Town roof (04) | 1.96 km, 14.9° | Left of the bank towers, L Tower between | Brick co-ops, St James's spire |
| West, Bathurst Street bridge (08) | 1.16 km, 25° | Alone at the end of the rail corridor | Tracks, GO trains, condos |
| West, King West and Liberty Village lofts | 1.25 km, 24°; 2.7 km, 11.5° | Right of, or in front of, the core | Brick lofts. UNVERIFIED, no photo collected |
| South down John Street from Queen | 0.84 km, 33° | At the end of the street | UNVERIFIED, from memory |
| South, the islands (05, 06, 07) | 2.7 km, 11.7° | Left, the dome at its foot, the core right | Water |

**Floqer's house**

- Found. The public Luma page of the after party of 28 May 2026 (he is a host) gives Berkeley Street at Adelaide Street East, Old Town. His LinkedIn post: "Floqer house is in downtown Toronto". Company profiles list Halifax as headquarters. A TechCrunch Battlefield listing: not found, UNVERIFIED.
- The pin is on the east side of Berkeley, so the street front faces west (bearing 253°). The scene's west windows match the truth.
- From there: CN Tower 2.15 km at bearing 238°, 15° left of straight out, tip 14.4° up. First Canadian Place and Scotia straight out at 1.3 to 1.5 km, 11.5 to 12°.
- What the real windows see: OSM has a 14 storey block (45 m) across the street, 60 m off, covering bearings 212 to 264 up to about 28° from a low floor. A condo, not the skyline. UNVERIFIED by photograph.
- Photo 04 (public domain, 2013) is the skyline from a roof 400 m south of the house. So the scene's view is true to the neighbourhood at roof height, not to the house's own glass.
- From that roof today (OSM, 30 m up): open from 228° to 280°. The waterfront towers at 228 to 234° now reach 14.8°, level with the CN Tower's 14.9°. From the north-east the tower still stands clear: one more reason for photo 02.

**What the windows let through** (eye 1.6 m, head 2.3 m, sill 0.75 m, lens 74°; the code has two windows, at z0 + 2.5 and z0 + 7.5)

- The whole tower shows only within 0.7 / tan(tip angle) of the glass: 7.4° from 5.4 m, 13° from 3.0 m, 15° from 2.6 m, 20° from 1.9 m.
- f16.5: 3.8 m from the glass. The first window shows 10° up, 13° down, from 15° toward -z to 30° toward +z. The camera looks 22° toward +z.
- Key c 16.6: 2.8 m. 14° up, 17° down, 22° toward -z to 36° toward +z.
- f16.7: 1.9 m, 20° up, the camera turning up the wall.
- Key c 16.96, along the wall: 0.45 m, 57° up, 62° down, only directions 20° to 85° toward +z.
- So nearly all he sees outside lies between 0° and 85° toward +z. The skyline belongs there. Today's tower stands the other way, at 9.6° toward -z.

## How others make window views

- **Film.** A printed backing hangs 3.7 to 9 m behind the window; Rosco: none holds under 3 m with camera movement. Horizon at lens height. Farther planes are softened on purpose: a sharp backing reads flat. The view runs hot, "nearly white" with a little detail (David Mullen ASC).
- **LED volumes** redraw the view from the tracked camera. Parallax solved by rendering.
- **Games.** Valve's 3D skybox: a small separate world at 1/16 scale with real parallax and its own fog. Vistas: a panorama, low-poly shapes, alpha cards on silhouettes, fog. Interior mapping fakes rooms behind glass in a shader.
- **Archviz.** An unlit plane behind the window, out of the lighting; match the lens and the horizon; nothing close in the photo; overexpose it.
- **Real or fake.** Horizon at eye height. Haze lowers contrast, it does not blur: contrast kept = exp(-3.912 x distance / visibility); a clear day keeps 92% at 1 km and 79% at 3 km, light haze 82% and 56%. A colour per building, a sun that agrees with the room, roof clutter, window rhythm: my judgement, no primary source, UNVERIFIED.
- **Parallax over the 12 m walk.** 50 m: 13.5°. 200 m: 3.4°. 1 km: 0.69°. 2 km: 0.34° (3 px). So: geometry to about 300 m, a photograph fixed in the world at 2 km, the sky locked to the camera.

## Assets

| Asset | Licence, checked on its own page | Verdict |
|---|---|---|
| 02 Riverdale panorama, 11 April 2026, 8921 x 2974, about 99° wide, Dillan Payne | CC BY-SA 4.0. Template and passed Flickr review | **Use: the strip** |
| 01 Riverdale 57 mm, same morning, 6945 x 4630, 314 px per degree | CC BY-SA 4.0, same checks | Spare: more detail in the core |
| 03 Riverdale, June 2012, 14:30 | CC BY-SA 2.0, template | Spare: afternoon light that suits the room's sun; old skyline, heavy cloud |
| 04 Old Town roof, 2013, 12745 x 1656, Geo Swan | Public domain, `{{PD-Self}}` | Spare with no obligations. True vantage; L Tower under its crane, the tip at the frame's edge |
| 05, 06 islands 2026; 08 Bathurst bridge | CC BY-SA 4.0 | Reference. Views from the water or the west |
| 07 harbour 2019, Bernard Spragg | CC0, passed Flickr review | No obligations, but a view from the water |
| ref-a flatiron, ref-b King East streetcars, ref-d tower from below | CC0 | Build the foreground from these |
| ref-c tenth floor window | CC BY-SA 2.0 | Reference for roofs |
| City of Toronto 3D Massing 2025 | Open Government Licence, Toronto: "worldwide, royalty-free, perpetual, non-exclusive licence to use the Information, including for commercial purposes". Asks for the line "Contains information licensed under the Open Government Licence – Toronto." | **Fallback source.** One 145 MB zip (a geodatabase, a layer per tile); 15 downtown tiles hold 7,694 buildings, 7.3 M faces. CN Tower in real shape (8,302 faces), Rogers Centre (4,469). Web Mercator: scale by 0.7236. Tiles 50G_SOUTH_2 (tower), 50G_NORTH_3 (banks), 51G (Old Town) |
| OpenStreetMap, the repo's cache | ODbL: "free to copy, distribute, transmit and adapt our data, as long as you credit OpenStreetMap and its contributors" | **Use: near blocks.** Core: 7,004 buildings and parts with a height (2,139 tagged, the rest from levels), roof shape on 943, colour on 1,296 (Scotia #290000, Royal Bank Plaza #FFD700). Errors: L Tower and St. Regis tagged 1 m |
| CN Tower scan, Sketchfab 1f105541 (the one in doc 19) | Labelled CC BY, but its own text says "3D scan export from google earth" | **Do not use** |
| CN Tower base mesh, Sketchfab da7bbf49, 14,518 faces | CC BY 4.0 by the API; download needs a login | Not needed with a photograph |
| Bank towers, flatiron, dome, streetcar models | None usable found | Keep `ttc_flexity` |
| Google Photorealistic 3D Tiles | "Customer will not export, extract, or otherwise scrape Google Maps Content for use outside the Services." | No |
| ambientCG Facade018A (brick, windows), Facade006 (white grid), Facade001 (glass) | CC0: "All ambientCG assets are provided under the Creative Commons CC0 1.0 Universal License." | Use on near blocks. Look UNVERIFIED, not opened |
| Poly Haven tarred_gravel, bitumen; the sky already in `sky/toronto.webp` | CC0: "Our assets are all licensed as CC0" | Roofs; the sky over the strip |

What each licence asks:

- CC BY-SA: "give appropriate credit, provide a link to the license, and indicate if changes were made"; "If you remix, transform, or build upon the material, you must distribute your contributions under the same license". The strip is such a remix.
- CC0 and public domain: nothing.
- OGL Toronto: the one line above, and a link where possible.
- ODbL: the credit already in CREDITS.md.

## Pipeline, primary

1. `scripts/stage-skyline.mjs` (sharp is installed). From the 16 MB original of 02, rows 560 to 1670, all columns: from sky over the tip to the tree line. `ref/toronto/mock-skyline-strip-from-02.jpg` is that cut.
2. Grade for a view through glass: blacks lifted, contrast down about 15%, no sharpening. Top fifth fades to clear so the sky dome shows above. The trees at the foot fade to the haze colour `#C9D7E3`. Sky sampled from the photo: `#8BB4EF` high, `#B2D1F7` at 8°.
3. Write `sky/toronto-skyline.webp`, 8192 x 1024 (614 KB at q80, measured without alpha) and 4096 x 512 for tier 1 (212 KB). Two 4096 halves if 8192 must be avoided.
4. Builder `torontoSkyline`: an open cylinder segment, radius 2000 m (inside the 2400 m sky dome), seen from inside, centred on the first window, fixed in the world.
   - Magnify 1.85: the photo's 7.0° tower becomes 13°. Its 99° of width spans about 180°, its height runs from 70 m under the eye line to 750 m over it.
   - The photo's eye line is its tree tops (row 1570): put that row at floor + 1.6 m.
   - CN Tower's column at 20° toward +z. Try 15° to 30° live. Do not mirror the photo.
   - At 13° the pod shows at f16.5 and the whole tower from c 16.6 (2.8 m). For a bigger tower try 18° (178 px); its antenna then hides until 2.2 m from the glass.
5. Material: `MeshBasicMaterial`, sRGB map, transparent, `depthWrite: false`, `fog: false`, inside faces. Add the name to `backdrop` in stage-run.ts and to `DROP_PROP` in bake.ts and stage-bake.py. `live: 'city'`.
6. Take out of `torontoView`: the coded tower, the far towers, the invented infill. The photograph carries all three.
7. Near blocks, 0 to 600 m, real: a second cut in stage-city.mjs from the cached OSM round the house, written to `oldtown.json`. Drop any block over 3° in the tower's arc. Brick to six storeys, glass or white grid above, OSM colour where tagged. Tar roofs, parapets, a few boxes for air handlers. Merged by texture.
8. The street under the glass: `streetAlong` and `frontRow` as Volta has them, tracks down the middle, a span of wire, `ttc_flexity` as a mover.
9. Past about 67° toward +z the photograph ends: near blocks close the view there, as they do round the real house.
10. Look: `LIVE=1 CARDS=1 shots.mjs` at 16.5, 16.6 and 16.7, `void.mjs` over the room, `rays.mjs` through both windows, `perf.mjs`. Credit line in stage-assets.mjs.

Bytes: strip 0.21 or 0.61 MB; three facade maps about 0.45 MB and `oldtown.json` about 0.06 MB (both UNVERIFIED, not made). Draw calls: strip 1, walls 3, roofs 1, clutter 1, street 1, wire 1, streetcar its own.

## Pipeline, fallback

1. Fetch `3DMassingMultipatch_2025_WGS84.zip`, read the 15 downtown layers with GDAL, scale 0.7236, export glTF.
2. Blender 5.2.1: camera in Old Town 30 m up, panorama type Central Cylindrical (present in 5.2.1, checked), sky and sun where the room's sun is, a mist pass for haze.
3. Materials: the towers of row 2 by hand in their colours, the rest by OSM colour or height with the ambientCG facades. CN Tower from the massing.
4. Render 8192 x 1024 to the same file. Same runtime.
5. Credit: the OGL Toronto line.

Honest: right angles and sun by construction, but it reads as a good model, never as a photograph. Effort: one to two days of materials, UNVERIFIED.

## Risks

- **Not seen in the scene.** The cut, the angles and the bytes are measured. The look is not.
- **ShareAlike.** The strip stays CC BY-SA 4.0 with credit, link and a note of the changes. My reading: the site's code and other files are not touched by it; screenshots of the room carry the photo. UNVERIFIED, not legal advice. Ways out: ask Dillan Payne (Commons user PascalHD) for plain credit, or use 04.
- **Sun.** The room's sun comes in through these windows at 34° (afternoon). Photo 02 is lit at 10:46 from the lake side. Most eyes will pass it. If not: 03's light agrees, or rebake with sky light only.
- **Tone mapping.** The stage draws through EffectComposer and OutputPass; three's docs say `toneMapped: false` is ignored there. Set the strip's brightness in the image, let it sit bright, check on screen.
- **Trees.** Bare April trees run along the strip's foot. The near blocks or the haze fade must cover them.
- **Magnifying 1.85** flattens depth a little, a long lens look. Judge live.
- **8192 px** is not safe on every phone. Tier 1 takes the 4096.
- **Date.** One Yonge and The One carry cranes in April 2026.
- **Privacy.** This doc names the house's corner, from his own public event page. The repo is public. Cut the line if he prefers.

## Sources

- Repo: `.cache/floqer-r0/f16.5.png`, `f16.7.png`; `walk-built.ts` (`torontoView`), `dolly.ts`, `sets.ts`, `stage-run.ts`; `.cache/osm/toronto.json` (line of sight and tag counts computed from it).
- Floqer: https://luma.com/jo6qxvwm , https://www.linkedin.com/posts/vanshsood_were-opening-our-hacker-house-for-toronto-activity-7463664362378125313-xRG0 (search snippet only), https://betakit.com/from-chrome-extension-to-customer-data-engine-floqer-announces-2-million-raise/
- Landmark figures: English Wikipedia infoboxes and text for CN Tower, First Canadian Place, Scotia Plaza, Toronto-Dominion Centre, Royal Bank Plaza, Commerce Court, Brookfield Place (Toronto), CIBC Square, L Tower, The St. Regis Toronto, Pinnacle One Yonge, The One (Toronto), Aura (Toronto), Toronto City Hall, Gooderham Building, Rogers Centre, Flexity Outlook (Toronto streetcar). Dome and tower dimensions also from the City's massing.
- Photographs: Wikimedia Commons file pages, listed in `ref/toronto/README.md`.
- Licences: https://creativecommons.org/licenses/by-sa/4.0/deed.en , https://creativecommons.org/publicdomain/zero/1.0/deed.en , https://open.toronto.ca/open-data-licence/ , https://www.openstreetmap.org/copyright , https://polyhaven.com/license , https://docs.ambientcg.com/license/
- Data: https://open.toronto.ca/dataset/3d-massing/ , https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/package_show?id=3d-massing , https://api.sketchfab.com/v3/models/1f105541bda242bcb8c00ac9a71bdfd9 , https://developers.google.com/maps/documentation/tile/policies
- Film: https://us.rosco.com/sites/default/files/content/resource/2016-09/Rosco_Backdrops_Resolution_Guide.pdf , https://cinematography.com/index.php?/forums/topic/20972-treatment-of-windows/ , https://www.jcbackings.com/backing-tips.php
- Games and archviz: https://developer.valvesoftware.com/wiki/3D_Skybox , http://joostdevblog.blogspot.com/2018/09/interior-mapping-real-rooms-without.html , https://80.lv/articles/creating-breathtaking-game-backgrounds , https://support.chaos.com/hc/en-us/articles/4528617090961-How-to-create-a-background-material-in-Corona-for-3ds-Max , https://dev.epicgames.com/documentation/unreal-engine/hdri-backdrop-visualization-tool-in-unreal-engine
- Haze: https://en.wikipedia.org/wiki/Visibility
- three.js: https://threejs.org/docs/pages/Material.html , https://threejs.org/docs/pages/CylinderGeometry.html , https://threejs.org/docs/pages/Texture.html , https://web3dsurvey.com/webgl/parameters/MAX_TEXTURE_SIZE , https://www.donmccurdy.com/2024/02/11/web-texture-formats/
