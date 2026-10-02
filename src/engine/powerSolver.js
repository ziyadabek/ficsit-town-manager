import powerData from '../database/powerData.json';

export function calculateNuclearRecycling(wasteRate) {
  if (wasteRate <= 0) return null;

  // Этап 1: Блендер (Non-fissile Uranium)
  // Из 10 отходов АЭС 7.5 идут в блендер, 2.5 в ускоритель.
  const w1 = 0.75 * wasteRate;
  const blenders = w1 / 15;
  const nfUranium = blenders * 20;
  const silica = blenders * 10;
  const nitricAcid = blenders * 15;
  const sulfuricAcid = blenders * 15;
  const blenderPower = blenders * 75;

  // Этап 2: Ускоритель частиц (Plutonium Pellets)
  const accelerators = nfUranium / 100;
  const pellets = accelerators * 30;
  const acceleratorPower = accelerators * 500; // 500 MW avg для пеллет

  // Этап 3: Ассемблер (Encased Plutonium Cell)
  const assemblers = pellets / 10;
  const cells = assemblers * 5;
  const concrete = assemblers * 20;
  const assemblerPower = assemblers * 15;

  // Этап 4: Мануфактурщик (Plutonium Fuel Rod)
  const manufacturers = cells / 30;
  const rods = manufacturers * 0.25;
  const steelBeams = manufacturers * 18;
  const ecr = manufacturers * 6;
  const heatSinks = manufacturers * 10;
  const manufacturerPower = manufacturers * 55;

  const totalParasiticPower = blenderPower + acceleratorPower + assemblerPower + manufacturerPower;

  return {
    rods,
    totalParasiticPower,
    machines: [
      { name: 'Блендер (Non-fissile Uranium)', count: blenders, power: blenderPower },
      { name: 'Ускоритель частиц (Plutonium Pellets)', count: accelerators, power: acceleratorPower },
      { name: 'Ассемблер (Encased Plutonium Cell)', count: assemblers, power: assemblerPower },
      { name: 'Мануфактурщик (Plutonium Fuel Rod)', count: manufacturers, power: manufacturerPower }
    ],
    materials: [
      { name: 'Кремнезем (Silica)', rate: silica },
      { name: 'Азотная кислота (Nitric Acid)', rate: nitricAcid },
      { name: 'Серная кислота (Sulfuric Acid)', rate: sulfuricAcid },
      { name: 'Бетон (Concrete)', rate: concrete },
      { name: 'Стальные балки (Steel Beam)', rate: steelBeams },
      { name: 'ЭМ-управляющие стержни (ECR)', rate: ecr },
      { name: 'Теплоотводы (Heat Sink)', rate: heatSinks }
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
