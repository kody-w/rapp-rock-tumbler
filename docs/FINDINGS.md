# Findings

Every defect the tumbler found, with the measurement that caught it and the
measurement that closed it. Ten artifacts, all single self-contained HTML
files, each benchmarked against a named commercial product.

**Nine of ten builder sub-agents reported success while their artifact was
still broken.**

---

## 1. Apex Driving Simulator — vs Gran Turismo 7

| Defect | Caught by | Before | After |
|---|---|---|---|
| Track spline not C1-continuous at loop closure | Walking all 1600 centreline points | max per-point heading **7.28°** vs 0.378° median; six worst at indices 1594–1599, 0 | **2.12°**, worst relocated to index 727 (a real corner) |
| Same — segment bunching | Segment length distribution | min **0.194 m** vs 0.743 m median | **0.648 / 0.649 / 0.650 m** |
| No collision with barriers/fences/trees | Head-on impact at 161 mph | car passed through, escaped into infinite field | penetration **0.0000 m**, \|lateral\| clamps at 8.40 m = limit |
| Chase camera clipping inside scenery | 12-bit colour histogram of viewport, computed outside the page | worst dominant-colour fraction **0.50** | **0.111** |
| Asphalt read as green, not tarmac | Pixel sampling road vs grass | road [90,102,70] at **0.316** saturation | road **[128,130,135] at 0.054**; grass 0.499 |
| Tyre slip oscillating violently at standstill | Slip trace at v→0 | singular: `(ωR − v)/\|v\|` | relaxation-length transient + low-speed force fade |
| "Skid mark" fan on the apron | See PATTERN.md rule on root causes | ~15 radial streaks | gone — was a *symptom* of the spline kink |

**The one that mattered:** the fan, the jagged road edge, and a Reset that
pinned the car against a barrier in 3 seconds were **three symptoms of one
cause**. The builder had "fixed" the fan by clearing the skid buffer;
`skidActive()` returned 0 and the fan remained.

Also worth recording: the tumbler *wrongly* suspected the physics of a yaw
defect. Measurement showed the car turned **0.0°** while the track curved
**21°** beneath it. Retracted immediately.

---

## 2. WebGPU Path Tracer — vs Blender Cycles

**No defects. Zero correction loops. The only artifact of the ten to ship
correct first try.**

| Check | Result |
|---|---|
| Furnace test (camera inside white uniformly-emitting sphere) | **0.49% energy error** over 2098 samples |
| Cornell box colour bleed | correct — red/green walls tint the white ceiling |
| Glass total internal reflection | present at grazing angles |
| Caustics through transmissive sphere | focused correctly |

It was also the only one whose **prompt carried an objective, self-administered
fail condition**. This is the central finding of the whole session.

---

## 3. Fluid Destruction Sandbox — vs Teardown

| Defect | Caught by | Detail |
|---|---|---|
| **Dead on arrival** | Opening it in a browser with a GPU | `Shader compile: 'sampler3D': No precision specified` — black screen. In GLSL ES 3.00 `sampler2D` has a default precision and **`sampler3D` does not**. One missing line. |
| Explosion positions diverging | Running scenes nobody had run | particle positions reaching **1e34** — unbounded impulse integrating without clamp |
| Rigid bodies falling through the floor | Same | contact normal flipped; solver pushed penetrating bodies *further in* |

**Five of six scenes had never been executed by anyone.** Both solver bugs were
sitting in them. `node --check` was happy with the whole file.

---

## 4. Open World Explorer — vs Breath of the Wild

| Defect | Caught by | Before | After |
|---|---|---|---|
| Grass taller than the player | Measuring blade height as a ratio of the player capsule | **44–152%** of player height | **11–23%** |
| Terrain too flat → overcorrected to spikes | Re-critiquing after the fix | ridge exponent 2.0, no terracing | **1.65**, terracing, flat valley floors |
| Camera/lighting | Visual | spawned inside geometry | fixed |

Systems chain verified end to end, not asserted: fire propagates through
vegetation → generates thermal updraft → paraglider gains altitude. HUD read
**"Glide — THERMAL +13.6m/s"**, and a shrine was then solved by the same
mechanic (*"Shrine solved! Fire climbed the trellis."*).

---

## 5. WebOS Desktop — vs macOS

