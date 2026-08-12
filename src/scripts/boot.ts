import { chhathStatus, splitDuration } from '../lib/chhath';
import { formatTime } from '../lib/format';
import { STAGES, narrativeMinutes } from '../lib/narrative';
import { TRACKS, type Track } from '../lib/playlist';
import { sceneVars } from '../lib/scene-vars';
import { stageVars } from '../lib/stages';
import { discAt } from '../lib/sun';
import { bookingOpensAt, bookingReminderEvent, googleCalendarUrl } from '../lib/travel';
import { type PlayerHandle, createPlayer } from '../lib/youtube';

/** SVG viewBox dimensions, matching Scene.astro. */
const VIEW_W = 1600;
const VIEW_H = 900;

/*
 * Horizontal inset of the disc's arc, as a percentage of width.
 *
 * discAt() returns x as clean 0..100 progress, which would place the disc exactly
 * on the viewBox edge at sunrise and sunset — cropping it in half at the two
 * arghya moments, which are the emotional peaks of both the festival and the
 * page. Insetting is a presentation concern, so it belongs here rather than in
 * the pure geometry module.
 */
const ARC_INSET = 7;

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const root = document.documentElement;
const disc = document.getElementById('disc');
const reflection = document.getElementById('reflection');
const sections = Array.from(document.querySelectorAll<HTMLElement>('.section'));

/** Index of the stage whose id matches a section element. */
const stageIndexOf = (el: HTMLElement): number =>
  STAGES.findIndex((s) => s.id === el.dataset.stage);

/**
 * Paints the scene for a narrative minute.
 * @param minutes Narrative minute; may exceed 1440.
 */
function paint(minutes: number): void {
  // Sky and disc colours, then one opacity per ritual layer.
  for (const [prop, value] of Object.entries(sceneVars(minutes))) {
    root.style.setProperty(prop, value);
  }
  for (const [prop, value] of Object.entries(stageVars(minutes))) {
    root.style.setProperty(prop, value);
  }

  // The disc and its reflection are positioned in SVG user units, so the
  // percentages from discAt() are scaled to the viewBox here.
  const { x, y } = discAt(minutes);
  const insetX = ARC_INSET + (x / 100) * (100 - 2 * ARC_INSET);
  const px = (insetX / 100) * VIEW_W;
  disc?.setAttribute('transform', `translate(${px} ${(y / 100) * VIEW_H})`);
  // Reflection is 160 wide, so offset by half to centre it under the disc.
  reflection?.setAttribute('x', String(px - 80));
}

/*
 * Dev-only affordances, stripped from production builds by Vite's dead-code
 * elimination on import.meta.env.DEV:
 *
 * - `__paintAt(1035)` paints an arbitrary narrative minute from the console.
 * - `?m=1035` pins the scene to one minute and ignores scroll entirely, which
 *   is how the nine keyframes get tuned by eye without scrubbing to each one.
 */
const pinnedMinute: number | null = (() => {
  if (!import.meta.env.DEV) return null;
  const raw = new URLSearchParams(window.location.search).get('m');
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
})();

if (import.meta.env.DEV) {
  (window as unknown as { __paintAt?: (m: number) => void }).__paintAt = paint;
}

/** Fraction of the page scrolled, 0..1. */
function scrollProgress(): number {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  return scrollable <= 0 ? 0 : window.scrollY / scrollable;
}

/*
 * Continuous mode: the sky interpolates with every scroll frame, which is the
 * page's signature effect.
 *
 * Reduced-motion mode abandons it deliberately — scroll-linked continuous
 * animation is a known trigger — and snaps to the nearest section's own minute
 * instead.
 */
if (reduceMotion) {
  const snap = (): void => {
    const middle = window.scrollY + window.innerHeight / 2;
    let nearest = sections[0];
    let best = Infinity;
    for (const el of sections) {
      const centre = el.offsetTop + el.offsetHeight / 2;
      const d = Math.abs(centre - middle);
      if (d < best) {
        best = d;
        nearest = el;
      }
    }
    const i = nearest ? stageIndexOf(nearest) : 0;
    paint(STAGES[i === -1 ? 0 : i]!.minutes);
  };
  snap();
  window.addEventListener('scroll', snap, { passive: true });
} else {
  /*
   * Coalesce scroll events into one paint per frame.
   *
   * Deliberately NOT a boolean latch set before the rAF call: browsers suspend
   * requestAnimationFrame entirely while the document is hidden, so a latch
   * would stick on forever and permanently freeze the sky if any scrolling
   * happened while the tab was in the background (scroll restoration does
   * exactly that). Cancel-and-reschedule cannot get stuck, and when the
   * document is hidden we skip the coalescing altogether since it would never
   * flush.
   */
  let rafId = 0;

  const render = (): void =>
    paint(pinnedMinute ?? narrativeMinutes(scrollProgress()));

  const onScroll = (): void => {
    if (document.hidden) {
      render();
      return;
    }
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      rafId = 0;
      render();
    });
  };

  render();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // Catch up immediately on return from a background tab.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) render();
  });
}

