# Chhath Radio — Design

**Date:** 2026-08-13
**Revised:** 2026-08-13 — restructured from ambient player to journey-first after
the playlist arrived and the scope grew to cover how Chhath is performed.
**Status:** Approved

## Goal

A single scrolling page that explains how Chhath Puja is performed — the
preparation, the four days, the prasad, and what makes the festival unlike any
other — while the playlist plays continuously and the sky moves with you.

Scrolling is the mechanism. As you move down the page, the sun crosses the sky,
sets, the diyas are lit, and dawn breaks on the final offering. The ritual is not
described alongside a picture; the page *performs* it.

Music is accompaniment, not the subject. It never stops and never restarts
between sections.

## Locked decisions

| Decision | Choice | Why |
|---|---|---|
| Structure | Journey-first, scroll-driven | The ritual is the content; ambient listening is the backdrop |
| Audio source | YouTube IFrame Player | Catalog already exists; no hosting, no licensing exposure |
| Playback model | Per-visitor, one shuffled rotation | Static site; songs are not matched to sections |
| Sky driver | **Scroll position**, not the clock | The narrative sets the time of day |
| Scene rendering | CSS gradient sky + SVG silhouettes | No licensing risk, tiny payload, continuous transitions |
| Scene architecture | Keyframes + Oklab interpolation | Colors stay art-directable; motion stays smooth |
| Stack | Astro, static output | Zero JS by default, one island |

### Reversed from the previous revision

- **The visitor's local clock no longer drives the sky.** It was the right call for
  an ambient page and the wrong one here — the narrative owns the time of day now.
- **The header clock is dropped.** It anchored a page that was about "now". This
  page is about a four-day ritual, so a live clock is noise.
- **Songs are not mapped to ritual stages.** Considered and rejected: several tracks
  do name specific moments, but tagging them would leave thin sections musically
  bare. One shuffled rotation across the whole page.

## The narrative time axis

The four days are **not monotonic in sun-time**. Kharna's fast breaks at dusk,
which is later in the day than Sandhya Arghya's sunset. A literal chronology
would make the sun run backwards as you scroll forward.

So the page compresses four days into **one symbolic arc** on an axis that only
increases. This is an acknowledged liberty, not an oversight: the copy states the
real timing of each rite even where the sky shows a compressed one.

Because narrative minutes may exceed 1440 and both `paletteAt` and `discAt`
normalise modulo 1440, the closing sunrise is simply minute 1810. No change to
the pure modules is needed to support this.

| # | Section | Narrative minutes | Sky reads as |
|---|---|---|---|
| 0 | Intro / entry gate | 270 | Pre-dawn |
| 1 | तैयारी — Preparation | 480 | Morning |
| 2 | नहाय खाय — Nahay Khay | 660 | Late morning |
| 3 | खरना — Kharna | 930 | Afternoon |
| 4 | संध्या अर्घ्य — Sandhya Arghya | 1035 | **Sunset** |
| 5 | कोसी भराई — Kosi Bharai | 1260 | Night, diyas lit |
| 6 | उषा अर्घ्य — Usha Arghya | 1810 (= 370 next day) | **Sunrise** |
| 7 | प्रसाद — What is in the soop | 1920 (= 480) | Morning after |
| 8 | क्या खास है — What makes it unique | 2000 | Later morning |
| 9 | Credits and tribute | 2060 | Later morning |

The two arghya sections are the emotional peaks and carry the most saturated
treatment. The page opens pre-dawn and closes the morning after the final
sunrise, so the whole arc is one continuous passage of light.

**Interpolation between sections is continuous.** Scrolling halfway between
Sandhya Arghya (1035) and Kosi Bharai (1260) yields minute 1147 and the sky that
belongs to it. The sun does not snap between states.

## Architecture

