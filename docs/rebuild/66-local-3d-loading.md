# 66. The local 3D loading failure

Chrome on `localhost:4321` showed the opening poster and the “3D journey could not load” message. The running Vite server pointed the browser at a version of `three.js` missing from its dependency cache. That request and the Three.js loader requests returned HTTP 504 with `Outdated Optimize Dep`. The import of `stage-run.ts` failed before the renderer could start. The logs did not identify which process replaced the cache.

The Vite config now gives each explicitly requested dev port its own dependency cache. Astro's temporary server for sync and checks uses the default cache. With a second server on 4387 and after `npm run check`, the Three.js requests on 4321 and 4387 each returned 200 from their own directory.

Headless Chrome reproduced the failure before the change. Afterward it loaded all 13 rooms, scrolled into the auditorium and entered Walk on both localhost and the published Canary preview at `a6cdadf`. The owner's localhost tab was reloaded. Visual verification was headless.

The graphic walk changes in this round cover the Volta community room, Dalhousie graduation and Floqer's two-floor office. At 390 and 1280 pixels wide the graphic walk reached all three and stopped at its configured endpoint without horizontal overflow. Captures are in `.cache/canary-stage-check/`.
