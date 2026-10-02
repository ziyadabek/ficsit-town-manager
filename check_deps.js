import fs from 'fs';

const recipes = JSON.parse(fs.readFileSync('./src/database/recipes.json', 'utf8'));

const recipeMap = new Map();
recipes.filter(r => !r.isAlternate).forEach(r => {
  r.outputs.forEach(o => {
    if (!recipeMap.has(o.itemId)) {
      recipeMap.set(o.itemId, r);
    }
  });
});

const rawMaterials = new Set([
  'iron_ore', 'copper_ore', 'limestone', 'coal', 'crude_oil', 'bauxite', 'caterium_ore', 'raw_quartz', 'sulfur', 'sam_ore', 'water', 'nitrogen_gas'
]);

const missing = new Set();
const checked = new Set();

function checkItem(itemId) {
  if (rawMaterials.has(itemId)) return;
  if (checked.has(itemId)) return;
  checked.add(itemId);

  const recipe = recipeMap.get(itemId);
  if (!recipe) {
    missing.add(itemId);
    return;
  }

  recipe.inputs.forEach(input => checkItem(input.itemId));
}

['nuclear_pasta', 'magnetic_field_generator', 'thermal_propulsion_rocket', 'singularity_cell'].forEach(checkItem);

console.log('Missing items (no standard recipe found):');
missing.forEach(m => console.log(m));
