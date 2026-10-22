# vanshsood.com

Vansh Sood's site. The home page is a scroll-driven 3D journey through the rooms of his life, built with Astro and three.js; a Walk mode lets you leave the scroll's line and pick things up.

```sh
npm install
npm run dev -- --port 4321
```

`npm run build` writes `dist/`; Vercel serves it from `main`. `curl vanshsood.com` returns the text version.

How the 3D is made, and how to work on it: `docs/rebuild/38-stage-playbook.md`; every round of the build is indexed in `docs/rebuild/README.md`. Agents start at `CLAUDE.md`.
