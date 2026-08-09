---
title: Rebuilding this site
description: Why the old portfolio is gone, what replaced it, and the one animation that never actually worked.
pubDate: 2026-08-08
tags: [meta, web]
---

The old site was a Next.js portfolio with gradient blobs, a rotating job title and a
scroll animation built on GSAP. It served me for three years. It is now parked on a
branch called `curl-era` and this is what took its place.

Three things changed.

**The stack is smaller.** Astro, static output, no framework runtime. The whole site
ships less JavaScript than the old homepage spent on its font loader.

**The animation is honest.** The old timeline used a paid GSAP plugin that was never
installed, so the line it was supposed to draw never drew. Nobody noticed for three
years, including me. The new one is four lines of CSS and the browser runs it.

**The repo name is finally true.** It has been called `curl-me-portfolio` since 2022
and there was never any curl handling in it. Now there is:

```
curl vanshsood.com
```

More soon.
