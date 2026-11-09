# JB Automations — 3D fly-over (Remotion + WebGL2)

14.5s · 1440×1152 · 60fps (870 frames) · three.js via @remotion/three

## Run it
```bash
npm install
npm run start      # Remotion Studio: scrub the timeline live
npm run still      # one PNG at 5.5s (frame 330) to check the featured-card lift
npm run render     # out/jb-flyover.mp4 (H.264, crf 16)
```
Needs Node 18+ and a machine that can run headless Chrome with GPU/ANGLE.
If the render shows black frames, try `--gl=swangle` (software) or `--gl=egl` instead of `--gl=angle`.
Add `--concurrency=2` if your machine runs out of memory (each frame uploads large canvas textures).

## Where things live
| File | What it does |
|---|---|
| `src/content.ts` | ALL text: brand, closing line, italic tail, chips, steps, SMS, row cards. Edit this. |
| `src/timeline.ts` | `seek(t)`: the single time → scene-state mapping (camera, lifts, morph, typewriter) |
| `src/cards.ts` | Canvas drawing for every card + the per-frame end card |
| `src/Scene.tsx` | Three.js scene: reads `seek(frame / fps)` and positions everything |

## Cue sheet (seconds)
| Time | Event |
|---|---|
| 0 – 8.2 | Continuous glide down the page, camera always looking up it |
| 1.35 | Key lift 1: three stat chips stand up (20° tilt, staggered 0.09s) |
| 3.4 | SMS bubbles lift off the scheduler |
| 5.45 | Key lift 2: first card in the lower row rises 112px and tilts 30° toward the lens |
| 8.2 – 9.47 | Pull up overhead |
| 9.47 – 11.4 | Dive straight back into the hero block |
| 10.2 – 11.3 | Hero cross-fades into the end card |
| 11.2 | White "JB Automations" pill fades in |
| 11.9 – 13.4 | Typewriter: closing line |
| 13.45 – 14.4 | Typewriter: italic tail |

## Claims in the video — read before publishing
* The "Average reduction in no shows" chip shows a number only when you set
  `MEASURED_NO_SHOW_REDUCTION` in `content.ts` to a figure you measured with real clients.
  Until then it says "Fewer no shows with automatic reminders".
* The lifted card defaults to the post-appointment review text message (a product feature).
  To show client testimonials instead, set `ROW_MODE = 'testimonials'` and add real quotes with
  `verified: true`, only for clients who agreed to be quoted. Unverified entries are skipped.
