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
  // Этап 1 ──► Этап 6 (Бетон на тяжелые каркасы и ж/б балки)
  { source: "complex_1", target: "complex_5", itemId: "concrete", baseRate: 494 },
  // Этап 3 ──► Этап 4 (Пластины на метизный цех)
  { source: "complex_2b", target: "complex_3", itemId: "iron_plate", baseRate: 500 },
  // Этап 3 ──► Этап 6 (Стальные трубы на каркасы, балки и моторы)
  { source: "complex_2b", target: "complex_5", itemId: "steel_pipe", baseRate: 880 },
  // Этап 4 ──► Этап 6 (Модульные каркасы на тяжелые каркасы)
  { source: "complex_3", target: "complex_5", itemId: "modular_frame", baseRate: 27 },
  // Этап 4 ──► Этап 7 (Винты на компьютеры)
  { source: "complex_3", target: "complex_6", itemId: "screws", baseRate: 208 },
  // Этап 5 ──► Этап 7 (Пластик с нефтехимического энергоблока на платы и компьютеры)
  { source: "power_4a", target: "complex_6", itemId: "plastic", baseRate: 160 },
  // Этап 5 ──► Этап 8 (Нефтяной кокс на алюминиевый завод для электродов)
  { source: "power_4a", target: "complex_7", itemId: "petroleum_coke", baseRate: 300 },
  // Этап 6 ──► Этап 10 (Моторы на ракеты и турбомоторы)
  { source: "complex_5", target: "complex_8b", itemId: "motor", baseRate: 10 },
  // Этап 6 ──► Этап 10 (Тяжелые каркасы на Фазу 4 Лифта)
  { source: "complex_5", target: "complex_8b", itemId: "heavy_modular_frame", baseRate: 2.5 },
  // Этап 6 ──► Этап 9 (Ж/б балки на АЭС)
  { source: "complex_5", target: "power_8a", itemId: "encased_industrial_beam", baseRate: 15 },
  // Этап 7 ──► Этап 10 (Компьютеры на компоненты Лифта)
  { source: "complex_6", target: "complex_8b", itemId: "computer", baseRate: 3 },
  // Этап 8 ──► Этап 10 (Алюминиевые гильзы на Фазу 4)
  { source: "complex_7", target: "complex_8b", itemId: "aluminum_casing", baseRate: 150 },
  // Этап 8 ──► Этап 10 (Алюминиевые листы на Фазу 4)
  { source: "complex_7", target: "complex_8b", itemId: "aluminum_sheet", baseRate: 60 },
  // Этап 6 ──► Этап 11 (Тяжелые каркасы на Варп-двигатели Фазы 5)
  { source: "complex_5", target: "phase_5", itemId: "heavy_modular_frame", baseRate: 5 },
  // Этап 7 ──► Этап 11 (Суперкомпьютеры на Скафандры Фазы 5)
  { source: "complex_6", target: "phase_5", itemId: "supercomputer", baseRate: 5 },
  // Этап 8 ──► Этап 11 (Системы охлаждения на Скафандры Фазы 5)
  { source: "complex_7", target: "phase_5", itemId: "cooling_system", baseRate: 10 },
  // Этап 10 ──► Этап 11 (Ядерная паста на Фазу 5 Лифта)
  { source: "complex_8b", target: "phase_5", itemId: "nuclear_pasta", baseRate: 1 }
];

/**
 * Рассчитывает сквозной баланс и транзит для всех этапов кампании.
 * @param {Object} stagesState - состояние кампании: { [stageId]: { enabled: boolean, scale: number } }
 * @param {Object} frozenStages - состояние замороженных построенных этапов
 * @returns {Object} { [targetStageId]: [ { itemId, rate, deficit, sourceStageId, sourceStageName } ] }
 */