```
chhath-radio/
├── astro.config.mjs
├── package.json
├── docs/
└── src/
    ├── pages/index.astro          # single route, composes all sections
    ├── components/
    │   ├── Scene.astro            # fixed SVG backdrop, server-rendered once
    │   ├── Section.astro          # one narrative section wrapper
    │   ├── Player.astro           # persistent now-playing bar
    │   └── EntryGate.astro        # title screen + the audio gesture
    ├── content/
    │   └── ritual.ts              # ALL copy and section data, one place
    ├── lib/
    │   ├── color.ts               # PURE — hex ↔ Oklab, channel lerp
    │   ├── sky.ts                 # PURE — 24h keyframes, paletteAt()
    │   ├── sun.ts                 # PURE — discAt()
    │   ├── scene-vars.ts          # PURE — minutes → CSS custom properties
    │   ├── narrative.ts           # PURE — scroll progress → narrative minutes
    │   ├── playlist.ts            # PURE — Track, shuffle, playableTracks
    │   └── youtube.ts             # STATEFUL — IFrame API wrapper
    ├── scripts/
    │   └── boot.ts                # the island: scroll observer + player wiring
    └── styles/global.css
```

`content/ritual.ts` holds every piece of user-facing copy and each section's
narrative minute. Sections are then rendered by iterating it. Copy lives in data,
not scattered through markup, so it can be corrected without touching layout —
which matters for religious and cultural detail that may need a native speaker's
review.

`narrative.ts` is new and is the only genuinely new logic this revision adds: it
maps a scroll position to a narrative minute by interpolating between the
bracketing sections. It is pure and unit-tested.

### Data flow

```
  scroll position ──▶ narrative.ts ──▶ minutes ──▶ scene-vars.ts ──▶ CSS vars
                                                        │
                                                  sky.ts + sun.ts

  user gesture ──▶ youtube.ts ──▶ track metadata ──▶ player bar DOM
```

The scene and the player remain **fully decoupled**. The sky does not know what
is playing; the player does not know where you have scrolled. Either can fail
without taking the other down — if YouTube is blocked, the visitor still gets the
full illustrated ritual guide, which is now the majority of the page's value.

## Content

All copy is Hindi-first with English support, since the audience is primarily
Bhojpuri/Maithili speakers and the diaspora. Every factual claim below is sourced.

### 0. Intro

Title, one-line framing, and the tap target that starts audio.

> छठ पूजा — सूर्य को अर्घ्य, चार दिन का महापर्व
> A four-day festival to the sun. Scroll to walk through it.

The intro also carries the **countdown widget** (see below).

### Countdown to the next Chhath

A frosted card on the opening screen showing days, hours, minutes and seconds
until the next festival, with its date span beneath.

Chhath is lunisolar — Kartik Shukla Shashthi — so the dates **cannot be computed**
from the Gregorian calendar and are tabulated in `lib/chhath.ts`. Only the
Shashthi (Sandhya Arghya) date is stored per year; the other three days are
consecutive around it, derived as −2, −1, 0, +1. Verified entries:

| Year | Shashthi | Festival runs |
|---|---|---|
| 2026 | 15 November | 13–16 November |
| 2027 | 4 November | 2–5 November |

Behaviour:

- **Before** a festival: counts down to 00:00 IST on Nahay Khay.
- **During**: the units are replaced by the day's name — "आज खरना है".
- **After** the last day: rolls to the following year automatically.
- **Past the final tabulated year**: reports `unknown` and the widget **hides
  itself**. It does not extrapolate a lunisolar date it cannot know. Adding a
  year is a one-line change.

Deliberately **not** counting down to precise arghya moments: those follow local
sunset and sunrise, and publishing per-minute times would be inventing precision.
The target is the start of the festival in IST.

It runs entirely client-side. The site is a static build, so which festival is
"next" depends on when the page is *viewed*, not when it was built — a
server-rendered value would go stale.

The ticking numbers are `aria-hidden`, since a per-second live region is
unusable with a screen reader; a visually hidden line states the same
information once. Figures are tabular so the seconds do not jitter the layout.

### 1. तैयारी — Preparation

Before the four days begin: the house is cleaned thoroughly, wheat is washed,
dried and ground for thekua, and the kitchen turns strictly satvik — no onion,
no garlic, no meat. Bamboo **soop** (a winnowing tray) and **daura** (the large
carrying basket) are bought new from local weavers.

