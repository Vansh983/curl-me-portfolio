# vanshsood.com

Vansh Sood's personal site, built with Astro and three.js. The home page pairs his story with a graphic walk on small screens and a 3D journey on desktop. Walk mode lets visitors explore the rooms and pick things up.

## Run it

- Use Node 22.12 or later.
- In a fresh clone, run `npm ci`.
- Start the site: `npm run dev -- --port 4321`.
- Before a commit run `npm run check && npm run build && npm test`.
- Serve that output: `npm run preview -- --port 4322`.

Vercel deploys `main`. Ongoing work uses `canary`. `curl vanshsood.com` returns the terminal profile through the root middleware.

## Find things

See [CLAUDE.md](CLAUDE.md#map) for the detailed repository map.

## Work on it

- Agents start with [CLAUDE.md](CLAUDE.md). `AGENTS.md` points to the same file.
- Read the [stage playbook](docs/rebuild/38-stage-playbook.md) before changing the 3D journey or its tools.
- The [round index](docs/rebuild/README.md) links the research and decisions behind the site. Reference photographs live in `docs/rebuild/ref/` and are not shipped.
