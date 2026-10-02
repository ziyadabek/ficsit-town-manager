import solver from 'javascript-lp-solver';

const recipes = [
  { id: 'plastic', inputs: [{itemId: 'crude_oil', rate: 30}], outputs: [{itemId: 'plastic', rate: 20}, {itemId: 'hor', rate: 10}] },
  { id: 'rubber', inputs: [{itemId: 'crude_oil', rate: 30}], outputs: [{itemId: 'rubber', rate: 20}, {itemId: 'hor', rate: 20}] },
  { id: 'fuel', inputs: [{itemId: 'hor', rate: 60}], outputs: [{itemId: 'fuel', rate: 40}] },
  // alternative residual fuel
  { id: 'residual_fuel', inputs: [{itemId: 'hor', rate: 60}], outputs: [{itemId: 'fuel', rate: 40}] }
];

const model = {
  optimize: 'cost',
  opType: 'min',
  constraints: {
    plastic: { equal: 200 },
    rubber: { equal: 200 },
    fuel: { equal: 200 }
  },
  variables: {
    mine_crude_oil: { crude_oil: 1, cost: 10 }
  }
};

// add recipes
recipes.forEach(r => {
  model.variables[r.id] = { cost: 1 };
  r.outputs.forEach(out => { model.variables[r.id][out.itemId] = out.rate; });
  r.inputs.forEach(inp => { model.variables[r.id][inp.itemId] = -inp.rate; });
});

const allItems = new Set(['hor', 'crude_oil']);
allItems.forEach(item => {
  model.constraints[item] = { min: 0 };
});

const results = solver.Solve(model);
console.log(results);
