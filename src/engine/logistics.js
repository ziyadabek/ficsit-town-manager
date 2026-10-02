export const CONVEYOR_LIMITS = {
  mk1: 60,
  mk2: 120,
  mk3: 270,
  mk4: 480,
  mk5: 780,
  mk6: 1200
};

/**
 * Validates a conveyor flow and returns status
 * @param {number} flow Rate in items per minute
 * @returns {object} { alert: boolean, mk: string, lines: number, message: string }
 */
export function validateConveyor(flow) {
  if (flow <= CONVEYOR_LIMITS.mk1) return { alert: false, mk: 'Mk.1', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk2) return { alert: false, mk: 'Mk.2', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk3) return { alert: false, mk: 'Mk.3', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk4) return { alert: false, mk: 'Mk.4', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk5) return { alert: false, mk: 'Mk.5', lines: 1 };
  if (flow <= CONVEYOR_LIMITS.mk6) return { alert: false, mk: 'Mk.6', lines: 1 }; // Полная поддержка 1200/min без предупреждений
  
  // Превышение абсолютного лимита Mk.6
  const lines = Math.ceil(flow / CONVEYOR_LIMITS.mk6);
  return { 
    alert: true, 
    mk: 'Mk.6+', 
    lines, 
    message: `Критический перегруз! Лимит ленты Mk.6 (1200 шт/мин) превышен. Требуется балансировка Manifold-сплиттером на ${lines} параллельных магистралей.` 
  };
}
