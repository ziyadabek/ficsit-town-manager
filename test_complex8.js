import { solveProductionGraph } from './src/engine/solver.js';

const targets = [
  { id: 't1', itemId: 'nuclear_pasta', rate: 1 },
  { id: 't2', itemId: 'magnetic_field_generator', rate: 2.5 },
  { id: 't3', itemId: 'thermal_propulsion_rocket', rate: 1 },
  { id: 't4', itemId: 'singularity_cell', rate: 1 }
];

const inputsLimit = [];
const options = { altRecipes: [], optimize: 'power', maxBelt: 5 };

try {
  const result = solveProductionGraph(targets, inputsLimit, options);
  console.log(result ? 'FEASIBLE' : 'INFEASIBLE');
} catch (e) {
  console.error(e);
}
