import lp_solver from 'javascript-lp-solver';
import recipesDB from '../database/recipes.json';
import itemsDB from '../database/items.json';
import buildings from '../database/buildings.json';
import { calculatePower } from './overclock.js';

export function getRecipe(recipeId) {
  return recipesDB.find(r => r.id === recipeId);
}

const RAW_MATERIALS = ['limestone', 'iron_ore', 'copper_ore', 'coal', 'crude_oil', 'raw_quartz', 'water', 'bauxite', 'sulfur', 'nitrogen_gas', 'caterium_ore', 'sam_ore', 'uranium'];

export const BUILDING_TIERS = {
  smelter: 0,
  constructor: 0,
  miner_mk1: 0,
  assembler: 2,
  water_pump: 3,
  foundry: 3,
  miner_mk2: 3,
  coal_generator: 3,
  oil_pump: 5,
  refinery: 5,
  manufacturer: 5,
  miner_mk3: 5,
  fuel_generator: 5,
  blender: 7,
  particle_accelerator: 8,
  nuclear_generator: 8,
  converter: 9,
  quantum_encoder: 9
};

export const MAX_TIER_LIMITS = {
  tier1: 2,
  tier2: 4,
  tier3: 6,
  tier4: 8,
  unlimited: 99
};

export const PURITY_MULTIPLIERS = {
  impure: 0.5,
  normal: 1.0,
  pure: 2.0
};

