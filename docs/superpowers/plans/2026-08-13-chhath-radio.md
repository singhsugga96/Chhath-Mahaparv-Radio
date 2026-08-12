# Chhath Radio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> ### ⚠️ REVISION 2 IS IN FORCE — read this before starting
>
> The scope changed after this plan was first written: the site is now
> **journey-first**, a scrolling guide to how Chhath is performed, with the sky
> driven by **scroll position** instead of the clock.
>
> - **Tasks 1–5 below are unchanged and still correct.** Build them as written.
>   The pure modules do not care where their `minutes` value comes from.
> - **Task 5's `TRACKS` array is now populated** — see Revision 2, Task 5R.
> - **Tasks 6–11 below are SUPERSEDED.** Do not build them. Use the replacements
>   in the `## Revision 2` section at the end of this document.
> - **Two new tasks** (`narrative.ts` and `content/ritual.ts`) are specified in
>   Revision 2 and have no equivalent above.
>
> Spec of record: `docs/specs/2026-08-13-chhath-radio-design.md` (revised).

**Goal:** Build a single-screen Astro site that plays Chhath Puja songs from YouTube while a CSS/SVG ghat scene moves continuously through the sun's daily arc.

**Architecture:** Static Astro output with one client-side script island. All time-and-color logic lives in four pure TypeScript modules (`color`, `sky`, `sun`, `playlist`) that are unit-tested with no DOM and no network. A single stateful module (`youtube`) wraps the YouTube IFrame Player API. The scene and the player are deliberately decoupled — neither knows about the other — so audio failure degrades the page instead of breaking it.

**Tech Stack:** Astro 5 (static output), TypeScript, Vitest. No UI framework, no CSS framework, no runtime dependencies.

## Global Constraints

These apply to every task. Do not restate them per-task; they are always in force.

- **Project root:** `/Users/surajsingh/Documents/chhath-radio`
- **Spec:** `docs/specs/2026-08-13-chhath-radio-design.md` — read it before starting
- **Zero runtime dependencies.** `astro`, `typescript`, and `vitest` are devDependencies. Nothing ships to the browser except Astro's own output and our code. Do not add a color library, a date library, or a UI framework.
- **Color interpolation is Cartesian Oklab (`L, a, b`), never sRGB, never Oklch.** sRGB midpoints go grey; Oklch introduces hue-wraparound ambiguity.
- **All times are minutes since local midnight**, integer `0`–`1439`. Never pass `Date` objects into pure functions — pass minutes. This is what makes them testable.
- **`lib/color.ts`, `lib/sky.ts`, `lib/sun.ts`, `lib/playlist.ts` must stay pure.** No `Date.now()`, no `Math.random()`, no DOM, no `window`. Callers inject time and randomness.
- **Never fabricate YouTube video ids.** Real ids come from the user's playlist. Placeholders stay empty and explicitly marked.
- **`prefers-reduced-motion: reduce` must freeze the sun disc and diya flicker.** The color ramp continues (it changes far too slowly to read as motion).
- **Silhouette color is a CSS constant, not an interpolated keyframe channel.** A silhouette is a silhouette at every hour.
- **Commit after every task**, using the message given in that task's final step.

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | Scripts and devDependencies |
| `astro.config.mjs` | Static output config |
| `tsconfig.json` | Strict TypeScript |
| `vitest.config.ts` | Test config for `src/lib/**` only |
| `src/lib/color.ts` | **Pure.** Hex ↔ Oklab conversion, channel lerp |
| `src/lib/sky.ts` | **Pure.** 24h keyframe table, `paletteAt(minutes)` |
| `src/lib/sun.ts` | **Pure.** `discAt(minutes)` → sun/moon screen position |
| `src/lib/playlist.ts` | **Pure.** `Track` type, `shuffle`, `playableTracks` |
| `src/lib/youtube.ts` | **Stateful.** IFrame API wrapper, dead-id skip logic |
| `src/components/Scene.astro` | Inline SVG silhouette stack, consumes CSS vars |
| `src/components/Header.astro` | Local clock, outbound links |
| `src/components/NowPlaying.astro` | Track text, controls, 200×200 player mount |
| `src/components/EntryGate.astro` | "tap to begin" veil |
| `src/pages/index.astro` | Composes the screen |
| `src/scripts/boot.ts` | Client island: ticks the scene, wires gate → player |
| `src/styles/global.css` | CSS vars, layout, reduced-motion, diya flicker |

Files that change together live together. The four pure modules are split by responsibility rather than layer, because each has a genuinely different reason to change: `color` changes if the color science is wrong, `sky` if the art direction changes, `sun` if the arc geometry changes, `playlist` if track handling changes.

---

## Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `src/lib/smoke.test.ts` (deleted at the end of this task)

**Interfaces:**
- Consumes: nothing — this is the first task
- Produces: working `npm test` and `npm run build`. Every later task depends on both existing.

- [ ] **Step 1: Initialise the project directory**

The directory and `docs/` already exist. Run from the project root:

```bash
cd /Users/surajsingh/Documents/chhath-radio
git init
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install --save-dev astro typescript vitest
```

Astro 5.x is expected. If npm resolves a major version other than 5, stop and report it rather than adapting the plan silently.

- [ ] **Step 3: Write the config files**

`package.json` — replace the generated `scripts` block with exactly this, and remove the `"main"` field:

```json
{
  "name": "chhath-radio",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
});
```

`tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/lib/**/*.test.ts'],
    environment: 'node',
  },
});
```

`environment: 'node'` is correct and deliberate — every tested module is pure and must never touch the DOM. If a future test needs jsdom, that is a signal the module under test has lost its purity.

`.gitignore`:

```
node_modules/
dist/
.astro/
.DS_Store
```

- [ ] **Step 4: Write a smoke test to prove the harness runs**

`src/lib/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('test harness', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run the test and the build**

```bash
npm test
```
Expected: 1 test passes.

```bash
npm run build
```
Expected: build succeeds. Astro will warn that no pages exist — that is fine, `src/pages/index.astro` arrives in Task 10.

- [ ] **Step 6: Delete the smoke test and commit**

```bash
rm src/lib/smoke.test.ts
git add -A
git commit -m "chore: scaffold Astro project with Vitest harness"
```

---

## Task 2: Oklab color conversion and interpolation

**Files:**
- Create: `src/lib/color.ts`
- Test: `src/lib/color.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface Oklab { L: number; a: number; b: number }`
  - `hexToOklab(hex: string): Oklab`
  - `oklabToHex(c: Oklab): string` — returns lowercase `#rrggbb`
  - `mixOklab(from: string, to: string, t: number): string` — `t` clamped to `0`–`1`, returns lowercase `#rrggbb`

`mixOklab` is the only function `sky.ts` calls. The other three are exported for testing and for any future use.

- [ ] **Step 1: Write the failing tests**

`src/lib/color.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { hexToOklab, mixOklab, oklabToHex } from './color';

describe('hexToOklab', () => {
  it('maps white to L=1 with no chroma', () => {
    const { L, a, b } = hexToOklab('#ffffff');
    expect(L).toBeCloseTo(1, 3);
    expect(a).toBeCloseTo(0, 3);
    expect(b).toBeCloseTo(0, 3);
  });

  it('maps black to L=0', () => {
    expect(hexToOklab('#000000').L).toBeCloseTo(0, 3);
  });

  it('accepts hex without a leading hash and is case insensitive', () => {
    expect(hexToOklab('FFFFFF').L).toBeCloseTo(1, 3);
  });
});

describe('oklabToHex', () => {
  it('round-trips a saturated color', () => {
    expect(oklabToHex(hexToOklab('#e8613c'))).toBe('#e8613c');
  });

  it('round-trips a dark blue', () => {
    expect(oklabToHex(hexToOklab('#0b1026'))).toBe('#0b1026');
  });

  it('clamps out-of-gamut values instead of emitting invalid hex', () => {
    const hex = oklabToHex({ L: 2, a: 0.5, b: 0.5 });
    expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});

describe('mixOklab', () => {
  it('returns the endpoints exactly at t=0 and t=1', () => {
    expect(mixOklab('#0b1026', '#e8613c', 0)).toBe('#0b1026');
    expect(mixOklab('#0b1026', '#e8613c', 1)).toBe('#e8613c');
  });

  it('clamps t outside 0..1', () => {
    expect(mixOklab('#0b1026', '#e8613c', -3)).toBe('#0b1026');
    expect(mixOklab('#0b1026', '#e8613c', 9)).toBe('#e8613c');
  });

  it('always returns valid six-digit hex', () => {
    for (let i = 0; i <= 10; i++) {
      expect(mixOklab('#3a2a5e', '#ffb03a', i / 10)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  // The reason this module exists. Mixing a warm orange with a cool violet
  // in sRGB yields a desaturated grey-brown midpoint. In Oklab the midpoint
  // stays colorful. We assert the midpoint is more saturated than the naive
  // sRGB average of the same two endpoints.
  it('keeps the midpoint more saturated than a naive sRGB average', () => {
    const warm = '#e8613c';
    const cool = '#3a2a5e';
    const mid = mixOklab(warm, cool, 0.5);

    const chroma = (hex: string): number => {
      const { a, b } = hexToOklab(hex);
      return Math.hypot(a, b);
    };

    // Naive sRGB midpoint of the same endpoints.
    const srgbMid =
      '#' +
      [1, 3, 5]
        .map((i) => {
          const x = parseInt(warm.slice(i, i + 2), 16);
          const y = parseInt(cool.slice(i, i + 2), 16);
          return Math.round((x + y) / 2)
            .toString(16)
            .padStart(2, '0');
        })
        .join('');

    expect(chroma(mid)).toBeGreaterThan(chroma(srgbMid));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/color.test.ts
```
Expected: FAIL — cannot resolve `./color`.

- [ ] **Step 3: Write the implementation**

`src/lib/color.ts`. The matrices are Björn Ottosson's published Oklab transform; do not attempt to simplify or re-derive them.

