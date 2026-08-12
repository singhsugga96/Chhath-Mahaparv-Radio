import { STAGES } from './narrative';

/**
 * How visible a stage's own scene layer is at a given narrative minute.
 *
 * A triangular window: 1 at the stage's own minute, falling to 0 at each
 * neighbouring stage. Adjacent stages therefore cross-fade into each other and
 * their weights always sum to 1, which holds regardless of how unevenly the
 * stages are spaced — and they are very unevenly spaced, from 80 minutes apart
 * at the end to 225 in the middle. A fixed falloff would make the late stages
 * pile up on top of one another.
 *
 * @param minutes Narrative minute; may exceed 1440.
 * @param index Index into {@link STAGES}.
 * @returns Opacity in 0..1.
 */
export function stageOpacity(minutes: number, index: number): number {
  const stage = STAGES[index];
  if (!stage) return 0;

  const cur = stage.minutes;
  if (minutes === cur) return 1;

  if (minutes < cur) {
    // Before the first stage there is nothing to fade from, so hold it open.
    const prev = index === 0 ? null : STAGES[index - 1]!.minutes;
    if (prev === null) return 1;
    if (minutes <= prev) return 0;
    return (minutes - prev) / (cur - prev);
  }

  // Past the last stage, likewise hold it open rather than fading to nothing.
  const next = index === STAGES.length - 1 ? null : STAGES[index + 1]!.minutes;
  if (next === null) return 1;
  if (minutes >= next) return 0;
  return 1 - (minutes - cur) / (next - cur);
}

/**
 * Maps a narrative minute to one CSS custom property per stage, named
 * `--s-<stage id>`, which the scene's ritual layers consume as their opacity.
 * Pure: no DOM, no clock, no randomness.
 *
 * @param minutes Narrative minute; may exceed 1440.
 * @returns CSS property names mapped to values, ready for `setProperty`.
 */
export function stageVars(minutes: number): Record<string, string> {
  const out: Record<string, string> = {};
  STAGES.forEach((stage, i) => {
    out[`--s-${stage.id}`] = stageOpacity(minutes, i).toFixed(3);
  });
  return out;
}
