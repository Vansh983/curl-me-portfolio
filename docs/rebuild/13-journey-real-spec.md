# Journey stage v3: real light, real things, one dolly

Date: 2026-08-30. Supersedes the look and asset rules of [11-journey-3d-spec.md](./11-journey-3d-spec.md). Reference point before this work: commit `b2fdcbf`.

Decisions taken with Vansh on 2026-08-30:

- The style is wrong, not the story. "It needs to be natural, like it needs to look real." Too glossy, shading unreal, objects read as primitives, animation reads as fake. Elements and storytelling stay.
- Real assets. The 2026-08-27 rule "no Blender, no GLB" is void. Photo-scanned CC0 models, HDRI light and scanned surface textures from Poly Haven; the few things it lacks are built in code with scanned textures on them.
- He stays off-camera for now. World, light and motion first; the figure is decided after he sees the new look.
- Still one continuous shot. No cuts, no crossfades, nothing changes opacity.

## 1. Look

- Light comes from a photograph: one HDRI per set drives `scene.environment` (PMREM) and the visible background. One directional sun per set, aimed to match the HDRI's brightest patch, casts the shadows (PCF, 2048 map, soft). Hemisphere and fill lights go; the HDRI is the fill.
- Surfaces are scans, not procedural noise: colour, normal, roughness (and AO where provided) from Poly Haven 1k sets, mapped in real metres (a plank set tiles every 2 m, plaster every 3 m). `surface.ts` survives only for code-built parts that have no scan (water ripple, trophy gold).
- Materials are matte unless the real thing is not. Roughness comes from the scan. No `envMapIntensity` above 1, no clearcoat, no bloom, no grade. ACES tone mapping and GTAO stay; those are how a real render looks. Exposure per set.
- Candidates seen on 2026-08-30 (thumbnails in the session scratchpad). Models: `television_02` (CRT, bedroom TV and, scaled, the lab monitors), `ceiling_fan`, `gaming_console` + `gamepad` (the Xbox), `football` or `dirty_football`, `wooden_bookshelf_worn` + `decorative_book_set_01`, `sofa_02` or `throw_pillows_01` on the rug, `hanging_picture_frame_01` (the Jobs poster), `SchoolDesk_01`, `SchoolChair_01`, `wall_clock`, `standing_chalkboard_01` (whiteboard stand-in, or code-built), `street_lamp_01`, `modular_street_seating`, `island_tree_01` or `jacaranda_tree` (no palm scan exists). HDRIs: `small_empty_room_1` (window, sun, curtains) for 2010, `school_hall` or `unfinished_office` for 2013, `golden_gate_hills` for 2018. Textures: `wood_floor` or `plank_flooring`, `painted_plaster_wall`, `ceiling_interior`, `old_linoleum_flooring_01`, `concrete_pavement`, `dirty_carpet`, `cotton_jersey`.
- Built in code, with scans on them: room shells (floor, walls, ceiling, window reveal, doorway), curtains, keyboards, the whiteboard, the Google sign, the trophy, the bridge, the bay water, boats. Everything else is a scan.

## 2. Motion

Nothing morphs. Real objects do not turn into other objects, so the room-that-redresses-itself goes. Instead:

- Three sets in one world: the Delhi room, a doorway and a dark passage, the school lab, its far door, the plaza by the bay. The camera dollies through them on one smooth path. A set change happens while the camera is inside a doorway, the classic one-shot trick: for a few frames the frame is the door jamb, and behind it the light, fog and environment have already become the next set's. Nothing the viewer sees pops.
- What moves is what would move: the fan turns with inertia, the TV plays, curtains breathe (a vertex wind, not a morph), the tube light flickers on as the camera enters the lab, the water ripples, clouds and the sun stay where the photograph put them. Props are placed, not grown or sunk.
- The camera is a dolly, not a spring: scroll maps to distance along the path, the follow is critically damped, the look-at leads the position slightly. Reduced motion snaps to the nearest set.
- Hotspots stay: captions and links hang off real objects (the TV, the sign).

Rejected: keeping one room that re-dresses with physical swaps (things carried out, things dropped in). It keeps the old device but every swap is a visible stunt, and with scanned objects there is nothing to blend through.

## 3. Assets pipeline

```
src/lib/stage/assets.ts        the manifest: id, source, kind (model | hdri | texture), res, licence, author, use
scripts/stage-assets.mjs       node: fetch via api.polyhaven.com/files/{id}, cache in .cache/polyhaven/ (ignored),
                               optimise, write public/assets/stage/, write public/assets/stage/CREDITS.md
public/assets/stage/*.glb      models: gltf-transform prune, dedup, textures resized to 1024 and webp, meshopt
public/assets/stage/*.hdr      HDRIs: 1k for light only, 2k where the sky is in frame
public/assets/stage/tex/*.webp textures: 1k, colour + normal + rough (+ ao)
```

- Outputs are committed so `astro build` never touches the network. Sources are cached and ignored.
- Budget: under 6 MB per set, under 18 MB total, all lazy behind the existing one-viewport `import()`. First paint unchanged. Loading order: the set in view first, the next set while the reader is on the first.
- Runtime: `GLTFLoader` + `MeshoptDecoder`, `RGBELoader`, `PMREMGenerator`. Loaded models get their shadow flags set by traversal, their materials left as scanned.

## 4. World model

```
Set   { id, hdri, exposure, sun: { dir, color, power }, fog, shell: Shell, props: Placement[], cam: Key[] }
Placement { model, at: V3, rot: V3 (deg), scale?, cap?, href?, live?: 'fan' | 'screen' | 'tube' }
Shell { floor/walls/ceiling built in code with a scanned surface each, plus openings }
```

- `world.ts` becomes `SETS[3]` plus the dolly path keys. `Actor`, morph keys, `timing` (grow, sink, drop) and `figure-*` actors go. `figure3d.ts` stays in the tree, unmounted, for the avatar decision.
- `shot.ts` keeps the centripetal CatmullRom camera through more keys (entry, doorway, set, exit per set); `stageProgress` mapping stays (stations on chapters 0 to 2, hold after).
- `env.ts` becomes per-set light data plus the blend used inside doorways.

## 5. Testing

- Node: manifest ids unique, every entry has a licence and an author, every referenced file exists under `public/assets/stage/` (skipped when the folder is absent), placements finite, camera path continuity at 1/1000 steps, each doorway key has its blend window inside 0..1.
- Build gate: `astro check`, `astro build`, stage chunk not in the initial script, assets total under budget (script prints the sum).
- Browser: Chrome, Safari, Firefox, iOS, reduced motion, dark mode. Vansh reviews the live page.

## 6. Out of scope

The figure (any avatar), chapters 3 to 8 (the camera holds on the plaza), WebGPU, physics, changing the wall or the blog.
