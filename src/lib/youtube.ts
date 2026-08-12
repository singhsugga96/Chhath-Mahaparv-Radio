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
 * Error codes the IFrame API reports for a video that will never play:
 * 2 invalid id, 5 HTML5 playback failure, 100 removed or private, and
 * 101 / 150 embedding disabled by the uploader.
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
 * Playback order is shuffled per visit. Tracks reporting a fatal error are
 * marked dead for the session and skipped, so a rotation containing
 * embedding-disabled videos degrades to the playable subset rather than
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
  // The IFrame API surface is untyped here on purpose — see the note at the
  // bottom of this file.
  let player: any = null;

  const currentTrack = (): Track | null => order[index] ?? null;

  /** Rebuilds the order from surviving tracks. Returns false if none remain. */
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

/*
 * The `any` types above are deliberate and confined to this module. Typing the
 * IFrame API properly would mean either a runtime dependency on @types/youtube
 * or hand-writing a large ambient declaration, for a surface touched in six
 * places. This is the one module allowed to be loosely typed, which is exactly
 * why all the tested logic lives elsewhere.
 */
