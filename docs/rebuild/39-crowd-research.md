# 39. The crowd in the hall: research (2026-10-02)

Research only. Nothing in the stage was changed. Set 11 (`convocation`), `crowdPeople()` in `src/lib/stage/sets.ts`, `dressPerson` in `src/scripts/stage-run.ts`.

## Verdict

1. The crowd reads fake mostly because of what it is made of and how thin it is: one athletic mannequin 72 times, painted-on clothes, self-lit, one height, 72 people in a house that holds 500 or more, each seen head to toe on bare floor, nobody clapping.
2. Build it from **Microsoft Rocketbox** people (MIT): real proportions, real clothes, mixed ages, with their own clap, cheer, phone and idle clips. Tested: one avatar and one clap clip import and render in Blender 5.2.1.
3. **Primary: two depths from one Blender source.** Rows 1 to 3 (on the flat floor, 6 to 8 m) stay real 3D on the existing skinned path, about 70 people. Every row behind is a card: each person rendered in Blender, drawn as one camera-facing quad, about 600 people in one draw call.
4. **Fallback: cards only**, the front rows too. Cheapest, and the look films use for a dark arena. Use it if the 3D front rows still read weird.
5. Honest answer on cards: past about 10 m in this light a rendered card looks as good as or better than a low-poly 3D figure, at almost no cost. Inside 8 m, with a camera that walks 13 m along the stage, 3D is safer. He also rejected a "2D" crowd once (painted rows, 2026-09-12).
6. Fact to settle first: Dalhousie bachelor's graduands wear gown and hood, **no cap**. Only Master and PhD graduands get a cap (dal.ca). The brief says caps.

Estimated cost of the primary: about 1.1 MB new download, about 280k triangles and 75 draw calls. Today: 176 KB, about 990k triangles, about 216 draw calls. Estimates, not measured.

## Why the current crowd reads fake

Measured from the code and from frames at chapters 14.9 and 15.

| Cue | A natural crowd | Today |
|---|---|---|
| Density | A seated hall is about 0.5 m² a person (estimate: 0.58 m seats, 0.9 m rows), shoulder to shoulder | 72 people over 19 by 16.5 m: 0.23 a m², 2.1 m apart, rows 2.35 m apart |
| Occlusion | Heads and shoulders over heads and shoulders, legs hidden | Every figure seen head to toe on empty carpet |
| Body | Many builds, ages, both sexes | One mesh, athletic, about 13.7k triangles, 53 joints |
| Height | 1.5 to 1.9 m, a child here and there | No scale set: all one height |
| Clothes | Real garments change the outline: jackets, dresses, gowns | Colour per bone on a bare body. A gown is a black body suit. Tan tops read as shirtless |
| Hair | Many shapes | One half-sphere cap, six colours |
| Stance | Feet under hips, weight on one leg | Wide action stance from the idle loop |
| Pose and motion | Most clap at their own tempo, some phones up, some arms raised | 65% idle, 35% "talk" (hands gesturing at the chest). No clap exists in the file |
| Head direction | Nearly everyone looks at the person on stage | Bodies within 12 degrees of the stage, heads follow the idle loop: down and around |
| Light | Front rows lit warm from the stage, falling off row by row, a rim on heads | Self-lit: `totalEmissiveRadiance += vBody * 0.3`. Back row as bright as the front |
| Haze | Far rows lose contrast | Fog starts at 60 m (`near: 60, far: 180`); the back wall is 34 m from the eye, so none |
| Palette | Dark and muted, a few whites | Flat saturated purple, burgundy, green, white |
| Grouping | Graduates in a block, families in clumps, gaps in clusters | Even grid with jitter, gowns scattered at random (45%) |

- Variety ranks above motion: "clones of appearance are far easier to detect than motion clones" (McDonnell et al., SIGGRAPH 2008). Viewers look mostly at heads and upper torsos (follow-up eye-tracking work; snippet only, paper not read).
- The old painted rows (`crowdRows`, paint `crowd`) are still in the code, unused.

## How others do it

