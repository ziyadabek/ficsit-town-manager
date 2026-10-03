import powerData from '../database/powerData.json';

export function calculateNuclearRecycling(wasteRate) {
  if (wasteRate <= 0) return null;

  // ─── Точные коэффициенты по Satisfactory 1.0 Wiki ─────────────────────────
  // Шаг 1: Блендер (Non-fissile Uranium)
  //   Рецепт: 37.5 Nuclear Waste/мин + 25 Uranium/мин + 15 Nitric Acid/мин
  //           + 15 Sulfuric Acid/мин → 50 Non-fissile Uranium/мин | 75 МВт
  //
  // Шаг 2: Ускоритель частиц (Plutonium Pellets)
  //   Рецепт: 100 Non-fissile Uranium/мин + 25 Nuclear Waste/мин
  //           → 30 Plutonium Pellets/мин | ~500 МВт (среднее)
  //
  // Математика: каждый ускоритель требует 2 блендера (100 NfU / 50 = 2)
  //   → Отходы на ускоритель: 2×37.5 (блендеры) + 25 (прямо) = 100/мин
  //   → accelerators = wasteRate / 100; blenders = wasteRate / 50
  // ──────────────────────────────────────────────────────────────────────────
  const blenders     = wasteRate / 50;
  const accelerators = wasteRate / 100;

  const nfUranium         = blenders     * 50;   // произведено NfU/мин
  const pellets           = accelerators * 30;   // произведено гранул/мин
  const blenderPower      = blenders     * 75;   // МВт
  const acceleratorPower  = accelerators * 500;  // МВт (среднее)

  // Дополнительное сырьё для блендеров
  const uranium      = blenders * 25;   // Uranium/мин (из шахты или склада)
  const nitricAcid   = blenders * 15;   // Nitric Acid/мин
  const sulfuricAcid = blenders * 15;   // Sulfuric Acid/мин

  // Шаг 3: Ассемблер (Encased Plutonium Cell)
  //   Рецепт: 10 Pellets/мин + 20 Concrete/мин → 5 Cells/мин | 15 МВт
  const assemblers      = pellets  / 10;
  const cells           = assemblers * 5;
  const concrete        = assemblers * 20;
  const assemblerPower  = assemblers * 15;

  // Шаг 4: Производитель (Plutonium Fuel Rod)
  //   Рецепт: 7.5 Cells/мин + 4.5 Steel Beams/мин + 1.5 ECM/мин
  //           + 2.5 Heat Sinks/мин → 0.25 Rods/мин | 55 МВт
  const manufacturers     = cells / 7.5;
  const rods              = manufacturers * 0.25;
  const steelBeams        = manufacturers * 4.5;
  const ecr               = manufacturers * 1.5;
  const heatSinks         = manufacturers * 2.5;
  const manufacturerPower = manufacturers * 55;

  const totalParasiticPower = blenderPower + acceleratorPower + assemblerPower + manufacturerPower;

  return {
    rods,
    totalParasiticPower,
    machines: [
      { name: 'Блендер (Non-fissile Uranium)',        count: blenders,      power: blenderPower },
      { name: 'Ускоритель частиц (Plutonium Pellets)',count: accelerators,  power: acceleratorPower },
      { name: 'Ассемблер (Encased Plutonium Cell)',   count: assemblers,    power: assemblerPower },
      { name: 'Производитель (Plutonium Fuel Rod)',   count: manufacturers, power: manufacturerPower }
    ],
    materials: [
      { name: 'Уран (Uranium)',                    rate: uranium },
      { name: 'Азотная кислота (Nitric Acid)',     rate: nitricAcid },
      { name: 'Серная кислота (Sulfuric Acid)',    rate: sulfuricAcid },
      { name: 'Бетон (Concrete)',                  rate: concrete },
      { name: 'Стальные балки (Steel Beam)',       rate: steelBeams },
      { name: 'ЭМ-управляющие стержни (ECM)',      rate: ecr },
      { name: 'Теплоотводы (Heat Sink)',           rate: heatSinks }
    ]
  };
}


export function solvePower(targetMW, generatorId, fuelId) {
  const gen = powerData.find(g => g.id === generatorId);
  if (!gen) return null;

  let fuel = null;
  if (gen.fuels.length > 0) {
    fuel = gen.fuels.find(f => f.id === fuelId) || gen.fuels[0];
  }

  // Number of generators
  const exactGens = targetMW / gen.power;
  const fullGens = Math.floor(exactGens);
  const remainder = exactGens - fullGens;
  const totalGens = Math.ceil(exactGens);
  
  const lastClockSpeed = remainder > 0 ? remainder * 100 : 100;

  // Water and Pumps
  const totalWater = exactGens * gen.water;
  const exactPumps = totalWater / 120; // Water extractor produces 120m3/min
  const totalPumps = Math.ceil(exactPumps);
  const pumpPower = exactPumps * 20; // 20 MW per pump exactly (or scaled)

  // Fuel consumption
  let totalFuelRate = 0;
  if (fuel) {
    totalFuelRate = exactGens * fuel.rate;
  }

  // Waste & Recycling
  let totalWasteRate = 0;
  let recycling = null;
  if (gen.waste) {
    totalWasteRate = exactGens * gen.waste.rate;
    if (gen.waste.id === 'nuclear_waste') {
      recycling = calculateNuclearRecycling(totalWasteRate);
    }
  }

  const totalParasitic = pumpPower + (recycling ? recycling.totalParasiticPower : 0);
  const netPower = targetMW - totalParasitic;

  return {
    generator: gen,
    fuel,
    grossPower: targetMW,
    netPower,
    parasiticPower: totalParasitic,
    pumpPower,
    generators: {
      count: totalGens,
      exact: exactGens,
      fullCount: fullGens,
      lastClock: lastClockSpeed
    },
    water: {
      totalRate: totalWater,
      pumps: exactPumps,
      pumpsFull: totalPumps,
      power: pumpPower
    },
    fuelLogistics: {
      rate: totalFuelRate
    },
    waste: {
      rate: totalWasteRate
    },
    recycling
  };
}
