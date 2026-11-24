---
title: Rebuilding this site
description: I wanted a minimal text site. I ended up with a 3D walk through my life that agents built while I pointed at things in Chrome.
pubDate: 2026-11-21
tags: [meta, web, agents]
---

I've always wanted to build a storyline in a game environment. So I turned my portfolio into one.

That wasn't the plan. I wiped the old site in August, I wanted something very minimal like stripe.dev. I built that first. It was fine ngl.

It was just me telling you what happened tho. I wanted people to walk through it.

So the home page is 13 sets now, from the Google trip to Floqer's hacker house (it's literally a house in dt Toronto). Scroll, or switch to Walk and use W A S D.

## I didn't write the code

Agents built all of it. Claude Code and Codex wrote the code, ran Blender and took the screenshots. I haven't opened Blender once.

My job was to look at it in Chrome and say what's wrong, mostly by talking. We did 63 rounds of that.

<figure class="blog-figure blog-loop" aria-label="The loop">
  <figcaption>the loop</figcaption>
  <div class="blog-loop-grid">
    <ol>
      <li class="blog-figure-pane">
        <strong>1. I say what is wrong</strong>
        <span>talking, in Chrome</span>
        <svg class="blog-loop-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24m-6-6 6 6-6 6" /></svg>
      </li>
      <li class="blog-figure-pane">
        <strong>2. Agents build</strong>
        <span>Claude Code and Codex: code, Blender bake</span>
        <svg class="blog-loop-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24m-6-6 6 6-6 6" /></svg>
      </li>
      <li class="blog-figure-pane">
        <strong>3. Headless Chrome takes frames</strong>
        <span>the agents check their own work</span>
        <svg class="blog-loop-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24m-6-6 6 6-6 6" /></svg>
      </li>
      <li class="blog-figure-pane">
        <strong>4. I judge it in Chrome</strong>
        <svg class="blog-loop-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M4 16h24m-6-6 6 6-6 6" /></svg>
      </li>
    </ol>
    <span class="blog-loop-rounds">63 rounds</span>
  </div>
</figure>

A few things I learnt about directing agents:

- They add things nobody asked for. I asked for a plane and got overhead bins, tray tables and a lavatory door. I literally had to ask why we're adding cabin bag space.
- Say a thing "doesn't seem the best" and they swap it for a different thing. My degree was a scroll. I said that about it and got back a flat printed certificate. I wanted the same scroll, just better. Now it's a rolled parchment with a gold bow, I crumple it and throw it in a bin.
- Without a reference they make things up. Volta came back as a white box with a coffee counter that doesn't exist. I used to spend 10 to 12 hours a day there, I know what it looks like. We rebuilt it from 25 photographs. Floqer's house took 16.
- They can't see, so they wrote their own eyes. One script opens headless Chrome and takes frames of every chapter. One scans for gaps you can see out of. One is a bot that walks the whole story and stops where it gets stuck.
- The first convocation crowd was 72 copies of one mannequin standing two metres apart. Before that there were stick figures. I don't wanna talk about the stick figures.
- I told them there is no point for tests. It's a portfolio, I judge it by looking at it.

## Real over fake

Everything invented looked fake. So the rule became real things only.

The streets of Toronto and Halifax come from OpenStreetMap. The photos from the Google trip are mine from 2019. The grads wear the actual Dal gown and hood for a CS degree.

<figure class="blog-figure blog-photos" aria-label="Photo and build">
  <div>
    <span class="blog-photo-label">photo</span>
    <div class="blog-photo-frame"><img src="/assets/blog/img/floqer-f-photo.jpg" alt="The Floqer mark in foam tiles on the wall of the real house" loading="lazy" decoding="async" /></div>
  </div>
  <div>
    <span class="blog-photo-label">build</span>
    <div class="blog-photo-frame"><img src="/assets/blog/img/floqer-f-build.jpg" alt="The same wall in the 3D walk" loading="lazy" decoding="async" /></div>
  </div>
</figure>

It backfired once. A real photograph of the Toronto skyline looked more fake than the CN Tower we'd coded. The coded one stayed.

## The stack

The old site was Next.js, this one is Astro. I want to be found when someone googles my name or asks an AI about me.

| what | why |
|---|---|
| Astro, not Next.js | Ships HTML and no JavaScript unless a piece asks for it. Next ships a React runtime before you write a line. |
| Text in the HTML | Google and AI crawlers read it without running anything. The 3D loads on top after. |
| Markdown | The source of truth. Every post has a raw `.md` twin. There is an `/llms.txt` too. An assistant reads a file I wrote on purpose. |
| JSON-LD, sitemap, RSS, canonicals | On every page. A lot of well known engineer blogs skip all of this. |
| three.js | The 3D, no React on top. |
| three-mesh-bvh | So you can't walk through walls. |
| Blender | Bakes the lighting into textures. Your laptop doesn't compute it. |
| Streaming | Sets load in story order. You get the first few fast. The rest load behind you while you walk. |
| Phones and tablets | A drawn version of the same walk, no 3D. |
| Vercel | Static. |

<figure class="blog-figure blog-readers" aria-label="Who reads what">
  <figcaption>who reads what</figcaption>
  <div class="blog-readers-grid">
    <div class="blog-figure-pane blog-reader-source">
      <strong>Markdown and data in the repo</strong>
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v24m-6-6 6 6 6-6" /></svg>
      <span>Astro</span>
      <svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v24m-6-6 6 6 6-6" /></svg>
      <span>static files on Vercel</span>
    </div>
    <dl class="blog-reader-list">
      <div class="blog-figure-pane">
        <dt>A person</dt>
        <dd>the text as HTML first, then the 3D on a laptop (three.js) or the drawn walk on a phone</dd>
      </div>
      <div class="blog-figure-pane">
        <dt>Google</dt>
        <dd>the same HTML, Person and BlogPosting JSON-LD, sitemap, canonicals, RSS</dd>
      </div>
      <div class="blog-figure-pane">
        <dt>An AI assistant</dt>
        <dd>/llms.txt, a raw .md twin of every post, the same HTML</dd>
      </div>
    </dl>
  </div>
  <div class="blog-js-comparison">
    <span>JavaScript shipped before you write a line</span>
    <dl>
      <div><dt>Astro</dt><dd>none</dd></div>
      <div><dt>Next.js</dt><dd>a React runtime</dd></div>
    </dl>
  </div>
</figure>

## The blog is tmux

The agent asked how the 3D world should meet the blog. I said no, no, no, the blog should not be 3D.

I told it I love stripe.dev and got back a clone of stripe.dev. That went too.

What you're reading is one tmux window, every post is a pane. Never used tmux? There are normal links too.

## Tell me what's broken

I need feedback, so pls reach out to me. Walk through it and tell me what looks off.

The repo is public: [github.com/Vansh983/curl-me-portfolio](https://github.com/Vansh983/curl-me-portfolio). Reach out on [LinkedIn](https://www.linkedin.com/in/vanshsood/). I read everything.