**Games**
- FIFA before 2014: sprite crowds. FIFA 14 on PS4 and Xbox One: "fully polygonal 3D crowds to replace the sprite-work of previous games" (Digital Foundry).
- Mobile stadium (Space Ape): 2D billboards, a whole region in one draw call, sorted by distance from the stadium centre, scene light baked into each vertex. Their note: "people don’t focus on one person in the crowd, they focus on the crowd as a whole".
- Assassin's Creed Unity: thousands of low-res NPCs, "40 real AIs and 120 high resolution models" near the player (GDC 2015).
- Hitman Absolution: 1200-character crowds at 30 fps (GDC 2012).
- Planet Coaster: 10,000 guests from interchangeable parts and four or five short walk variants (Game Developer).
- GPU Gems 3, ch. 2: every bone matrix of every frame baked into a texture, read in the vertex shader, one instanced draw. Unreal teams do the same with vertex animation textures.
- Fortnite: octahedral impostors for far objects (Ryan Brucks).
- Survey (Beacco et al., 2016): image-based crowds are fastest but "suitable only for distant characters"; hybrids put geometry near and images far.

**Film and archviz**
- Rodeo FX, the arena in Now You See Me. Closest match to this scene. CG people "whenever we needed the crowd to be in a standing position, such as around the stage" and where perspective changed; one sprite on a card per seat behind; flat tiles furthest. Their note: "the crowd stays quite dark so we could get away with quite a lot of off-axis movement". Random sprite per seat, random time offset per section.
- Archviz stills: 2D cutout people added in post, because 3D people "always make images look 3dish" (r/archviz, search snippet). For animation: posed 3D scans (Renderpeople, AXYZ).

**Web**
- No shipped three.js site with a documented human crowd was found. What exists is demos.
- InstancedMesh2 skinning demos: 3k and 20k skinned instances (agargaro).
- three.js examples at r185: `webgl_instancing_morph` (WebGL), `webgpu_skinning_instancing` (WebGPU only).
- Octahedral impostor forest, 200k trees (agargaro).
- Codrops "False Earth": vertex animation textures with instancing in WebGL.
- CodePen "Crowd Simulator" (Szenia Zadvornykh): 2D sprites, Open Peeps.

## Techniques in three.js today

Installed: three 0.185.1, `WebGLRenderer`. It has `InstancedMesh` with per-instance colour and morph (`setMorphAt`), `BatchedMesh` (no skinning), `SkinnedMesh` (one skeleton per draw, no built-in instancing in WebGL).

| Approach | Looks | Cost | Effort | Here |
|---|---|---|---|---|
| One skinned mesh per person (today) | Best motion, true 3D | One draw call and one mixer each. About 100 is the ceiling | Built | Keep for rows 1 to 3 |
| `InstancedMesh` of static posed bodies | True 3D, frozen. Sway in the shader, or a two-pose morph per instance | One draw call per variant | Low | Good far rows if cards read flat |
| Instanced skinning: `@three.ez/instanced-mesh` (MIT, npm 0.3.16, peer three >= 0.159; `initSkeleton`, `setBonesAt`) | True 3D, real clips for hundreds | Bone texture upload each frame, one draw per mesh | Medium, new dependency | The all-3D route |
| Vertex animation textures: OpenVAT for Blender (tool GPL-3.0, no three.js sample), r3f VAT repo | Same picture as instanced skinning | Float textures | High | No gain here |
| Cards from pre-rendered sprites | Offline light, hair and cloth for free. Flat if near and the camera moves | One draw call, two triangles a person, one atlas | Low to medium | Rows 4 and back |
| Octahedral impostors: agargaro/octahedral-impostor (MIT, "wip", v0.0.1, not on npm), Ctrlmonster/three-octahedral-impostor | Correct from every angle | Large atlas | High, immature | Overkill: the camera never leaves the stage |
| Hybrid: geometry near, cards far | What film and games ship | Sum of both | Medium | Primary |

Cards beat geometry when: the viewing arc is narrow, the person is under about 200 px tall, the light does not change, the count is high, the GPU is small. All true here past row 3.

## Assets

