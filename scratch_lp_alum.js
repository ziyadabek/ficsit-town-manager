import solver from 'javascript-lp-solver';

const recipes = [
  // bauxite + water -> alumina + silica
  { id: 'alumina_solution', inputs: [{itemId: 'bauxite', rate: 120}, {itemId: 'water', rate: 180}], outputs: [{itemId: 'alumina', rate: 120}, {itemId: 'silica', rate: 50}] },
  // alumina + coal -> aluminum scrap + water (BYPRODUCT LOOP)
  { id: 'aluminum_scrap', inputs: [{itemId: 'alumina', rate: 240}, {itemId: 'coal', rate: 120}], outputs: [{itemId: 'scrap', rate: 360}, {itemId: 'water', rate: 120}] },
  // scrap + silica -> aluminum ingot
  { id: 'aluminum_ingot', inputs: [{itemId: 'scrap', rate: 90}, {itemId: 'silica', rate: 75}], outputs: [{itemId: 'ingot', rate: 60}] }
];

const model = {
  optimize: 'cost',
  opType: 'min',
  constraints: {
    ingot: { equal: 240 }, // We want 240 ingots
    bauxite: { min: 0 },
    water: { min: 0 },
    alumina: { min: 0 },
    silica: { min: 0 },
    scrap: { min: 0 },
    coal: { min: 0 }
  },
  variables: {
    mine_bauxite: { bauxite: 1, cost: 10 },
    mine_coal: { coal: 1, cost: 10 },
    mine_water: { water: 1, cost: 10 },
    mine_silica: { silica: 1, cost: 10 } // Allow mining silica if alumina's byproduct isn't enough
  }
};

recipes.forEach(r => {
  model.variables[r.id] = { cost: 1 };
  r.outputs.forEach(out => { model.variables[r.id][out.itemId] = out.rate; });
  r.inputs.forEach(inp => { model.variables[r.id][inp.itemId] = -inp.rate; });
});

const results = solver.Solve(model);
console.log(results);
