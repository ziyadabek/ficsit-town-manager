import fs from 'fs';

const recipes = JSON.parse(fs.readFileSync('./src/database/recipes.json', 'utf8'));
const items = JSON.parse(fs.readFileSync('./src/database/items.json', 'utf8'));

const missing = new Set();
recipes.forEach(r => {
  r.inputs.forEach(i => {
    if (!items[i.itemId]) missing.add(i.itemId);
  });
  r.outputs.forEach(o => {
    if (!items[o.itemId]) missing.add(o.itemId);
  });
});

console.log('Items missing from items.json:');
missing.forEach(m => console.log(m));
