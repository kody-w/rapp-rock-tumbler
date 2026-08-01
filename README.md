# RAPP Rock Tumbler

**An agent's report of success is not evidence of success.**

Ten ambitious single-file browser applications were built by fanning out
sub-agents, each benchmarked against a named commercial product. Every
sub-agent ran its own checks. Every sub-agent reported success.

**Nine of the ten were still broken.**

Not one of those defects was reachable by `node --check`, a linter, jsdom, or
by asking the author. All of them were obvious within seconds in a real
browser — *if* someone bothered to open one.

This repo is that loop, documented end to end, with the harness that runs it
and a 110-second reel of the ten artifacts after tumbling.

▶ **[Watch the showcase](https://kody-w.github.io/rapp-rock-tumbler/)** (3m40s, narrated) ·
📄 [The pattern](docs/PATTERN.md) ·
🔬 [Every defect, with numbers](docs/FINDINGS.md) ·
✍️ [The ten seed prompts](docs/PROMPTS.md)

---

## The loop

```
build  →  serve over http  →  drive it  →  measure from outside  →  number
   ↑                                                                  │
   └───────────────  reject unless the number is right  ←──────────────┘
```

1. **Serve over HTTP, never `file://`.** OPFS, workers and ES modules all fail
   silently under `file://` and give you false failures.
2. **Launch a real browser** with GPU flags. Without them WebGL and WebGPU
   quietly fall back and you find bugs that only exist in your harness.
3. **Capture `pageerror` and `console.error`** — then *identify* every one
   before dismissing it. A bare test server's own `/favicon.ico` 404 will
   masquerade as an application defect.
4. **Drive the app.** Click the start gate. Press the keys. Open the tab nobody
   opens. Run the app's own self-test if it ships one.
5. **Measure from outside the page.** Screenshot to PNG and compute over the
   pixels yourself. Page-side code can tell you whatever it likes; a PNG cannot.
6. **Hand back a number, not an adjective.** "The road is green" gets argued
   with. "Road RGB [90,102,70] at 0.316 saturation, grass at 0.499" gets fixed.
7. **Loop until the number is right**, then re-run the whole sweep to catch what
   the fix broke.

## Quick start

```bash
cd harness
npm install
npx playwright install chromium

# tumble one artifact
node tumble.mjs /path/to/your/site index.html --seconds 9
```

Output is a report made of numbers:

```
=== TUMBLE  index.html ===
http status        200
canvases/buttons   1 / 24
scrollX/scrollY    -1138 / 0   <-- document scrolled; suspect an unclipped oversized child
doc vs viewport    3200px vs 1600px   <-- horizontally scrollable
dominant colour    0.47 of frame is rgb(187,204,204)   <-- a flat slab fills the view
pageerrors         0
console errors     0   (server 404s seen: /favicon.ico)
```

Every line above is a real finding from the session this repo documents.

## The single most useful result

Of the ten applications, **exactly one shipped correct on the first attempt
with zero correction loops**: the WebGPU path tracer.

It was also the only one whose prompt contained an **objective,
self-administered fail condition**:

> *Run the white furnace test. Put the camera inside a uniformly emitting
> sphere with albedo 1.0 — every pixel must return exactly the emitter's
> radiance. If energy error exceeds 1%, your integrator is wrong.*

It came back at **0.49%** and it was telling the truth.

The other nine were graded on *"make it AAA quality."* All nine reported
success while broken — not maliciously, but because **a subjective bar can
always be argued into.**

> **If you can name the measurement, put it in the prompt, not in the review.**

## What's here

| Path | What it is |
|---|---|
| [`docs/PATTERN.md`](docs/PATTERN.md) | The eight rules, why each exists, and the bug that taught it |
| [`docs/FINDINGS.md`](docs/FINDINGS.md) | All ten artifacts and every defect, with the measurement that caught it |
| [`docs/PROMPTS.md`](docs/PROMPTS.md) | The ten seed prompts, including the fail conditions |
| [`harness/tumble.mjs`](harness/tumble.mjs) | Serve → launch → drive → screenshot → measure → report |
| [`harness/record.mjs`](harness/record.mjs) | Driven video capture and reel stitching |
| [`harness/lib/serve.mjs`](harness/lib/serve.mjs) | Static server with COOP/COEP and 404 accounting |
| [`index.html`](index.html) | GitHub Pages showcase — the reel, playable |
| `media/showcase-1080p.{mp4,webm}` | **Narrated 3m40s showcase**, 1920×1080 — live capture of each app with lower-thirds and voiceover |
| `media/short-1080x1920.{mp4,webm}` | **Vertical cut, 32s** — Shorts / Reels / TikTok format |
| `media/rock-tumbler.{mp4,webm}` | Original silent 110s reel, 1280×720 |

## Chapters

| | | |
|---|---|---|
| 0:00 | Intro | nine of ten reported success while broken |
| 0:18 | Apex Driving Simulator | a 7.28° kink at the loop seam |
| 0:45 | WebGPU Path Tracer | the only one that shipped correct |
| 1:07 | Fluid & Destruction Sandbox | dead on arrival |
| 1:24 | Open World Explorer | grass taller than the player |
| 1:37 | webOS Desktop | the whole UI at x = −1138 |
| 1:59 | NES Emulator Studio | 2× speed on 120Hz |
| 2:18 | Browser DAW Studio | exported silence |
| 2:35 | HyperSheet | text that would not spill |
| 2:48 | Vector Design Studio | twelve layers named `r` |
| 3:00 | Self-Writing Game Engine | it rejects its own bad output |
| 3:18 | Name the measurement | the finding worth keeping |

## The artifacts

All ten are self-contained HTML files. Sources live in
[kody-w/localFirstTools](https://github.com/kody-w/localFirstTools); each has a
write-up at [learnwithkody/examples](https://kody-w.github.io/learnwithkody/examples/).

| # | Artifact | Benchmarked against | What the tumbler found |
|---|---|---|---|
| 1 | Apex Driving Simulator | Gran Turismo 7 | Track spline not C1-continuous at its seam — one root cause, three visible bugs |
| 2 | WebGPU Path Tracer | Blender Cycles | Nothing. Passed the furnace test at 0.49% first try |
| 3 | Fluid Destruction Sandbox | Teardown | Dead on arrival — `sampler3D` has no default precision in GLSL ES |
| 4 | Open World Explorer | Breath of the Wild | Grass rendering at 44–152% of player height |
| 5 | WebOS Desktop | macOS | Whole desktop at x = −1138; `ls \| grep txt \| wc -l` returned 1 |
| 6 | NES Emulator Studio | Mesen | 2× speed on 120Hz displays; own self-test said 4 FAILED / 26 |
| 7 | Browser DAW Studio | Ableton Live | Bounced silent WAVs — `OfflineAudioContext` dropped worklet messages |
| 8 | Hypersheet | Excel | Text clipped instead of spilling into empty cells |
| 9 | Vector Design Studio | Figma | Twelve layers all named `r` |
| 10 | Self-Writing Game Engine | itself | Nothing — it rejects its own unwinnable output before you see it |

## Also available as a twin

The practice ships as a hatchable RAPP method twin:

```
Twin(action='hatch', egg_url='https://raw.githubusercontent.com/kody-w/rapp-egg-hub/main/eggs/rock-tumbler.egg')
```

It carries the eight rules, 23 diagnostic facts, and two runnable agents —
`BrowserCritic` (runs the loop) and `AdversarialCritic` (adjudicates a claim
and returns either the rejection or the number). See
[kody-w/rapp-egg-hub](https://github.com/kody-w/rapp-egg-hub).

## License

MIT — see [LICENSE](LICENSE).
