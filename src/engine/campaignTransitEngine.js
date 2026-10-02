/**
 * campaignTransitEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Движок сквозной динамической связности этапов (Dynamic Multi-Stage Transit).
 * Рассчитывает потоки ресурсов между комплексами кампании.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import presets from '../database/campaignPresets.json';

// Создадим удобный маппинг имен этапов для красивого вывода
const STAGE_NAMES = presets.reduce((acc, p) => {
  acc[p.id] = p.name;
  return acc;
}, {});

// Жестко заданная матрица зависимостей между этапами (в шт/мин для scale = 1.0)
export const STAGE_TRANSIT_ROUTES = [
  // Этап 1 ──► Этап 6
  { source: "complex_1", target: "complex_5", itemId: "concrete", baseRate: 344 },
  // Этап 3 ──► Этап 4
  { source: "complex_2b", target: "complex_3", itemId: "iron_plate", baseRate: 500 },
  // Этап 3 ──► Этап 6
  { source: "complex_2b", target: "complex_5", itemId: "steel_pipe", baseRate: 780 },
  // Этап 4 ──► Этап 6
  { source: "complex_3", target: "complex_5", itemId: "modular_frame", baseRate: 27 },
  // Этап 4 ──► Этап 7
  { source: "complex_3", target: "complex_6", itemId: "screws", baseRate: 208 },
  // Этап 5 ──► Этап 7
  { source: "power_4a", target: "complex_6", itemId: "plastic", baseRate: 160 },
  // Этап 5 ──► Этап 8
  { source: "power_4a", target: "complex_7", itemId: "petroleum_coke", baseRate: 300 },
  // Этап 6 ──► Этап 10
  { source: "complex_5", target: "complex_8b", itemId: "motor", baseRate: 10 },
  { source: "complex_5", target: "complex_8b", itemId: "heavy_modular_frame", baseRate: 2.5 },
  // Этап 6 ──► Этап 9
  { source: "complex_5", target: "power_8a", itemId: "encased_industrial_beam", baseRate: 15 },
  // Этап 7 ──► Этап 10
  { source: "complex_6", target: "complex_8b", itemId: "computer", baseRate: 3 },
  // Этап 8 ──► Этап 9
  { source: "complex_7", target: "power_8a", itemId: "aluminum_casing", baseRate: 60 },
  // Этап 8 ──► Этап 10
  { source: "complex_7", target: "complex_8b", itemId: "aluminum_casing", baseRate: 90 },
  { source: "complex_7", target: "complex_8b", itemId: "aluminum_sheet", baseRate: 60 },
  // Этап 6 ──► Этап 11
  { source: "complex_5", target: "phase_5", itemId: "heavy_modular_frame", baseRate: 5 },
  // Этап 7 ──► Этап 11
  { source: "complex_6", target: "phase_5", itemId: "supercomputer", baseRate: 5 },
  // Этап 8 ──► Этап 11
  { source: "complex_7", target: "phase_5", itemId: "cooling_system", baseRate: 10 }
];

/**
 * Рассчитывает сквозной баланс и транзит для всех этапов кампании.
 * @param {Object} stagesState - состояние кампании: { [stageId]: { enabled: boolean, scale: number } }
 * @returns {Object} { [targetStageId]: [ { itemId, rate, deficit, sourceStageId, sourceStageName } ] }
 */
export function calculateAllTransits(stagesState) {
  // 1. Собираем суммарный выпуск (Surplus) с каждого активного этапа
  // Предполагаем, что этап производит ровно столько, сколько от него требуется в сумме по маршрутам (при scale=1.0)
  const supplyPool = {}; 

  // Инициализируем пул
  STAGE_TRANSIT_ROUTES.forEach(route => {
    if (!supplyPool[route.source]) supplyPool[route.source] = {};
    if (!supplyPool[route.source][route.itemId]) supplyPool[route.source][route.itemId] = 0;
    
    // Суммируем базовый выпуск для пула
    const sourceState = stagesState[route.source] || { enabled: true, scale: 1.0 };
    const multiplier = sourceState.enabled ? sourceState.scale : 0;
    
    // Добавляем долю этого маршрута в общий пул источника
    supplyPool[route.source][route.itemId] += route.baseRate * multiplier;
  });

  // 2. Распределяем ресурсы по потребителям
  const transitsByTarget = {};

  STAGE_TRANSIT_ROUTES.forEach(route => {
    const targetState = stagesState[route.target] || { enabled: true, scale: 1.0 };
    
    // Если целевой этап выключен, ему транзит не нужен
    if (!targetState.enabled) return;

    const requiredAmount = route.baseRate * targetState.scale;
    const availableInPool = supplyPool[route.source][route.itemId] || 0;

    // Выделяем объемы (с учетом того, что пул может исчерпаться)
    const providedAmount = Math.min(requiredAmount, availableInPool);
    const deficit = requiredAmount - providedAmount;

    // Списываем из пула
    supplyPool[route.source][route.itemId] -= providedAmount;

    // --- ЛОГИСТИКА: РАСЧЕТ ТРАНСПОРТА ---
    let stackSize = 100;
    const stackSizeMap = {
      concrete: 500, iron_plate: 200, steel_pipe: 200, modular_frame: 50,
      screws: 500, plastic: 200, petroleum_coke: 200, motor: 50,
      heavy_modular_frame: 50, encased_industrial_beam: 100, computer: 50,
      aluminum_casing: 200, aluminum_sheet: 200, uranium: 100,
      cooling_system: 100, supercomputer: 50
    };
    if (stackSizeMap[route.itemId]) stackSize = stackSizeMap[route.itemId];

    let transportType = 'tractor';
    let capacityPerTrip = 25 * stackSize; // 25 слотов для Трактора

    if (route.itemId === 'crude_oil' || route.itemId === 'water' || route.itemId === 'heavy_oil_residue') {
      transportType = 'train_fluid';
      capacityPerTrip = 1600; // 1600 м³ на цистерну
    } else if (route.itemId === 'uranium') {
      transportType = 'train_nuclear';
      capacityPerTrip = 32 * stackSize; // 32 слота на вагон
    } else if (route.target === 'complex_8b' || route.target === 'phase_5') {
      transportType = 'train';
      capacityPerTrip = 32 * stackSize; // 32 слота на грузовой вагон
    }

    const tripsPerMinute = requiredAmount / capacityPerTrip;
    const roundTripTimeSeconds = 300; // 5 минут на круг по умолчанию
    const vehicleCount = Math.max(1, Math.ceil(tripsPerMinute * (roundTripTimeSeconds / 60)));

    // Формируем входящий транзит (autoInput)
    if (!transitsByTarget[route.target]) transitsByTarget[route.target] = [];
    
    transitsByTarget[route.target].push({
      itemId: route.itemId,
      rate: providedAmount,
      required: requiredAmount, // сколько нужно было в идеале
      deficit: deficit > 0.001 ? deficit : 0,
      sourceStageId: route.source,
      sourceStageName: STAGE_NAMES[route.source] || route.source,
      isTransit: true,
      transport: {
        type: transportType,
        tripsPerMinute: tripsPerMinute,
        vehicleCount: vehicleCount,
        capacity: capacityPerTrip
      }
    });
  });

  return transitsByTarget;
}
