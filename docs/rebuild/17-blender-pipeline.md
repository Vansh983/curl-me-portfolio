# 17. Why it still reads as a video game, and the Blender pipeline (2026-09-06)

## Verdict

- The cause is not the textures. It is direct light on code boxes: one sun, a hemisphere, a studio env map, no bounced light, no modelled furniture. That is the PS2 look. Screen-space occlusion and bevels cannot fix it.
- The fix is the pipeline every good three.js room uses: build and light the rooms in Blender, bake the light with Cycles (path traced global illumination) into lightmaps, ship one GLB per room. The site then draws baked light, not computed light.
- No Claude skill exists for this; a headless `bpy` script does it. Tools now on this Mac: Blender 5.2.1 (Cycles on the M2 Pro GPU, verified), `uv`, `gltf-transform`.
- Models: BlenderKit's public API hands out free GLBs with no key (verified: 946 free office chairs, 2.7 MB GLB downloaded). Sketchfab CC-BY needs an API token from him. Poly Haven stays for CC0.

## What Vansh provides

- Sketchfab API token (Settings > Password & API, sketchfab.com/settings/password) for the CN Tower, Bay Bridge, skyline, MacBook and a baked living room. Optional.
- Optional, for gaps only: a Tripo key (platform.tripo3d.ai, 300 free credits, $0.35 to $0.45 per photo-to-model) or a fal.ai key (Rodin, $0.40 per model).
- Nothing else. BlenderKit and Poly Haven need no login.

## Pipeline

1. Assets: `scripts/stage-assets.mjs` gains a `blenderkit` source: search `GET https://www.blenderkit.com/api/v1/search/?query=<q>+asset_type:model+is_free:true`, take `files[fileType=gltf].downloadUrl`, `GET {downloadUrl}?scene_uuid=<uuid>` gives a signed GLB URL. Licence Royalty Free (no credit, cannot resell the file). Sketchfab source: `GET /v3/models/{uid}/download` with `Authorization: Token`, signed `glb.url` valid 300 s. All through `gltf-transform optimize` to 512 or 1k webp, meshopt.
2. Scene: a headless three.js export (`GLTFExporter` in the audit script) of each set's shell and props into `.cache/scene/<set>.glb`, or the same layout rebuilt in `bpy` from `sets.ts` data. Props come in as GLBs.
3. Light in Blender: an HDRI world (Poly Haven), a sun through the window, area lights at lamps and screens, Cycles GPU.
4. Bake: per mesh a `Lightmap` UV (`smart_project(angle_limit=1.15, island_margin=0.02)` + `pack_islands`), `bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT','INDIRECT'}, margin=8, use_clear=True)` at 2048 px per room, 256 samples, Compositor OIDN denoise, 16 bit PNG. Shared materials made single user first or later objects bake black.
5. Export: `export_scene.gltf(export_format='GLB', export_apply=True, export_lights=False)`; UV layers land as TEXCOORD_0 and TEXCOORD_1.
6. three.js: load the GLB per set; `lightMap.channel = 1`, `flipY = false`; drop the sun and hemisphere, keep PMREM, N8AO, bloom, the screens' video, curtain sway and fan as live overlays. Day/night in the condo stays a tone map exposure change.
7. Audit with `.cache/shoot.mjs` at 26 stops as before.

Effort: 2 to 3 days. First room to convert: the condo (hero), then 2010, lab, plaza.

## Sources

blender-mcp (interactive only, GUI needed, ~7k tokens of tool schema): github.com/ahujasid/blender-mcp. Bake scripts: github.com/LiteReality/LiteReality-Agent (bake_glb.py), github.com/techinz/blender-batch-lightmap-baker, tchayen.github.io/posts/baked-lighting-in-r3f, tympanus.net/codrops/2025/04/08/3d-world-in-the-browser-with-blender-and-three-js, threejs-journey.com/lessons/baking-and-exporting-the-scene. three.js: GLTFLoader maps TEXCOORD_1 to uv1, r152 migration note on lightMap.channel. BlenderKit client: github.com/BlenderKit/bk_client (download.go), blendkit.com/docs/licenses. Sketchfab: sketchfab.com/developers/download-api. Tripo: developers.tripo3d.ai/en/pricing. Rodin on fal: fal.ai/models/fal-ai/hyper3d/rodin. Skill packs (text only, not needed): freshtechbro/claudedesignskills blender-web-pipeline, RobLe3/cc-blender-skill, CloudAI-X/threejs-skills.