export function solveProductionGraph(targets, inputsLimit, options = {}) {
  const model = {
    optimize: 'cost',
    opType: 'min',
    constraints: {},
    variables: {}
  };

  // 1. Outputs (Targets)
  targets.forEach(t => {
    if (model.constraints[t.itemId]) {
      model.constraints[t.itemId].equal += t.rate;
    } else {
      model.constraints[t.itemId] = { equal: t.rate };
    }
  });

  const allItems = new Set();
  targets.forEach(t => allItems.add(t.itemId));

  // 2. Filter Recipes based on options and explicit target recipe choices
  const forcedRecipesByItem = {};
  targets.forEach(t => {
    if (t.recipeId) {
      forcedRecipesByItem[t.itemId] = t.recipeId;
    }
  });

  let activeRecipes = recipesDB.filter(r => {
    // If maxTier is set, exclude recipes requiring higher tier buildings
    if (options.maxTier && options.maxTier !== 'unlimited') {
      const allowedTier = MAX_TIER_LIMITS[options.maxTier] ?? 99;
      const bTier = BUILDING_TIERS[r.buildingId] ?? 0;
      if (bTier > allowedTier) return false;
    }
    // If user explicitly picked a recipe for an item produced by this recipe:
    const producesForcedItem = r.outputs?.some(out => forcedRecipesByItem[out.itemId]);
    if (producesForcedItem) {
      // ONLY allow the forced recipe for this item!
      return r.outputs.some(out => forcedRecipesByItem[out.itemId] === r.id);
    }
    return !r.isAlternate || (options.altRecipes && options.altRecipes.includes(r.id));
  });
  
  if (options.generatorId) {
    activeRecipes = activeRecipes.filter(r => !r.id.startsWith('recipe_power_') || r.id === `recipe_power_${options.generatorId}`);
  } else {
    // If not in power mode, hide all power recipes so they don't pollute normal factories
    activeRecipes = activeRecipes.filter(r => !r.id.startsWith('recipe_power_'));
  }

  const isRecipeAmplified = (recipeId) => {
    if (!options.somersloopRecipes) return false;
    if (Array.isArray(options.somersloopRecipes)) return options.somersloopRecipes.includes(recipeId);
    return Boolean(options.somersloopRecipes[recipeId]);
  };

  // 3. Setup LP Variables for Recipes
  activeRecipes.forEach(r => {
    model.variables[r.id] = { cost: 1 }; // Minimize machines or raw by adjusting cost
    if (options.optimize === 'raw') model.variables[r.id].cost = 0.0001; // if raw, machine cost is 0, raw is high
    
    // If alternate recipe is active, prefer it over standard
    if (r.isAlternate && options.altRecipes && options.altRecipes.includes(r.id)) {
      model.variables[r.id].cost *= 0.8;
    }

    const isAmplified = isRecipeAmplified(r.id);
    const outMult = isAmplified ? 2.0 : 1.0;
    
    if (options.optimize === 'power') {
      const p = buildings[r.buildingId]?.power || 1;
      model.variables[r.id].cost = p * (isAmplified ? 4.0 : 1.0);
    }

    r.outputs.forEach(out => { 
      model.variables[r.id][out.itemId] = (model.variables[r.id][out.itemId] || 0) + (out.rate * outMult); 
      allItems.add(out.itemId);
    });
    
    r.inputs.forEach(inp => { 
      model.variables[r.id][inp.itemId] = (model.variables[r.id][inp.itemId] || 0) - inp.rate; 
      allItems.add(inp.itemId);
    });
  });

  // 4. Setup LP Variables for Raw Mining
  RAW_MATERIALS.forEach(raw => {
    let cost = 10;
    if (options.optimize === 'raw') cost = 1000;
    model.variables[`mine_${raw}`] = { [raw]: 1, cost }; 
    allItems.add(raw);
  });
  
  // 5. Constraints for Inputs Limits (and enabling intermediate imports)
  inputsLimit.forEach(inp => {
    if (model.variables[`mine_${inp.itemId}`]) {
      model.constraints[`limit_${inp.itemId}`] = { max: inp.rate };
      model.variables[`mine_${inp.itemId}`][`limit_${inp.itemId}`] = 1;
    } else {
      // It's an intermediate item being imported from another factory!
      // Add it as an available free/cheap source up to the rate limit
      model.variables[`import_${inp.itemId}`] = { [inp.itemId]: 1, cost: 0.01 }; // Very cheap so solver prefers it over making it
      model.constraints[`limit_${inp.itemId}`] = { max: inp.rate };
      model.variables[`import_${inp.itemId}`][`limit_${inp.itemId}`] = 1;
      allItems.add(inp.itemId);
    }
  });

  // 6. Generic balances (>= 0 for non-targets)
  allItems.forEach(item => {
    if (!model.constraints[item]) {
      model.constraints[item] = { min: 0 };
    }
  });

  const solution = lp_solver.Solve(model);
  
  if (!solution.feasible) {
    return { feasible: false, nodes: [], edges: [], summary: { items: [], buildings: [] } };
  }

  // 7. Process Solution
  const nodes = [];
  const edges = [];
  const summaryItems = {};
  const summaryBuildings = {};

  const usedRecipes = activeRecipes.filter(r => solution[r.id] && solution[r.id] > 0.0001);
  const minedInputs = RAW_MATERIALS.filter(raw => solution[`mine_${raw}`] && solution[`mine_${raw}`] > 0.0001);
  const importedInputs = inputsLimit.filter(inp => solution[`import_${inp.itemId}`] && solution[`import_${inp.itemId}`] > 0.0001);

  const recipeNodes = {};
  let totalPowerUsage = 0;
  
  usedRecipes.forEach(recipe => {
    const machines = solution[recipe.id];
    const isAmplified = isRecipeAmplified(recipe.id);
    const bData = buildings[recipe.buildingId];
    const power = calculatePower(bData?.power || 0, 100, isAmplified) * Math.floor(machines) + 
                  calculatePower(bData?.power || 0, (machines - Math.floor(machines)) * 100, isAmplified);

    totalPowerUsage += power;

    // Summary buildings
    if (!summaryBuildings[recipe.buildingId]) {
      summaryBuildings[recipe.buildingId] = { id: recipe.buildingId, count: 0, power: 0, name: bData?.name, icon: bData?.icon };
    }
    summaryBuildings[recipe.buildingId].count += machines;
    summaryBuildings[recipe.buildingId].power += power;

    const nodeId = `recipe_${recipe.id}`;
    recipeNodes[recipe.id] = nodeId;
    
    const outMult = isAmplified ? 2.0 : 1.0;
    const amplifiedOutputs = recipe.outputs.map(o => ({ ...o, rate: o.rate * outMult }));

    nodes.push({
      id: nodeId,
      type: 'machine',
      data: {
        label: recipe.name,
        recipeId: recipe.id,
        machines: machines,
        power: power,
        itemId: recipe.outputs[0].itemId,
        rate: recipe.outputs[0].rate * machines * outMult,
        buildingId: recipe.buildingId,
        clockSpeed: 100,
        inputs: recipe.inputs,
        outputs: amplifiedOutputs
      }
    });

    // Summary items logic
    recipe.outputs.forEach(out => {
      if (!summaryItems[out.itemId]) summaryItems[out.itemId] = { id: out.itemId, produced: 0, consumed: 0 };
      summaryItems[out.itemId].produced += out.rate * machines * outMult;
    });
    recipe.inputs.forEach(inp => {
      if (!summaryItems[inp.itemId]) summaryItems[inp.itemId] = { id: inp.itemId, produced: 0, consumed: 0 };
      summaryItems[inp.itemId].consumed += inp.rate * machines;
    });
  });

  minedInputs.forEach(raw => {
    const rate = solution[`mine_${raw}`];
    nodes.push({
      id: `mine_${raw}`,
      type: 'machine',
      data: {
        label: itemsDB[raw]?.name || raw,
        itemId: raw,
        rate: rate,
        isInput: true
      }
    });

    if (!summaryItems[raw]) summaryItems[raw] = { id: raw, produced: 0, consumed: 0 };
    summaryItems[raw].produced += rate;
    
    // Water Pump / Miner count logic based on purity and maxTier
    const maxTierLimit = MAX_TIER_LIMITS[options?.maxTier] ?? 99;
    let bId = 'miner_mk3';
    let baseRate = 240;

    if (maxTierLimit <= 2) {
      bId = 'miner_mk1';
      baseRate = 60;
    } else if (maxTierLimit <= 4) {
      bId = 'miner_mk2';
      baseRate = 120;
    } else {
      bId = 'miner_mk3';
      baseRate = 240;
    }

    let extRate = baseRate;
    if (raw === 'water') {
      bId = 'water_pump';
      const waterMult = PURITY_MULTIPLIERS[options?.waterPurity] || 1.0;
      extRate = 120 * waterMult;
    } else if (raw === 'crude_oil') {
      bId = 'oil_pump';
      const oilMult = PURITY_MULTIPLIERS[options?.oilPurity] || 1.0;
      extRate = 120 * oilMult;
    } else if (raw === 'nitrogen_gas') {
      bId = 'oil_pump';
      const gasMult = PURITY_MULTIPLIERS[options?.gasPurity] || 1.0;
      extRate = 120 * gasMult;
    } else {
      const oreMult = PURITY_MULTIPLIERS[options?.minerPurity] || 1.0;
      extRate = baseRate * oreMult;
    }
    
    const bData = buildings[bId];
    if (bData && extRate > 0) {
      const machines = rate / extRate;
      const power = (bData.power || 0) * machines;
      totalPowerUsage += power;
      
      if (!summaryBuildings[bId]) summaryBuildings[bId] = { id: bId, count: 0, power: 0, name: bData.name, icon: bData.icon };
      summaryBuildings[bId].count += machines;
      summaryBuildings[bId].power += power;
    }
  });

  importedInputs.forEach(inp => {
    const rate = solution[`import_${inp.itemId}`];
    nodes.push({
      id: `import_${inp.itemId}`,
      type: 'machine',
      data: {
        label: itemsDB[inp.itemId]?.name || inp.itemId,
        itemId: inp.itemId,
        rate: rate,
        isInput: true,
        isImport: true,
        isTransit: inp.isTransit || false,
        sourceStageName: inp.sourceStageName,
        deficit: inp.deficit,
        transport: inp.transport
      }
    });

    if (!summaryItems[inp.itemId]) summaryItems[inp.itemId] = { id: inp.itemId, produced: 0, consumed: 0 };
    summaryItems[inp.itemId].produced += rate;
  });

  // Routing Edges
  const producers = {};
  const consumers = {};

  // ПРИОРИТЕТ 1: Входящий импорт и межцеховой транзит расходуются станками в первую очередь
  importedInputs.forEach(inp => {
    producers[inp.itemId] = producers[inp.itemId] || [];
    producers[inp.itemId].push({ nodeId: `import_${inp.itemId}`, rate: solution[`import_${inp.itemId}`] });
  });

  // ПРИОРИТЕТ 2: Локально добываемое сырьё
  minedInputs.forEach(raw => {
    producers[raw] = producers[raw] || [];
    producers[raw].push({ nodeId: `mine_${raw}`, rate: solution[`mine_${raw}`] });
  });

  // ПРИОРИТЕТ 3: Продукция производственных станков
  usedRecipes.forEach(recipe => {
    const machines = solution[recipe.id];
    const isAmplified = isRecipeAmplified(recipe.id);
    const outMult = isAmplified ? 2.0 : 1.0;

    recipe.outputs.forEach(out => {
      producers[out.itemId] = producers[out.itemId] || [];
      producers[out.itemId].push({ nodeId: recipeNodes[recipe.id], rate: out.rate * machines * outMult });
    });
    recipe.inputs.forEach(inp => {
      consumers[inp.itemId] = consumers[inp.itemId] || [];
      consumers[inp.itemId].push({ nodeId: recipeNodes[recipe.id], rate: inp.rate * machines });
    });
  });

  // --- HYDROLOCK PREVENTION: VIP JUNCTION FOR RECYCLED WATER ---
  const byproductWaterNodes = (producers['water'] || []).filter(p => !p.nodeId.startsWith('mine_') && !p.nodeId.startsWith('import_'));
  if (byproductWaterNodes.length > 0) {
    const totalByproduct = byproductWaterNodes.reduce((sum, p) => sum + p.rate, 0);
    const mineWaterNode = (producers['water'] || []).find(p => p.nodeId.startsWith('mine_'));
    const makeupWater = mineWaterNode ? mineWaterNode.rate : 0;
    
    // Create VIP Node
    nodes.push({
      id: 'vip_water',
      type: 'machine',
      data: {
        label: 'VIP Junction (Вода)',
        itemId: 'water',
        rate: totalByproduct + makeupWater,
        isVIP: true,
        byproduct: totalByproduct,
        makeup: makeupWater
      }
    });

    const oldWaterProducers = producers['water'];
    // All original consumers of water will now consume from VIP
    producers['water'] = [{ nodeId: 'vip_water', rate: totalByproduct + makeupWater }];
    
    // VIP itself consumes from the original producers
    consumers['water_vip_in'] = [{ nodeId: 'vip_water', rate: totalByproduct + makeupWater }];
    producers['water_vip_in'] = oldWaterProducers;
  }

  const sourceOutCount = {};

  // УЛУЧШЕНО: Пропорциональное распределение вместо жадного «первый пришёл — первый получил».
  // Если суммарный спрос превышает суммарное предложение, каждый потребитель получает
  // пропорциональную долю, устраняя асимметрию в ребрах графа.
  Object.keys(consumers).forEach(item => {
    const itemProducers = producers[item] || [];
    const itemConsumers = consumers[item];

    const totalAvailable = itemProducers.reduce((s, p) => s + p.rate, 0);
    const totalNeeded = itemConsumers.reduce((s, c) => s + c.rate, 0);
    // Если предложение < спроса — масштабируем доли пропорционально
    const allocationRatio = totalNeeded > totalAvailable + 0.001 ? totalAvailable / totalNeeded : 1.0;

    itemConsumers.forEach(consumer => {
      let needed = consumer.rate * allocationRatio;
      for (const producer of itemProducers) {
        if (needed <= 0.001) break;
        if (producer.rate <= 0.001) continue;
        
        const transferred = Math.min(needed, producer.rate);
        needed -= transferred;
        producer.rate -= transferred;
        
        if (!sourceOutCount[producer.nodeId]) sourceOutCount[producer.nodeId] = 0;
        const currentSlot = sourceOutCount[producer.nodeId]++;
        
        const cleanItem = item.replace('_vip_in', '');

        edges.push({
          id: `edge_${producer.nodeId}_${consumer.nodeId}_${cleanItem}_${currentSlot}`,
          source: producer.nodeId,
          sourceHandle: `out-${cleanItem}`,
          target: consumer.nodeId,
          targetHandle: `in-${cleanItem}`,
          data: { rate: transferred, itemId: cleanItem, slotIndex: currentSlot }
        });
      }
    });
  });

  return { 
    feasible: true, 
    nodes, 
    edges, 
    summary: { 
      items: Object.values(summaryItems), 
      buildings: Object.values(summaryBuildings),
      recipes: usedRecipes.map(r => ({ 
        id: r.id, 
        name: r.name, 
        machines: solution[r.id], 
        isAlternate: r.isAlternate,
        outputs: r.outputs,
        inputs: r.inputs
      })),
      totalPower: totalPowerUsage
    } 
  };
}