| Defect | Caught by | Detail |
|---|---|---|
| Entire desktop displaced | `getBoundingClientRect` + `getComputedStyle` dumped at each step | **x = −1138 with `transform: none`** → a *scroll*, not a layout bug. `#win-spaces-row` was 3200px in a 1600px viewport, unclipped; native `scrollIntoView` on focus displaced everything permanently |
| Terminal had no notion of a pipe | Running `ls \| grep txt \| wc -l` | returned **1**, should be **2** — `ls` printed space-separated on one line. Real `ls` emits one entry per line when stdout is not a TTY |
| Mission Control thumbnail overflow | Visual | found by the builder on the rebound |

The builder initially reported **"cannot reproduce"** on the displacement bug.

After: x = 0 in every state; `ls|grep txt|wc -l` → **2**, `ls|wc -l` → **6**,
`grep -c` → **2**.

---

## 6. NES Emulator Studio — vs Mesen

| Defect | Caught by | Before | After |
|---|---|---|---|
| Ran at exactly 2× speed on 120Hz displays | Counting frames over 10 s | **1200** frames/10s | **599** — wall-clock accumulator at 60.0988 Hz + `resetPacing()` |
| Its own Self-Test tab was failing | Clicking a tab nobody had ever clicked | **4 FAILED / 26** — render checks asserted `rom.length === 40976` against a 24592-byte ROM | **26/26, 0 failures** |
| Deprecated ScriptProcessorNode | Review | — | migrated to AudioWorklet |

Both defects lived on paths the builder structurally could not see: hardware it
did not have, and a diagnostic panel it wrote but never opened.

---

## 7. Browser DAW Studio — vs Ableton Live

| Defect | Caught by | Before | After |
|---|---|---|---|
| Every synth track bounced to silence | Capturing the exported blob and decoding it | **RMS 0.0000, peak 0.0000** | **RMS 0.0419, peak 0.9446** |
| Track badge overlapped clip label | Visual | — | fixed |

Root cause: **`OfflineAudioContext` silently drops AudioWorklet
`port.postMessage` sent immediately before `startRendering()`.** The naive fix
is a `setTimeout` before rendering — a race that passes on an idle machine and
fails under load. The correct fix is `flushWorklets()`: ping every worklet,
await a pong on each message port, *then* render.

Verified container: RIFF/WAVE, PCM, 2ch, 48000 Hz, 16-bit, 18.7 s.

---

## 8. Hypersheet — vs Excel

| Defect | Caught by | Detail |
|---|---|---|
| Text clipped at the cell boundary | Typing a long label into A1 with B1 empty | Excel has spilled text into adjacent empty cells since ~1985. It appears in no requirements document, so an agent building from a feature list will never implement it |
| Chart drawn on top of its own data | Inserting a chart | it covered the range it was visualising |
| `quickSort` crash | Builder, on the rebound | found unprompted after receiving two concrete symptoms |
| Missing XLSX importer | Builder, on the rebound | same |

The formula engine — dependency graph, topological recalculation, array
formulas, spill ranges, 200+ functions — was correct on the first pass. Every
defect was in the muscle-memory layer.

---

## 9. Vector Design Studio — vs Figma

| Defect | Caught by | Detail |
|---|---|---|
| Twelve text layers all named `r` | Opening the layers panel | a literal hardcoded `name:'r'` in the demo-document builder loop, **plus** no content-based auto-naming anywhere |
| Stale `app.hover` crash | Builder, on the rebound | deleting a hovered object left a dangling reference; next pointer move threw |

After: layers read "Refund", "Umbrella", "$2,100", "Acme Inc". 34/34 in-browser
checks covering boolean ops, SVG export and multiplayer.

---

## 10. Self-Writing Game Engine — verifies itself

**No defects found by the tumbler — because it tumbles itself.**

| Event | Result |
|---|---|
| Candidate 2 generated | auto-played headlessly, judged **UNWINNABLE**, discarded without ever being displayed |
| Candidate 3 regenerated | **PASSED** |
| Competent scripted agent | completes **85%** of the time |
| Random-input baseline (control) | completes **0%** of the time |

The gap is the evidence: winnable through skill, not winnable by accident.
Playability is not visible in source code — a generated game can be
syntactically perfect, render beautifully, and be mathematically impossible.

---

## Summary

| | Count |
|---|---|
| Artifacts built | 10 |
| Builder sub-agents that self-reported success | 10 |
| Artifacts still broken at that point | **9** |
| Defects catchable by `node --check` / linter / jsdom | **0** |
| Artifacts whose prompt carried an objective fail condition | **1** |
| Artifacts that shipped correct first try | **1 — the same one** |