| Name | Licence | Looks, size | Verdict |
|---|---|---|---|
| [Microsoft Rocketbox](https://github.com/microsoft/Microsoft-Rocketbox) | VERIFIED MIT. "The library of avatars is now released under MIT License." | 115 rigged people: 40 adults, 5 children, 74 professions (11 business). Real proportions, photo-textured clothes. 7.8k triangles as imported, 80 bones, FBX 0.5 MB, textures 2048 TGA (12 MB each). The paper lists levels at 10k, 5k, 2.5k and 500 triangles; the export FBX opened here held only the top one. 417 clips incl. `claphands`, `cheer`, `cell_phone`, `wave`, `idle_neutral`. No gown | **Use** |
| [VALID avatars](https://github.com/google/valid-avatar-library) | VERIFIED MIT (LICENSE: "MIT License, Copyright (c) 2022 Tiffany Do") | 42 people of seven ethnicities, five outfits each incl. casual and business. FBX about 7.6 MB each. Triangle count UNVERIFIED | Second source for more faces |
| [MakeHuman / MPFB2](https://static.makehumancommunity.org/about/license.html) | VERIFIED. "All core assets are shared under Creative Commons, CC0." Some community packs are CC-BY | Parametric humans in Blender (extension 2.0.17, Blender 4.2+). Low-poly proxies (1,591 faces). Clothes and hair need assembling. Gown UNVERIFIED | Backup source; more work per person |
| [Quaternius](https://quaternius.com/faq.html) Universal Base Characters, Animated Men, Animated Women, Universal Animation Library | VERIFIED CC0. "All models are under the CC0 License." | Stylised low-poly. Base Characters are unclothed bodies. Clap clip UNVERIFIED | No: same look as today |
| Current `base_character` (Quaternius via Poly Pizza) | CC-BY 3.0 per repo manifest. Page not re-read (captcha): UNVERIFIED | The figure in use | Replace |
| [Kenney](https://kenney.nl/support) characters | VERIFIED CC0 | Toy-like | No |
| [Mixamo](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) | VERIFIED text. Use is "royalty free for personal, commercial, and non-profit projects". Adobe terms 3.6: never "distribute the Content Files on a stand-alone basis" | Good clap and cheer clips | Fine inside renders. Raw files in a public repo: avoid. Not needed, Rocketbox has clips |
| [Renderpeople free](https://renderpeople.com/free-3d-people/) | VERIFIED terms 4.3(b): no making the 3D data downloadable "as individual files". Renders allowed (4.1a). The same models on Sketchfab are marked CC Attribution (API): conflict | Best-looking scans, 20k to 100k faces, about ten free | Renders only, if ever |
| [Human Generator](https://help.humgen3d.com/license) | VERIFIED: paid; sharing its models as files "is not allowed" | Realistic | No |
| [ActorCore free](https://actorcore.reallusion.com/3d-motion/free) | UNVERIFIED for a public site or repo | 3 actors free on sign-up | Skip |
| [Blender Human Base Meshes](https://www.blender.org/download/demo-files/) | VERIFIED CC0 | Unclothed sculpt bases | No |
| Sketchfab: [Low Detail Animated Crowd](https://sketchfab.com/3d-models/low-detail-animated-crowd-4fe76fdec12d456f9b0db06b45cc53d6) | VERIFIED CC-BY (API) | 10k faces in all, one material, animated | Too crude for rows 1 to 3 |
| Sketchfab: [Lowpoly People + Waldo](https://sketchfab.com/3d-models/lowpoly-people-waldo-9ec7a14729aa490fa712e51c217db0f5) | VERIFIED CC-BY (API) | 282 faceted figures | Stylised: no |
| Sketchfab: [Graduation Cap Pro](https://sketchfab.com/3d-models/graduation-cap-pro-48291f7500eb4c34b881ba32bcff2d41), [Academic Gown scan](https://sketchfab.com/3d-models/academic-gown-of-william-bennett-bizzell-6f4065870fc74114ac4604ff1f3d568e) | VERIFIED CC-BY (API) | 2.7k and 50k faces | Reference only; simpler to model |
| Photo cutouts (Skalgubbar and others) | UNVERIFIED | Real people's likenesses, wrong light | No |

- No CC0 pack of clothed or scanned people turned up on Sketchfab.
- MIT needs its copyright and permission notice kept: add Rocketbox to `CREDITS.md`.

## Pipeline: primary

**Source (Blender 5.2, headless, a new script beside `stage-bake.py`)**
1. Pick 16 Rocketbox avatars: 10 family (Adults and Business; mixed age, sex, skin), 6 to wear the gown. Fetch only those: FBX plus body, head and opacity colour TGAs, about 40 MB each. Keep them out of git.
2. Fetch clips: `m_` and `f_` `claphands_01/02`, `cheer_01` to `05`, `idle_neutral_*`, `cell_phone_*`, `wave_*`.
3. Import avatar, import clip, put the clip's action on the avatar's armature. Bone names match (`Bip01`). Tested with `Male_Adult_05` and `m_claphands_01`: 210 frames at 30 fps, clapping about frames 40 to 110, one clap every 6 to 8 frames.
4. Gown: one robe mesh, open at the front, wide sleeves, mid-calf, weights transferred from the body. Hood: a V at the throat in the degree colour (BCSc: emerald green, gold border, per dal.ca). No cap unless he says so.

**Rows 1 to 3: real 3D (about 70 people, 6.3 to 8.1 m)**
5. Eight avatars: decimate to about 4k triangles, merge the three materials into one 512 px texture, drop finger and face bones, export clap, cheer, idle and phone loops of 2 to 4 s at 15 fps. One GLB each through `stage-assets.mjs` (meshopt, WebP).
6. Runtime: the existing `person` path (`cloneRig`, one mixer each), with the bone recolouring, the hair cap and the 0.3 self-light removed.

**Rows 4 and back: cards (about 600 people, 9 to 33 m)**
7. Render each person from the front, 3 degrees above, orthographic, transparent film, Cycles 64 samples with denoise, 128 by 256 px. Light: warm key from the camera side and above, cool rim from above and behind, no fill. Four frames for clap and cheer, one for idle and phone.
8. Pack about 128 cells into one 2048 px WebP with `sharp`, colour bled 2 px past the alpha edge, plus a JSON of cells.
9. Runtime: one `InstancedMesh` of a quad. In the vertex shader each quad turns about its vertical axis to face the camera's position (not the view plane, so a head turn moves nothing). Per instance: cell, frame count, phase, rate, height, tint, mirror. Frame from time, rate and phase. A few millimetres of sway at the top. `alphaTest`, depth write, instances ordered near to far. The stage's leaf cutouts already use `alphaTest` this way.

**Layout (replace the grid in `crowdPeople()`)**
10. Rows 0.9 m apart, three to a tier. Seats 0.58 m. 15 to 25% empty, in clusters. Aisle kept.
11. Gowns in a block at the front centre, families behind and at the sides (usual at convocations; UNVERIFIED for this hall, he will know).
12. Height scale 0.9 to 1.08. Body turned to the stage centre within 10 degrees. About 55% clap, 10% phone up, 10% cheer or wave, the rest stand. Neighbours never share a phase; rate 0.85 to 1.15.

**Light**
13. Light the crowd in its own material, not with new scene lights, so the baked hall does not change: warm key from the stage, row 1 full, about a quarter by row 10; a cool rim; fade to the fog colour `#16141A` from 8 m. Phone screens emissive so bloom catches them.

**Phone tier**: two 3D rows, atlas at 1024.

**Check**: `CARDS=1 node scripts/look/shots.mjs` over chapters 14.6 to 15.3, `perf.mjs`, then his Chrome.

**Cost (estimate)**: 3D rows about 280k triangles, 70 draw calls, 0.7 MB. Cards about 1,200 triangles, 1 draw call, 0.4 MB, about 22 MB of texture memory.

**It will look like**: a full house of different adults shoulder to shoulder, the front rows warm and clapping, the rest falling into haze as rim-lit heads, a few phone screens.
**It will not have**: faces that hold closer than about 5 m, moving cloth or hair, anyone walking or sitting, smooth motion in the far rows (four-frame loops), a tailored gown.

## Pipeline: fallback (cards only)

- Steps 1 to 4 and 7 to 13 as above. No GLB, no skeletons at runtime.
- A second atlas for rows 1 to 3: 12 people, four frames, 192 by 384 px, in one 2048 px WebP.
- Keep the front rows a little darker than the 3D version would be.
- Cost: about 1,400 triangles, 2 draw calls, about 1 MB.
- Loses: front-row people turn as flat cards while he walks the stage (they stay facing him), and their clap is four frames.
- If cards read flat instead, the other way out is all 3D with `@three.ez/instanced-mesh` skinning.

## Risks

- Rocketbox faces are 2010-era game faces. At 6 m in warm low light they should pass; this is the first thing to judge live.
- The seam between 3D rows and cards. Put it at the first riser (rows 1 to 3 are on the flat floor) and render the cards under the same key light.
- Cards swivel to face him during the 13 m walk. Seen only at the screen edge, in the dark.
- N8AO may draw dark halos round alpha-tested cards. Take the crowd out of the AO pass if so.
- Thin alpha at distance eats heads and hands in the mip levels. Bleed the edges, lower `alphaTest` to about 0.35.
- Byte, triangle and frame-rate figures are estimates. Measure with `perf.mjs`.
- Source textures are large: about 670 MB for 16 avatars. Only the baked results go in the repo.
- The gown and hood are modelled by hand. Check them against a Dalhousie photo.
- The house has no seats. A dense standing crowd hides that, except the front row's legs.
- Caps: see verdict 6.

## Sources

Techniques and examples
- Rodeo FX crowds: https://beforesandafters.com/2020/10/23/body-of-work-rodeo-fx-on-how-it-crafts-crowds/
- FIFA 14: https://www.digitalfoundry.net/articles/digitalfoundry-fifa-14-next-gen-face-off
- Space Ape mobile crowds: https://medium.com/spaceapetech/crowd-rendering-on-mobile-with-unity-b14745126a2a
- AC Unity: https://gdcvault.com/play/1022411/Massive-Crowd-on-Assassin-s
- Hitman Absolution: https://gdcvault.com/play/1015526/Crowds-in-Hitman
- Planet Coaster: https://www.gamedeveloper.com/audio/game-design-deep-dive-creating-believable-crowds-in-i-planet-coaster-i-
- GPU Gems 3 ch. 2: https://developer.nvidia.com/gpugems/gpugems3/part-i-geometry/chapter-2-animated-crowd-rendering
- Unreal stadium crowd with vertex animation: https://forums.unrealengine.com/t/stadium-crowd-system-in-unreal/380537
- Octahedral impostors, Fortnite: https://shaderbits.com/blog/octahedral-impostors
- Survey of real-time crowd rendering: https://upcommons.upc.edu/bitstreams/f862568b-0d4e-49b7-94a5-4c902d454c82/download
- Clone Attack: https://www.scss.tcd.ie/rachel.mcdonnell/papers/Siggraph08.pdf
- Stadium crowd sprites: https://gamedev.stackexchange.com/questions/48071/how-do-i-simulate-a-crowd-in-the-stadium-stands
- three.js sprite crowd question: https://stackoverflow.com/questions/25266254/three-js-inexpensive-crowd-using-sprites-and-spritesheets
- Archviz cutouts: https://www.reddit.com/r/archviz/comments/1kr62uk/why_do_many_visualizers_prefer_adding_people_in/

three.js libraries
- InstancedMesh2: https://github.com/agargaro/instanced-mesh , demo https://instanced-mesh-skinning-demo.vercel.app/ , thread https://www.reddit.com/r/threejs/comments/1hw39vs/20k_skinned_instances_using_instancedmesh2_library/
- Octahedral impostors: https://github.com/agargaro/octahedral-impostor , https://discourse.threejs.org/t/a-forest-of-octahedral-impostors/85735 , https://github.com/Ctrlmonster/three-octahedral-impostor
- Instanced skinned mesh: https://github.com/luis-herasme/instanced-skinned-mesh
- OpenVAT: https://github.com/sharpen3d/openvat
- r3f VAT: https://github.com/mikelyndon/r3f-webgl-vertex-animation-textures
- three.js examples: https://threejs.org/examples/#webgl_instancing_morph , https://threejs.org/examples/#webgpu_skinning_instancing
- False Earth: https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
- Crowd Simulator: https://codepen.io/zadvorsky/pen/xxwbBQV

Assets and licences
- Rocketbox: https://github.com/microsoft/Microsoft-Rocketbox , levels of detail: https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2020.561558/full
- VALID: https://github.com/google/valid-avatar-library , https://www.frontiersin.org/journals/virtual-reality/articles/10.3389/frvir.2023.1248915/full
- MakeHuman and MPFB: https://static.makehumancommunity.org/about/license.html , https://static.makehumancommunity.org/mpfb/faq/can_i_sell_models.html , https://static.makehumancommunity.org/assets/assetpacks.html , https://extensions.blender.org/add-ons/mpfb/
- Quaternius: https://quaternius.com/faq.html , https://quaternius.com/packs/universalbasecharacters.html , https://quaternius.com/packs/universalanimationlibrary.html
- Kenney: https://kenney.nl/support
- Mixamo: https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html , Adobe terms 3.6: https://www.adobe.com/legal/terms.html
- Renderpeople: https://renderpeople.com/general-terms-and-conditions/
- Human Generator: https://help.humgen3d.com/license
- Reallusion content licence: https://www.reallusion.com/license/content.html
- Sketchfab licences read from https://api.sketchfab.com/v3/models/<id>
- Dalhousie dress: https://www.dal.ca/convocation/graduate_information.html , https://www.dal.ca/convocation/history_traditions/gowns_hoods.html
