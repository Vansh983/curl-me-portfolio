# Palette & Typography Proposal

## The recommendation, up front

**Palette A "Paper & Ink + one acid note"** — stripe.dev lineage, but yours, with an inverted dark mode that keeps the old site's near-black identity. Space Grotesk display at 100px+, Inter body, JetBrains Mono labels (all free). Swap to Clash Display if you want louder.

---

## Palette candidates

### A. Paper & Ink + acid (RECOMMENDED)

Light-first like stripe.dev; dark mode is the same system inverted.

| Role | Light (default) | Dark |
|---|---|---|
| Background | `#EFEDE8` warm paper (or cooler `#E8E8E8` stripe-exact) | `#0D0D0D` (the old site's black) |
| Surface / chrome | `#E4E1DA` | `#161616` |
| Ink / text | `#1B1B1B` (never `#000`) | `#E8E6E1` |
| Muted | `#8A8A8A` | `#7A7A7A` |
| Faint / disabled | `#1B1B1B44` (alpha-on-ink) | `#E8E6E144` |
| Border | `#1B1B1B` solid; `#ABABAB` dotted | `#2A2A2A` |
| **Accent (one only)** | `#B8E000` acid (chartreuse family, shifted off Stripe's `#c4e817`) | same, reads neon on black |

Accent usage rule (stripe.dev's discipline): `::selection`, link-hover fill, one tag/chip style, the timeline's traveling dot. Nowhere else.

### B. Ink-first dark (rauno.me lineage)

Keeps the current site's identity; boldness from black.

| Role | Value |
|---|---|
| Background | `#0A0A0A`; surface `#111111` |
| Text | `#E5E5E5`; muted `#737373`; border `#262626` |
| Accent | ONE of: acid `#CCFF00`, international orange `#FF4D00`, terminal green `#00FF41` |

### C. Zero-accent grayscale (emilkowal.ski / paco.me lineage)

The strictest read of "monotone". 12-step gray scale, no hue anywhere; links are gray + underline; boldness must come entirely from type size.

- Light: `#FDFDFC` bg → `#21201C` ink; Dark: `#111110` → `#EEEEEC`
- Steps: `#FDFDFC #F5F5F4 #EAEAE8 #D9D9D6 #B3B3B0 #8C8C89 #666663 #4A4A47 #333330 #21201C`

**Why A over B/C**: you asked for stripe.dev's vibe — that vibe is specifically *paper*, not black. Paper + acid photographs as artsy; pure dark reads as "another dev site"; zero-accent needs perfect typography to not read as gray. A gives you B for free as its dark mode.

---

## Typography system

### Recommended stack (all free)

| Slot | Font | Source | Role |
|---|---|---|---|
| Display | **Space Grotesk** 500/700 | Google Fonts | Headlines 64–170px; techy, quirky terminals |
| — louder alt | **Clash Display** | Fontshare | Wide + heavy = genuinely in-your-face |
| Body | **Inter** 400/500 (features `cv11, ss01`) | Google Fonts | 16–18px prose |
| Mono / labels | **JetBrains Mono** 400 | Google Fonts | 11–13px UPPERCASE smallcaps labels, dates, tags |
| — nicer paid alt | Berkeley Mono ($75, usgraphics.com) | — | The coveted one; JetBrains is ~85% of it free |

Paid reference points: Söhne (Klim — the Stripe/OpenAI face), Neue Haas Grotesk Display. Not needed at launch.

Serif-body variant (the mitchellh/leerob trend): swap Inter body for **PT Serif** or **STIX Two Text**, keep grotesk display. More editorial, less terminal. Decide in brainstorm.

### The oversized-type recipe (this IS the design)

```css
h1 {
  font-size: clamp(64px, 12vw, 170px);
  line-height: 0.9;
  letter-spacing: -0.04em;   /* -0.03 to -0.05em */
}
.label {                      /* the stripe.dev smallcaps */
  font-family: var(--mono);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

- The contrast between a 12px mono label and a 150px headline is the whole trick. Nothing in between competes.
- Two weight philosophies: heavy 700 (classic bold) or stripe.dev's inverse — **weight 300 at display size** with tight tracking reads as expensive restraint. Pick one, never mix.
- Body max-width **~65ch / 640px column** (the survey's 576–672px cluster). Centered column, left-aligned text.
- Only decoration allowed: 1px hairline rules, dotted separators, `/` section prefixes, `[ Fig. 1 ]` captions, `( n )` counters.
- Zero rounded corners, zero shadows, zero gradients (teenage.engineering rule) — except pill buttons if wanted (stripe.dev's 99px radius + invert-on-hover).

### CSS variable skeleton

```css
:root {
  --bg: #EFEDE8; --surface: #E4E1DA;
  --ink: #1B1B1B; --muted: #8A8A8A; --faint: #1B1B1B44;
  --border: #1B1B1B; --border-dot: #ABABAB;
  --accent: #B8E000;
  --sans: 'Inter', system-ui; --display: 'Space Grotesk'; --mono: 'JetBrains Mono', monospace;
}
[data-theme="dark"] {
  --bg: #0D0D0D; --surface: #161616;
  --ink: #E8E6E1; --muted: #7A7A7A; --faint: #E8E6E144;
  --border: #2A2A2A; --border-dot: #3A3A3A;
}
::selection { background: var(--accent); color: var(--ink); }
```

Semantic-var theming is also stripe.dev's mechanism for its 9 alt themes — leaves the door open for CRT/theme easter eggs later at near-zero cost.