/* --- Section entrance and the progress rail ----------------------------- */

const dots = Array.from(document.querySelectorAll<HTMLButtonElement>('.rail__dot'));

const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      const i = stageIndexOf(entry.target as HTMLElement);
      dots.forEach((dot, k) => dot.setAttribute('aria-current', String(k === i)));
    }
  },
  { threshold: 0.35 },
);

for (const el of sections) observer.observe(el);

dots.forEach((dot) => {
  dot.addEventListener('click', () => {
    document.getElementById(dot.dataset.target ?? '')?.scrollIntoView({
      behavior: reduceMotion ? 'auto' : 'smooth',
      block: 'center',
    });
  });
});

/* --- Player -------------------------------------------------------------- */

/* --- Countdown to the next Chhath ---------------------------------------- */

/** Hindi names for the four days, indexed to match DAY_IDS. */
const DAY_NAMES = ['नहाय खाय', 'खरना', 'संध्या अर्घ्य', 'उषा अर्घ्य'] as const;

/**
 * Fills the opening screen's countdown and keeps it ticking.
 *
 * Runs entirely on the client because which festival is "next" depends on when
 * the page is viewed, and this is a static build. If the tabulated dates have
 * run out the widget simply stays hidden rather than showing a guess.
 */
function startCountdown(): void {
  const root = document.getElementById('countdown');
  if (!root) return;

  const labelEl = document.getElementById('countdown-label');
  const datesEl = document.getElementById('countdown-dates');
  const daysEl = document.getElementById('cd-days');

  /** Formats the festival's date span in Hindi, in IST. */
  const formatSpan = (days: readonly number[]): string => {
    const opts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Kolkata',
    };
    const first = new Intl.DateTimeFormat('hi-IN', opts).format(new Date(days[0]!));
    const last = new Intl.DateTimeFormat('hi-IN', { ...opts, year: 'numeric' }).format(
      new Date(days[3]!),
    );
    return `${first} – ${last}`;
  };

  const tick = (): void => {
    const status = chhathStatus(new Date());

    if (status.kind === 'unknown') {
      root.hidden = true;
      return;
    }

    root.hidden = false;

    if (status.kind === 'during') {
      root.classList.add('is-live');
      const name = DAY_NAMES[status.dayIndex] ?? '';
      if (labelEl) labelEl.textContent = `आज ${name} है`;
      if (datesEl) datesEl.textContent = formatSpan(status.days);
      return;
    }

    root.classList.remove('is-live');
    if (labelEl) labelEl.textContent = 'अगली छठ पूजा';

    const { days } = splitDuration(status.msRemaining);
    if (daysEl) daysEl.textContent = String(days);
    if (datesEl) datesEl.textContent = formatSpan(status.days);
  };

  tick();
  // Days only, so a per-second tick would be pure waste. A minute is plenty to
  // roll the number over promptly at IST midnight.
  window.setInterval(tick, 60_000);
}

startCountdown();

/* --- Train booking reminder ----------------------------------------------- */

/** Where to send people once booking is already open. */
const IRCTC_URL = 'https://www.irctc.co.in/';

/**
 * Fills the travel widget: pick a journey date, see the morning booking opens,
 * and take a prefilled Google Calendar reminder for 07:30 that day.
 *
 * The calendar link is a template only — following it opens Google's own compose
 * screen and the person still presses save themselves. This site never writes to
 * anyone's calendar.
 */
