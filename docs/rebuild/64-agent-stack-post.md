# Agent stack post

[Working draft](../../src/content/blog/my-agent-stack.md) · [Local preview](http://127.0.0.1:4336/blog/my-agent-stack)

The title is open. “My agent harness” is the working label.

## Section review

1. **Opening.** Keep the daily crashes and the three questions about capacity, context and using a phone.
2. **How I run Claude and Codex.** Start with the harness Vansh wanted to keep. Follow an optional API field from his conversation with Fable through two independent Codex briefs, the returned findings, edits and tests.
3. **What I tried.** Explain what the hosted alternatives offered and why Vansh kept his own interface before introducing Beast.
4. **Beast had the repo. I wanted my conversation too.** Keep the real-path issue and the round-trip test. Git handles source and Syncthing handles agent state.
5. **Picking it up from my phone.** Trace regular SSH over Tailscale into tmux, and Claude Remote Control into the same running session. Keep the actual away-from-home SSH failure and its resolution here.
6. **How I ended up with three Raspberry Pis.** Follow the three-way sync with the first Pi and growth to three Pis. Each workload uses CPU and RAM on its selected host.
7. **What I still use my Mac for.** The laptop is a terminal and review screen. The closing thought about a folding phone comes from Vansh's own post.

The first figure is a horizontal cycle. Vansh talks directly to Fable, shown by the two-way arrow above it. Fable sits between Codex and Opus. The upper arrows carry briefs, fixes and ready PRs. The return arrows carry diffs, test results and review findings. Each model sits under its product logo. The model labels come from Sandcrawler’s `claude/rules/model-routing.md`. Cloudflare uses an icon above each participant in its privacy proxy sequence. Tailscale puts each request and reply beside its path in the STUN example. [Cloudflare’s privacy proxy](https://blog.cloudflare.com/open-sourcing-our-privacy-proxy-cli/) · [How NAT traversal works](https://tailscale.com/blog/how-nat-traversal-works)

The access sequence traces SSH into tmux, a phone prompt and its reply, reattachment and a new worktree. The cluster figure follows two independent routes to the same set of hosts. Syncthing carries agent files between peers. Git carries committed code on a manual push or pull. All three figures keep their Mermaid source in the Markdown twin and full-text index. The Claude and Codex marks come from [LobeHub](https://github.com/lobehub/lobe-icons/tree/main/packages/static-svg/icons), the Pi logo from [Devicon](https://github.com/devicons/devicon/tree/master/icons/raspberrypi) and the Syncthing mark from [Syncthing](https://github.com/syncthing/syncthing/blob/main/assets/logo-only.svg).

At desktop width, enlarging the Mermaid SVG had turned a 17px model label into 25px beside 17.5px prose. The figure now uses 13px for names and 12px for arrow labels. The device diagrams use the same two sizes.

## Sandcrawler evidence

- Oct 28, `8112589` and `d3ed36c`. See `docs/02-setup-log.md` sections 0, 6, 8 and 14 for the machines, first 7 GB sync and resume tests. See `docs/03-daily-use.md` for the repo handoff.
- Oct 29, `72f9b54` and `07301e6`. See setup log sections 13b and 13d for the SSH hang and model routing. The current `mac/beast` and `claude/rules/model-routing.md` supply the commands and delegation rules.
- Nov 26, read-only check on Beast. The host identified as an Alienware Aurora Ryzen Edition. Claude processes were running. Remote Control at startup was enabled and Fable was the configured model. Syncthing reported connected peers on the Mac and Beast. Both sides reported zero errors for the Claude, Codex and agent folders.
- The first Pi, three-way sync and growth to three Pis come from the author's account in the draft review. The live check above covered the Mac and Beast.

## Notes for the separate PR review post

- The earlier workflow and single-pass method are in `chemical_wish/.github/workflows/claude-pr-review.yml` and `chemical_wish/.claude/skills/pr-review/SKILL.md`. The workflow calls the checked-in skill. The skill reads GitHub PR metadata, diffs, CI status and earlier review comments.
- `talos/skills/pr-review/SKILL.md` documents the local review method. It checks the PR and caller code at the PR head, consults the parent and repo rules and compares linked PRs at their own heads. Correctness, design and tests are parallel passes. Cross-repo contract checks apply when sibling PRs exist. Each finding goes through a verification pass.

The portfolio's [voice notes](../voice/his-writing.md) include the author's LinkedIn post about using his laptop as an interface. The collection distinguishes his published posts from earlier generated drafts.

## Editorial references

Three first-person engineering posts informed the rewrite.

- Julia Evans starts by describing what she wants her terminal to do. The tools make more sense once the reader knows her habits. [What's involved in getting a “modern” terminal setup?](https://jvns.ca/blog/2025/01/11/getting-a-modern-terminal-setup/)
- Getting a Pi online gives Jeff Geerling his next problem, making the site reachable. That progression informed the move from having the repo on Beast to finding the conversation about it. [Hosting this website on a farm](https://www.jeffgeerling.com/blog/2022/hosting-website-on-farm-or-anywhere/)
- Simon Willison makes agent research concrete by showing the questions he gave it and the work that came back. The SSH hang gives this piece a reason to show the individual jobs. [Code research projects with async coding agents](https://simonwillison.net/2025/Nov/6/async-code-research/)

The technical article skill suggests opening with an incident. Anthropic's co-authoring skill asks whether a new reader can follow the piece. The question here is whether the reader can tell where the job runs after the laptop closes. [Technical Article](https://github.com/ohugonnot/claude-skills/blob/main/plugins/tech-article/skills/tech-article/SKILL.md) · [Anthropic Doc Co-Authoring](https://github.com/anthropics/skills/blob/main/skills/doc-coauthoring/SKILL.md)

Anthropic documents the phone and browser connection to an existing local Claude Code process. [Remote Control](https://code.claude.com/docs/en/remote-control)
