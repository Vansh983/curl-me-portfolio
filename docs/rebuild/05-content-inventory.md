# Content Inventory — what to carry from the old site

Extracted from the `curl-era` codebase (`data/about.ts`, `data/projects.ts`, `data/archive.ts`, `data/nav.ts`, components). This is the seed data for the new site.

## ⚠️ Finding: the curl gimmick never existed

Verified exhaustively (`git log --all`, `git grep` across every branch): there is **no middleware, no user-agent branching, no plaintext response anywhere in history**. `pages/api/hello.ts` is untouched Next.js boilerplate returning `{"name":"John Doe"}`. `curl vanshsood.com` returns ordinary Next.js HTML. The repo name was aspirational branding. If the terminal-response idea is wanted for the new site, it's a from-scratch build (trivially easy in Astro/Vercel: serve a plaintext résumé when `User-Agent` starts with `curl/` via an edge middleware or a `/resume.txt` route).

## Old timeline mechanics (the inherited signature interaction)

- Desktop `Timeline.tsx`: GSAP ScrollTrigger scrub (`start: "top center"`, `end: "bottom center"`) over a hand-authored SVG S-curve (`viewBox 0 0 600 1200`, white 7px stroke). A dot traveled the path via MotionPathPlugin; logo markers (`google/webcube/dal/rocket1`) pulsed in (`scale: 2, power3.out`) at progress 0.2/0.38/0.55/0.74; years 2018/2020/2022/2023 hardcoded as SVG `<text>` in Bebas Neue.
- **Silent defect**: the line-draw tween used `drawSVG` — a paid Club GreenSock plugin never installed or registered. It no-op'd for the site's entire life; only ball travel + pulses ever animated. (GSAP plugins are all free now, post-Webflow.)
- Milestone coords hardcoded into SVG pixels — not data-driven; breaks if entries change. Mobile fell back to a plain card grid with no animation.

## Timeline entries (verbatim from `data/about.ts`)

1. **2018 — Google Code-in**: Winner of Google Code In at 17; fully sponsored trip to San Francisco by Google; catalyzed the move to Canada for CS.
2. **2020 — Webcube**: founded; startups' ideas → software; managed 25+ developers, six production projects; assisted 20+ startups; $100,000+ funding secured via MVPs.
3. **2022 — Dalhousie**: moved to Canada for CS; Student Ambassador at Shiftkey Labs (workshops); joined Emerging Wireless Technologies Lab under Dr. Srinivas Sampalli.
4. **2023 — Dalhousie SDE**: intern/Software Developer contributing to research projects; building a community for student freelancing/financial independence.

Missing from the old timeline (to add in brainstorm): everything 2024–2026 — **Floqer** (current), and whatever else has happened since.

## Identity / bio copy

- Title: "Vansh Sood - Full Stack Developer, Tech Founder". Meta description: "Vansh Sood's personal portfolio. Explore my world of development, technology leadership, and creative projects."
- Rotating roles: Creative Developer / Full Stack Developer / Software Architect / Tech Entrepreneur / Cloud Architect / Cloud Practitioner / Tech Founder / Open Source Enthusiast / LinkedIn Top Voice / Mobile Developer / Web Developer / Web Designer / Creative Designer.
- Hero paragraph (stale — says "3rd year" desktop, "2nd year" mobile): Dalhousie CS student, promotes freelancing/solopreneurship, runs a software company, open-source under Shiftkey Labs, system architectures for startups. **Needs a full 2026 rewrite** (Floqer, post-university reality).
- CTA: "Enjoyed my work? Lets work together! Drop a text (LinkedIn), schedule a quick call (topmate), or send an email."

## Canonical links

| Label | URL | Note |
|---|---|---|
| LinkedIn | https://www.linkedin.com/in/vanshsood/ | |
| GitHub | https://github.com/Vansh983 | |
| Mail | vanshsood@dal.ca | likely outdated — vansh@floqer.com? |
| Blog | https://blog.vanshsood.com/ | merge decision in doc 04 |
| Resume | https://vanshsood.com/resume.pdf | `public/resume.pdf` exists |
| Topmate | topmate.io/vanshsood vs topmate.io/vansh_sood | **inconsistent in old code — pick one** |

Analytics in old `_app.tsx`: GA4 `G-F4F6K9RZP7` + Floqer contact-tracker script.

