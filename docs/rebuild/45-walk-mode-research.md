# 45. Walk mode, made smooth: research (2026-10-05)

Research only. Web sources, plus a read of `roam.ts`, `stage-roam.ts` and the roam wiring in `stage-run.ts`. Nothing changed, nothing run in a browser. `[n]` points into Sources. "Unverified" means believed, not sourced.

## What to change in the build

Verdict
- The core is right and matches the three.js and three-mesh-bvh examples: capsule and shapecast, substeps, dt clamp at 50 ms, the exp ease, `event.code`, keys cleared on blur, `pointermove`, no head bob, no mouse smoothing. No rewrite.
- The gaps are at the edges: raw mouse input, a spike guard, layout reads and allocations every frame, keys that stick, the unlocked state, the BVH build on the main thread.
- One call for his eye: the lens. 74° wide is 45.9° tall at 16:9. First person defaults are 59.8 to 75° tall.

Ranked
1. **Ask for raw mouse input, fall back when refused.** [1][2][4]
   ```ts
   const lock = async () => {
     try { await canvas.requestPointerLock({ unadjustedMovement: true }); }
     catch (e) { if ((e as DOMException).name === 'NotSupportedError') await canvas.requestPointerLock(); }
   };
   // on pointerdown: void lock().catch(() => {});
   ```
   Then tune `ROAM.look` again by hand: raw counts are not the pixels the OS gives today.
2. **Drop mouse spikes.** In `onRoamMove`: `if (Math.abs(e.movementX) > innerWidth / 3 || Math.abs(e.movementY) > innerHeight / 3) return;` [10]. Reports: 300 to 400 px in Chrome 62 [11]; 100 to 300 px on Chrome with Windows, reported again in 2025-12 [10].
3. **No layout reads in the walking frame.** `yFor()` reads `offsetTop` of every article, `getBoundingClientRect` and `scrollY` each frame; the scroll it writes then runs `onScroll`, and `progress()` reads them all again. Cache the tops and the base (recompute on resize), and `if (roam?.active) return;` at the top of `onScroll`. All of these calls are on the forced layout list [21][22].
4. **Keys must not stick on macOS.** Add to keydown and keyup: `if (e.code === 'MetaLeft' || e.code === 'MetaRight') roam.release();`. While Cmd is down, no keyup arrives for other keys [42]. Also release on `visibilitychange`.
5. **Know when the mouse is freed.** Add a `pointerlockchange` listener. Chrome eats the Escape that unlocks, the page never sees that keydown [9], so with the mouse locked Escape leaves Walk only on the second press, and nothing tells him to click again. On unlock: `roam.release()` and show "Click to look". Add "Esc leave" to the legend.
6. **Build the collision meshes off the main thread.** `import { GenerateMeshBVHWorker } from 'three-mesh-bvh/worker'`, then `worker.generate(geometry)` [38]. Measured here: 60 to 77 ms per 100,000 triangles. The baked sets hold 10,442 to 224,562 triangles, 990,792 in all, so `prepare()` blocks up to about 170 ms in one frame and about 0.6 to 0.8 s in total (baked files only; the collision set differs a little).
7. **No allocation in `step()`.** `gather()` makes a `Matrix4` per drawn set each frame; `doorsNear()` filters an array on every `tryMove` (up to 18 a frame); `pushOut` makes its two callbacks on each call; `eye()` and `yFor()` make arrays. Keep one of each and reuse [23]. Gain here is unverified: measure in the Performance panel first.
8. **Try a wider lens in Walk: `fov: 90`** (58.7° tall at 16:9) against 74 now. Ease it on the switch. His eye decides. [25][29][36]
9. **Page keys.** PageUp, PageDown, Home, End and the scrollbar still scroll the page in Walk, and the walker only pulls it back when he next moves. In `onScroll`, while walking, set `roamY = -1` so the next frame writes the scroll again. (Read from the code, no outside source.)
10. **Legend.** Drop `aria-hidden` and name Esc and the arrows [44]. Label keys by layout where the browser can: `navigator.keyboard.getLayoutMap()` then `.get('KeyW')` (Chromium only) [41]. Move focus to the canvas on entry, not to the body.

## 1. Pointer Lock and mouse look

