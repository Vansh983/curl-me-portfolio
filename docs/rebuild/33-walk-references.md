# Walk references: how the best pieces keep a moving camera alive

Researched 2026-09-26. Web only. No code touched.

## Verdict

- Nobody good labels a place. They change the state of the world: palette, fog, ground, light, sound, one hero landmark, a few things that move.
- The walk reads static because nothing changes state between cities. Same ground, same light, same sky, a banner swap.
- Fix in this order: colour script per city, cross-dissolve between cities, one landmark revealed late, world assembling ahead, movers, then type.
- Banners go. Facts become short captions lit by the scene, or light thrown on a wall.
- All of it is cheap: uniforms, fog colour, instancing, one noise function. No new heavy assets needed.

## How this was checked

- Every source below was opened and read through a page fetcher. Wording of quotes is close, not guaranteed exact.
- Exception: the V&A guide was read from the PDF text directly, so those quotes are exact.
- I did not watch the live WebGL sites. "On screen" descriptions come from the makers' own write-ups.
- Anything seen only in a search snippet, or blocked (403), is marked unverified.

## What this means for the walk (my inference, not a source)

- Give each city its own row in a colour script: sky, fog colour, light colour, ground material, one landmark, one mover, one sound.
- Blend rows over a stretch of path between cities. Never switch at a line.
- Keep one continuous path. Hide any asset swap behind fog, a pillar passing the lens, or a doorway.
- The coworking room entry stays a doorway. A doorway is already a natural place to swap sets.

---

## 1. Changing the world while the camera keeps moving

1. **Atmos, Leeroy** (sky and light change together)
   - A plane follows a Catmull-Rom spline through clouds. Path is built in code and differs each load.
   - Sky is an inward sphere with Perlin noise gradients from designer palettes. A hemisphere light changes colour to match the sky.
   - Only two cloud models, instanced with different scale, position, rotation.
   - Depth of field is faked with a cheap 2D radial blur.
   - https://www.awwwards.com/case-study-atmos.html
   - https://www.webgpu.com/showcase/atmos-scroll-driven-flight-procedural-skies/
2. **ZERO, BUNQ Labs** (fog reveal, gates)
   - Six scroll stages joined by five gates. One virtual scroll value drives everything.
   - "Clouds part to reveal the city below, with ZERO's tower at its centre."
   - During a hold the whole frame shifts to dark red, then snaps back in about 200 ms.
   - https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/
3. **Joseph Santamaria portfolio** (palette and weather per chapter)
   - Opens "lit like an early morning underwater city". Halfway the palette goes deep red and rose petals drift through fog. Then fractured statues and lava cracks.
   - Free scroll switches to snap beats for a four moment sequence.
   - https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
4. **The Monolith Project, Ethan Chiu** (named shader transitions)
   - 13 scenes. Each join has its own transition: wipe up, zoom blur, mask, radial, sphere.
   - Scene A and scene B are both rendered, then mixed by one fullscreen triangle material.
   - Wind, flow map and animated gradient are reusable material modules.
   - https://tympanus.net/codrops/2025/11/29/building-the-monolith-composable-rendering-systems-for-a-13-scene-webgl-epic/
5. **The Fabulous Cartier Journey, Merci-Michel** (three chapters, one landmark ends each)
   - Starts beyond the clouds, then over a glittering lake, then a starry night.
   - The Maison marks the end of each chapter.
   - Foreground elements sit in front of the zeppelin so it passes behind them.
   - Sea of clouds is billboard sprites, chosen to avoid overdraw.
   - https://www.awwwards.com/the-fabulous-cartier-journey-case-study.html
6. **World assembles ahead of the camera** (Codrops demo plus Bastion)
   - Codrops: buildings sorted by z distance to camera, each rises with `delay: index / 350`, `Power3.easeOut`. Far ones fade into fog (near 1, far 138).
   - https://tympanus.net/codrops/2019/01/30/buildings-wave-animation-with-three-js/
   - Bastion: ground forms a path as the player nears the edge. Reason given: no map needed, and the player sees where they have been. The story was written after, to explain the mechanic.
   - https://en.wikipedia.org/wiki/Bastion_(video_game)

