import { describe, expect, it } from 'vitest';
import { STAGES } from './narrative';
import { sceneVars } from './scene-vars';

const HEX = /^#[0-9a-f]{6}$/;

describe('sceneVars', () => {
  // Locks the CSS variable contract shared with global.css and Scene.astro.
  it('emits every property in the CSS variable contract', () => {
    expect(Object.keys(sceneVars(720)).sort()).toEqual([
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
    expect(v['--sky-top']).toMatch(HEX);
    expect(v['--water']).toMatch(HEX);
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
      expect(sceneVars(m)['--sky-top']).toMatch(HEX);
      expect(Number(sceneVars(m)['--disc-y'])).not.toBeNaN();
    }
  });

  it('produces valid output at every narrative stage, including beyond one day', () => {
    for (const stage of STAGES) {
      const v = sceneVars(stage.minutes);
      expect(v['--sky-top']).toMatch(HEX);
      expect(v['--sky-horizon']).toMatch(HEX);
      expect(Number(v['--disc-y'])).not.toBeNaN();
    }
  });

  it('lights the diyas at Kosi Bharai and puts them out at the closing sunrise', () => {
    const kosi = STAGES.find((s) => s.id === 'kosi-bharai')!;
    const usha = STAGES.find((s) => s.id === 'usha-arghya')!;
    expect(Number(sceneVars(kosi.minutes)['--diya-glow'])).toBeGreaterThan(0.9);
    expect(Number(sceneVars(usha.minutes)['--diya-glow'])).toBeLessThan(0.4);
  });
});