- `unadjustedMovement: true` turns off OS mouse acceleration and gives raw input. Default false. [1]
- Support, from MDN's data read 2026-10-05 [3]: Chrome and Edge 88 (macOS 10.15.1 and later, Windows, ChromeOS; not yet Linux); Firefox 152, released 2026-06-16 [5]; Safari 18.4; Chrome Android 144; Firefox Android no; Safari on iOS has no Pointer Lock at all.
- The promise: Chrome 92 and Safari 18.4 return one. Older versions return `undefined` and ignore the option, so the lock still comes, with acceleration. `await` handles both. Firefox's return value: not stated in its notes, unverified. [3]
- When the platform cannot do it the promise rejects with `NotSupportedError`. Correct fallback: call `requestPointerLock()` again with no options [2][4]. The option can be changed while locked by asking again; a failed change fires no lock events [4].
- Spikes: a real, old, unfixed class of bug. Chrome 62: 300 to 400 px jumps [11]. 2023 to 2025: skips on Windows that grow with mouse polling rate (rare at 125 Hz, common at 1000 Hz), closed as a device issue [10]. One write-up had its jumps go away with `unadjustedMovement` [17]. Usual guard: reject outliers; the threshold in the thread is a third of the window [10]. The Chromium tracker page could not be read (sign in), so no Chromium bug number here.
- Dropping the first move after each lock: seen in practice, unverified.
- Which event: keep `pointermove`. Chrome since 60 holds move events and sends them right before rAF [13]; under lock the event's `movementX` is the sum of the coalesced ones [14]. So one event a frame, nothing lost, and `getCoalescedEvents` is not needed.
- `pointerrawupdate`: Chrome 77, Firefox 148, not Safari, secure context [3]. MDN: "not more precise in space or time", and a slow listener makes things worse [12]. Skip it. three.js itself listens to `mousemove` [26].
- Units of `movementX` differ by browser: physical, logical or CSS pixels [15]. Raw mode sidesteps the OS part. Per browser state in 2026: unverified.
- After Escape, Chrome refuses a new lock for 1,250 ms: `SecurityError`, "Pointer lock cannot be acquired immediately after the user has exited the lock." No cooldown when the page itself unlocks [7][8]. Without a user gesture: `NotAllowedError` [6][8]. The build swallows both and the drag look covers the gap. Fine.
- Safari: Pointer Lock since 10.1 on desktop, promise and raw input from 18.4 [3]. Its rAF has been held to 60 on 120 Hz screens by a setting, "Prefer Page Rendering Updates near 60fps"; the WebKit bug is still open, 2024 comments say iOS 18 lifted it on most devices; Low Power Mode gives 30 [16]. State in 2026: unverified.

## 2. Frame pacing

- Keep variable dt with substeps. three.js's FPS example: dt clamped to 0.05 s, 5 substeps [25]. three-mesh-bvh's: clamped to 0.1 s, 5 substeps [37]. The build: 50 ms, up to 6 steps of 7 cm, against a 26 cm body. Safer than both.
- Fixed step with an accumulator and blending between states is the standard for physics that can blow up [18]. Nothing here can (no gravity, no jump). Only worth it if those arrive.
- Damping: `1 - Math.exp(-rate * dt)` is the frame rate independent form [19]. The build uses it for pace (10/s) and eye height (12/s). Right.
- rAF runs at the screen's rate: 60, 75, 120 or 144 Hz; use its timestamp, not a clock read [20]. The build does.
- Known stutter sources: garbage made every frame [23]; a layout read after a write in the same frame [22]; scroll calls, `offsetTop`, `getBoundingClientRect`, `scrollY` all force layout when anything is dirty [21].
- `scrollTo` every frame: not found named as a bug in MDN, Chrome or WebKit docs. What is documented is the forced layout above, and that a scroll made by script still fires `scroll` (CSSOM View, text not read here: unverified). In this build the cost is the reads round the write (change 3), not the write.
- Already right: written only when the value changes, `behavior: 'instant'`, done inside rAF.
- Option: scroll positions can be fractional [24], so `Math.round(y * devicePixelRatio) / devicePixelRatio` halves the card's step on a 2x screen. Gain unverified.
- If a profile still shows the scroll: move the cards with a transform in Walk. Bigger change, unverified.

## 3. Feel, with numbers

| | Walk m/s | Run m/s | Eye m | Look rad/px | Pitch | Lens |
|---|---|---|---|---|---|---|
| Build | 2.4 | 4.4 | 1.6 | 0.0022 | ±68.75° | 74° wide (45.9° tall at 16:9) |
| People [34] | 1.10 to 1.65 | | 1.6 [33] | | | |
| three.js [25][26] | about 6.25 (derived) | | | 0.002 | ±90° | 70° tall |
| three-mesh-bvh example [37] | 10 | | | | | 75° tall |
| Quake [28] | 200 u/s | 320 u/s cap | | 0.066°/count = 0.00115 | 80° down, 70° up | 90° wide at 4:3 (73.7° tall) |
| Half-Life 2 [29][30] | 2.86 and 3.62 | 6.10 | 1.22 | 0.00115 | ±89° | 75 to 90° wide (59.8° tall at 75) |
| Unity starter [31] | 4.0 | 6.0 | | | ±90° | |
| Godot template [32] | 5.0 | | | | | |
| A-Frame [33] | | | 1.6 | | | 80° (axis not stated) |