Also confirmed:
- Igloo Inc: camera drifts between scenes with chromatic aberration, displacement and a frost dissolve. https://www.awwwards.com/igloo-inc-case-study.html
- Prometheus, Active Theory: start and end camera per scene. Scrolling controls clouds forming and chemical reactions. https://www.awwwards.com/prometheus-by-active-theory-wins-site-of-the-month-may-2021.html
- CHILE20, Active Theory: three worlds, three looks (black and white with film grain, present day, neon future). https://www.webgpu.com/showcase/chile20-active-theory-webgl-adidas-originals/
- 1917: cuts hidden when a post, tree or fence crosses the frame, when darkness fills the frame, or through a window. https://www.studiobinder.com/blog/1917-one-shot-cinematography/
- Pixar colour script: a map of colour and light per story beat, made before production. https://hyperallergic.com/the-art-of-pixar-chronicle-books/

## 2. Showing a place without posters, banners or signs

1. **Disneyland: the weenie**
   - One tall landmark with a long sightline per land pulls people toward it.
   - It works through "staging, size, form, colour, and motion". Some are only visible from inside their own land.
   - https://book.leveldesignbook.com/studies/irl/disneyland
   - https://www.gamedeveloper.com/design/what-mario-learned-from-mickey-mouse---part-3-decision-making-and-weenies
2. **Disneyland: the three dimensional cross-dissolve (John Hench)**
   - "Transitions between lands are never abrupt. Ragtime fades into jungle drums. Brick becomes bamboo. Light narrows into shadow."
   - Ground, sound and light all change together, over distance.
   - The term is Hench's. The quoted wording is the blog author's.
   - https://writteninthequeue.com/disneys-art-of-storytelling/
   - Hench: "When there are contradictions, when there is chaos, we feel threatened." https://mouseplanet.com/the-wisdom-of-john-hench/1844/
3. **Firewatch, Campo Santo** (silhouette and fog layers)
   - Bold colours in distinct layers. Each layer adds depth.
   - Flat shapes, strong silhouettes, abstract inner detail.
   - Colours follow a colour script tied to story moments.
   - https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch/
4. **ZERO** (hero landmark in a revealed city)
   - City appears only after clouds part. One tower at the centre carries the identity.
   - https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/
5. **Windland, Anderson Mancini** (a city that moves)
   - Rotating wind turbines, helicopters, cars, birds with wing animation, swaying trees.
   - Night and "apocalyptic" modes come from post-processing only, no scene change.
   - https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/
6. **Explore Primland, Outpost** (place by atmosphere)
   - "ambient nature sounds, birdsong, fog, drifting clouds", plus seasons.
   - Art directors can edit lighting, cloud movement, foliage density, tree colours.
   - https://outpost.design/work/primland-explore/

Also confirmed:
- Journey: one mountain with a glowing peak is visible from the start and stays the goal. Desert, then buried city, then snow. https://en.wikipedia.org/wiki/Journey_(2012_video_game)
- Level Design Book wayfinding: "flock of birds suddenly flying upwards", "hearing the sound of flowing water in the distance", "path implied by light placement". https://book.leveldesignbook.com/process/blockout/wayfinding
- Same page warns: heavy signposting "will make a level feel like Disneyland".

Secondary listings only, live site not opened:
- Sébastien Lempens portfolio: scroll tour of a 3D Paris, first person, then scooter, then skydive. https://www.creativedevjobs.com/blog/best-threejs-portfolio-examples-2025
- Mola Zone, Studio 9P: rider stays on a rotating platform while desert, forest and palace scroll past. https://www.creativedevjobs.com/blog/best-threejs-website-examples

## 3. Milestones, facts and numbers inside the world

1. **Atmos** (real 3D text, not an overlay)
   - Troika renders the type inside the scene. On mobile the camera leaves the path and moves closer to the text.
   - https://www.awwwards.com/case-study-atmos.html
2. **/fm, Filip Zrnzevic** (type as thrown light)
   - "the track title is cast onto the back wall as light, tiled and scattered like a gobo throw."
   - Built as a world-space planar texture added to the emissive term.
   - https://tympanus.net/codrops/2026/08/22/sixty-frames-for-the-record-a-three-js-game-seven-fly-throughs-and-a-wall-of-crts/
   - How projection works in three.js: https://tympanus.net/codrops/2020/01/07/playing-with-texture-projection-in-three-js/
