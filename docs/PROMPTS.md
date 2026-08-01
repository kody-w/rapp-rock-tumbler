# The Ten Seed Prompts

Each prompt follows the same shape:

1. an audacious build, stated without hedging
2. **a named real-world benchmark** — not "high quality", but *Gran Turismo 7*
3. sub-agent fan-out, one per subsystem
4. a **separate** harsh critic doing a blind side-by-side
5. **an objective fail condition the critic administers to itself**
6. `/loop` until the condition passes
7. `ultracode`

Item 5 is the load-bearing one, and this is the finding worth taking away:

> Of the ten, **exactly one shipped correct on the first attempt with zero
> correction loops** — the path tracer. It was **the only prompt that named a
> measurement.** The other nine said "make it AAA quality" and all nine
> reported success while broken.
>
> **If you can name the measurement, put it in the prompt, not in the review.**

---

## The shared scaffold

Every prompt ends with some variant of:

```
Fan out sub-agents and have sub-agents tackle each one individually so that
the <thing> is utterly perfect. You should /loop on each item and have a
separate sub-agent check it VISUALLY in a real browser. That separate
sub-agent should be a really harsh critic, and if it doesn't meet the bar,
it should keep going.

Don't stop until each sub-agent is utterly wowed with the quality when
compared with the actual <benchmark>. It should literally compare them side
by side blind and say which one looks better. ONE self-contained HTML file.
/loop until it's utterly perfect. Fan out sub-agents and ultracode.
```

What varies — and what actually determines the outcome — is the fail
condition each critic is handed.

---

## 1. Apex Driving Simulator — *vs Gran Turismo 7 / Assetto Corsa*

> Real Pacejka-style combined slip. Weight transfer under braking and
> cornering. A proper 6-speed gearbox with real ratios and a torque curve.
> ABS, traction control and stability control that each measurably change lap
> time. Telemetry traces. A ghost lap.
>
> **The critic is not allowed to accept prose. Every claim must be a number it
> measured itself:** sample the road pixels and prove the tarmac is neutral
> grey and not green. Drive into a barrier at speed and prove the penetration
> depth is zero. Measure the centreline spline point by point and prove there
> is no discontinuity. If the critic cannot produce the number, the fix is
> rejected.

## 2. WebGPU Path Tracer — *vs Blender Cycles* ← the one that worked

> A real Disney-style principled BSDF. Multiple importance sampling. A BVH.
> Russian roulette with correct survival-probability compensation. Progressive
> accumulation. Depth of field. ACES tonemapping.
>
> **Do not have the critic judge this one by eye — a path tracer can look
> beautiful and still be physically wrong. Make it run the FURNACE TEST:** put
> the camera inside a uniformly emitting sphere with albedo 1.0. Every pixel
> must converge to exactly the emitter's radiance. Darker means you are losing
> energy in the BSDF or the MIS weights; brighter means you are gaining energy
> that doesn't exist. **Report the percentage error. Anything above about 1%
> means the light transport is wrong.**

*Result: 0.49%. Zero correction loops. The only one.*

## 3. Fluid Destruction Sandbox — *vs Teardown / Houdini*

> Voxel structures with real structural integrity — cut a support and the load
> path recomputes. GPU smoke and fire on a 3D grid. SPH fluid. Cloth. Soft
> bodies. Explosions that couple to all of it.
>
> **The critic must actually open it in a browser and confirm it renders** — a
> shader that fails to compile produces a black screen and passes every static
> check ever written. **Then run EVERY scene, not just the default.** Ask which
> scenes have actually been executed; any scene nobody has run is a scene with
> unknown bugs in it. Print particle positions and confirm they are finite.

## 4. Open World Explorer — *vs Breath of the Wild*

> Procedural terrain with real erosion. Climb anything, with a stamina economy.
> A paraglider. And SYSTEMS THAT COMPOSE: fire spreads through vegetation,
> burning vegetation creates a thermal, the thermal gives you lift. Puzzles
> solvable by combining systems I never scripted.
>
> **Do not let the critic judge scale by eye. Make it MEASURE things against
> the player character** — how tall is the grass relative to the player
> capsule. "Looks lush" is not an acceptable report. And make it play the
> systems chain end to end, quoting the numbers off the HUD.