- Half-Life 2 in its own units: 150, 190, 320 u/s, eye 64 u, step 18 u. Scale 1 u = 0.75 in = 0.01905 m (Valve wiki via a search excerpt, the page refused reading).
- Speed: 2.4 and 4.4 sit between a real walk and game defaults. Right for compact rooms. Keep. Archviz defaults: none found, unverified.
- Mouse reference: `m_yaw` 0.022° per count times `sensitivity` 3, same in Quake and Source [28][29]. The web habit is 0.002 rad/px [25][26]. 0.0022 is in family. `m_filter` is 0 by default: no smoothing [29]. Keep none.
- Pace change: Quake and Source `sv_accelerate` 10, `sv_friction` 4, `sv_stopspeed` 100 [28][29]; Unity `SpeedChangeRate` 10.0 [31]. From those constants a Quake start takes about 0.13 s and a stop about 0.54 s (derived). The build's 10/s reaches 95% in 0.3 s both ways. Keep.
- Lens: three.js `fov` is the vertical angle [27]; the stage turns its wide angle into that. Xbox's guideline: give a field of view setting, and the right angle depends on how far he sits [36]. Narrow rooms on a narrow lens show little of the room per step, hence change 8.
- Head bob: no. Both guides say avoid it or make it optional, with weapon sway, camera shake and mouse smoothing [35][36]. Also no lens kick on run. `prefers-reduced-motion`: Walk moves only on his input, so it can stay; add nothing that moves by itself.
- Stairs: Quake eases the eye up steps at 80 u/s and never lets it lag more than 12 u [28]. The build's 12/s ease does the same job. Keep.

## 4. three-mesh-bvh character controllers

