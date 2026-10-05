import { describe, it, expect } from 'vitest';
import { calculateAllTransits } from '../engine/campaignTransitEngine';

describe('Campaign Transit Engine', () => {
  it('calculates transits when stages are enabled at 100% scale', () => {
    const stagesState = {
      complex_1: { enabled: true, scale: 1.0 },
      complex_5: { enabled: true, scale: 1.0 }
    };

    const transits = calculateAllTransits(stagesState, {});
    expect(transits.complex_5).toBeDefined();

    // Stage 1 produces concrete for Stage 5
    const concreteTransit = transits.complex_5.find(t => t.itemId === 'concrete');
    expect(concreteTransit).toBeDefined();
    expect(concreteTransit.rate).toBeCloseTo(494, 1);
    expect(concreteTransit.deficit).toBe(0);
  });

  it('detects deficit when source stage is disabled', () => {
    const stagesState = {
      complex_1: { enabled: false, scale: 1.0 },
      complex_5: { enabled: true, scale: 1.0 }
    };

    const transits = calculateAllTransits(stagesState, {});
    const concreteTransit = transits.complex_5?.find(t => t.itemId === 'concrete');
    expect(concreteTransit).toBeDefined();
    expect(concreteTransit.rate).toBe(0);
    expect(concreteTransit.deficit).toBeCloseTo(494, 1);
  });

  it('scales transit rates proportionally to source scale', () => {
    const stagesState = {
      complex_1: { enabled: true, scale: 0.5 },
      complex_5: { enabled: true, scale: 1.0 }
    };

    const transits = calculateAllTransits(stagesState, {});
    const concreteTransit = transits.complex_5?.find(t => t.itemId === 'concrete');
    expect(concreteTransit).toBeDefined();
    expect(concreteTransit.rate).toBeCloseTo(494 * 0.5, 1);
    expect(concreteTransit.deficit).toBeCloseTo(494 * 0.5, 1); // 50% deficit
  });

  it('uses frozen stage outputs as guaranteed supply', () => {
    const stagesState = {
      complex_1: { enabled: false, scale: 1.0 }, // Disabled in live config
      complex_5: { enabled: true, scale: 1.0 }
    };
    const frozenStages = {
      complex_1: {
        isFrozen: true,
        snapshot: {
          outputs: [{ itemId: 'concrete', rate: 500 }]
        }
      }
    };

    const transits = calculateAllTransits(stagesState, frozenStages);
    const concreteTransit = transits.complex_5?.find(t => t.itemId === 'concrete');
    expect(concreteTransit).toBeDefined();
    expect(concreteTransit.rate).toBeCloseTo(494, 1);
    expect(concreteTransit.deficit).toBe(0); // Supplied by frozen factory!
  });
});