3. **Panic Room titles, then Fringe** (type as architecture)
   - Names hang beside Manhattan buildings, casting shadows and reflections.
   - Goal: "the viewer accepted them as a part of the landscape, not an additional element".
   - Copperplate chosen because "it bevels well and is really legible off-angle" and "doesn't fight the architecture".
   - https://www.artofthetitle.com/title/panic-room/
   - Fringe used the same idea for place names (HARVARD as solid letters in the shot). https://graphic-engine.swarthmore.edu/titles-on-the-fringe/
4. **What Remains of Edith Finch** (words that lead the eye)
   - Text in the world was "a way to encourage players to look in certain directions".
   - It also "gave us a chance to add life and movement to the house, which was otherwise fairly static."
   - https://bounthavy.com/en/interview-with-ian-dallas-on-what-remains-of-edith-finch/
5. **ZERO** (text that focuses in)
   - Text sharpens from a seven tap blur as it comes into view.
   - Composited after tone mapping so it stays crisp.
   - https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/
6. **HTML overlay synced to scroll** (Apple pattern and GSAP)
   - Apple: frame index comes from scroll fraction, drawn to a canvas. AirPods Pro used 148 images.
   - https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/
   - Codrops: camera scrubbed with `scrub: true`, text with `scrub: 0.5`, character stagger 0.02.
   - https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/

Also confirmed:
- Igloo Inc renders all UI in WebGL. Letter scramble swaps SDF texture offsets. https://www.awwwards.com/igloo-inc-case-study.html
- Splinter Cell projected text. Wylie Robinson: add "depth and layers to remove that hard-edged computer look". https://motionographer.com/2014/08/20/motion-design-in-games-with-ubisofts-wylie-robinson/

### Typographic rules that make it look designed

- Type takes the scene's light. Troika patches any three.js material, so text gets lighting, shadows and fog. https://protectwise.github.io/troika/troika-three-text/
- One typeface that survives an angle and a bevel. https://www.artofthetitle.com/title/panic-room/
- All caps only for less than one line. Add 5 to 12% letterspacing. Kerning always on. https://practicaltypography.com/summary-of-key-rules.html
- Line length 45 to 90 characters. Line spacing 120 to 145%. Same source.
- Bold or italic "as little as possible, and not together". Centered text sparingly. Same source.
- Caption budget: object label 50 to 60 words. First sentence no more than 16 words. https://www.vam.ac.uk/blog/wp-content/uploads/VA_Gallery-Text-Writing-Guidelines_online_Web.pdf
- "Visitors have come to look at objects, not to read books on the wall." Same source.
- Fixed hierarchy, then stick to it. Same source.
- Detail signals importance. In Firewatch, texture detail marks the things that matter. https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch/
- Text drawn after tone mapping, so grading does not soften it. https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/

## 4. Cheap motion that makes a walk feel alive

1. **Damped scroll to camera**
   - Two values: `targetT` jumps with input, `camProxy.t` follows. `gsap.quickTo(camProxy, 't', { duration: 1, ease: 'power3.out' })`.
   - https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/
   - Frame rate safe lerp: `pos += (target - pos) * 5 * deltaTime`. https://tympanus.net/codrops/2022/01/05/crafting-scroll-based-animations-in-three-js/
2. **Look-at target on its own track**
   - Camera position and look target are animated separately per segment. https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
   - itomdev adds an auto glance toward the door that is coming up, plus mouse and gyroscope parallax. https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/
   - Rotation by quaternion slerp toward a target, to avoid gimbal lock. https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/
3. **Ease per shot, not one global ease**
   - Custom curve per segment, for example "cinematicSilk" 0.45, 0.05, 0.55, 0.95.
   - https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
4. **Sway from smooth noise, rotation only**
   - Perlin noise, not random: similar inputs give similar outputs, so motion is continuous.
   - In 3D, skip positional shake: it can push the camera through nearby objects.
   - Strength is trauma squared. Trauma decays over time.
   - https://roystan.net/articles/camera-shake/
   - Sine wave head bob with amplitude tied to speed: unverified (search snippets only).
