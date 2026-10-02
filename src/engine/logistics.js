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
 * Validates a conveyor or pipe flow and returns status
 * @param {number} flow Rate in items per minute
 * @param {boolean} isFluid Whether the item is a fluid
 * @returns {object} { alert: boolean, mk: string, lines: number, message: string }
 */
export function validateLogistics(flow, isFluid = false) {
  if (isFluid) {
    if (flow <= PIPE_LIMITS.mk1) return { alert: false, mk: 'Труба Mk.1', lines: 1 };
    if (flow <= PIPE_LIMITS.mk2) return { alert: false, mk: 'Труба Mk.2', lines: 1 };
    
    const lines = Math.ceil(flow / PIPE_LIMITS.mk2);
    return {
      alert: true,
      mk: 'Труба Mk.2+',
      lines,
      message: `Внимание! Макс. поток трубы Mk.2 (600/мин) превышен. Требуется параллельных труб: ${lines}.`
    };
  }

  if (flow <= CONVEYOR_LIMITS.mk1) return { alert: false, mk: 'Mk.1', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk2) return { alert: false, mk: 'Mk.2', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk3) return { alert: false, mk: 'Mk.3', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk4) return { alert: false, mk: 'Mk.4', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk5) return { alert: false, mk: 'Mk.5', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk6) return { alert: false, mk: 'Mk.6', lines: 1 };
  
  const lines = Math.ceil(flow / CONVEYOR_LIMITS.mk6);
  return { 
    alert: true, 
    mk: 'Mk.6+', 
    lines, 
    message: `Внимание! Макс. поток ленты Mk.6 (1200/мин) превышен. Требуется параллельных лент: ${lines}.` 
  };
}