## 5. WebOS Desktop — *vs macOS*

> Draggable, resizable windows with real z-order. A dock with magnification. A
> menu bar. Mission Control. Virtual desktops. A Spotlight launcher. A file
> manager on a real file system. A terminal with a working shell — and I mean
> working: pipes, redirection, globbing.
>
> **The critic must not accept "works on my machine".** If it sees something
> wrong in a screenshot, it must prove what is wrong by measuring the DOM —
> dump `getBoundingClientRect` and `getComputedStyle` and show the numbers.
> And it must actually exercise the terminal: run `ls | grep txt | wc -l` and
> check the count is right, not just that something printed.

## 6. NES Emulator Studio — *vs Mesen*

> A cycle-accurate 6502 including unofficial opcodes. A scanline-accurate PPU
> with correct sprite-zero hit. A full APU through an AudioWorklet. Mappers.
> Save states. Rewind. A real debugger.
>
> **The critic must test the paths the builder would never test. Check frame
> pacing on a HIGH REFRESH RATE display, not just 60Hz** — an emulator that
> paces off requestAnimationFrame ticks will run at double speed on a 120Hz
> monitor and the builder will never notice. Count actual frames over ten
> seconds and prove the number. **And open every panel and tab the emulator
> ships with, including its own self-test, and report what they say.**

## 7. Browser DAW Studio — *vs Ableton Live*

> Multi-track arrange. A piano roll with velocity. Polyphonic synths in
> AudioWorklets, not ScriptProcessor. A sampler. Per-track effect chains. A
> mixer with sends. Automation. WAV bounce and stem export.
>
> **The critic must actually export a file and decode it. It is not allowed to
> trust an "export complete" message.** It has to parse the WAV container,
> check sample rate and bit depth, and **compute RMS and peak amplitude to
> prove the file is not silence.**

## 8. Hypersheet — *vs Microsoft Excel*

> A dependency graph with topological recalculation, not a naive
> re-evaluate-everything loop. 200+ functions. Array formulas with spill
> ranges. Circular reference detection. Pivot tables. Charts. Multi-sheet with
> cross-sheet references. XLSX import/export. Responsive at 100,000 rows.
>
> **The critic must DRIVE IT LIKE AN EXCEL USER, not read the feature list.**
> Type a long label into a cell whose neighbour is empty and check it spills.
> Insert a chart and check it isn't covering the data it charts. **The bugs
> that matter here are the ones in muscle memory, and they will not show up in
> a spec.**

## 9. Vector Design Studio — *vs Figma*

> A real pen tool with bezier node editing. Actual boolean path operations on
> real curves. Auto-layout with constraints. Components with instance
> overrides. An infinite canvas. SVG and PNG export. Live multiplayer.
>
> **The critic must open the app the way a first-time user does and judge what
> it actually sees — including the demo document and the layers panel. Seed
> content is part of the product.** If the tool opens to something that looks
> broken, it has failed before anyone draws a line, no matter how good the
> engine is.

## 10. Self-Writing Game Engine — *vs itself*

> An engine where I describe a game in plain English and it synthesises the
> entities, systems, physics, win/loss conditions and rendering.
>
> **THE ENGINE MUST VERIFY ITS OWN OUTPUT BEFORE SHOWING IT TO ME.** After
> generating a game it should play it headlessly with a scripted competent
> agent and determine whether it is actually winnable. If not, throw it away
> and regenerate. **And it must run a CONTROL:** a random-input baseline
> playing the same game. If random wins as often as competent, the game plays
> itself and is worthless. If neither can win, it's impossible. **Report both
> numbers. The GAP is the evidence.**
>
> The critic should specifically verify that the self-correction loop
> **actually rejects** a bad game. If it has never rejected anything, the
> verifier is decorative.

*Result: candidate 2 generated → auto-played → judged UNWINNABLE → discarded.
Candidate 3 passed at 85% skilled / 0% random.*

---

## What to copy

Not the scope. The **fail condition**.

"Make it AAA quality" is a bar that can be argued into, and nine out of nine
times it was. "Energy error must be under 1%, report the number" cannot be
argued with at all.