5. **Scroll speed drives effects**
   - Atmos: wind particles are always in the scene as an InstancedMesh. Opacity follows scroll acceleration. https://www.awwwards.com/case-study-atmos.html
   - Codrops gallery: velocity lifts background brightness and tilts planes. Velocity is smoothed, clamped, and reset to zero at rest. https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/
   - Roman Jean-Elie: text stretches with scroll velocity. https://tympanus.net/codrops/2025/11/27/letting-the-creative-process-shape-a-webgl-portfolio/
6. **Ambient movers and shader motion**
   - Fan Museum: a bird follows an elliptical curve via `getPoint()`. Waterfall is scrolling UVs. Fire is a shader. https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/
   - Windland: trees placed with MeshSurfaceSampler and swayed in the vertex shader. https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/
   - Bruno Simon: wind on grass, rain with splashes, falling leaves, day and night. https://www.awwwards.com/brunos-portfolio-case-study.html

Also confirmed:
- Prometheus runs supporting effects at 12 fps and main elements at 60 fps, so effects feel hand-drawn. https://www.awwwards.com/prometheus-by-active-theory-wins-site-of-the-month-may-2021.html
- Sound sells space. Santamaria muffles the music when a project opens, "as if you had stepped through a door". https://tympanus.net/codrops/2026/04/28/more-than-a-portfolio-building-a-scroll-driven-3d-world-with-something-to-say/
- Pacing: "Alternate highs and lows." Rest makes the next accent land. https://book.leveldesignbook.com/process/preproduction/pacing
- Reduced motion: parallax can trigger vestibular symptoms. Offer a calm variant. https://web.dev/articles/prefers-reduced-motion
- three.js GPGPU birds and ocean examples exist: unverified (not opened). https://threejs.org/examples/webgl_gpgpu_birds.html

## 5. What reads as cheap or AI-generated, and the fix

| Tell | Fix | Source |
|---|---|---|
| Signs and labels doing the work of the world | Landmark, light, ground, sound | https://book.leveldesignbook.com/process/blockout/wayfinding |
| Text pasted over the scene, unlit | Type takes light, shadow, fog | https://www.artofthetitle.com/title/panic-room/ |
| Hard-edged computer look | Add depth and layers | https://motionographer.com/2014/08/20/motion-design-in-games-with-ubisofts-wylie-robinson/ |
| Dark background with neon accents | Pick a look that is yours. itomdev used hand-drawn textures on flat planes | https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/ |
| Washed or over-contrasted colour, clipped highlights | sRGB on colour textures, check tone mapping curve | https://discourse.threejs.org/t/photorealistic-render-comparison-why-does-three-js-look-so-bad/25617 |
| Flat lighting | "good environment maps, ambient light, light placement, fog, lut's" (drcmda) | Same thread |
| Uniform, tiled textures | Mix the same texture with a slight colour shift through a noise mask | https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/ |
| Even detail everywhere | Detail only where the story is. Flat shapes, strong silhouettes elsewhere | https://www.thumbsticks.com/gdc-2015-the-art-of-firewatch/ |
| Mixed styles and scales in one frame | Remove contradictions. One language per scene | https://mouseplanet.com/the-wisdom-of-john-hench/1844/ |
| Shimmer from thin parallel lines | Do not model them | https://discoverthreejs.com/tips-and-tricks/ |
| Sub-pixel geometry detail | Remove it. One piece went from 49.6 ms to 17.9 ms p95 | https://tympanus.net/codrops/2026/08/22/sixty-frames-for-the-record-a-three-js-game-seven-fly-throughs-and-a-wall-of-crts/ |
| Everything moves at the same smooth rate | Mix frame rates. 12 fps for supporting effects | https://www.awwwards.com/prometheus-by-active-theory-wins-site-of-the-month-may-2021.html |
| Real-time shadows that add nothing | Drop the lights, bake tints into textures | https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/ |
| Generated models: triangle noise up close, smeared textures, fused parts, missing thin parts | Retopologise, re-unwrap, or regenerate from better input | https://triverse.ai/blog/ai-3d-generation-troubleshooting |
| Template feel | "every project gets its own system, its own logic" (Lusion) | https://tympanus.net/codrops/2026/04/13/lusion-where-digital-craft-meets-ambitious-experimentation/ |
| Filler | Monument Valley cut 30 levels to 10: "all killer, no filler" | https://www.wallpaper.com/tech/monument-valley-at-10-the-story-of-the-most-meticulous-puzzle-game-ever-created |

