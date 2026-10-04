export const CONVEYOR_LIMITS = {
  mk1: 60,
  mk2: 120,
  mk3: 270,
  mk4: 480,
  mk5: 780,
  mk6: 1200
};

export const PIPE_LIMITS = {
  mk1: 300,
  mk2: 600
};

/**
 * Validates a conveyor or pipe flow and returns status based on user limits
 * @param {number} flow Rate in items per minute
 * @param {boolean} isFluid Whether the item is a fluid
 * @param {number} maxBelt Selected max belt capacity
 * @param {number} maxPipe Selected max pipe capacity
 * @returns {object} { alert: boolean, mk: string, lines: number, message: string }
 */
export function validateLogistics(flow, isFluid = false, maxBelt = 1200, maxPipe = 600) {
  const effectiveMaxPipe = maxPipe || 600;
  const effectiveMaxBelt = maxBelt || 1200;

  if (isFluid) {
    if (flow <= effectiveMaxPipe) {
      const mk = flow <= PIPE_LIMITS.mk1 ? 'Труба Mk.1' : 'Труба Mk.2';
      return { alert: false, mk, lines: 1 };
    }
    
    const lines = Math.ceil(flow / effectiveMaxPipe);
    return {
      alert: true,
      mk: `Труба > ${effectiveMaxPipe} м³/мин`,
      lines,
      message: `Внимание! Лимит трубы (${effectiveMaxPipe} м³/мин) превышен. Требуется параллельных труб: ${lines}.`
    };
  }

  if (flow <= effectiveMaxBelt) {
    let mk = 'Mk.6';
    if (flow <= CONVEYOR_LIMITS.mk1) mk = 'Mk.1';
    else if (flow <= CONVEYOR_LIMITS.mk2) mk = 'Mk.2';
    else if (flow <= CONVEYOR_LIMITS.mk3) mk = 'Mk.3';
    else if (flow <= CONVEYOR_LIMITS.mk4) mk = 'Mk.4';
    else if (flow <= CONVEYOR_LIMITS.mk5) mk = 'Mk.5';
    return { alert: false, mk, lines: 1 };
  }
  
  const lines = Math.ceil(flow / effectiveMaxBelt);
  return { 
    alert: true, 
    mk: `Лента > ${effectiveMaxBelt} шт/мин`, 
    lines, 
    message: `Внимание! Лимит ленты (${effectiveMaxBelt} шт/мин) превышен. Требуется параллельных лент: ${lines}.` 
  };
}