export function calculateAllTransits(stagesState, frozenStages = {}) {
  // 1. Собираем суммарный выпуск (Surplus) с каждого активного этапа
  const supplyPool = {}; 

  // Инициализируем пул
  STAGE_TRANSIT_ROUTES.forEach(route => {
    if (!supplyPool[route.source]) supplyPool[route.source] = {};
    if (supplyPool[route.source][route.itemId] === undefined) {
      supplyPool[route.source][route.itemId] = 0;
    }
  });

  // Заполняем пул фактическими выпусками
  STAGE_TRANSIT_ROUTES.forEach(route => {
    const isFrozen = frozenStages[route.source]?.isFrozen;
    if (isFrozen) {
      const frozenOutputs = frozenStages[route.source]?.snapshot?.outputs;
      if (frozenOutputs) {
        const itemOut = frozenOutputs.find(o => o.itemId === route.itemId);
        // Замороженный этап отдает в пул пропорцию базового маршрута от своего реального выпуска
        const outputRate = itemOut ? itemOut.rate : 0;
        supplyPool[route.source][route.itemId] += Math.min(outputRate, route.baseRate);
      } else {
        // Если снимок пуст, подстраховываемся базовым значением
        supplyPool[route.source][route.itemId] += route.baseRate;
      }
    } else {
      // Суммируем базовый выпуск для пула с учетом масштаба
      const sourceState = stagesState[route.source] || { enabled: true, scale: 1.0 };
      const multiplier = sourceState.enabled ? sourceState.scale : 0;
      supplyPool[route.source][route.itemId] += route.baseRate * multiplier;
    }
  });

  // 2. Распределяем ресурсы по потребителям с пропорциональной балансировкой пула
  // Предварительный проход: вычисляем суммарный спрос по каждому источнику и ресурсу
  const totalDemandBySourceItem = {};
  STAGE_TRANSIT_ROUTES.forEach(route => {
    const targetState = stagesState[route.target] || { enabled: true, scale: 1.0 };
    if (!targetState.enabled) return;

    const key = `${route.source}__${route.itemId}`;
    const needed = route.baseRate * targetState.scale;
    totalDemandBySourceItem[key] = (totalDemandBySourceItem[key] || 0) + needed;
  });

  const transitsByTarget = {};

  STAGE_TRANSIT_ROUTES.forEach(route => {
    const targetState = stagesState[route.target] || { enabled: true, scale: 1.0 };
    
    // Если целевой этап выключен, ему транзит не нужен
    if (!targetState.enabled) return;

    const requiredAmount = route.baseRate * targetState.scale;
    const totalDemand = totalDemandBySourceItem[`${route.source}__${route.itemId}`] || requiredAmount;
    const availableInPool = supplyPool[route.source]?.[route.itemId] || 0;

    // Взвешенное пропорциональное выделение: если спрос превышает доступный пул,
    // все потребители этого источника получают равную относительную долю (ratio),
    // исключая дефицит из-за порядка обхода массива маршрутов.
    const allocationRatio = totalDemand > 0.001 && availableInPool < totalDemand
      ? availableInPool / totalDemand
      : 1.0;

    const providedAmount = Math.min(requiredAmount * allocationRatio, availableInPool);
    const deficit = Math.max(0, requiredAmount - providedAmount);

    // --- ЛОГИСТИКА: РАСЧЕТ ТРАНСПОРТА ---
    let stackSize = 100;
    const stackSizeMap = {
      concrete: 500, iron_plate: 200, steel_pipe: 200, modular_frame: 50,
      screws: 500, plastic: 200, petroleum_coke: 200, motor: 50,
      heavy_modular_frame: 50, encased_industrial_beam: 100, computer: 50,
      aluminum_casing: 200, aluminum_sheet: 200, uranium: 100,
      cooling_system: 100, supercomputer: 50, nuclear_pasta: 50
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

    // Время кругового рейса зависит от дистанции между этапами кампании
    const STAGE_ORDER = [
      'complex_1', 'power_2a', 'complex_2b', 'complex_3', 'power_4a',
      'complex_5', 'complex_6', 'complex_7', 'power_8a', 'complex_8b', 'phase_5'
    ];
    const sourceIdx = STAGE_ORDER.indexOf(route.source);
    const targetIdx = STAGE_ORDER.indexOf(route.target);
    const stageHops = Math.max(1, Math.abs(targetIdx - sourceIdx));
    const secondsPerHop = transportType === 'tractor' ? 90 : 60;
    const roundTripTimeSeconds = stageHops * secondsPerHop * 2; // туда и обратно

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