Unverified:
- Generated models look plastic or waxy because they ship a flat colour map without roughness, normal or AO maps, and export at random scale. Tripo page returned 403. https://www.tripo3d.ai/blog/why-ai-3d-models-look-bad

## 6. Performance patterns for a long scroll world

1. **One scene per frame**
   - Active Theory never renders two scenes at once. During a transition they "ping-pong between them so that we still only ever render one scene per frame".
   - https://www.awwwards.com/prometheus-by-active-theory-wins-site-of-the-month-may-2021.html
   - The studio's own Medium write-up returned 403: unverified. https://medium.com/active-theory/prometheus-2d3c05b88ec0
2. **Merge, then cut back into chunks**
   - A corridor went from 1,421 draw calls to 25 by merging. It was then re-cut per 3 metre z section so frustum culling works again.
   - Buffer capped by an absolute pixel budget (5.2 MP), not by device pixel ratio.
   - Warning from the same author: batching erases per object flags.
   - https://tympanus.net/codrops/2026/08/22/sixty-frames-for-the-record-a-three-js-game-seven-fly-throughs-and-a-wall-of-crts/
3. **Instancing**
   - InstancedMesh: same geometry and material, different transforms, fewer draw calls. https://threejs.org/docs/pages/InstancedMesh.html
   - BatchedMesh: same material, different geometries. https://threejs.org/docs/pages/BatchedMesh.html
   - Atmos: whole sky from two cloud models. https://www.awwwards.com/case-study-atmos.html
   - Mobile target about 100 draw calls per frame. https://www.utsubo.com/blog/threejs-best-practices-100-tips
4. **Baked lighting**
   - Windland: all shadows in one 2048 by 2048 texture. Whole site 1.8 MB. https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/
   - Fan Museum: baked at 4K, grouped by proximity, MeshBasicMaterial in place of MeshStandardMaterial. https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/
   - Direct lights are slow. Use as few as possible. Toggle `visible`, do not add and remove. https://discoverthreejs.com/tips-and-tricks/
5. **Streaming and warm-up**
   - ZERO: 35 to 40 MB cut to under 10 MB. Fifty plus images into about a dozen atlases. Big textures split into 256 px tiles, one uploaded per frame. Decode off the main thread.
   - ZERO: shader passes are warmed during an earlier stage's idle time, so the first real frame is a cache hit.
   - https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/
   - Fan Museum: model loaded in chunks. https://tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js/
   - `compileAsync()` while the loader is up. https://www.utsubo.com/blog/threejs-best-practices-100-tips
   - Hide with `object.visible = false` if it will come back. https://discoverthreejs.com/tips-and-tricks/
6. **LOD and shader reveals**
   - three.js LOD has a hysteresis value to stop flicker at boundaries. https://threejs.org/docs/pages/LOD.html
   - False Earth: three tiers (0 to 5 m, 5 to 20 m, 20 m plus). Per instance noise jitter on the distance test hides the LOD rings. Grid snaps forward as the camera crosses a cell. https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
   - Dissolve reveal: noise below `uProgress` is discarded, a `uEdge` band gets the edge colour. Injected into a standard material, no new geometry. https://tympanus.net/codrops/2025/02/17/implementing-a-dissolve-effect-with-shaders-and-particles-in-three-js/
   - Radial reveal driven by one `uProgress` uniform. https://tympanus.net/codrops/2024/12/02/how-to-code-a-shader-based-reveal-effect-with-react-three-fiber-glsl/
   - Fog hides the far edge for free. FogExp2 is clear near the camera and dense far away. https://threejs.org/docs/pages/FogExp2.html

Also confirmed:
- Quality tiers at runtime: ZERO adjusts pixel ratio, blur samples and text resolution. Windland measures FPS while loading and drops post-processing on weak devices. Codrops demo lowers DPR by 20% on a drop. https://tympanus.net/codrops/2025/02/11/building-efficient-three-js-scenes-optimize-performance-while-maintaining-quality/
- KTX2 stays compressed on the GPU (ZERO, Santamaria). Counter case: itomdev went back to WebP because KTX2 hurt the hand-drawn look.
- Bruno Simon: instancing, frustum culling, Draco, ETC1S and UASTC textures, lower preset on mobile. https://www.awwwards.com/brunos-portfolio-case-study.html