function startTravelReminder(): void {
  const root = document.getElementById('travel');
  const select = document.getElementById('travel-journey') as HTMLSelectElement | null;
  const opensEl = document.getElementById('travel-opens');
  const cta = document.getElementById('travel-cta') as HTMLAnchorElement | null;
  if (!root || !select || !opensEl || !cta) return;

  const status = chhathStatus(new Date());
  if (status.kind === 'unknown') {
    root.hidden = true;
    return;
  }

  const nahayKhay = status.days[0]!;
  const dayFormat = new Intl.DateTimeFormat('hi-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    timeZone: 'Asia/Kolkata',
  });

  /*
   * Journey dates from ten days before Nahay Khay up to the day before it —
   * for Chhath 2026 that is 3 to 12 November. People take long leave and travel
   * home well ahead, so a three-day window was far too narrow. Every option is
   * before the festival begins, since the point is to be home for it.
   */
  const EARLIEST_DAYS_BEFORE = 10;
  const options = Array.from(
    { length: EARLIEST_DAYS_BEFORE },
    (_, i) => nahayKhay - (EARLIEST_DAYS_BEFORE - i) * 86_400_000,
  );
  select.innerHTML = '';
  options.forEach((journeyMs, i) => {
    const option = document.createElement('option');
    option.value = String(journeyMs);
    option.textContent = dayFormat.format(new Date(journeyMs));
    // Default to arriving the day before Nahay Khay.
    if (i === options.length - 1) option.selected = true;
    select.append(option);
  });

  const render = (): void => {
    const journeyMs = Number(select.value);
    const opensMs = bookingOpensAt(journeyMs);
    const alreadyOpen = Date.now() >= opensMs;

    const opensLabel = new Intl.DateTimeFormat('hi-IN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Asia/Kolkata',
    }).format(new Date(opensMs));

    if (alreadyOpen) {
      root.classList.add('is-open');
      opensEl.innerHTML = 'बुकिंग <strong>खुल चुकी है</strong> — अभी देखें।';
      cta.textContent = 'IRCTC पर बुक करें';
      cta.href = IRCTC_URL;
      return;
    }

    root.classList.remove('is-open');
    opensEl.innerHTML = `बुकिंग खुलेगी <strong>${opensLabel}</strong>, सुबह 8 बजे।`;
    cta.textContent = 'Google Calendar में रिमाइंडर जोड़ें';
    cta.href = googleCalendarUrl(bookingReminderEvent(journeyMs));
  };

  select.addEventListener('change', render);
  render();
  root.hidden = false;
}

startTravelReminder();

/* --- Player --------------------------------------------------------------- */

const bar = document.querySelector<HTMLElement>('.player');
const titleEl = document.getElementById('track-title');
const artistEl = document.getElementById('track-artist');
const coverEl = document.getElementById('cover-img') as HTMLImageElement | null;
const fillEl = document.getElementById('player-fill');
const timeEl = document.getElementById('player-time');
const trackEl = document.getElementById('player-track');

/**
 * Puts the player bar into its unavailable state. The journey keeps working:
 * the ritual content is server-rendered HTML and is the product's floor.
 */
function showUnavailable(): void {
  const controls = document.getElementById('player-controls');
  const scrub = document.querySelector<HTMLElement>('.player__scrub');
  if (titleEl) titleEl.textContent = 'संगीत अभी उपलब्ध नहीं है';
  if (artistEl) artistEl.textContent = '';
  if (controls) controls.hidden = true;
  if (scrub) scrub.hidden = true;
  bar?.classList.add('is-paused');
}

/** Shows a track's text and swaps in its YouTube thumbnail as the cover. */
function showTrack(track: Track): void {
  if (titleEl) titleEl.textContent = track.title;
  if (artistEl) artistEl.textContent = track.artist;
  if (coverEl) {
    coverEl.hidden = false;
    // mqdefault is 320x180 and always present; the cover crops it to a circle.
    coverEl.src = `https://i.ytimg.com/vi/${track.videoId}/mqdefault.jpg`;
    coverEl.onerror = () => {
      coverEl.hidden = true;
    };
  }
}

/** Paints the progress line and the time readout. */
function showProgress(handle: PlayerHandle): void {
  const p = handle.progress();
  if (!p) return;
  const fraction = p.duration > 0 ? p.elapsed / p.duration : 0;
  if (fillEl) fillEl.style.width = `${Math.min(100, fraction * 100).toFixed(2)}%`;
  if (timeEl) {
    timeEl.textContent = `${formatTime(p.elapsed)} / ${formatTime(p.duration)}`;
  }
  trackEl?.setAttribute('aria-valuetext', `${formatTime(p.elapsed)} of ${formatTime(p.duration)}`);
}

/** Wires the transport controls and the seek bar to a live player handle. */
function bindControls(handle: PlayerHandle): void {
  const toggle = document.getElementById('btn-toggle');

  toggle?.addEventListener('click', () => {
    // Drive off the class rather than a local flag, so the button stays correct
    // when YouTube changes state on its own (ads, buffering stalls, track ends).
    if (bar?.classList.contains('is-paused')) handle.play();
    else handle.pause();
  });

  document.getElementById('btn-next')?.addEventListener('click', () => handle.next());
  document.getElementById('btn-prev')?.addEventListener('click', () => handle.previous());

  trackEl?.addEventListener('click', (event) => {
    const rect = trackEl.getBoundingClientRect();
    if (rect.width === 0) return;
    handle.seek(((event as MouseEvent).clientX - rect.left) / rect.width);
    showProgress(handle);
  });

  /*
   * setInterval rather than requestAnimationFrame: rAF is suspended while the
   * document is hidden, and a stalled progress line is worse than a coarse one.
   * 500ms is imperceptible on a 4px bar showing whole seconds.
   */
  window.setInterval(() => showProgress(handle), 500);
}

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
        onTrackChange: showTrack,
        onPlayingChange: (playing) => {
          bar?.classList.toggle('is-paused', !playing);
          document
            .getElementById('btn-toggle')
            ?.setAttribute('aria-label', playing ? 'Pause' : 'Play');
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
