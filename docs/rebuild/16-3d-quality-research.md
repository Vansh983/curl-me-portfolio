# 16. Making the stage look real: research (2026-09-06)

## Verdict

Update 2026-09-06: the condo is hypothetical, not his real flat. The scan route (section 1) is parked; kept for reference.

Two moves, in this order of payoff.

1. **Replace code-built props with real PBR models.** Poly Haven (CC0) covers half; Sketchfab CC-BY covers the rest (desk, chair, monitors, MacBook, PC, bed, blinds, palms, cars, Bay Bridge, CN Tower, Xbox 360). Needs a credits page. A whole baked condo (Sketchfab, CC-BY) can replace the built shell of set 0.
2. **Rendering upgrades** (N8AO ambient occlusion, bevels, roughness variation, real PBR textures, AgX, SMAA, interior HDRI, sheen/clearcoat, low bloom). ~25 to 40 h, zero assets needed. Fixes the "blocky/fake" read on everything that stays code-built.

Why it looks fake today: no ambient occlusion, hard box edges, 8-segment cylinders, one flat roughness per material, grey studio environment. `src/scripts/stage-run.ts` (three's EffectComposer: RenderPass, OutputPass, FXAA), `src/lib/stage/materials.ts`, `src/lib/stage/rig.ts`.

## What Vansh does (the ask)

Parked items (real-flat scan, photos of his furniture) stay below for reference. Live ask: Sketchfab login (Epic account) to download CC-BY models, by him or by me through his Chrome with a per-file OK.

- **Scan the living room / desk area** with Scaniverse (free, App Store, LiDAR on, Splat mode, "Area" quality). Recipe below. Export splat as **PLY** and **SPZ**, plus a separate **Mesh scan → GLB**.
- **10 to 20 sharp photos** of each key piece from all sides (chair, desk, monitor, lamp, anything he wants exact) on a plain background. For Meshy / TRELLIS.2 photo-to-GLB.
- **Phone photos of the room** as it is: window, desk, every wall. Reference for layout and colours.
- **Sketchfab login** (Epic account since 2025-12) so CC-BY models can be downloaded, either by him or by me through his Chrome with a per-file OK.
- Optional: **Meshy Pro, $20 for one month** (photo → clean quad GLB with PBR). Free tier is 5 gens/month, CC BY.

### Capture recipe (Scaniverse, iPhone Pro)

- Light: overcast day, or night with all lights on. No direct sun in the window. Blinds set so the CN Tower shows but the window is not blown out. Keep lighting constant.
- Prep: tidy, keep the real objects. Cover mirrors. Monitors on with a still image, or off. No people, pets, moving curtains.
- Walk: 3 slow loops (1 m every 3 s): chest height aimed at walls; waist height tilted at floor and desk tops; high tilted at ceiling. Then a slow orbit of the desk at arm's length. Finish with a slow 360 at the door and one at the window. Smooth arcs, never spin in place, 60 to 80% overlap.
- Avoid: aiming into the window for more than 1 s, floor-only passes, fast pans, closer than 30 cm to glass.
- Send: PLY, SPZ, mesh GLB, photo folders.

## 1. Splat pipeline

- Capture: Scaniverse (Niantic Spatial), free, on-device training, exports SPZ/PLY/GLB/USDZ. Polycam splat export needs Basic $150/yr. Luma free cloud PLY. Postshot Windows/NVIDIA only. RealityScan no macOS.
- Clean: SuperSplat v2.32.5 (browser, MIT): crop to the room, delete floaters, cut the window plane so our own city stays outside. Export SOG or SPZ v3. CLI: `@playcanvas/splat-transform` 3.3.3 (`--filter-box`, `--filter-floaters`, `--decimate`).
- Render: `@sparkjsdev/spark` 2.1.0 (MIT, peer three >= 0.180, WebGL2 only, active). `SplatMesh({ lod: true })`, `depthWrite: false`. Works inside three's EffectComposer with non-depth passes (RenderPass/OutputPass/FXAA/SMAA fine). Depth-based passes (N8AO, DoF, outline) misbehave on splats: gate AO off for the splat set, or copy brown3d's tiering.
- Size: 20 m² room at 1 to 2 M splats: SPZ 25 to 50 MB, SOG 12 to 30 MB. Decimated to ≤ 600 K for mobile: SOG ~5 to 8 MB (estimate). Spark bundle 1.8 MB gzip. iPhone budget 1 to 3 M splats.
- Limits: no relighting, no shadows (shadow-catcher plane under real meshes). Day/night only via exposure and `SplatEdit` tint. Breaks up close and at grazing angles. Sort lags a frame on fast turns.
- Keep desk, chair, monitor as real GLB meshes on top of the splat so close-ups and the screen glow hold.
- Fallback if < 30 fps at ≤ 600 K on his phone: hand-build the room in Blender from the LiDAR mesh + photos, Meshy furniture, Cycles-baked lightmap (30 to 80 K tris, 1 to 3 MB). 3 to 6 days. Keeps real shadows and the day/night rig.
- LiDAR mesh GLB alone (3 to 8 MB): blurry, wobbly walls, baked lighting, window holes. Reference only.
- Skip: `@mkkellogg/gaussian-splats-3d` (dormant since 2025, needs SharedArrayBuffer); three core `GaussianSplat` addon (r186, WebGPURenderer only).
- Examples: icurtis1/third-person-controller-splat (Spark 2 LoD + GLB + composer bloom), aero177-jpg/radia-gallery (Spark + three EffectComposer), noahfinkelstein/brown3d (Spark + N8AO tiers).

## 2. Assets

Pipeline already exists: `scripts/stage-assets.mjs` → `gltf-transform optimize --compress meshopt --texture-compress webp --texture-size 512` + `MeshoptDecoder`. Sketchfab GLBs (5 to 70 MB raw) drop to 1 to 3 MB after `resize 1024` + webp.

### Poly Haven, CC0, no credit (polyhaven.com/a/<id>)
- sofa_02 (2.7 K tris), Ottoman_01 (pouf), modern_coffee_table_01, coffee_table_round_01, side_table_01, mid_century_lounge_chair, modern_arm_chair_01, wooden_display_shelves_01 (bookshelf), modern_wooden_cabinet (TV stand, 25 K), modern_ceiling_lamp_01, street_lamp_01 / 02, potted_plant_02 / 04, hanging_picture_frame_01..03, decorative_book_set_01, electric_stove, vintage_electric_kettle, tea_set_01, modular_urban_apartments_facade (51 m, city fill).
- Already used: television_02, gamepad, ceiling_fan, desk_lamp_arm_01, SchoolDesk/Chair_01, steel_frame_shelves_01, potted_plant_01, island_tree_01, football, throw_pillows_01, wall_clock, book_encyclopedia_set_01, gaming_console, street_lamp_01, modular_street_seating.
- Gaps (nothing usable): modern desk, office chair, monitor, modern laptop, keyboard/mouse, PC tower, modern bed, floor lamp, palm, car, bridge, towers, Xbox.

### Sketchfab, CC-BY 4.0 (credit author + link on a /credits page; login to download)
- Desk: Office Desk_7_MB (ahmagh2e) 2.8 K, `18abda12d33b4231aa13f92a291c717e`. Standing Desk (Ryan_Nein) `65a7f4b06a5f4954a0d43eb8812dd165`.
- Office chair: artvolodskikh 5.5 K, `a7fefb5dde954c84896949246dde5be6`. Gaming Chair (Kiiba) `ccb3ada5917a4b90b689e1d1bf852dc2`.
- Monitor 27": Annelida 6.4 K, `06fb18eec19245d4811c4c3c8c7ea567`. Ultrawide: `f7445b4b5d84412aa58ed7379483267c`.
- MacBook Pro 13 (timblewee) 77 K, `efab224280fd4c3993c808107f7c0b38`. Mini MacBook (bastienBGR) 20 K, `2b054523279747c8b5b2e5ed9ea7b311`.
- Mechanical keyboard (FelikinRuslan) `1ba4055c33674567b51b783701ed05ce`. Mouse + keyboard (RMrando) `d91b625d38a64ed39c1dfaef28e588d7`.
- PC tower: Zalman (slagperch3d) 5 K, `ad08a46c140c420592535131d30874a2`.
- Bed: Modern Bed (nguyenngocngan) 4.8 K, `c713701eecbd479ea5ae7918de5de2f2`.
- Floor lamp (Justin.Foley) 7 K / 0.8 MB, `083c9408b89949d8b201e8a1bb6ce41c`.
- Kitchen: Basic Kitchen Cabinets and Counter (jimbogies) 11.6 K, `d2918a9d978144f38012973b28eea9f6`.
- Blinds: Window Blind 2MB (ahmagh2e) `675f4f7b110d40698e71264dc6a8c320`. Curtains (Heliona) `a83e1baf822a4442b0f50ed70d449198`.
- Monstera (ChubbyPanda) 9.3 K, `1ab9bf841df04c07b1819be596327629`.
- Whole baked condo, reference or shell: VR apartment loft interior baked (ida61xq) 98 K, `54bc929a26094b6cb36f977903fbcd97`. White Modern Living Room (dylanheyes) `afb8cb0cbee1488caf61471ef14041e9`.
- Xbox 360 FAT low poly (senkinsky, untextured, retexture white) 4.2 K, `3b8b0231e7214a148246635a03521727`. Controller (joshuagoldenbu) 5.6 K, `b2c37a2b0bce4145bff6672d105a5567`.
- Anime figures: fan art, IP caveat, keep small: Basil Nendoroid `48875a0c88bc4517b935f0b37191cbae`, Figure Boxes `4c4ee82f48154e88afa86dc89541147e`.
- 2013 lab: Lenovo ThinkCentre M58 (quasplashipu) 868 tris, `78978164a6804d70ba13b31542bd4fbf`. Monitor (marcoZakaria) `1d4ee42eda804b02b05b63721921c1d7`. Keyboard `dd09a9f35cc8404db7e8c82eb8ec4f87`. Classroom .blend (Blender demo, CC0) for the shell.
- Palm: Date Palm (evolveduk) 10 K, `11acf710e6c149daa8d6fb8cdc5d087f`.
- Cars: Generic passenger car pack (comrade1280) 69 K, `20f9af9b8a404d5cb022ac6fe87f21f5`. SUV (mk2design) 8 K, `edc994ad28ed438cb365c0e0389ac177`.
- Bay Bridge western span (cdr420, untextured, 455 K, simplify) `1c2cd0daa908481aadad7073b91f1732`.
- Skyline: Low Poly Night City (99.Miles) 6 K, `b0035b8713b048bb8ddf311ee67c28c8`. San Francisco City (abimaelgonzale) 46 K, `108841754fd3485886c1dde13301d341`. CN Tower (Gula) 1.8 K, `36b4f641d3e74d77918770adac8e2f6a`.

### Photo → GLB for his exact furniture
- Hosted: Meshy 7 (Aug 2026), Pro $20/mo, quads, polycount target, PBR 2K/4K, GLB. Tripo 3.1 close second (free tier non-commercial). Hi3D #2 on ELO.
- Local Mac: TRELLIS.2-4B (MIT) via `trellis-mac`, needs 24 GB+ unified memory, ~3 min per object, 200 to 800 K tris → decimate. Hunyuan3D-2.1 MPS fork runner-up.
- All outputs → `gltf-transform optimize` to 5 to 20 K tris, 512 to 1024 textures.

### Not useful
- Sketchfab CC0 filter (museum scans only), ambientCG models (14 photogrammetry objects; its textures are great), Smithsonian, TurboSquid/Free3D (per-model licences), Kenney/KayKit/Quaternius (low-poly stylised, only if the whole look changes).

## 3. Rendering upgrades (prioritised, effort)

1. **N8AO 2.0.1** (CC0) as `N8AOPass` replacing RenderPass; Performance + halfRes on mobile, Medium/High desktop. 3 to 5 h. Biggest single win. WebGL2 only; keep `antialias: false`.
2. **Bevels + segments in `Sink`**: `RoundedBoxGeometry`, ExtrudeGeometry bevel for car and bezels, cylinder/lathe 32 segments, smooth normals on hero props. 6 to 10 h.
3. **Roughness variation** (256 px noise roughnessMap, 0.7 to 1.0) + **5 to 6 real PBR sets** (Poly Haven / ambientCG CC0: oak floor, plaster, fabric weave, concrete pavers, asphalt, teak; 1k diff+nor+arm webp, 300 to 600 KB each; `aoMap`/`roughnessMap`/`metalnessMap` from arm). `stage-assets.mjs` already has the texture branch, unused. 6 to 8 h.
4. **AgX tone mapping** + exposure retune + **SMAAPass** instead of FXAA + vignette. 2 to 3 h.
5. **Interior HDRI** (UltraHDR gain-map jpg, 100 to 300 KB) replacing `RoomEnvironment` for the 3 indoor sets. 2 to 4 h.
6. **PCFSoftShadowMap 2048** on desktop tier; `MeshPhysicalMaterial` sheen on fabric/duvet/pouf/curtain/rug, clearcoat on desk top, car, Xbox, figures. 2 to 3 h. Skip transmission on mobile.
7. **Low bloom** (strength 0.15 to 0.3, threshold 0.9 to 1.0) for CN Tower, screens, tube lights + device tier gate. 3 to 4 h.
8. **Baked lightmaps**: `GLTFExporter` the built sets → Blender Cycles bake → `uv1` lightMap. 12 to 20 h. Highest ceiling. Every top three.js room portfolio (bruno-simon folio-2019, jesse-zhou Ramen-Shop, henryheffernan, davidhckh portfolio-2025) is a Blender-baked `MeshBasicMaterial` scene with no runtime lights.

Skip: realism-effects (dead since 2024), VSM shadows, LightProbe, TAARenderPass, three SSAO/SAO, WebGPURenderer for now (r185 still "experimental"; EffectComposer and `onBeforeCompile` unsupported; 2 to 4 days to migrate; revisit for SSGI/TRAA).

Mobile guardrails: keep dpr cap 1.25 + EMA downscaler, drop AO before dpr. Tier by `pointer: coarse` + `hardwareConcurrency <= 4` + renderer string. ≤ 3 fullscreen passes on mobile. GPU textures ≤ 20 MB, 512 px on mobile, gltf-transform UASTC/ETC1S.

## Plan and status (2026-09-06)

Done on `canary`:
- N8AO (tiered, pacer drops it before pixels), low bloom, neutral tone map, SMAA, vignette. `?tier=0|1`, `?off=ao,bloom,vignette,smaa`, `?tm=aces|agx` for review.
- `Sink.rbox` rounded boxes on desk, monitors, laptop, hutch, PC, chair, bed, shelves, Xbox, TV, keyboard, kerb, planter, sign; cylinders 24, spheres 24x12, lathes 32 by default.
- Nine Poly Haven texture sets (`public/assets/stage/tex`, 1.4 MB): floors and oak with colour, plaster/wool/fleece/cotton/carpet relief only; box-projected uv on built props; roughness wander; sheen on cloth, clearcoat on lacquer, cars, plastic.
- Scanned armchair, side table, picture frame in the condo. Figure code and three unused models removed. Set 4.5 MB.

Open:
- Sketchfab CC-BY (needs login): desk, chair, monitors, MacBook, keyboard, PC, bed, blinds, palms, cars, Bay Bridge, skyline, CN Tower, Xbox 360, lab PCs; whole baked condo shell for set 0; `/credits` page.
- Interior HDRI for the 2010 room and lab (1k .hdr is 1.5 MB; needs a gain-map jpg route first).
- Baked lightmaps for the 2010 room and lab.
- Parked: splat scan of a real room.

## Sources

Spark: github.com/sparkjsdev/spark, sparkjs.dev/docs/spark-renderer, sparkjs.dev/docs/performance. Scaniverse: nianticspatial.com/en/capture/scaniverse-release-notes. SuperSplat: superspl.at/editor, github.com/playcanvas/splat-transform. Formats: dev.scaniverse.com/news/spz-gaussian-splat-open-source-file-format, blog.playcanvas.com/compressing-gaussian-splats. Meshy: meshy.ai/pricing. TRELLIS.2: github.com/microsoft/TRELLIS.2, github.com/shivampkumar/trellis-mac. Leaderboard: top3d.ai/leaderboard. Poly Haven: polyhaven.com/models (API api.polyhaven.com/assets?t=models). Sketchfab: api.sketchfab.com/v3/search?downloadable=true&license=by. N8AO: github.com/N8python/n8ao. pmndrs postprocessing 6.39.4. three-gpu-pathtracer 0.0.24. Baking: svilenkovic.com/3d/how-to-bake-lighting-for-web, discourse.threejs.org/t/34924. Portfolios: github.com/brunosimon/folio-2019, github.com/enderh3art/Ramen-Shop, github.com/henryjeff/portfolio-website, github.com/davidhckh/portfolio-2025. WebGPU: threejs.org/manual/en/webgpurenderer.html. gltf-transform: gltf-transform.dev/cli.

Unverified: mobile ms figures, splat size estimates, HDRI names, Blendkit free count, Sketchfab texture quality (API metadata only).