---

## Opened, little to steal for this walk

- Lusion studio site case study: cloth sim and data packing. https://www.awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html
- Hello Monday, Lyft Cities Talk Back: portraits resolve into a flag. https://www.awwwards.com/case-study-lyft-cities-talk-back-by-hello-monday.html
- Immersive Garden, David Whyte and New Mobile Workforce: Blender camera, speed stretch transitions. https://www.awwwards.com/case-study-david-whyte-experience-by-immersive-garden.html
- Zentry: DOM portal masks, no three.js. https://www.awwwards.com/zentry-case-study.html
- Alto's Odyssey interview: biomes "transition seamlessly into one another", no method given. https://www.pocketgamer.com/altos-odyssey/interview-a-closer-look-at-team-altos-stunning-sequel-altos-odyssey/
- Immersive Garden Cartier Watches and Wonders, Unseen Studio Hubtown: secondary listing only. https://www.utsubo.com/blog/best-threejs-websites-2026

## Not found or blocked

- Google Arts and Culture: no scroll-driven 3D journey with a write-up found.
- Resn, 14islands: no relevant case study opened.
- Theatre set changes in view of the audience (revolve, wagons, flown scenery): unverified, Britannica returned 403.
- Kevin Lynch's five city elements: unverified, search snippet only.
- Blocked pages: Active Theory Medium, Giant Bomb on Bastion, ctrl500 on Firewatch, TouringPlans on land transitions, Tripo.

---

## Top 8 moves to steal

1. Cross-dissolve between cities: ground, light, fog and sound change together over a stretch of path, never at a line. Source: John Hench via Written in the Queue, https://writteninthequeue.com/disneys-art-of-storytelling/
2. Colour script per city: one palette per chapter, blended as the camera moves, with the light colour matching the sky. Sources: Codrops mood gallery, https://tympanus.net/codrops/2026/03/09/building-a-scroll-reactive-3d-gallery-with-three-js-velocity-and-mood-based-backgrounds/ and Atmos by Leeroy, https://www.awwwards.com/case-study-atmos.html
3. One hero landmark per city, hidden until fog or cloud parts, held as a silhouette. Source: ZERO on Codrops, https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/
4. World rises out of the ground ahead of the camera, sorted by distance, far edge lost in fog. Source: Codrops Buildings Wave, https://tympanus.net/codrops/2019/01/30/buildings-wave-animation-with-three-js/
5. Replace banners with type thrown as light on a wall, or text lit by the scene, first sentence 16 words or fewer. Sources: /fm in Sixty Frames on Codrops, https://tympanus.net/codrops/2026/08/22/sixty-frames-for-the-record-a-three-js-game-seven-fly-throughs-and-a-wall-of-crts/ and the V&A text guide, https://www.vam.ac.uk/blog/wp-content/uploads/VA_Gallery-Text-Writing-Guidelines_online_Web.pdf
6. Movers that cost almost nothing: vehicles and birds, trees swayed in the vertex shader, wind particles that show only when scrolling fast. Sources: Windland on Codrops, https://tympanus.net/codrops/2022/04/25/case-study-windland-an-immersive-three-js-experience/ and Atmos, https://www.awwwards.com/case-study-atmos.html
7. A held camera: damped scroll (1 s, power3.out), a look target that glances at what is coming, noise sway on rotation only. Sources: Codrops Blender camera path, https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/ and itomdev, https://tympanus.net/codrops/2026/06/11/sketching-the-impossible-a-3d-portfolio-built-without-a-single-3d-model/ and Roystan, https://roystan.net/articles/camera-shake/
8. Render one chapter per frame and ping-pong during transitions, with geometry merged then re-cut every 3 m. Sources: Active Theory Prometheus on Awwwards, https://www.awwwards.com/prometheus-by-active-theory-wins-site-of-the-month-may-2021.html and Sixty Frames on Codrops, https://tympanus.net/codrops/2026/08/22/sixty-frames-for-the-record-a-three-js-game-seven-fly-throughs-and-a-wall-of-crts/