### 2. नहाय खाय — Nahay Khay (Day 1)

"Bathe and eat." Devotees bathe in a river or pond, ideally the Ganga, then eat a
single satvik meal — traditionally rice, chana dal, and bottle gourd (lauki)
cooked in pure ghee. The meal marks the entry into ritual purity.

### 3. खरना — Kharna (Day 2)

A full day's fast from sunrise to sunset with nothing at all. At dusk it is
broken with **kheer and puri** offered first to Surya. That meal is also the last
food and water for 36 hours — the *nirjala* fast begins the moment it ends.

*(The sky in this section reads as afternoon; the rite itself happens at dusk.)*

### 4. संध्या अर्घ्य — Sandhya Arghya (Day 3, sunset)

The vratti stands in the water at sunset and offers arghya to the **setting** sun.
The soop is packed with thekua, sugarcane, coconut, bananas, turmeric root and
diyas, carried to the ghat in the daura. Families gather on the banks.

### 5. कोसी भराई — Kosi Bharai (Day 3, night)

Five to seven sugarcane stalks are tied into a canopy, and 12 to 24 earthen lamps
are lit beneath it, with thekua and fruit placed inside. It is performed by those
whose vow has been fulfilled, as a celebratory repayment — and repeated again
between 3 and 4 in the morning before the family leaves for the ghat.

### 6. उषा अर्घ्य — Usha Arghya (Day 4, sunrise)

Back in the water before first light, the final arghya goes to the **rising** sun.
When it is done, the 36-hour waterless fast is broken with the prasad. This is
the climax of the festival and of the page.

### 7. प्रसाद — What is in the soop

**Thekua** — the festival's signature prasad: whole wheat flour, jaggery and ghee,
often with cardamom or grated coconut, pressed into discs and deep-fried.
**Kasar** — rice flour and jaggery balls. Alongside them: sugarcane, banana,
coconut, turmeric root, lemon, sweet potato, radish, and seasonal fruit. The
produce is a thanksgiving for the harvest.

### 8. क्या खास है — What makes Chhath unique

- It is the only festival that worships **both the setting and the rising sun** —
  gratitude for the light already given, and a prayer for the light to come.
- **No priest, no idol, no temple.** The fasting person stands in the water and
  offers directly. There is no intermediary.
- **Chhathi Maiya** is held in folk tradition to be Surya's sister, a protective
  maternal goddess invoked for children's long life.
- The fast is **36 hours without food or water**, most often kept by women, called
  vratti or parvaitin.

### 9. Credits and tribute

A note that the playlist is dominated by **Sharda Sinha**, "Bihar Kokila", whose
voice is inseparable from Chhath. She died on 5 November 2024, the first day of
Chhath that year, one day after releasing her final Chhath song.

### Sources

