import { describe, it, expect } from 'vitest';
import { validateLogistics, CONVEYOR_LIMITS, PIPE_LIMITS } from '../engine/logistics';

describe('Logistics Engine', () => {
  it('identifies conveyor tiers correctly under standard limits', () => {
    expect(validateLogistics(50, false).mk).toBe('Mk.1');
    expect(validateLogistics(60, false).mk).toBe('Mk.1');
    expect(validateLogistics(120, false).mk).toBe('Mk.2');
    expect(validateLogistics(250, false).mk).toBe('Mk.3');
    expect(validateLogistics(480, false).mk).toBe('Mk.4');
    expect(validateLogistics(750, false).mk).toBe('Mk.5');
    expect(validateLogistics(1200, false).mk).toBe('Mk.6');
  });

  it('triggers alert when flow exceeds maxBelt option', () => {
    // With maxBelt set to Mk.3 (270)
    const result = validateLogistics(350, false, 270, 600);
    expect(result.alert).toBe(true);
    expect(result.lines).toBe(2);
    expect(result.message).toContain('270');
  });

  it('identifies pipe tiers correctly', () => {
    expect(validateLogistics(200, true).mk).toBe('Труба Mk.1');
    expect(validateLogistics(300, true).mk).toBe('Труба Mk.1');
    expect(validateLogistics(500, true).mk).toBe('Труба Mk.2');
  });

  it('triggers alert when fluid flow exceeds maxPipe option', () => {
    const result = validateLogistics(350, true, 1200, 300);
    expect(result.alert).toBe(true);
    expect(result.lines).toBe(2);
    expect(result.message).toContain('300');
  });
});
