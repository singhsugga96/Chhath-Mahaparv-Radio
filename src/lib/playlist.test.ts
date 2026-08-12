import { describe, expect, it } from 'vitest';
import { TRACKS, type Track, playableTracks, shuffle } from './playlist';

/** A rand stub that walks a fixed sequence, cycling if exhausted. */
const seeded = (values: readonly number[]): (() => number) => {
  let i = 0;
  return () => values[i++ % values.length]!;
};

const track = (id: string): Track => ({ videoId: id, title: id, artist: 'a' });

describe('TRACKS', () => {
  it('holds the 23 verified Chhath tracks', () => {
    expect(TRACKS).toHaveLength(23);
  });

  it('has no duplicate video ids', () => {
    expect(new Set(TRACKS.map((t) => t.videoId)).size).toBe(TRACKS.length);
  });

  it('uses well-formed 11-character YouTube ids', () => {
    for (const t of TRACKS) {
      expect(t.videoId).toMatch(/^[A-Za-z0-9_-]{11}$/);
    }
  });

  it('never includes the Bollywood item song from the source playlist', () => {
    expect(TRACKS.map((t) => t.videoId)).not.toContain('gcVbtUGLDNk');
  });

  it('gives every track a title and an artist', () => {
    for (const t of TRACKS) {
      expect(t.title.trim()).not.toBe('');
      expect(t.artist.trim()).not.toBe('');
    }
  });
});

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

  /*
   * Guards against a shuffle that silently does nothing.
   *
   * The seed must be 0, not something near 1: Fisher-Yates with rand -> 0.99
   * always picks j === i, so every swap is a no-op and the identity permutation
   * is the CORRECT result for that seed. rand -> 0 swaps each element with
   * index 0 and is guaranteed to reorder a list this size.
   */
  it('actually reorders rather than returning the input order', () => {
    const input = [1, 2, 3, 4, 5, 6];
    expect(shuffle(input, seeded([0]))).not.toEqual(input);
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

  it('preserves the real rotation intact', () => {
    const out = shuffle(TRACKS, seeded([0.2, 0.8, 0.5, 0.1, 0.9]));
    expect(new Set(out.map((t) => t.videoId))).toEqual(
      new Set(TRACKS.map((t) => t.videoId)),
    );
  });
});

describe('playableTracks', () => {
  it('excludes tracks whose ids are marked dead', () => {
    const tracks = [track('a'), track('b'), track('c')];
    expect(playableTracks(tracks, new Set(['b'])).map((t) => t.videoId)).toEqual(['a', 'c']);
  });

  it('returns everything when nothing is dead', () => {
    expect(playableTracks([track('a'), track('b')], new Set())).toHaveLength(2);
  });

  it('returns empty when every track is dead', () => {
    expect(playableTracks([track('a'), track('b')], new Set(['a', 'b']))).toEqual([]);
  });

  it('does not mutate the input', () => {
    const tracks = [track('a'), track('b')];
    playableTracks(tracks, new Set(['a']));
    expect(tracks).toHaveLength(2);
  });
});