- The official example [37]: capsule radius 0.5 on a 1.0 segment; all scenery merged into one geometry (`StaticGeometryGenerator`) with one `MeshBVH`; each substep moves the body, shapecasts with `closestPointToSegment`, pushes the capsule out by the overlap.
- Ground there is a guess, not a ray: on ground when the push was mostly upward, `deltaVector.y > Math.abs(delta * playerVelocity.y * 0.25)`. Gravity -30, jump speed 10, speed 10, reset below y = -25. That test flickered against walls and was adjusted in 2023 [39, #518]. The build's 5 rays down do not depend on it.
- Tunnelling: the example has no sweep. Its only guard is small steps: 5 a frame, dt at most 0.1 s [37]. Keep each step well under the radius. The build does (7 cm against 26 cm).
- The body must start outside the mesh or it stays stuck [39, #370].
- No early exit: every touching triangle must be handled, so cost follows mesh density. Maintainer: "most games use a simplified geometry for physics and collisions" [39, #455]. The build collides with the drawn meshes, about 1 million triangles in the baked sets. Time `roam.step`; simplify only if it shows.
- A wrong box in `intersectsBounds` tests every triangle and still works, only slowly [39, #455]. The build's box is right.
- Quantized or normalized positions (KHR_mesh_quantization, meshopt): broke shapecast in 0.5.15, supported since PR 452, with a slower `refit` (9.3 ms to 10.7 or 11.9 ms) [39, #448, #452, #456]. Every baked set uses both extensions. The build copies positions out in metres through `fromBufferAttribute` and the mesh matrix, so it is safe on any version.
- README traps: queries are in the BVH's own frame (the build converts); geometry far from its origin loses precision, centre it [38].
- Worker: `GenerateMeshBVHWorker` from `three-mesh-bvh/worker`; bundlers differ, the worker source may need copying. `ParallelMeshBVHWorker` needs SharedArrayBuffer and falls back without it [38].
- Build cost: no published figure found. Measured here (0.9.15, Node 26, M2 Pro, default split, unindexed): 60, 66, 77 ms for 100,000 triangles; 297 ms for 500,000. Slower machines: unverified.

## 5. Keyboard

- `event.code` is the physical key, the same four keys on AZERTY and Dvorak. MDN's own example is WASD for a game [40]. Right in the build.
- The catch: `code` cannot say what is printed on the key (`KeyQ` is A on AZERTY) [40]. Hence `getLayoutMap()` for the legend: Chrome 69, no Firefox, no Safari [3][41].
- Stuck keys, case one: focus lost. Handled (blur).
- Case two: Cmd on macOS. Keydown fires for other keys, keyup does not. Mozilla's bug is still open and names other browsers too; Electron has the same report [42]. Not handled: W held, Cmd pressed, W let go, he walks on.
- Escape under lock is the browser's. The spec says an unlock gesture must always exist and recommends Esc [6]. Chrome handles it and does not pass the key on [9]. Firefox and Safari: unverified.
- Keyboard Lock (`navigator.keyboard.lock`): Chromium only, full screen only, asks permission since Chrome 130 [3][43]; Esc then needs a hold of 1,500 ms in Chromium's source (the article says two seconds) [9][43]. Not for this.
- `preventDefault`: arrows and Space, to stop the page scrolling. Never when Cmd, Ctrl or Alt is down, never Tab. The build does exactly this. Missing: the page keys (change 9).

## 6. Prior art

- No personal portfolio with both a scroll tour and free WASD walking could be verified. One candidate is an unmerged pull request, left out. The pattern lives in gallery and archviz viewers. Read from their docs and search excerpts; none walked by me.
- Kunstmatrix, 3D exhibitions: arrows or WASD plus Q and E to walk; K starts and stops the guided tour, which has its own player with back, forward and progress. https://www.kunstmatrix.com/en/changelog (2025-01-21 and 2026-05-11)
- Shapespark, archviz walkthroughs: an "Automatic tour" button in the bottom menu tours the saved views; WASD and arrows walk at any time; on touch, tap a spot to walk there. https://help.shapespark.com/hc/en-us/articles/360009196618-Navigation
- Matterport: a Play button bottom left runs the guided tour; W A S D or arrows step to the next spot. https://support.matterport.com/hc/en-us/articles/360019401733-Highlight-Reel-Guided-Tour-in-Edit-Mode
- Sketchfab: a navigation setting switches Orbit to First Person (WASD, wheel sets speed); annotations run on "Autopilot"; a help screen lists the keys. https://help.sketchfab.com/hc/en-us/articles/202512456-Annotations
- Artsteps: guided tour when the author made one, else arrows or Q W E A S D, or click where to go; a map bottom left. https://www.artsteps.com/article/navigate
- Shared pattern: the tour is one button with a player; walking needs no mode, any key takes over; the key list sits behind a help button.

## 7. Accessibility and touch

- Keyboard only: the mode must be reachable, leavable and explained without a mouse. The switch is two real buttons with `aria-pressed`, the arrows turn, Esc leaves, Tab is free. Good.
- WCAG 2.1.4 (A): one letter shortcuts need an off switch, a remap, or to work only on focus [44]. The Scroll button is the off switch. Met.
- WCAG 2.1.2 (A): where leaving takes more than arrows or Tab, the user is told how [44]. The legend is `aria-hidden` and does not name Esc. Change 10.
- Focus: `b.blur()` drops it on the body. Give the canvas `tabindex="-1"` and a label, focus it on entry, return focus to the switch on exit. Unverified as a rule, common practice.
- Touch: Pointer Lock does not exist on iOS Safari; Chrome Android has it only from 144 [3].
- Two patterns: a virtual stick (nipplejs, 1,946 stars [46]) with drag to look, as games do; or tap to go, as Shapespark and Artsteps do. Or no Walk on touch.
- The build hides Walk outside `(hover: hover) and (pointer: fine)`. Right for now. If touch is ever wanted, tap to go fits a story path better than a stick.

## Sources

1. MDN, requestPointerLock: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
2. MDN, Pointer Lock API: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
3. MDN browser-compat-data, read 2026-10-05 (Element, PointerEvent, Keyboard): https://github.com/mdn/browser-compat-data/tree/main/api
4. web.dev, Disable mouse acceleration: https://web.dev/articles/disable-mouse-acceleration
5. Firefox 152 for developers: https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Releases/152 and https://bugzilla.mozilla.org/show_bug.cgi?id=2037802
6. W3C, Pointer Lock 2.0: https://www.w3.org/TR/pointerlock-2/
7. Chromium, the 1,250 ms cooldown: https://github.com/chromium/chromium/blob/main/chrome/browser/ui/exclusive_access/pointer_lock_controller.cc
8. Chromium, the error texts: https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/page/pointer_lock_controller.cc
9. Chromium, Escape handling and the 1,500 ms hold: https://github.com/chromium/chromium/blob/main/chrome/browser/ui/exclusive_access/exclusive_access_manager.cc
10. three.js issue 27040, mouse skips: https://github.com/mrdoob/three.js/issues/27040
11. three.js issue 12757, Chrome 62 spikes: https://github.com/mrdoob/three.js/issues/12757
12. MDN, pointerrawupdate: https://developer.mozilla.org/en-US/docs/Web/API/Element/pointerrawupdate_event
13. Chrome, Aligning input events: https://developer.chrome.com/blog/aligning-input-events
14. w3c/pointerlock issue 74: https://github.com/w3c/pointerlock/issues/74
15. MDN, movementX, and w3c/pointerlock issue 42: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/movementX and https://github.com/w3c/pointerlock/issues/42
16. WebKit bug 173434, 120 Hz rAF: https://bugs.webkit.org/show_bug.cgi?id=173434
17. easimer.net, Raw mouse input in the browser: https://easimer.net/homepage/2024/09/25/pointer-lock-raw-input.html
18. Gaffer On Games, Fix Your Timestep: https://gafferongames.com/post/fix_your_timestep/
19. Rory Driscoll, Frame Rate Independent Damping using Lerp: https://www.rorydriscoll.com/2016/03/07/frame-rate-independent-damping-using-lerp/
20. MDN, requestAnimationFrame: https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame
21. Paul Irish, What forces layout: https://gist.github.com/paulirish/5d52fb081b3570c81e3a
22. web.dev, layout thrashing: https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing
23. web.dev, Static Memory JavaScript with Object Pools: https://web.dev/articles/speed-static-mem-pools
24. MDN, scrollTop: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
25. three.js r185, games_fps: https://github.com/mrdoob/three.js/blob/r185/examples/games_fps.html
26. three.js r185, PointerLockControls: https://github.com/mrdoob/three.js/blob/r185/examples/jsm/controls/PointerLockControls.js
27. three.js docs, PerspectiveCamera: https://threejs.org/docs/pages/PerspectiveCamera.html
28. Quake source (cl_main.c, in_win.c, cl_input.c, sv_user.c, sv_phys.c, view.c, screen.c): https://github.com/id-Software/Quake/tree/master/WinQuake
29. Source SDK 2013 (in_mouse.cpp, in_main.cpp, movevars_shared.cpp, hl2_player.cpp, gamerules.cpp, clientmode_hlnormal.cpp): https://github.com/ValveSoftware/source-sdk-2013/tree/master/src/game
30. Valve Developer Wiki, Dimensions (not read directly): https://developer.valvesoftware.com/wiki/Dimensions_(Half-Life_2_and_Counter-Strike:_Source)
31. Unity Starter Assets, FirstPersonController.cs (a mirror): https://github.com/HongYD/Shooting/blob/main/Shooting/Assets/StarterAssets/FirstPersonController/Scripts/FirstPersonController.cs
32. Godot, CharacterBody3D template: https://github.com/godotengine/godot/blob/master/modules/gdscript/editor/script_templates/CharacterBody3D/basic_movement.gd
33. A-Frame, camera: https://aframe.io/docs/1.7.0/components/camera.html
34. Wikipedia, Preferred walking speed: https://en.wikipedia.org/wiki/Preferred_walking_speed
35. Game Accessibility Guidelines, controller and camera movement: https://gameaccessibilityguidelines.com/avoid-or-provide-option-to-disable-any-difference-between-controller-movement-and-camera-movement/
36. Xbox Accessibility Guideline 117: https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117
37. three-mesh-bvh, characterMovement.js: https://github.com/gkjohnson/three-mesh-bvh/blob/master/example/characterMovement.js
38. three-mesh-bvh, README: https://github.com/gkjohnson/three-mesh-bvh/blob/master/README.md
39. three-mesh-bvh issues 370, 448, 452, 455, 456, 518: https://github.com/gkjohnson/three-mesh-bvh/issues/370 (swap the number)
40. MDN, KeyboardEvent.code: https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
41. MDN, Keyboard.getLayoutMap: https://developer.mozilla.org/en-US/docs/Web/API/Keyboard/getLayoutMap
42. Mozilla bug 1299553 and Electron issue 5188: https://bugzilla.mozilla.org/show_bug.cgi?id=1299553 and https://github.com/electron/electron/issues/5188
43. Chrome, Keyboard Lock: https://developer.chrome.com/docs/capabilities/web-apis/keyboard-lock
44. WCAG 2.1.4 and 2.1.2: https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html and https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html
45. Prior art links are inline in section 6.
46. nipplejs: https://github.com/yoannmoinet/nipplejs