## Milestones ("flaunt" cards, `story[]`)

Titles reliable; descriptions for items 1, 5, 6 were copy-paste duplicates and links for 5, 6 were wrong:

1. LinkedIn Top Web Applications Voice (desc+link broken)
2. Google Code-In Grand Prize Winner
3. Empowering international students to leverage Freelancing (LinkedIn post link)
4. Built Non Profit Platform for Covid patients — covidleadsdelhi.com, 20,000+ reached in two months
5. Certified AWS Cloud Practitioner ("prepared in 3 days") (link broken)
6. President of Converge Clan (desc broken — needs real copy)

## Featured projects (`projects[]`, 10)

1. **The Good Neighbour App** (2023) — RN/Expo/TS/Node/PG/AWS — raised $45k, 200+ active users, 40% server-cost savings — App Store
2. **Nutrition Defined** (2022) — Next/TS/Firebase/Tailwind — nutritiondefined.in
3. **Waqalat: Legal Documents Generator** (2022) — React/Redux/Node/PG/EC2/S3 — waqalat-web.vercel.app
4. **Re-New: AI Mental Health App** (2023) — Cohere NLP/RN/Flask/AWS — UofT Hacks, most stable MVP among 150+ teams
5. **Anatomy Guru** (2022) — anatomyguru.in
6. **Re-defined** (2022) — NPO, 30k people / 5 countries, 1600 students — redefined.social
7. **Multiplayer Terminal RPG** (2022) — Java — github.com/Vansh983/clash-rpg
8. **Covid-19 Resource Platform** (2020) — 20k+ users, 52 volunteers — covidleads-delhi.vercel.app
9. **Atlantic Canada Data Analysis Tool** (2023) — 15,000 med placements across NS — foh-dashboard.vercel.app
10. **Tech and Drupal Blog** (2022) — blog.vanshsood.com

(Old `projects.ts` had `["tag1","tag2","tag3"]` placeholders on several; real tags live in `archive.ts`.)

## Full archive (31 items, 2017–2023)

Filterable by category (Web/Mobile/Cloud/ML) and year. Highlights beyond the featured 10: Urbanwoven AR try-on ecommerce, Q-Learning 3D maze solver, ELXR emergency app (Behance), Thapar University permissions platform, Cancer-risk ML dashboard, Stellar/Toony/ClarOS/Taurus/macOS-concept (2017–18 era pieces on *.vanshsood.com subdomains), FlipX sneaker bidding, Chemistsmart, Lumenore BI, Dalhousie CS Leaders Society site, Flutter world clock. Known data bug: item 26 (Prodigy Music) points at lumenore.com. One commented-out item: Shiftkey Labs Events App (github.com/shiftkey-labs/shiftkey-app).

Tag vocabulary doubles as a skills list: React Native, Expo, TypeScript, Docker, Node.js, PostgreSQL, AWS, NLP, Python, Flask, Nginx, MongoDB, Next.js, Firebase, Redux, Computer Vision, Java, Sanity, Drupal, PHP, MySQL, Figma, Django, Tailwind, Flutter, GCP, Jenkins…

Assets reusable: `public/assets/projects/*.png` (32 screenshots), timeline logos, `public/resume.pdf`, story images.

## Old design identity (for continuity decisions)

- Fonts: **Bebas Neue** (display), **Playfair Display** (section headings), **Montserrat** (body). Inter imported but never used.
- Palette: bg `#0d0d0d`, white/gray-300/gray-400 text, `sky-600` accent links, two blurred pink/purple gradient blobs (`#ff80b5→#9089fc`) as ambient decoration, selection `#dedede` on `#13171c`.
- The new direction (doc 02) deliberately drops the gradient blobs and sky accent; keeping near-black as the dark mode preserves the recognizable core.

## Fix-on-migration list

- "3rd year"/"2nd year" copy mismatch; dal.ca email; topmate URL split; story[] items 1/5/6 desc+links; archive item 26 URL; placeholder tags.
- Dead code not worth porting: `code_proj[]`, `inter` font, ZoomSection, Brand, `Particles copy.tsx`, `Navbar copy.tsx`, `data/savages/*`, `pages/legacy-old.tsx`, unused conference-timeline CSS, `pages/api/hello.ts`.