- [Britannica — Chhath Puja](https://www.britannica.com/topic/Chhath-Puja)
- [Svastika — significance, rituals, vrat vidhi](https://svastika.in/blogs/indian-festivals/chhath-puja-significance-rituals-vrat-vidhi)
- [NewsX — step-by-step ritual guide](https://www.newsx.com/offbeat/chhath-puja-2025-complete-step-by-step-ritual-guide-for-nahay-khay-kharna-arghya-99358/)
- [NewsX — full samagri list](https://www.newsx.com/offbeat/chhath-puja-2025-full-samagri-list-of-thekua-fruits-diyas-puja-essentials-99405/)
- [Outlook — guide to Chhath prasad and thekua](https://www.outlookindia.com/brand-studio/the-ultimate-guide-to-chhath-puja-prasad-offerings-2025)
- [Dharohar — the tradition of Kosi Bharai](https://dharohar.hargharpuja.com/how-is-the-ritual-of-kosi-bharai-performed-during-chhath-puja/5020)
- [Daily Jagran — why Chhathi Maiya is worshipped](https://www.thedailyjagran.com/spiritual/chhath-puja-2025-why-devotees-worship-chhathi-maiya-during-chhath-mahaparv-10275309)
- [Wikipedia — Sharda Sinha](https://en.wikipedia.org/wiki/Sharda_Sinha)

**Copy review is an open item.** The Hindi above is written by a non-native
speaker and should be checked by someone fluent before the site is shared, along
with the ritual details, which vary by family and region.

## The sky system

Unchanged from the previous revision except for its input.

A 24-hour timeline of authored keyframes. Given a minute, find the two keyframes
bracketing it and interpolate.

**Interpolation happens in Oklab, not sRGB.** Crossing a warm sunset into a cool
dusk in sRGB passes through grey mud; Oklab keeps the midpoint saturated.
Interpolation is done in **JS only**, in Cartesian Oklab (`L, a, b`) rather than
polar Oklch — Oklab avoids hue-wraparound ambiguity and matches what
`color-mix(in oklab, …)` does. `sky.ts` converts the two bracketing keyframes to
Oklab, lerps each channel, converts back to hex, and writes resolved values to
CSS custom properties on `:root`.

| Time | Stage | Sky top | Sky horizon | Water | Diya glow |
|---|---|---|---|---|---|
| 00:00 | Night | `#0B1026` | `#1B2A4A` | `#0A1A2E` | 1.00 |
| 04:30 | Pre-dawn | `#1E2A44` | `#4A4A6A` | `#1A2438` | 0.75 |
| 06:10 | **Usha Arghya** | `#2E4A7A` | `#FF7A3C` | `#C97A4E` | 0.30 |
| 08:00 | Morning | `#4A8FD6` | `#BFE0F5` | `#7FA8C4` | 0.00 |
| 12:00 | Midday | `#3B82C4` | `#CFE6F7` | `#8FB6D0` | 0.00 |
| 15:30 | Afternoon | `#5A8FC0` | `#F2D9A8` | `#A89478` | 0.00 |
| 17:15 | **Sandhya Arghya** | `#3A2A5E` | `#E8613C` | `#B85A3C` | 0.25 |
| 18:30 | Dusk | `#221A3A` | `#7A4A5E` | `#3A2A38` | 0.70 |
| 20:00 | Night | `#0B1026` | `#1B2A4A` | `#0A1A2E` | 1.00 |

The 20:00 and 00:00 entries are deliberately identical so the wrap across
midnight is invisible.

### The scene

One `position: fixed` SVG backdrop behind all sections. It is server-rendered
once and never re-created; only CSS custom properties change as you scroll, so
there is no DOM churn and no layout thrash.

### Ritual layers

The scene is not one fixed picture that recolours. On top of the permanent stage
sit **eight ritual layers, one per narrative stage**, each showing what its
section describes:

| Stage | What the scene shows |
|---|---|
| तैयारी | Grinding wheat at the chakki, a chulha alight with smoke climbing, new soop and daura stacked |
| नहाय खाय | A figure standing waist-deep, lifting water in cupped hands, rings spreading outward |
| खरना | Kheer on the fire, a seated figure waiting, a lamp on the step |
| संध्या अर्घ्य | Three figures in the water, arms raised, **water pouring from the lota** toward the setting sun, and a laden soop |
| कोसी भराई | Five sugarcane stalks tied into a canopy with lamps beneath |
| उषा अर्घ्य | A larger gathering, five figures, mirrored to face the rising sun |
| प्रसाद | The soop laid out — thekua, sugarcane, coconut, bananas, turmeric root |
| क्या खास है | The ghat crowded, eight silhouettes along the bank |

Visibility comes from `stages.ts`, which is pure and unit-tested. Each stage gets
a **triangular window**: opacity 1 at its own minute, falling to 0 at each
neighbouring stage. Adjacent rites therefore cross-fade and the weights **always
sum to exactly 1**, which matters because the stages are very unevenly spaced —
80 minutes apart at the end, 225 in the middle. A fixed falloff would make the
late rites pile up on one another. This replaces the bespoke `--kosi` variable of
the previous revision.

**Layout constraint worth remembering:** the far bank is an opaque band from
roughly y 520 to 558. Anything dark drawn into it merges with it and disappears —
the arghya figures were first drawn there and read as featureless tree trunks.
Figures therefore stand below y 600, silhouetted against the lit water. Only
light or rising elements (smoke, the canopy apex) belong in that band.

### Ambient motion

The scene should never be completely frozen, but nothing should pull the eye.
Every animation is slow, small, and out of phase: ripple bands drift laterally
over 26–41s, floating diyas rise and settle, chulha smoke climbs and dissipates,
the arghya pour runs as a travelling dash down the stream, and rings spread from
the bather. Smoke is drawn **dark, not white** — both rites that use it happen in
daylight, where white smoke on a pale sky was invisible.

### Motion

One thing moves with the sky: the sun disc, whose arc position comes from
`discAt`. Diyas flicker via CSS keyframes, desynchronised by per-element
`animation-delay`.

Section text fades and rises slightly as it enters view. This is the only
scroll-linked motion on content, and it is short.

### Accessibility

- `prefers-reduced-motion: reduce` stops diya flicker and the text entrance, and
  makes the sky **snap per section** rather than interpolating continuously
  during scroll. Scroll-linked continuous animation is a known trigger, so the
  reduced-motion path deliberately abandons the page's signature effect.
- All text sits on a scrim, never directly on the gradient, so contrast holds at
  every point of the arc. Verified against the lightest daytime keyframe and the
  darkest night keyframe — the two worst cases.
- Semantic structure: one `<h1>`, each section a `<section>` with an `<h2>`.
  The page is fully readable and comprehensible with CSS and JS disabled, since
  all copy is server-rendered. The sky is decoration over real content.
- Controls are real `<button>` elements, keyboard reachable, with visible focus.
- The now-playing title updates via `aria-live="polite"`.
- The SVG backdrop is `aria-hidden`.

## The player

`youtube.ts` wraps the IFrame Player API. Tracks live in `playlist.ts`, populated
from the supplied playlist (see Playlist below).

**Entry gate.** Browsers block audio autoplay and the IFrame API needs a genuine
user gesture, so the intro section carries the tap target. It is the title screen,
so the requirement costs nothing.

**Player appearance and visibility.** The bar is modelled on saloon.wtf's, whose
measurements were taken directly from the live site: a `border-radius: 999px`
pill, `white/10` fill with `blur(40px) saturate(1.5)`, a 1px `white/20` border,
16px gap, and 12/20/12/12 padding — 528×107 at desktop. Inside it: an 80×80
**circular cover that rotates once every 8 seconds** like a record, the title and
artist, a 4px fully-rounded progress line on a `white/20` track, a `m:ss` time
readout, then a 36×36 ghost previous button, a 44×44 **solid white** play/pause
button with a black glyph, and a 36×36 ghost next button.

This **reverses the earlier decision** to make the iframe itself the artwork tile:

- The cover is an 80px circle, far smaller than the 200×200 an embed needs, so the
  iframe cannot serve as it. The cover is the video's own thumbnail from
  `i.ytimg.com/vi/<id>/mqdefault.jpg`, cropped to a circle.
- The iframe is therefore parked off-view at its real 640×360 inside
  `.player__video` — translated out of the viewport, `opacity: 0`,
  `pointer-events: none`. It is deliberately **not** `display: none`, which can
  stop the IFrame API initialising and makes duration misreport.
- **This is a deliberate trade-off against YouTube's terms**, which expect the
  player visible and unobscured. It is the arrangement saloon.wtf itself uses —
  its live page carries a real `youtube.com/embed/...?controls=0&disablekb=1`
  iframe parked out of sight. Recorded here as a known, chosen risk rather than
  an oversight, so it can be revisited.

The bar starts in its paused state and only clears it when the API reports
playback actually began, so a refused autoplay shows a play button rather than
claiming to play. Under 480px the record shrinks to 56px and the time readout is
dropped before the title is allowed to truncate.

Seeking is supported: the progress track is a real `<button>`, so it is keyboard
reachable, and a click maps its x-position to a fraction of the duration.

Progress is polled on a 500ms `setInterval` rather than `requestAnimationFrame`,
because rAF is suspended while the document is hidden and a frozen progress line
is worse than a coarse one.

**Shuffle.** Fisher–Yates per visit, so repeat visits do not open on the same song.

**Continuity.** The player is outside the scrolling sections and is never
re-mounted. Scrolling the full page start to finish does not interrupt playback.

### Error handling

| Failure | Behavior |
|---|---|
| IFrame API script fails to load | Page and scene work normally; player bar shows an offline state. No dialog. |
| Video unembeddable (101 / 150) | Skip to next, mark the id dead for the session. Silent. |
| Video unavailable (100) or invalid (2, 5) | Same skip path. |
| Every track fails | Bar shows "संगीत अभी उपलब्ध नहीं है". The journey is unaffected. |
| Autoplay still blocked after gesture | Surface the play button rather than pretending it is playing. |

The governing rule: **the ritual content is the product's floor.** It is
server-rendered HTML. Audio and the animated sky are both enhancements.

## Playlist

Source: `Chaath Songs - Classical`
(`PL-HJTkuLZnWxbBolNkLTql6PUUdXgknjX`) — 25 videos, 1 hidden as unavailable, 24
extracted.

**23 tracks will be used.** Item 24, `gcVbtUGLDNk` — "Aapka Kya Hoga Janabe Ali"
from *Housefull* — is a Bollywood item song, not a Chhath geet, and is excluded
as an evident accident in the source playlist.

Extracted ids are recorded and each **must be verified to actually play in an
embed** before shipping. YouTube Music art tracks are frequently
embedding-disabled, and this is the single most likely reason a finished build
would be silent. Ids that fail are reported so alternate uploads of the same song
can be substituted.

## Testing

Vitest against the pure modules:

- `color.ts` — white/black anchors, round-trip fidelity, out-of-gamut clamping,
  and that an Oklab midpoint stays more saturated than the naive sRGB average
- `sky.ts` — keyframe bracketing, exact-keyframe hits, midnight wraparound,
  valid hex at every minute, diyas lit at night and out in daylight
- `sun.ts` — below horizon at night, peak at solar noon, monotonic through the
  morning, continuous across midnight, position always in range
- `narrative.ts` — monotonic across the whole scroll, exact section minutes at
  section boundaries, correct interpolation between sections, clamped at both ends
- `stages.ts` — each rite is fully on at its own stage and fully off at every
  other, neighbours cross-fade evenly at the midpoint, the first and last stages
  stay open beyond the ends of the arc, and **the weights sum to 1 everywhere**,
  which is the property that makes uneven stage spacing safe
- `playlist.ts` — shuffle is a permutation that never drops or duplicates, is
  deterministic for a given rand, and dead ids are excluded
- `chhath.ts` — the four days derive correctly from Shashthi including across a
  month boundary, the status switches to `during` at the exact moment the
  festival begins, rolls to the next year once it ends, reports `unknown` past
  the last tabulated year, and never returns a negative countdown
- `format.ts` — `m:ss` under an hour and `h:mm:ss` above, fractions truncate, and
  NaN or Infinity collapse to `0:00` rather than rendering "NaN:NaN" into the bar
  (YouTube reports NaN duration before metadata arrives)

`youtube.ts` and DOM wiring get no unit tests — mocking the IFrame API tests the
mock. They get a manual smoke pass: load, play, skip, a deliberately dead id, and
an empty rotation.

## Explicitly out of scope (YAGNI)

Cut deliberately:

- Server-synced playback and a live listener count. Needs a backend and fights
  YouTube's player.
- Songs mapped to ritual stages. Chosen against above.
- A live clock anywhere on the page.
- Accounts, favorites, comments, sharing.
- Photographs or raster illustration. The scene stays CSS and SVG.
- A language toggle. Copy is Hindi-first with inline English, not two versions.
- Per-region ritual variants. The page presents the common Bihar/UP form and says
  so rather than attempting to cover every family's practice.

## Open questions

1. **Hindi copy and ritual detail need a native-speaker review** before sharing.
   Practice varies by family and region; the page should say which form it shows.
2. **Hosting target.** Assumed Vercel or Cloudflare Pages. Either serves Astro
   static output with no configuration worth discussing.
