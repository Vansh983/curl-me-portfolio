# Journey stage v2: real 3D, one continuous shot

Date: 2026-08-27. Supersedes the stage half of [08-journey-stage-spec.md](./08-journey-stage-spec.md). Reference point before this work: commit `d2c696e`, tag `pre-3d`.

Decisions taken with Vansh on 2026-08-27:

- Real WebGL via three.js. Not CSS 2.5D.
- One continuous shot. No crossfades, no cuts, no layers popping in. Everything morphs, grows from the ground, or the camera travels to it.
- All models are code-built low-poly with fixed topology, so a kid to teen morph is a true vertex morph. No Blender, no GLB, no AI models.
- This pass: the bedroom (2010) and the school lab (2013) rebuilt in the new engine. Later chapters get stations in later passes.

## 1. What changes

- The `.stage` inside `Journey.astro` becomes one `<canvas>` behind the text wall. The wall (chapters, hero slot, text styles, sticky maths) stays as it is.
- The whole CSS engine in `Journey.astro` (layers, motions, scroll timelines, `timeline-scope`, `@supports` fallback, `morph.ts` at runtime) is removed. Firefox stops being a special case: WebGL is everywhere, scroll progress is JS.
- `src/lib/scenes/*.svg`, `src/lib/morph.ts` and `src/lib/figure.ts` stay in the tree for this pass as colour and pose reference. Deleted when the last chapter is rebuilt.
- JS budget: three core chunk about 130 KB gz, our code under 15 KB gz. Loaded lazily (dynamic `import()`) when the journey is within one viewport, so first paint is unchanged.

## 2. Architecture

```
src/lib/stage/
  rig.ts        Rig: params in, Float32Array positions out, fixed index buffer. Primitives with fixed segment counts.
  figure3d.ts   the person: one rig, params for age, pose, clothes, hair, tie
  props.ts      room, seat (rug..chair), screen (tv..crt), fan, desk, shelf, poster, console, ball, lab row
  world.ts      actors and stations: per station, params + colours for every actor, camera pose
  shot.ts       progress p -> per-actor blend, camera position/target on a smooth curve. Pure, tested.
src/scripts/stage.ts   client: renderer, lazy load, resize, scroll, theme, render on demand
src/components/Journey.astro   wall unchanged; stage is a <canvas> and a poster
tests/stage/*.test.ts  node --test, no DOM
```

Every module under `src/lib/stage/` is pure and runs in node. Only `stage.ts` touches the DOM or the renderer.

## 3. Morphing

- A rig is a function `build(params) -> positions` with a fixed vertex and index count for every input. Same rule as `figure.ts` in 2D: things that "appear" are always present and shrink to zero or sink under the floor when off.
- For each actor, the geometry's base positions are station 0 and `morphAttributes.position[k]` is station k. Between stations i and i+1 at eased t: influence[i] = 1 - t, influence[i+1] = t (i = 0 uses the base). The GPU does the blend, the CPU writes two numbers per actor per frame.
- Colours (`material.color`) lerp on the CPU in linear RGB. Screen content is one shader material that mixes two textures by t (the TV picture becomes Notepad, the surface never fades).
- Objects with no counterpart in the next station are one rig covering both forms. The seat rig is a flat rug disc at station 0 and a chair (disc shrinks, legs and back rise) at station 1. The Xbox, ball, shelf, poster and nuggets sink into the floor as the row of lab machines rises out of it. Nothing changes opacity, anywhere.

## 4. Camera and continuity

- Camera position and look-at are two centripetal CatmullRom curves through the station keys. Centripetal tension means no overshoot and no kink at a station.
- Progress: `locate(p, n)` from `lerp.ts` as today (rest 30% on each station, ease across the middle 40%). Damped with the same exponential follow as the current script. Reduced motion: snap to the nearest station, no tween.
- Station 0, bedroom: low, behind the kid, TV framed centre, poster and shelf on the right, fan above. Station 1, lab: the camera pushes forward and rises to over the shoulder at the CRT while the room re-dresses around it. Same room box the whole way: wall colour cream to lab grey-blue, floor rug to lino, window to a whiteboard.
- Framing at any aspect: a safe box (figure plus screen) is fitted by adjusting the vertical FOV from the aspect ratio. No media queries in the stage. The wall keeps its existing text breakpoints.

## 5. Look

- `MeshToonMaterial` with a three-step gradient map, one hemisphere light plus one directional. Flat colours taken from the current SVG scenes.
- Ink outline: an inverted-hull copy of each mesh (`BackSide`, slightly scaled, ink colour) sharing the same geometry, so outlines morph with the mesh.
- Theme: clear colour from `--bg`, ink from `--tx`, read on load and on `data-theme` change (MutationObserver). Textures: `zombies-gameplay.mp4` as a `VideoTexture`, `jobs.jpg` and `xbox-360-logo.png` on planes, Notepad drawn on a canvas texture.
- Renders only when progress, size or theme changes. The fan and the video run on their own clock via a small rAF that only draws when the section is on screen.

## 6. Fallbacks

- No JS or no WebGL: the paper background and the text wall. Nothing breaks.
- The old `data-chapter` script and the `@supports` CSS go away.
- `@media print` hides the stage.

## 7. Testing

- Node: every rig keeps its vertex and index count across random params, every station produces finite positions, `shot(p)` camera samples at 1/1000 steps never jump more than a threshold, `locate` still rests and eases as before.
- Build gate: `astro check`, `astro build`, three chunk under 140 KB gz and not in the initial script.
- Browser: Chrome, Safari 26, Firefox, iOS Safari, reduced motion, dark mode. Vansh reviews the live page.

## 8. Out of scope

Chapters 3 to 8 (camera holds in the lab after station 1 for the rest of the scroll until their stations exist). GLB loaders, WebGPU, postprocessing, physics, smooth-scroll libraries, changing the wall or the blog.