```ts
/** A color in the Oklab perceptual color space. */
export interface Oklab {
  /** Perceptual lightness, 0 (black) to 1 (white). */
  L: number;
  /** Green–red axis. */
  a: number;
  /** Blue–yellow axis. */
  b: number;
}

/** Expands one sRGB channel (0-255) to linear-light 0..1. */
function srgbToLinear(channel: number): number {
  const x = channel / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}

/** Compresses one linear-light channel (0..1) back to sRGB 0-255, clamped. */
function linearToSrgb(x: number): number {
  const c = x <= 0.0031308 ? x * 12.92 : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/**
 * Parses a hex color into Oklab.
 * @param hex Six-digit hex, with or without a leading `#`, any case.
 * @returns The color in Oklab.
 */
export function hexToOklab(hex: string): Oklab {
  const h = hex.replace('#', '');
  const r = srgbToLinear(parseInt(h.slice(0, 2), 16));
  const g = srgbToLinear(parseInt(h.slice(2, 4), 16));
  const b = srgbToLinear(parseInt(h.slice(4, 6), 16));

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/**
 * Converts an Oklab color back to a hex string, clamping out-of-gamut results.
 * @param c The Oklab color.
 * @returns Lowercase six-digit hex including the leading `#`.
 */
export function oklabToHex(c: Oklab): string {
  const l_ = c.L + 0.3963377774 * c.a + 0.2158037573 * c.b;
  const m_ = c.L - 0.1055613458 * c.a - 0.0638541728 * c.b;
  const s_ = c.L - 0.0894841775 * c.a - 1.291485548 * c.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
  const g = linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
  const b = linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);

  return (
    '#' +
    [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
  );
}

/**
 * Interpolates between two hex colors through Oklab space.
 * @param from Hex color returned at `t <= 0`.
 * @param to Hex color returned at `t >= 1`.
 * @param t Position between the two, clamped to 0..1.
 * @returns Lowercase six-digit hex including the leading `#`.
 */
export function mixOklab(from: string, to: string, t: number): string {
  const k = Math.min(1, Math.max(0, t));
  const x = hexToOklab(from);
  const y = hexToOklab(to);
  return oklabToHex({
    L: x.L + (y.L - x.L) * k,
    a: x.a + (y.a - x.a) * k,
    b: x.b + (y.b - x.b) * k,
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/color.test.ts
```
Expected: PASS, all 10 tests.

If the round-trip tests fail by one bit on a channel, do not add a tolerance to make them pass — a correct implementation round-trips these values exactly. Re-check the matrix constants against the code above.

- [ ] **Step 5: Commit**

```bash
git add src/lib/color.ts src/lib/color.test.ts
git commit -m "feat: add Oklab color conversion and interpolation"
```

---

## Task 3: Sky keyframe timeline

**Files:**
- Create: `src/lib/sky.ts`
- Test: `src/lib/sky.test.ts`

**Interfaces:**
- Consumes: `mixOklab` from `src/lib/color.ts`
- Produces:
  - `interface Palette { skyTop: string; skyHorizon: string; water: string; diyaGlow: number }`
  - `interface Keyframe extends Palette { minutes: number; stage: string }`
  - `KEYFRAMES: readonly Keyframe[]` — sorted ascending by `minutes`
  - `paletteAt(minutes: number): Palette`

- [ ] **Step 1: Write the failing tests**

`src/lib/sky.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { KEYFRAMES, paletteAt } from './sky';

const HEX = /^#[0-9a-f]{6}$/;

describe('KEYFRAMES', () => {
  it('is sorted ascending by minutes', () => {
    const mins = KEYFRAMES.map((k) => k.minutes);
    expect(mins).toEqual([...mins].sort((a, b) => a - b));
  });

  it('starts at midnight and stays within the day', () => {
    expect(KEYFRAMES[0].minutes).toBe(0);
    expect(KEYFRAMES.at(-1)!.minutes).toBeLessThan(1440);
  });

  it('includes both arghya stages at their ritual times', () => {
    const usha = KEYFRAMES.find((k) => k.stage === 'Usha Arghya');
    const sandhya = KEYFRAMES.find((k) => k.stage === 'Sandhya Arghya');
    expect(usha?.minutes).toBe(370); // 06:10
    expect(sandhya?.minutes).toBe(1035); // 17:15
  });
});

describe('paletteAt', () => {
  it('returns a keyframe exactly when the time is exactly on it', () => {
    for (const k of KEYFRAMES) {
      expect(paletteAt(k.minutes)).toEqual({
        skyTop: k.skyTop,
        skyHorizon: k.skyHorizon,
        water: k.water,
        diyaGlow: k.diyaGlow,
      });
    }
  });

  it('returns valid hex and an in-range glow at every minute of the day', () => {
    for (let m = 0; m < 1440; m++) {
      const p = paletteAt(m);
      expect(p.skyTop).toMatch(HEX);
      expect(p.skyHorizon).toMatch(HEX);
      expect(p.water).toMatch(HEX);
      expect(p.diyaGlow).toBeGreaterThanOrEqual(0);
      expect(p.diyaGlow).toBeLessThanOrEqual(1);
    }
  });

  it('interpolates strictly between the bracketing keyframes', () => {
    // 07:00 sits between Usha Arghya (370) and Morning (480).
    const mid = paletteAt(420);
    expect(mid.skyTop).not.toBe(paletteAt(370).skyTop);
    expect(mid.skyTop).not.toBe(paletteAt(480).skyTop);
  });

  it('wraps continuously across midnight', () => {
    // 23:59 must be very close to 00:00, not snapped to the last keyframe.
    const before = paletteAt(1439);
    const atMidnight = paletteAt(0);
    expect(before.skyTop).toBe(atMidnight.skyTop);
    expect(before.diyaGlow).toBeCloseTo(atMidnight.diyaGlow, 2);
  });

  it('holds full diya glow through the night', () => {
    expect(paletteAt(0).diyaGlow).toBe(1);
    expect(paletteAt(1200).diyaGlow).toBe(1);
  });

  it('extinguishes the diyas in full daylight', () => {
    expect(paletteAt(480).diyaGlow).toBe(0);
    expect(paletteAt(720).diyaGlow).toBe(0);
  });

  it('normalises out-of-range and fractional minutes', () => {
    expect(paletteAt(1440)).toEqual(paletteAt(0));
    expect(paletteAt(-60)).toEqual(paletteAt(1380));
    expect(paletteAt(370.6).skyTop).toMatch(HEX);
  });
});
```

Note on the midnight-wrap test: because the 20:00 and 00:00 keyframes carry identical palettes, interpolating between them yields that same palette at every minute in between, so `paletteAt(1439).skyTop` equals `paletteAt(0).skyTop` exactly. That is the correct expectation, and it is what makes the seam invisible.

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/sky.test.ts
```
Expected: FAIL — cannot resolve `./sky`.

- [ ] **Step 3: Write the implementation**

`src/lib/sky.ts`. Colors are copied verbatim from the spec's keyframe table.

```ts
import { mixOklab } from './color';

/** Resolved scene colors for one instant. */
export interface Palette {
  /** Color at the top of the sky gradient. */
  skyTop: string;
  /** Color at the horizon end of the sky gradient. */
  skyHorizon: string;
  /** Color of the river surface. */
  water: string;
  /** Diya opacity, 0 (unlit) to 1 (full). */
  diyaGlow: number;
}

/** A palette anchored to a time of day. */
export interface Keyframe extends Palette {
  /** Minutes since local midnight, 0..1439. */
  minutes: number;
  /** Human-readable stage name. */
  stage: string;
}

/**
 * The 24-hour ramp. The two arghya stages are the emotional peaks and carry the
 * most saturated treatment. The 20:00 and 00:00 entries are deliberately
 * identical so the wrap across midnight is invisible.
 */
export const KEYFRAMES: readonly Keyframe[] = [
  { minutes: 0,    stage: 'Night',          skyTop: '#0b1026', skyHorizon: '#1b2a4a', water: '#0a1a2e', diyaGlow: 1 },
  { minutes: 270,  stage: 'Pre-dawn',       skyTop: '#1e2a44', skyHorizon: '#4a4a6a', water: '#1a2438', diyaGlow: 0.75 },
  { minutes: 370,  stage: 'Usha Arghya',    skyTop: '#2e4a7a', skyHorizon: '#ff7a3c', water: '#c97a4e', diyaGlow: 0.3 },
  { minutes: 480,  stage: 'Morning',        skyTop: '#4a8fd6', skyHorizon: '#bfe0f5', water: '#7fa8c4', diyaGlow: 0 },
  { minutes: 720,  stage: 'Midday',         skyTop: '#3b82c4', skyHorizon: '#cfe6f7', water: '#8fb6d0', diyaGlow: 0 },
  { minutes: 930,  stage: 'Afternoon',      skyTop: '#5a8fc0', skyHorizon: '#f2d9a8', water: '#a89478', diyaGlow: 0 },
  { minutes: 1035, stage: 'Sandhya Arghya', skyTop: '#3a2a5e', skyHorizon: '#e8613c', water: '#b85a3c', diyaGlow: 0.25 },
  { minutes: 1110, stage: 'Dusk',           skyTop: '#221a3a', skyHorizon: '#7a4a5e', water: '#3a2a38', diyaGlow: 0.7 },
  { minutes: 1200, stage: 'Night',          skyTop: '#0b1026', skyHorizon: '#1b2a4a', water: '#0a1a2e', diyaGlow: 1 },
];

const DAY = 1440;

/**
 * Resolves the scene palette for a given time of day, interpolating in Oklab
 * between the two bracketing keyframes.
 * @param minutes Minutes since local midnight. Values outside 0..1439 and
 *   fractional values are normalised rather than rejected.
 * @returns The interpolated palette.
 */
export function paletteAt(minutes: number): Palette {
  const m = ((minutes % DAY) + DAY) % DAY;

  // Find the last keyframe at or before m. Because KEYFRAMES[0].minutes is 0
  // and m >= 0, this always finds one.
  let i = 0;
  for (let k = KEYFRAMES.length - 1; k >= 0; k--) {
    if (KEYFRAMES[k].minutes <= m) {
      i = k;
      break;
    }
  }

  const from = KEYFRAMES[i];
  const isLast = i === KEYFRAMES.length - 1;

  // Past the final keyframe we wrap to the first one, treating it as sitting at
  // minute 1440 so the span length is correct.
  const to = isLast ? KEYFRAMES[0] : KEYFRAMES[i + 1];
  const toMinutes = isLast ? DAY : to.minutes;

  const span = toMinutes - from.minutes;
  const t = span === 0 ? 0 : (m - from.minutes) / span;

  return {
    skyTop: mixOklab(from.skyTop, to.skyTop, t),
    skyHorizon: mixOklab(from.skyHorizon, to.skyHorizon, t),
    water: mixOklab(from.water, to.water, t),
    diyaGlow: from.diyaGlow + (to.diyaGlow - from.diyaGlow) * t,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/sky.test.ts
```
Expected: PASS, all 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sky.ts src/lib/sky.test.ts
git commit -m "feat: add 24-hour sky keyframe timeline"
```

---

## Task 4: Sun and moon arc geometry

**Files:**
- Create: `src/lib/sun.ts`
- Test: `src/lib/sun.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `SUNRISE_MINUTES = 370`, `SUNSET_MINUTES = 1035` (exported consts, matching the arghya keyframes in `sky.ts`)
  - `interface Disc { kind: 'sun' | 'moon'; x: number; y: number; altitude: number }`
  - `discAt(minutes: number): Disc`

`x` and `y` are percentages `0`–`100` for direct use in CSS. `x` runs left to right across the arc; `y` is measured from the top of the viewport, so a **smaller `y` is higher in the sky**. `altitude` is `0` at the horizon and `1` at peak.

- [ ] **Step 1: Write the failing tests**

`src/lib/sun.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { SUNRISE_MINUTES, SUNSET_MINUTES, discAt } from './sun';

describe('discAt', () => {
  it('shows the sun between sunrise and sunset', () => {
    expect(discAt(SUNRISE_MINUTES + 1).kind).toBe('sun');
    expect(discAt(720).kind).toBe('sun');
    expect(discAt(SUNSET_MINUTES - 1).kind).toBe('sun');
  });

  it('shows the moon at night', () => {
    expect(discAt(120).kind).toBe('moon');
    expect(discAt(1300).kind).toBe('moon');
  });

  it('sits on the horizon exactly at sunrise and sunset', () => {
    expect(discAt(SUNRISE_MINUTES).altitude).toBeCloseTo(0, 6);
    expect(discAt(SUNSET_MINUTES).altitude).toBeCloseTo(0, 6);
  });

  it('peaks at solar noon, midway between sunrise and sunset', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    expect(discAt(noon).altitude).toBeCloseTo(1, 6);
    // 12:00 is close to but not exactly solar noon here, so still very high.
    expect(discAt(720).altitude).toBeGreaterThan(0.99);
  });

  it('rises monotonically from sunrise to solar noon', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    let previous = -1;
    for (let m = SUNRISE_MINUTES; m <= noon; m += 5) {
      const { altitude } = discAt(m);
      expect(altitude).toBeGreaterThan(previous);
      previous = altitude;
    }
  });

  it('keeps altitude in 0..1 and position in 0..100 all day', () => {
    for (let m = 0; m < 1440; m++) {
      const d = discAt(m);
      expect(d.altitude).toBeGreaterThanOrEqual(0);
      expect(d.altitude).toBeLessThanOrEqual(1);
      expect(d.x).toBeGreaterThanOrEqual(0);
      expect(d.x).toBeLessThanOrEqual(100);
      expect(d.y).toBeGreaterThanOrEqual(0);
      expect(d.y).toBeLessThanOrEqual(100);
    }
  });

  it('maps higher altitude to a smaller y', () => {
    const noon = (SUNRISE_MINUTES + SUNSET_MINUTES) / 2;
    expect(discAt(noon).y).toBeLessThan(discAt(SUNRISE_MINUTES).y);
  });

  it('travels left to right across the daytime arc', () => {
    expect(discAt(SUNRISE_MINUTES).x).toBeCloseTo(0, 6);
    expect(discAt(SUNSET_MINUTES).x).toBeCloseTo(100, 6);
    expect(discAt(600).x).toBeLessThan(discAt(900).x);
  });

  it('gives the moon its own continuous arc across midnight', () => {
    // The night arc runs sunset -> midnight -> sunrise without a jump.
    const justBefore = discAt(1439);
    const justAfter = discAt(0);
    expect(Math.abs(justAfter.x - justBefore.x)).toBeLessThan(1);
    expect(Math.abs(justAfter.altitude - justBefore.altitude)).toBeLessThan(0.05);
  });

  it('normalises out-of-range minutes', () => {
    expect(discAt(1440)).toEqual(discAt(0));
    expect(discAt(-60)).toEqual(discAt(1380));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/sun.test.ts
```
Expected: FAIL — cannot resolve `./sun`.

- [ ] **Step 3: Write the implementation**

`src/lib/sun.ts`:

```ts
/** Minutes since midnight at which the sun crosses the horizon rising. */
export const SUNRISE_MINUTES = 370; // 06:10, Usha Arghya

/** Minutes since midnight at which the sun crosses the horizon setting. */
export const SUNSET_MINUTES = 1035; // 17:15, Sandhya Arghya

/** The celestial body currently on screen, and where to draw it. */
export interface Disc {
  /** Which body is visible. */
  kind: 'sun' | 'moon';
  /** Horizontal position across the arc, 0 (left) to 100 (right), as a percentage. */
  x: number;
  /** Vertical position from the top of the viewport, 0 to 100, as a percentage. */
  y: number;
  /** Height above the horizon, 0 (on the horizon) to 1 (at peak). */
  altitude: number;
}

const DAY = 1440;

/** Percentage of viewport height the horizon sits at. */
const HORIZON_Y = 62;

/** How far above the horizon the disc climbs at peak altitude, in viewport percent. */
const ARC_HEIGHT = 50;

/**
 * Computes the position of the sun or moon for a given time of day.
 *
 * Daytime runs sunrise to sunset; the remaining hours form a single night arc
 * that crosses midnight without discontinuity. Both arcs are a half sine, so
 * altitude is 0 at each end and 1 at the midpoint.
 *
 * @param minutes Minutes since local midnight. Out-of-range and fractional
 *   values are normalised rather than rejected.
 * @returns Which body is visible and where to draw it.
 */
export function discAt(minutes: number): Disc {
  const m = ((minutes % DAY) + DAY) % DAY;
  const isDay = m >= SUNRISE_MINUTES && m <= SUNSET_MINUTES;

  let progress: number;
  if (isDay) {
    progress = (m - SUNRISE_MINUTES) / (SUNSET_MINUTES - SUNRISE_MINUTES);
  } else {
    // Night length wraps past midnight, so shift into a continuous coordinate
    // starting at sunset.
    const nightLength = DAY - SUNSET_MINUTES + SUNRISE_MINUTES;
    const sinceSunset = m > SUNSET_MINUTES ? m - SUNSET_MINUTES : m + (DAY - SUNSET_MINUTES);
    progress = sinceSunset / nightLength;
  }

  const altitude = Math.sin(progress * Math.PI);

  return {
    kind: isDay ? 'sun' : 'moon',
    x: progress * 100,
    y: HORIZON_Y - altitude * ARC_HEIGHT,
    altitude,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/sun.test.ts
```
Expected: PASS, all 10 tests.

`Math.sin(Math.PI)` is about `1.2e-16` rather than exactly `0`, which is why the horizon assertions use `toBeCloseTo` rather than `toBe`. Do not "fix" this by rounding inside `discAt`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sun.ts src/lib/sun.test.ts
git commit -m "feat: add sun and moon arc geometry"
```

---

## Task 5: Playlist model

**Files:**
- Create: `src/lib/playlist.ts`
- Test: `src/lib/playlist.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface Track { videoId: string; title: string; artist: string }`
  - `TRACKS: readonly Track[]` — **empty until the user supplies real ids**
  - `shuffle<T>(items: readonly T[], rand: () => number): T[]`
  - `playableTracks(tracks: readonly Track[], dead: ReadonlySet<string>): Track[]`

`shuffle` takes an injected `rand` so tests are deterministic. Production callers pass `Math.random`. This is the reason `shuffle` can live in a pure module at all.

- [ ] **Step 1: Write the failing tests**

`src/lib/playlist.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { type Track, playableTracks, shuffle } from './playlist';

/** A rand stub that walks a fixed sequence, cycling if exhausted. */
const seeded = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length];
};

const track = (id: string): Track => ({ videoId: id, title: id, artist: 'a' });

describe('shuffle', () => {
  it('returns a permutation, never dropping or duplicating', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, seeded([0.1, 0.9, 0.4, 0.65, 0.2, 0.8, 0.3]));
    expect(out).toHaveLength(input.length);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('does not mutate the input', () => {
    const input = [1, 2, 3, 4];
    const copy = [...input];
    shuffle(input, seeded([0.5]));
    expect(input).toEqual(copy);
  });

  it('actually reorders rather than returning the input order', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const out = shuffle(input, seeded([0.99, 0.99, 0.99, 0.99, 0.99]));
    expect(out).not.toEqual(input);
  });

  it('handles empty and single-item lists', () => {
    expect(shuffle([], seeded([0.5]))).toEqual([]);
    expect(shuffle([7], seeded([0.5]))).toEqual([7]);
  });

  it('is deterministic for a given rand sequence', () => {
    const input = [1, 2, 3, 4, 5];
    const seq = [0.3, 0.7, 0.1, 0.9];
    expect(shuffle(input, seeded(seq))).toEqual(shuffle(input, seeded(seq)));
  });
});

describe('playableTracks', () => {
  it('excludes tracks whose ids are marked dead', () => {
    const tracks = [track('a'), track('b'), track('c')];
    const out = playableTracks(tracks, new Set(['b']));
    expect(out.map((t) => t.videoId)).toEqual(['a', 'c']);
  });

  it('returns everything when nothing is dead', () => {
    const tracks = [track('a'), track('b')];
    expect(playableTracks(tracks, new Set())).toHaveLength(2);
  });

  it('returns empty when every track is dead', () => {
    const tracks = [track('a'), track('b')];
    expect(playableTracks(tracks, new Set(['a', 'b']))).toEqual([]);
  });

  it('does not mutate the input', () => {
    const tracks = [track('a'), track('b')];
    playableTracks(tracks, new Set(['a']));
    expect(tracks).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run src/lib/playlist.test.ts
```
Expected: FAIL — cannot resolve `./playlist`.

- [ ] **Step 3: Write the implementation**

`src/lib/playlist.ts`:

```ts
/** One song in the rotation. */
export interface Track {
  /** YouTube video id, the 11-character value from a watch URL. */
  videoId: string;
  /** Song title as shown in the now-playing card. */
  title: string;
  /** Performing artist as shown in the now-playing card. */
  artist: string;
}

/**
 * The rotation.
 *
 * INTENTIONALLY EMPTY. Real video ids come from the user's YouTube Music
 * playlist and must not be invented — a wrong id is a silent skip at runtime.
 * Populate this in Task 11, and verify each id actually plays in an embed:
 * YouTube Music "art tracks" frequently have embedding disabled.
 *
 * The app handles an empty list gracefully by design: the ghat scene still
 * runs and the now-playing card shows its unavailable state.
 */
export const TRACKS: readonly Track[] = [];

/**
 * Returns a shuffled copy using Fisher–Yates.
 * @param items The list to shuffle. Not mutated.
 * @param rand Returns a float in [0, 1). Pass `Math.random` in production;
 *   pass a stub in tests to make the result deterministic.
 * @returns A new array containing the same items in a new order.
 */
export function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Filters out tracks that failed to play earlier in this session.
 * @param tracks The full rotation.
 * @param dead Video ids known to be unplayable.
 * @returns A new array of tracks worth attempting.
 */
export function playableTracks(
  tracks: readonly Track[],
  dead: ReadonlySet<string>,
): Track[] {
  return tracks.filter((t) => !dead.has(t.videoId));
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run src/lib/playlist.test.ts
```
Expected: PASS, all 9 tests.

- [ ] **Step 5: Run the whole suite and commit**

```bash
npm test
```
Expected: PASS — 39 tests across four files. All pure logic is now covered.

```bash
git add src/lib/playlist.ts src/lib/playlist.test.ts
git commit -m "feat: add playlist model with deterministic shuffle"
```

---

## Task 6: Global styles and CSS variable contract

**Files:**
- Create: `src/styles/global.css`

**Interfaces:**
- Consumes: nothing
- Produces the CSS custom property contract that `Scene.astro` reads and `boot.ts` writes. Both later tasks depend on these exact names:
  - `--sky-top`, `--sky-horizon`, `--water` — hex colors
  - `--diya-glow` — unitless number `0`–`1`
  - `--disc-x`, `--disc-y` — unitless numbers `0`–`100`, consumed as percentages
  - `--disc-color`, `--disc-halo` — set per body kind (sun vs moon)
  - `--ink` — the silhouette constant, never interpolated

- [ ] **Step 1: Write the stylesheet**

`src/styles/global.css`:

```css
/*
 * CSS custom property contract.
 *
 * The values below are only the initial paint, chosen to match the midnight
 * keyframe so the first frame is never a flash of unstyled sky. boot.ts
 * overwrites them from paletteAt() and discAt() on load and every tick.
 */
:root {
  --sky-top: #0b1026;
  --sky-horizon: #1b2a4a;
  --water: #0a1a2e;
  --diya-glow: 1;
  --disc-x: 50;
  --disc-y: 20;
  --disc-color: #fff6e0;
  --disc-halo: 255 246 224;

  /* The silhouette is a constant. A silhouette is a silhouette at every hour. */
  --ink: #0b0a12;

  --scrim: rgb(0 0 0 / 0.45);
  --text: #f7f1e6;
  --text-dim: #cfc4b4;

  --font: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-deva: "Noto Sans Devanagari", var(--font);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  margin: 0;
}

body {
  background: var(--sky-top);
  color: var(--text);
  font-family: var(--font);
  overflow: hidden;
}

/* Visually hidden but available to screen readers. Used by the page's only h1. */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

/* The scene fills the viewport and everything else layers on top of it. */
.stage {
  position: relative;
  height: 100dvh;
  width: 100%;
  overflow: hidden;
}

.scene {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
}

/* --- Chrome ------------------------------------------------------------- */

.header,
.now-playing,
.gate {
  position: absolute;
  z-index: 2;
}

.header {
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.04em;
  color: var(--text-dim);
}

.header a {
  color: var(--text);
  text-decoration: none;
  opacity: 0.85;
}

.header a:hover,
.header a:focus-visible {
  opacity: 1;
  text-decoration: underline;
}

.header__links {
  display: flex;
  gap: 1.25rem;
}

/*
 * Text sits on a scrim rather than directly on the gradient, so contrast holds
 * against both the lightest daytime keyframe and the darkest night keyframe.
 */
.now-playing {
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  max-width: min(92vw, 34rem);
  background: var(--scrim);
  backdrop-filter: blur(12px);
  border-radius: 1rem;
}

/*
 * The YouTube iframe IS the artwork tile: visible, unobscured, 200x200. This
 * satisfies YouTube's player visibility terms with no hidden-player tension.
 * Do not shrink below 200px and do not cover it.
 */
.player-mount {
  flex: 0 0 auto;
  width: 200px;
  height: 200px;
  border-radius: 0.625rem;
  overflow: hidden;
  background: rgb(0 0 0 / 0.35);
}

.player-mount iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}

.now-playing__meta {
  min-width: 0;
}

.now-playing__title {
  margin: 0;
  font-family: var(--font-deva);
  font-size: 1.0625rem;
  font-weight: 600;
  line-height: 1.3;
}

.now-playing__artist {
  margin: 0.125rem 0 0;
  font-size: 0.875rem;
  color: var(--text-dim);
}

.now-playing__controls {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}

.control {
  display: grid;
  place-items: center;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 50%;
  background: rgb(255 255 255 / 0.14);
  color: var(--text);
  font-size: 0.875rem;
  cursor: pointer;
}

.control:hover {
  background: rgb(255 255 255 / 0.24);
}

.control:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

/* --- Entry gate --------------------------------------------------------- */

.gate {
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  gap: 0;
  border: 0;
  width: 100%;
  background: rgb(0 0 0 / 0.35);
  backdrop-filter: blur(2px);
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.gate[hidden] {
  display: none;
}

.gate__inner {
  text-align: center;
  padding: 2rem;
}

.gate__title {
  font-family: var(--font-deva);
  font-size: clamp(2rem, 7vw, 3.5rem);
  font-weight: 700;
  margin: 0 0 0.5rem;
  text-shadow: 0 2px 24px rgb(0 0 0 / 0.5);
}

.gate__hint {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--text-dim);
  letter-spacing: 0.06em;
}

/* --- Motion ------------------------------------------------------------- */

.diya {
  animation: flicker 3.2s ease-in-out infinite;
}

@keyframes flicker {
  0%,
  100% {
    opacity: calc(var(--diya-glow) * 0.82);
  }
  45% {
    opacity: var(--diya-glow);
  }
  70% {
    opacity: calc(var(--diya-glow) * 0.68);
  }
}

/*
 * Reduced motion freezes the disc and the flicker. The color ramp is left
 * running deliberately: it changes far too slowly to register as motion.
 */
@media (prefers-reduced-motion: reduce) {
  .diya {
    animation: none;
    opacity: var(--diya-glow);
  }

  .disc {
    transition: none !important;
  }
}
```

- [ ] **Step 2: Verify it parses**

There is no test for CSS. Confirm the file has balanced braces and no stray characters:

```bash
node -e "const s=require('fs').readFileSync('src/styles/global.css','utf8');const o=(s.match(/{/g)||[]).length,c=(s.match(/}/g)||[]).length;if(o!==c)throw new Error('unbalanced braces: '+o+' vs '+c);console.log('braces balanced:',o)"
```
Expected: `braces balanced: 30` (approximately — the exact count does not matter, only that it does not throw).

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add global styles and CSS variable contract"
```

**Note on the one `!important`:** it appears only inside the `prefers-reduced-motion` block, where overriding a motion preference is the entire point. Accessibility overrides are the legitimate exception; do not add `!important` anywhere else.

---

## Task 7: The ghat scene

**Files:**
- Create: `src/components/Scene.astro`

**Interfaces:**
- Consumes: the CSS custom properties defined in Task 6
- Produces: an SVG with `class="scene"`, containing an element with `class="disc"` and `id="disc"` that `boot.ts` positions, and `.diya` elements that inherit `--diya-glow`

The SVG is server-rendered once and never re-created on the client. Only CSS variables change at runtime, so there is no DOM churn and no layout thrash.

- [ ] **Step 1: Write the component**

`src/components/Scene.astro`:

```astro
---
/**
 * The ghat scene: a gradient sky, a sun/moon disc, the far bank, the river,
 * the ghat steps, figures at the water offering arghya, and diyas.
 *
 * Every color comes from a CSS custom property that boot.ts drives from the
 * clock. This component holds shape only — no color values, no timing.
 */
---

<svg
  class="scene"
  viewBox="0 0 1600 900"
  preserveAspectRatio="xMidYMid slice"
  aria-hidden="true"
  focusable="false"
>
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--sky-top)"></stop>
      <stop offset="72%" stop-color="var(--sky-horizon)"></stop>
    </linearGradient>

    <linearGradient id="river" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="var(--sky-horizon)" stop-opacity="0.55"></stop>
      <stop offset="30%" stop-color="var(--water)"></stop>
      <stop offset="100%" stop-color="var(--water)"></stop>
    </linearGradient>

    <radialGradient id="halo">
      <stop offset="0%" stop-color="rgb(var(--disc-halo) / 0.55)"></stop>
      <stop offset="100%" stop-color="rgb(var(--disc-halo) / 0)"></stop>
    </radialGradient>

    <radialGradient id="diyaGlow">
      <stop offset="0%" stop-color="rgb(255 176 71 / 0.85)"></stop>
      <stop offset="100%" stop-color="rgb(255 176 71 / 0)"></stop>
    </radialGradient>
  </defs>

  <!-- Sky -->
  <rect width="1600" height="558" fill="url(#sky)"></rect>

  <!-- Sun or moon. boot.ts sets the transform from discAt(). -->
  <g class="disc" id="disc">
    <circle r="150" fill="url(#halo)"></circle>
    <circle r="34" fill="var(--disc-color)"></circle>
  </g>

  <!-- Far bank: a low silhouette of the opposite shore -->
  <path
    d="M0 540 L120 528 L210 534 L300 520 L420 532 L520 522 L640 534 L760 524
       L900 536 L1020 526 L1140 534 L1260 522 L1380 532 L1500 526 L1600 534
       L1600 558 L0 558 Z"
    fill="var(--ink)"
    opacity="0.55"
  ></path>

  <!-- Temple spires on the far bank -->
  <path d="M352 522 L368 470 L384 522 Z" fill="var(--ink)" opacity="0.65"></path>
  <path d="M1188 528 L1206 464 L1224 528 Z" fill="var(--ink)" opacity="0.65"></path>

  <!-- River -->
  <rect y="558" width="1600" height="342" fill="url(#river)"></rect>

  <!-- Reflection column beneath the disc -->
  <rect
    class="reflection"
    id="reflection"
    y="558"
    width="120"
    height="342"
    fill="rgb(var(--disc-halo) / 0.16)"
  ></rect>

  <!-- Ghat steps, right bank, receding into the water -->
  <g fill="var(--ink)">
    <rect x="1180" y="612" width="420" height="26"></rect>
    <rect x="1240" y="638" width="360" height="26"></rect>
    <rect x="1300" y="664" width="300" height="26"></rect>
    <rect x="1360" y="690" width="240" height="210"></rect>
  </g>

  <!-- Ghat steps, left bank -->
  <g fill="var(--ink)">
    <rect x="0" y="628" width="300" height="24"></rect>
    <rect x="0" y="652" width="240" height="24"></rect>
    <rect x="0" y="676" width="180" height="224"></rect>
  </g>

  <!--
    Figures standing in the water offering arghya: torso, head, and raised
    arms holding the soop. Deliberately simple silhouettes.
  -->
  <g fill="var(--ink)">
    <!-- Figure 1 -->
    <g transform="translate(560 604)">
      <circle cx="0" cy="-52" r="13"></circle>
      <path d="M-16 -38 Q0 -44 16 -38 L22 44 L-22 44 Z"></path>
      <path d="M-16 -30 L-30 -60 L-24 -64 L-8 -36 Z"></path>
      <path d="M16 -30 L30 -60 L24 -64 L8 -36 Z"></path>
      <ellipse cx="0" cy="-68" rx="26" ry="7"></ellipse>
    </g>
    <!-- Figure 2 -->
    <g transform="translate(660 616)">
      <circle cx="0" cy="-48" r="12"></circle>
      <path d="M-15 -35 Q0 -41 15 -35 L20 40 L-20 40 Z"></path>
      <path d="M-15 -28 L-27 -55 L-21 -59 L-7 -33 Z"></path>
      <path d="M15 -28 L27 -55 L21 -59 L7 -33 Z"></path>
      <ellipse cx="0" cy="-62" rx="24" ry="6"></ellipse>
    </g>
    <!-- Figure 3, further out and smaller -->
    <g transform="translate(452 594)">
      <circle cx="0" cy="-42" r="10"></circle>
      <path d="M-13 -31 Q0 -36 13 -31 L17 34 L-17 34 Z"></path>
      <ellipse cx="0" cy="-54" rx="20" ry="5"></ellipse>
    </g>
  </g>

  <!-- Diyas floating on the water. Opacity is driven by --diya-glow. -->
  <g class="diyas">
    <g class="diya" style="animation-delay: 0s">
      <circle cx="300" cy="700" r="30" fill="url(#diyaGlow)"></circle>
      <circle cx="300" cy="700" r="4" fill="#ffd9a0"></circle>
    </g>
    <g class="diya" style="animation-delay: 0.7s">
      <circle cx="420" cy="756" r="26" fill="url(#diyaGlow)"></circle>
      <circle cx="420" cy="756" r="3.5" fill="#ffd9a0"></circle>
    </g>
    <g class="diya" style="animation-delay: 1.4s">
      <circle cx="760" cy="724" r="28" fill="url(#diyaGlow)"></circle>
      <circle cx="760" cy="724" r="4" fill="#ffd9a0"></circle>
    </g>
    <g class="diya" style="animation-delay: 2.1s">
      <circle cx="980" cy="792" r="24" fill="url(#diyaGlow)"></circle>
      <circle cx="980" cy="792" r="3.5" fill="#ffd9a0"></circle>
    </g>
    <g class="diya" style="animation-delay: 0.35s">
      <circle cx="1120" cy="716" r="26" fill="url(#diyaGlow)"></circle>
      <circle cx="1120" cy="716" r="3.5" fill="#ffd9a0"></circle>
    </g>
    <g class="diya" style="animation-delay: 1.75s">
      <circle cx="620" cy="828" r="22" fill="url(#diyaGlow)"></circle>
      <circle cx="620" cy="828" r="3" fill="#ffd9a0"></circle>
    </g>
  </g>
</svg>
```

- [ ] **Step 2: Commit**

There is nothing to run yet — `index.astro` arrives in Task 10. The scene is verified visually in Task 11.

```bash
git add src/components/Scene.astro
git commit -m "feat: add ghat scene SVG"
```

---

## Task 8: Scene ticking

**Files:**
- Create: `src/scripts/scene.ts`
- Test: `src/lib/scene-vars.test.ts`
- Create: `src/lib/scene-vars.ts`

**Interfaces:**
- Consumes: `paletteAt` from `src/lib/sky.ts`, `discAt` and `SUNRISE_MINUTES`/`SUNSET_MINUTES` from `src/lib/sun.ts`
- Produces:
  - `src/lib/scene-vars.ts` — **pure.** `sceneVars(minutes: number): Record<string, string>` mapping CSS property names to values
  - `src/scripts/scene.ts` — `startScene(root: HTMLElement, now: () => Date): () => void`, returns a teardown function

The split exists so the interesting part is testable. `sceneVars` is a pure function from a time to a set of CSS values; `scene.ts` is the thin, untestable shell that writes them and schedules ticks.

- [ ] **Step 1: Write the failing test for the pure mapper**

`src/lib/scene-vars.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sceneVars } from './scene-vars';

describe('sceneVars', () => {
  it('emits every property in the CSS variable contract', () => {
    const v = sceneVars(720);
    expect(Object.keys(v).sort()).toEqual([
      '--disc-color',
      '--disc-halo',
      '--disc-x',
      '--disc-y',
      '--diya-glow',
      '--sky-horizon',
      '--sky-top',
      '--water',
    ]);
  });

  it('emits colors as hex and numbers as unitless strings', () => {
    const v = sceneVars(720);
    expect(v['--sky-top']).toMatch(/^#[0-9a-f]{6}$/);
    expect(v['--water']).toMatch(/^#[0-9a-f]{6}$/);
    expect(Number(v['--disc-x'])).not.toBeNaN();
    expect(Number(v['--diya-glow'])).not.toBeNaN();
  });

  it('uses a warm disc by day and a cool one by night', () => {
    expect(sceneVars(720)['--disc-color']).toBe('#fff3d4');
    expect(sceneVars(120)['--disc-color']).toBe('#e8eeff');
  });

  it('emits the halo as a space-separated rgb triplet for rgb() consumption', () => {
    expect(sceneVars(720)['--disc-halo']).toMatch(/^\d{1,3} \d{1,3} \d{1,3}$/);
  });

  it('produces valid output for every minute of the day', () => {
    for (let m = 0; m < 1440; m++) {
      const v = sceneVars(m);
      expect(v['--sky-top']).toMatch(/^#[0-9a-f]{6}$/);
      expect(Number(v['--disc-y'])).not.toBeNaN();
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/lib/scene-vars.test.ts
```
Expected: FAIL — cannot resolve `./scene-vars`.

- [ ] **Step 3: Write the pure mapper**

`src/lib/scene-vars.ts`:

```ts
import { paletteAt } from './sky';
import { discAt } from './sun';

/** Disc appearance per body. The sun is warm; the moon is cool. */
const DISC = {
  sun: { color: '#fff3d4', halo: '255 226 168' },
  moon: { color: '#e8eeff', halo: '198 214 255' },
} as const;

/**
 * Maps a time of day to the full set of CSS custom property values the scene
 * needs. Pure: no DOM, no clock, no randomness.
 * @param minutes Minutes since local midnight.
 * @returns CSS property names mapped to their values, ready for `setProperty`.
 */
export function sceneVars(minutes: number): Record<string, string> {
  const palette = paletteAt(minutes);
  const disc = discAt(minutes);
  const look = DISC[disc.kind];

  return {
    '--sky-top': palette.skyTop,
    '--sky-horizon': palette.skyHorizon,
    '--water': palette.water,
    '--diya-glow': palette.diyaGlow.toFixed(3),
    '--disc-x': disc.x.toFixed(2),
    '--disc-y': disc.y.toFixed(2),
    '--disc-color': look.color,
    '--disc-halo': look.halo,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/lib/scene-vars.test.ts
```
Expected: PASS, all 5 tests.

- [ ] **Step 5: Write the DOM shell**

`src/scripts/scene.ts`:

```ts
import { sceneVars } from '../lib/scene-vars';
import { discAt } from '../lib/sun';

/** How often to recompute the sky, in milliseconds. */
const TICK_MS = 30_000;

/** SVG viewBox dimensions, matching Scene.astro. */
const VIEW_W = 1600;
const VIEW_H = 900;

/** Converts a Date to minutes since local midnight. */
function minutesOf(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

/**
 * Starts driving the scene from the clock.
 *
 * Recomputes on an interval and again on `visibilitychange`, because browsers
 * throttle timers in background tabs — without the visibility hook, returning
 * to the tab after an hour would show a stale sky until the next tick landed.
 *
 * @param root Element whose inline style receives the custom properties,
 *   normally `document.documentElement`.
 * @param now Returns the current time. Injected so callers can control it.
 * @returns A teardown function that stops the interval and removes listeners.
 */
export function startScene(root: HTMLElement, now: () => Date): () => void {
  const disc = document.getElementById('disc');
  const reflection = document.getElementById('reflection');

  const paint = (): void => {
    const minutes = minutesOf(now());

    for (const [prop, value] of Object.entries(sceneVars(minutes))) {
      root.style.setProperty(prop, value);
    }

    // The disc and its reflection are positioned in SVG user units, so the
    // percentages from discAt() are scaled to the viewBox here. Read from
    // discAt() directly rather than parsing back the CSS string we just wrote.
    const { x, y } = discAt(minutes);
    const px = (x / 100) * VIEW_W;
    disc?.setAttribute('transform', `translate(${px} ${(y / 100) * VIEW_H})`);
    reflection?.setAttribute('x', String(px - 60));
  };

  paint();

  const id = window.setInterval(paint, TICK_MS);
  const onVisible = (): void => {
    if (!document.hidden) paint();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    window.clearInterval(id);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
```

- [ ] **Step 6: Run the full suite and commit**

```bash
npm test
```
Expected: PASS — 44 tests across five files.

```bash
git add src/lib/scene-vars.ts src/lib/scene-vars.test.ts src/scripts/scene.ts
git commit -m "feat: drive the scene from the local clock"
```

---

## Task 9: YouTube player wrapper

**Files:**
- Create: `src/lib/youtube.ts`

**Interfaces:**
- Consumes: `Track`, `shuffle`, `playableTracks` from `src/lib/playlist.ts`
- Produces:
  - `interface PlayerHandle { play(): void; pause(): void; next(): void; current(): Track | null; destroy(): void }`
  - `interface PlayerOptions { mount: HTMLElement; tracks: readonly Track[]; onTrackChange: (track: Track) => void; onUnavailable: () => void }`
  - `createPlayer(options: PlayerOptions): Promise<PlayerHandle>`

Per the spec this module is **not unit tested** — mocking the IFrame API would test the mock rather than the code. It gets a manual smoke pass in Task 11.

- [ ] **Step 1: Write the implementation**

`src/lib/youtube.ts`:

```ts
import { type Track, playableTracks, shuffle } from './playlist';

/** Controls for the running player. */
export interface PlayerHandle {
  play(): void;
  pause(): void;
  /** Advances to the next track in the shuffled order, wrapping at the end. */
  next(): void;
  /** The track currently loaded, or null if nothing is playable. */
  current(): Track | null;
  /** Tears the player down and releases the iframe. */
  destroy(): void;
}

/** Wiring for {@link createPlayer}. */
export interface PlayerOptions {
  /** Element the iframe replaces. Must be at least 200x200 and unobscured. */
  mount: HTMLElement;
  /** The full rotation. May be empty. */
  tracks: readonly Track[];
  /** Called whenever a new track starts loading. */
  onTrackChange: (track: Track) => void;
  /** Called when no track in the rotation can be played. */
  onUnavailable: () => void;
}

/**
 * Error codes the IFrame API reports for a video that will never play.
 * 2 invalid id, 5 HTML5 playback failure, 100 removed or private,
 * 101 and 150 embedding disabled by the uploader. The last two are the common
 * case for YouTube Music art tracks.
 */
const FATAL_CODES = new Set([2, 5, 100, 101, 150]);

const API_SRC = 'https://www.youtube.com/iframe_api';

/** Resolves once `window.YT.Player` is available, loading the API if needed. */
function loadApi(): Promise<void> {
  const w = window as unknown as {
    YT?: { Player?: unknown };
    onYouTubeIframeAPIReady?: () => void;
  };

  if (w.YT?.Player) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      existing?.();
      resolve();
    };

    if (document.querySelector(`script[src="${API_SRC}"]`)) return;

    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onerror = () => reject(new Error('YouTube IFrame API failed to load'));
    document.head.appendChild(script);
  });
}

/**
 * Creates a YouTube-backed player over the rotation.
 *
 * Playback order is shuffled per visit. Tracks that report a fatal error are
 * marked dead for the session and skipped, so a playlist containing
 * embedding-disabled art tracks degrades to the playable subset rather than
 * stalling.
 *
 * @param options Mount point, rotation, and callbacks.
 * @returns A handle for controlling playback.
 * @throws If the IFrame API script cannot be loaded.
 */
export async function createPlayer(options: PlayerOptions): Promise<PlayerHandle> {
  const { mount, tracks, onTrackChange, onUnavailable } = options;

  await loadApi();

  const dead = new Set<string>();
  let order = shuffle(playableTracks(tracks, dead), Math.random);
  let index = 0;
  let player: any = null;

  const currentTrack = (): Track | null => order[index] ?? null;

  /** Rebuilds the order from the surviving tracks. Returns false if none remain. */
  const reorder = (): boolean => {
    order = shuffle(playableTracks(tracks, dead), Math.random);
    index = 0;
    return order.length > 0;
  };

  const advance = (): void => {
    if (order.length === 0) {
      onUnavailable();
      return;
    }
    index = (index + 1) % order.length;
    const track = currentTrack();
    if (!track) {
      onUnavailable();
      return;
    }
    onTrackChange(track);
    player?.loadVideoById(track.videoId);
  };

  const first = currentTrack();
  if (!first) {
    onUnavailable();
    return {
      play: () => {},
      pause: () => {},
      next: () => {},
      current: () => null,
      destroy: () => {},
    };
  }

  const YT = (window as any).YT;

  player = new YT.Player(mount, {
    width: 200,
    height: 200,
    videoId: first.videoId,
    playerVars: {
      // No related videos, no branding chrome, no keyboard hijacking.
      rel: 0,
      modestbranding: 1,
      playsinline: 1,
      disablekb: 1,
    },
    events: {
      onReady: () => {
        onTrackChange(first);
        player.playVideo();
      },
      onStateChange: (event: { data: number }) => {
        // 0 === ended
        if (event.data === 0) advance();
      },
      onError: (event: { data: number }) => {
        const track = currentTrack();
        if (track && FATAL_CODES.has(event.data)) {
          dead.add(track.videoId);
          if (!reorder()) {
            onUnavailable();
            return;
          }
          const next = currentTrack();
          if (next) {
            onTrackChange(next);
            player.loadVideoById(next.videoId);
          }
          return;
        }
        advance();
      },
    },
  });

  return {
    play: () => player?.playVideo(),
    pause: () => player?.pauseVideo(),
    next: advance,
    current: currentTrack,
    destroy: () => player?.destroy(),
  };
}
```

The `any` types on `player` and `YT` are deliberate and confined to this module: typing the IFrame API properly would mean either a runtime dependency on `@types/youtube` or hand-writing a large ambient declaration, for a surface we touch in six places. This is the one module allowed to be loosely typed, which is precisely why the tested logic lives elsewhere.

- [ ] **Step 2: Verify it type-checks**

```bash
npx astro check
```
Expected: no errors in `src/lib/youtube.ts`. `astro check` may report that no pages exist yet — that is fine.

If `astro check` reports a missing dependency, install it as instructed by the error and note it in the commit.

- [ ] **Step 3: Commit**

```bash
git add src/lib/youtube.ts
git commit -m "feat: add YouTube IFrame player wrapper with dead-id skipping"
```

---

## Task 10: Page composition and boot

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/NowPlaying.astro`
- Create: `src/components/EntryGate.astro`
- Create: `src/pages/index.astro`
- Create: `src/scripts/boot.ts`

**Interfaces:**
- Consumes: `Scene.astro`, `global.css`, `startScene` from `src/scripts/scene.ts`, `createPlayer` from `src/lib/youtube.ts`, `TRACKS` from `src/lib/playlist.ts`
- Produces: the built page. This is the last code task.

DOM contract shared between the components and `boot.ts`:

| id | Element | Purpose |
|---|---|---|
| `gate` | `<button>` | The entry veil; hidden after the first click |
| `player-mount` | `<div>` | Replaced by the 200×200 iframe |
| `track-title` | `<h2>` | `aria-live="polite"` |
| `track-artist` | `<p>` | |
| `btn-toggle` | `<button>` | Play/pause |
| `btn-next` | `<button>` | Skip |
| `clock` | `<time>` | Local clock in the header |

- [ ] **Step 1: Write Header.astro**

```astro
---
/** Top chrome: the visitor's local clock and outbound links. */
---

<header class="header">
  <time class="header__clock" id="clock" datetime="">--:--</time>
  <nav class="header__links">
    <a href="https://music.youtube.com" target="_blank" rel="noopener noreferrer">
      YT Music ↗
    </a>
  </nav>
</header>
```

- [ ] **Step 2: Write NowPlaying.astro**

```astro
---
/**
 * The now-playing card. The player mount is a 200x200 square that the YouTube
 * iframe replaces, so the video itself serves as the artwork tile — visible
 * and unobscured, as YouTube's terms require.
 */
---

<section class="now-playing" aria-label="Now playing">
  <div class="player-mount" id="player-mount"></div>
  <div class="now-playing__meta">
    <h2 class="now-playing__title" id="track-title" aria-live="polite">
      संगीत तैयार हो रहा है
    </h2>
    <p class="now-playing__artist" id="track-artist"></p>
    <div class="now-playing__controls">
      <button class="control" id="btn-toggle" type="button" aria-label="Play or pause">
        ⏸
      </button>
      <button class="control" id="btn-next" type="button" aria-label="Next track">
        ⏭
      </button>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Write EntryGate.astro**

```astro
---
/**
 * The entry veil. Browsers block audio autoplay and the IFrame API needs a
 * genuine user gesture, so the first interaction is required. Rather than
 * apologising for it, it becomes the threshold into the ghat.
 */
---

<button class="gate" id="gate" type="button">
  <span class="gate__inner">
    <span class="gate__title">छठ पूजा</span>
    <p class="gate__hint">शुरू करने के लिए स्पर्श करें · tap to begin</p>
  </span>
</button>
```

- [ ] **Step 4: Write index.astro**

```astro
---
import EntryGate from '../components/EntryGate.astro';
import Header from '../components/Header.astro';
import NowPlaying from '../components/NowPlaying.astro';
import Scene from '../components/Scene.astro';
import '../styles/global.css';
---

<!doctype html>
<html lang="hi">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>छठ पूजा · Chhath Radio</title>
    <meta
      name="description"
      content="Chhath Puja songs, and a ghat that moves with the sun."
    />
    <link rel="preconnect" href="https://www.youtube.com" />
  </head>
  <body>
    <main class="stage">
      <h1 class="sr-only">छठ पूजा · Chhath Radio</h1>
      <Scene />
      <Header />
      <NowPlaying />
      <EntryGate />
    </main>
    <script>
      import '../scripts/boot';
    </script>
  </body>
</html>
```

The `.sr-only` class this `<h1>` depends on is already in `global.css` from Task 6.

- [ ] **Step 5: Write boot.ts**

`src/scripts/boot.ts`:

```ts
import { TRACKS } from '../lib/playlist';
import { type PlayerHandle, createPlayer } from '../lib/youtube';
import { startScene } from './scene';

/** Keeps the header clock in sync with the visitor's local time. */
function startClock(): void {
  const el = document.getElementById('clock');
  if (!el) return;

  const paint = (): void => {
    const now = new Date();
    el.textContent = now.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
    el.setAttribute('datetime', now.toISOString());
  };

  paint();
  window.setInterval(paint, 15_000);
}

/**
 * Puts the now-playing card into its unavailable state. The scene keeps
 * running: audio failure degrades the page, it never breaks it.
 */
function showUnavailable(): void {
  const title = document.getElementById('track-title');
  const artist = document.getElementById('track-artist');
  const controls = document.querySelector<HTMLElement>('.now-playing__controls');
  if (title) title.textContent = 'संगीत अभी उपलब्ध नहीं है';
  if (artist) artist.textContent = '';
  if (controls) controls.hidden = true;
}

/** Wires the play/pause and next buttons to a live player handle. */
function bindControls(handle: PlayerHandle): void {
  const toggle = document.getElementById('btn-toggle');
  const next = document.getElementById('btn-next');
  let playing = true;

  toggle?.addEventListener('click', () => {
    playing = !playing;
    if (playing) handle.play();
    else handle.pause();
    toggle.textContent = playing ? '⏸' : '▶';
  });

  next?.addEventListener('click', () => handle.next());
}

// The scene and the clock start immediately and do not depend on the player.
// If YouTube is unreachable, the visitor still gets a moving ghat.
startScene(document.documentElement, () => new Date());
startClock();

const gate = document.getElementById('gate');

gate?.addEventListener(
  'click',
  async () => {
    gate.hidden = true;

    const mount = document.getElementById('player-mount');
    if (!mount) return;

    try {
      const handle = await createPlayer({
        mount,
        tracks: TRACKS,
        onTrackChange: (track) => {
          const title = document.getElementById('track-title');
          const artist = document.getElementById('track-artist');
          if (title) title.textContent = track.title;
          if (artist) artist.textContent = track.artist;
        },
        onUnavailable: showUnavailable,
      });
      bindControls(handle);
    } catch {
      // The API script itself failed — offline, blocked, or filtered.
      showUnavailable();
    }
  },
  { once: true },
);
```

- [ ] **Step 6: Build and check**

```bash
npm run build
```
Expected: build succeeds, `dist/index.html` exists.

```bash
npx astro check
```
Expected: no errors.

```bash
npm test
```
Expected: PASS — 44 tests.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: compose the page and wire the entry gate to the player"
```

---

## Task 11: Real playlist and verification

**Files:**
- Modify: `src/lib/playlist.ts` — populate `TRACKS`

**Interfaces:**
- Consumes: everything built above
- Produces: a working site

**This task requires the user's YouTube Music playlist and cannot be completed without it.** If it has not been supplied, stop and ask rather than inventing video ids.

- [ ] **Step 1: Extract the video ids**

For each track in the user's playlist, collect the 11-character `videoId` from its watch URL (`https://www.youtube.com/watch?v=XXXXXXXXXXX`), plus the title and artist as they should be displayed.

- [ ] **Step 2: Verify each id is actually embeddable**

For every id, open `https://www.youtube.com/embed/<videoId>` directly in a browser and confirm it plays. Any id showing "Video unavailable" or "Watch on YouTube" is embedding-disabled and must be dropped from the list — this is common for YouTube Music art tracks, and it is the single most likely reason the finished site would appear silent.

Record which ids were dropped and report them to the user, since they may want to substitute alternative uploads of the same song.

- [ ] **Step 3: Populate TRACKS**

Replace the empty array in `src/lib/playlist.ts`, keeping the surrounding JSDoc but removing the "INTENTIONALLY EMPTY" paragraph:

```ts
export const TRACKS: readonly Track[] = [
  { videoId: '...', title: '...', artist: '...' },
  // one entry per verified track
];
```

- [ ] **Step 4: Smoke test the player manually**

```bash
npm run dev
```

Confirm each of these, which is the manual pass standing in for unit tests on `youtube.ts`:

1. The scene renders and the sky matches the current time of day.
2. The gate is visible on load and audio does not start until it is clicked.
3. Clicking the gate hides it and starts playback.
4. The iframe fills the 200×200 tile and is not covered by anything.
5. Skip advances to a different track and the title text updates.
6. Play/pause toggles both playback and the button glyph.
7. Adding a deliberately invalid id such as `'aaaaaaaaaaa'` to `TRACKS` causes a silent skip to the next track rather than a stall. Remove it afterwards.
8. Emptying `TRACKS` shows "संगीत अभी उपलब्ध नहीं है" and the ghat keeps moving. Restore it afterwards.

- [ ] **Step 5: Verify the scene across the whole day**

The sky cannot be judged by waiting 24 hours. Temporarily drive it from a fake clock — in the browser console on the running dev server:

```js
// Sweep the full day in about 12 seconds to check every transition.
let m = 0;
const sweep = setInterval(() => {
  const vars = window.__sceneVars?.(m);
  if (vars) for (const [k, v] of Object.entries(vars)) {
    document.documentElement.style.setProperty(k, v);
  }
  m = (m + 10) % 1440;
}, 80);
// clearInterval(sweep) to stop
```

For this to work, expose the mapper for debugging by adding this line to the end of `src/scripts/boot.ts`:

```ts
// Debug hook: lets the day be swept by hand in the console.
(window as unknown as { __sceneVars?: unknown }).__sceneVars = sceneVars;
```

and importing it at the top:

```ts
import { sceneVars } from '../lib/scene-vars';
```

Watch for: any grey or muddy midpoint (a sign interpolation is not running in Oklab), the diyas fading in at dusk and out after dawn, and the disc crossing the horizon smoothly at both arghya times.

- [ ] **Step 6: Check accessibility**

1. Tab through the page: gate, then play/pause, then next, then the header link. Every stop must show a visible focus ring.
2. Enable "Reduce motion" in the OS and reload. The diyas must stop flickering; the sky must still be correct for the time.
3. Check contrast of the now-playing title against the card at both midday (`m = 720`) and midnight (`m = 0`) using the sweep above. Both must clear 4.5:1.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add verified Chhath playlist and debug sweep hook"
```

---

## Revision 2 — journey-first

Supersedes Tasks 6–11. Tasks 1–5 above stand as written.

### Task 5R: Populate TRACKS with the verified playlist

**Files:**
- Modify: `src/lib/playlist.ts`

Replace the empty `TRACKS` array and drop the "INTENTIONALLY EMPTY" paragraph
from its JSDoc. These 23 ids come from `PL-HJTkuLZnWxbBolNkLTql6PUUdXgknjX` and
were each verified against the live IFrame API: all cued without error code 101
or 150, so none has embedding disabled.

`gcVbtUGLDNk` ("Aapka Kya Hoga Janabe Ali", from *Housefull*) is deliberately
absent — it is a Bollywood item song that appears in the source playlist by
accident.

```ts
export const TRACKS: readonly Track[] = [
  { videoId: 'jRsXRee52xw', title: 'Maarbo Re Sugva Dhanukh Se', artist: 'Anuradha Paudwal' },
  { videoId: 'WYkrgIZFcZw', title: 'Pahile Pahil Chhathi Maiya', artist: 'Sharda Sinha' },
  { videoId: '8MzoVsjL4QU', title: 'Uga Hai Suraj Dev', artist: 'Anuradha Paudwal' },
  { videoId: 'W-w55hqwyUs', title: 'Kaanche Hi Baans Ke Bahangiya', artist: 'T-Series Regional' },
  { videoId: 'kEJsJ7wn5Zw', title: 'Aadit Manaila', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'oJ1h2TtZdjw', title: 'Asiya Puran Hoy', artist: 'Kavita Paudwal' },
  { videoId: 'izIkAY6w8V8', title: 'Patna Ke Haat Par Nariyar', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'pp0bO8uro64', title: 'Kahawa Paibo Sone Ke Katorwa', artist: 'Anu Dubey' },
  { videoId: 'knZ8b5YnQiY', title: 'Kelwa Ke Paat Par', artist: 'Sharda Sinha' },
  { videoId: 'IzDm2ndwWqg', title: 'Angna Mein Pokhri Khonaib', artist: 'Kavita Paudwal' },
  { videoId: 'N3u5P5PjKQU', title: 'Aragh Ke Ber', artist: 'Anuradha Paudwal' },
  { videoId: '6v9PSJFCEMo', title: 'Beriya Ke Beri', artist: 'T-Series Bhakti Sagar' },
  { videoId: 'SocuWpGE2z0', title: 'Darshan Dihi Na Apar Chhathi Maiya', artist: 'Anuradha Paudwal' },
  { videoId: 'iTffu3kgU7s', title: 'Rakho Sabhe Chhath Ke Barat', artist: 'Kavita Paudwal' },
  { videoId: 'WsvuH5QO23I', title: 'Kelwa Ke Paat Par', artist: 'Devi' },
  { videoId: 'O4ARvvmllCA', title: 'Tohe Badka Bhaiya Ho', artist: 'Sharda Sinha' },
  { videoId: '_RDu847nhmU', title: 'Patna Ke Ghat Par — Hamhu Aragiya', artist: 'Sharda Sinha' },
  { videoId: 'sH1bqkui-pA', title: 'Ho Dinanath', artist: 'T-Series Regional' },
  { videoId: '_ngNpxnA5hY', title: 'Kahele Mahadev Kari Haath Jodiya', artist: 'Pawan Singh' },
  { videoId: 'FIGYq0dsqQM', title: 'Chaar Hi Kunava Ke', artist: 'T-Series Regional' },
  { videoId: 'bL6rp6eI_2k', title: 'Chhath Ke Baratiya', artist: 'Sharda Sinha' },
  { videoId: 'fOVGz9WFymU', title: 'Ho Deenanath', artist: 'Sharda Sinha' },
  { videoId: '3ViLjNee1o0', title: 'Ho Deenanath (alternate)', artist: 'Sharda Sinha' },
];
```

### Task 6R: Narrative time axis

**Files:**
- Create: `src/lib/narrative.ts`
- Test: `src/lib/narrative.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `interface Stage { id: string; minutes: number }`
  - `STAGES: readonly Stage[]` — ascending by `minutes`, ids matching `ritual.ts`
  - `narrativeMinutes(progress: number): number`

`progress` is `0`–`1` across the whole scrollable page. The returned minute may
exceed 1440; `paletteAt` and `discAt` already normalise modulo 1440, which is
what lets the closing sunrise be minute 1810.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { STAGES, narrativeMinutes } from './narrative';

describe('STAGES', () => {
  it('is strictly ascending, so scrolling never runs time backwards', () => {
    for (let i = 1; i < STAGES.length; i++) {
      expect(STAGES[i].minutes).toBeGreaterThan(STAGES[i - 1].minutes);
    }
  });

  it('has unique ids', () => {
    expect(new Set(STAGES.map((s) => s.id)).size).toBe(STAGES.length);
  });

  it('spans pre-dawn to the morning after the closing sunrise', () => {
    expect(STAGES[0].minutes).toBe(270);
    expect(STAGES.at(-1)!.minutes).toBeGreaterThan(1440);
  });
});

describe('narrativeMinutes', () => {
  it('returns the first and last stage minutes at the extremes', () => {
    expect(narrativeMinutes(0)).toBe(STAGES[0].minutes);
    expect(narrativeMinutes(1)).toBe(STAGES.at(-1)!.minutes);
  });

  it('clamps progress outside 0..1', () => {
    expect(narrativeMinutes(-5)).toBe(STAGES[0].minutes);
    expect(narrativeMinutes(5)).toBe(STAGES.at(-1)!.minutes);
  });

  it('hits each stage exactly at its own scroll position', () => {
    STAGES.forEach((stage, i) => {
      const progress = i / (STAGES.length - 1);
      expect(narrativeMinutes(progress)).toBeCloseTo(stage.minutes, 6);
    });
  });

  it('increases monotonically across the whole scroll', () => {
    let previous = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const m = narrativeMinutes(i / 200);
      expect(m).toBeGreaterThanOrEqual(previous);
      previous = m;
    }
  });

  it('interpolates between stages rather than snapping', () => {
    const first = STAGES[0].minutes;
    const second = STAGES[1].minutes;
    const half = narrativeMinutes(0.5 / (STAGES.length - 1));
    expect(half).toBeGreaterThan(first);
    expect(half).toBeLessThan(second);
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
npx vitest run src/lib/narrative.test.ts
```
Expected: FAIL — cannot resolve `./narrative`.

- [ ] **Step 3: Implement**

```ts
/** One narrative section, anchored to a point on the symbolic day. */
export interface Stage {
  /** Matches the section id in `content/ritual.ts`. */
  id: string;
  /**
   * Minutes on the narrative axis. Strictly ascending across STAGES, and
   * allowed to exceed 1440 — `paletteAt` and `discAt` normalise modulo 1440,
   * so the closing sunrise is 1810 (= 370 the next day).
   */
  minutes: number;
}

/**
 * The symbolic arc. Chhath's four days are NOT monotonic in sun-time — Kharna's
 * fast breaks at dusk, which is later than Sandhya Arghya's sunset — so a
 * literal chronology would run the sun backwards as the reader scrolls forward.
 * The page therefore compresses four days into one continuous passage of light,
 * and the copy states each rite's real timing.
 */
export const STAGES: readonly Stage[] = [
  { id: 'intro', minutes: 270 },
  { id: 'preparation', minutes: 480 },
  { id: 'nahay-khay', minutes: 660 },
  { id: 'kharna', minutes: 930 },
  { id: 'sandhya-arghya', minutes: 1035 },
  { id: 'kosi-bharai', minutes: 1260 },
  { id: 'usha-arghya', minutes: 1810 },
  { id: 'prasad', minutes: 1920 },
  { id: 'unique', minutes: 2000 },
  { id: 'credits', minutes: 2060 },
];

/**
 * Maps scroll progress to a narrative minute, interpolating between the two
 * bracketing stages so the sky moves continuously rather than snapping.
 * @param progress Fraction of the page scrolled, 0..1. Clamped.
 * @returns The narrative minute, which may exceed 1440.
 */
export function narrativeMinutes(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  const span = 1 / (STAGES.length - 1);
  const raw = p / span;
  const i = Math.min(STAGES.length - 2, Math.floor(raw));
  const t = raw - i;
  const from = STAGES[i].minutes;
  const to = STAGES[i + 1].minutes;
  return from + (to - from) * t;
}
```

- [ ] **Step 4: Run to verify passing**

```bash
npx vitest run src/lib/narrative.test.ts
```
Expected: PASS, all 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/narrative.ts src/lib/narrative.test.ts
git commit -m "feat: add scroll-driven narrative time axis"
```

### Task 7R onward

Remaining tasks — `content/ritual.ts`, the revised `global.css` scroll layout,
`Scene.astro` with the Kosi sugarcane canopy and the soop/daura, `Section.astro`,
the scroll-driven scene driver replacing the clock driver, `Player.astro` as a
persistent bar, `index.astro` composing ten sections, and the verification pass —
are specified during execution against the revised spec, which is the authority
for content and behavior. The DOM contract, error table, and accessibility
requirements in that spec are binding.

---

## Self-Review

**Spec coverage.** Walking the spec section by section:

| Spec requirement | Task |
|---|---|
| Astro static, zero runtime deps | 1 |
| Oklab interpolation, not sRGB | 2 |
| Nine keyframes, arghya peaks, midnight wrap | 3 |
| Sun disc as the only moving element | 4, 7, 8 |
| Per-visit shuffle | 5, 9 |
| Dead-id exclusion | 5, 9 |
| CSS sky + SVG silhouettes, no raster assets | 6, 7 |
| Silhouette as a constant, not interpolated | 6 |
| Visitor's local clock drives the sky | 8, 10 |
| Recompute on visibilitychange | 8 |
| Player visible, unobscured, 200×200 | 6, 7 note, 10, 11 step 4 |
| Entry gate for the autoplay gesture | 10 |
| Scene and player decoupled | 8, 10 (scene starts before and independently of the player) |
| Error table: API load failure | 10 (`catch` → `showUnavailable`) |
| Error table: codes 100/101/150 skip silently | 9 (`FATAL_CODES`) |
| Error table: all tracks fail | 9 (`onUnavailable`) → 10 |
| Error table: autoplay still blocked | 10 (toggle button remains available) |
| `prefers-reduced-motion` | 6, 11 step 6 |
| Contrast at lightest and darkest keyframes | 6, 11 step 6 |
| One `<h1>`, `aria-live` on the title | 10 |
| Testing: sky bracketing, wrap, no grey mud | 3, 2 |
| Testing: sun below horizon, peak, monotonic, continuous | 4 |
| Testing: shuffle is a permutation, dead ids excluded | 5 |
| Testing: `youtube.ts` manual smoke only | 11 step 4 |
| Copy is Hindi with minimal English chrome | 10 |

No gaps. Every "out of scope" item in the spec has no task, correctly.

**Placeholder scan.** No `TBD`, no "add error handling", no "similar to Task N". Every code step carries real code. The one intentional empty value — `TRACKS` — is documented as deliberate, has a task that fills it, and the app is specified to handle it empty.

**Type consistency.** Checked across tasks:

- `Palette` fields `skyTop`/`skyHorizon`/`water`/`diyaGlow` are identical in Task 3's definition, Task 8's consumption, and Task 6's CSS names.
- `mixOklab(from, to, t)` is defined in Task 2 and called with that arity in Task 3.
- `discAt` returns `{ kind, x, y, altitude }` in Task 4 and exactly those four fields are read in Task 8.
- `SUNRISE_MINUTES = 370` and `SUNSET_MINUTES = 1035` in Task 4 match the `Usha Arghya` and `Sandhya Arghya` keyframe minutes in Task 3, and Task 3's test asserts those two numbers — so the two modules cannot silently drift apart.
- `shuffle(items, rand)` and `playableTracks(tracks, dead)` are defined in Task 5 with the same signatures used in Task 9.
- `PlayerHandle` methods `play`/`pause`/`next`/`current`/`destroy` are defined in Task 9 and only `play`/`pause`/`next` are used in Task 10 — no method is called that does not exist.
- The DOM ids in Task 10's contract table match those in `Header.astro`, `NowPlaying.astro`, `EntryGate.astro`, `Scene.astro` (`disc`, `reflection`), and every `getElementById` in `boot.ts` and `scene.ts`.
- CSS variable names in Task 6 match `sceneVars`' output keys in Task 8 exactly — Task 8's first test asserts the full sorted key list, which locks the contract.

One inconsistency found and fixed while reviewing: `sceneVars` emits `--disc-halo` as a bare `r g b` triplet, which requires `Scene.astro` to wrap it as `rgb(var(--disc-halo) / 0.55)` rather than using it directly. Task 7's gradients do exactly that, and Task 8's test asserts the triplet format so the two cannot drift.
