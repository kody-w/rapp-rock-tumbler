# The Pattern

Eight rules. Each one exists because a specific bug got past everything else.

---

## 1. Ban prose. Demand a number.

> "It's fixed" is not a result. "Penetration is 0.0000 m at 161 mph" is a result.

If a claim cannot be reduced to a measurement someone actually took, it is not
evidence. Reject it and send it back.

This single rule produced more fixed bugs than every other technique combined.
The mechanism is not that agents lie — it is that "I verified it" and "I ran a
measurement whose result would have differed if it were broken" feel identical
from the inside, and only one of them is verification.

**The bug that taught it.** A driving simulator's builder replied, in full:
*"BUG 8 is fully resolved."* No number. Pushed back for the measurement, the
same agent discovered the fix had not addressed the actual cause at all.

---

## 2. Verify from outside the process under test.

Never let an artifact grade its own homework. The measurement must not share a
failure mode with the thing being measured.

- A DAW says "export complete" → **open the file and compute its RMS.**
- An emulator ships a self-test tab → **click it yourself.**
- A page claims its layout is fine → **read `getBoundingClientRect` from
  outside the page.**
- A renderer looks correct → **compute a histogram over the PNG**, not over
  anything the page hands you.

**The bug that taught it.** A digital audio workstation reported successful
export on every bounce. The exported WAV was digital silence — RMS 0.0000,
peak 0.0000. `OfflineAudioContext` silently drops AudioWorklet
`port.postMessage` sent immediately before `startRendering()`, so every synth
voice rendered with an uninitialised patch. The export function ran perfectly.
It exported nothing.

---

## 3. Prefer a ground-truth invariant to any opinion, including yours.

Where physics or mathematics supplies an exact expected value, use it and stop
asking anyone what they think.

**The furnace test** is the canonical example. Put a camera inside a sphere
that emits uniform radiance *L* with a perfectly white surface (albedo 1.0).
Every pixel must return exactly *L* — a white surface reflects everything and
adds nothing, so bounce count is irrelevant. The scene is a furnace at
equilibrium.

That single number validates BSDF normalisation, the MIS power heuristic,
cosine-weighted hemisphere sampling PDFs, and Russian roulette survival
compensation, all at once.

**Why judgement actively misleads here:** a renderer losing 8% of its energy
still looks beautiful. "Looks photorealistic" is not a correctness claim.

---

## 4. Always run a control arm.

One number usually proves nothing. Ask constantly: *what would I see if this
were broken, and can I distinguish that from what I am seeing now?*

**The example.** A generated game is completed 85% of the time by a competent
scripted agent. Good? Unknowable — until you learn a random-input agent
completes it 0% of the time.

- High skilled **and** high random → the game plays itself. There is no game.
- Low random **and** low skilled → you generated something impossible.
- **The gap is the evidence.**

---

## 5. Open the doors nobody opens.

The highest-yield question in a review is rarely about the code. It is:
**which paths has anybody actually executed?**

**Two bugs that taught it.**

- A physics sandbox shipped six scenes. Exactly **one** had ever been run.
  Opening the other five immediately surfaced explosion positions diverging to
  **1e34** and rigid bodies tunnelling through the floor from a flipped
  contact normal.
- An emulator shipped a **Self-Test tab** — 26 checks, written and never
  clicked. It reported **4 FAILED / 26**. The emulator was fine; the test
  harness asserted `rom.length === 40976` against a 24592-byte ROM. It had
  been failing honestly into an empty room.

---

## 6. When an agent says "cannot reproduce", stop arguing and measure.

Screenshots invite debate. Geometry does not.

**The bug that taught it.** A critic screenshot showed a desktop OS clipped to
~460px with a black void beside it. The builder loaded the same file, saw a
normal desktop, and reported no repro.

Rather than trade screenshots, a probe dumped `getBoundingClientRect` and
`getComputedStyle` at every interaction step. The desktop root sat at
**x = −1138 with `transform: none`.**

That combination *is* the diagnosis. A uniform offset with no transform is not
a layout collapse — **it is a scroll.** `#win-spaces-row` was 3200px wide in a
1600px viewport and unclipped, making the document horizontally scrollable;
the browser's native `scrollIntoView` on focus then displaced the entire UI
permanently.

One measurement ended a disagreement that screenshots could have sustained
indefinitely.

---

## 7. Loop, because the fix breaks something else.

Never accept a fix without re-running the check that caught the original.

**The bug that taught it.** Terrain corrected for being too flat overcorrected
into spiky cones — technically "more dramatic", visually absurd. A single
review pass would have confidently shipped either the pancake or the spikes.
Only re-critiquing *after* each fix converged on the version in between (ridge
exponent 2.0 → 1.65, plus terracing and flat valley floors).

---

## 8. Distrust the categories of bug that only exist at runtime.

Static analysis is real but narrow. `node --check` is perfectly happy with:

- **a shader that cannot compile.** In GLSL ES 3.00, `sampler2D` has a default
  precision but **`sampler3D` does not**. A missing `precision highp sampler3D;`
  is a hard compile failure. The file was well-formed, well-structured, and
  rendered a black screen.
- **an audio graph that renders silence** (see rule 2).
- **a frame loop that runs at double speed on hardware you do not own.** Pacing
  emulation off `requestAnimationFrame` *tick count* rather than the wall clock
  is correct-by-accident at 60Hz and exactly 2× wrong at 120Hz. Measured:
  1200 frames per 10s → 599 after switching to a wall-clock accumulator at the
  NES's real 60.0988 Hz.

---

## Corollaries worth keeping

**Find the root cause before proposing three fixes.** A driving simulator
showed a fan of ~15 dark radial streaks that read unmistakably as broken
skid-mark decals. The builder cleared the skid buffer; `skidActive()` returned
0; the fan remained.

Walking the track's 1600 centreline points directly:

| metric | value |
|---|---|
| median per-point heading change | 0.378° |
| **max per-point heading change** | **7.28°** |
| indices holding the six worst values | **1594–1599, 0** — the loop seam |
| median segment length | 0.743 m |
| **min segment length** | **0.194 m** |

The spline was not C1-continuous where it closed. That one defect produced the
"skid" fan (asphalt seams compressing at the cusp), a jagged notch in the
road/grass boundary (edge offset exceeding the local radius of curvature and
folding back on itself), **and** a Reset that spawned inside a 40° bend. Three
symptoms, one cause. After arc-length resampling: max turn **2.12°**, segments
**0.648 / 0.649 / 0.650 m**.

**Scale bugs are invisible to judgement and obvious to a ruler.** Grass
rendering at 44–152% of player height read as "lush" to every reviewer until
someone measured it against the player capsule. Correct is 11–23%.

**Seed content is part of the product.** A design tool opening to a layers
panel where twelve layers are all named `r` has failed before the user draws
anything, however good the bezier engine is.

**Give credit with the same rigor you use to reject.** An agent told *"three of
four are confirmed fixed, here are my numbers, the fourth is still broken and
here is why"* does markedly better work than one that is only ever criticised.

**A critic must be able to retract.** During this session the tumbler suspected
a vehicle of a yaw defect. Measurement showed the car turned **0.0°** while the
track curved **21°** beneath it. The physics was right and the suspicion was
wrong. Said so immediately, moved on. A critic who cannot be wrong is just
noise.
