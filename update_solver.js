import fs from 'fs';

let content = fs.readFileSync('src/engine/solver.js', 'utf8');

const search = `  // 5. Constraints for Inputs Limits
  inputsLimit.forEach(inp => {
    if (model.variables[\`mine_\${inp.itemId}\`]) {
      model.constraints[\`limit_\${inp.itemId}\`] = { max: inp.rate };
      model.variables[\`mine_\${inp.itemId}\`][\`limit_\${inp.itemId}\`] = 1;
    }
  });`;

const replace = `  // 5. Constraints for Inputs Limits (and enabling intermediate imports)
  inputsLimit.forEach(inp => {
    if (model.variables[\`mine_\${inp.itemId}\`]) {
      model.constraints[\`limit_\${inp.itemId}\`] = { max: inp.rate };
      model.variables[\`mine_\${inp.itemId}\`][\`limit_\${inp.itemId}\`] = 1;
    } else {
      // It's an intermediate item being imported from another factory!
      // Add it as an available free/cheap source up to the rate limit
      model.variables[\`import_\${inp.itemId}\`] = { [inp.itemId]: 1, cost: 0.01 }; // Very cheap so solver prefers it over making it
      model.constraints[\`limit_\${inp.itemId}\`] = { max: inp.rate };
      model.variables[\`import_\${inp.itemId}\`][\`limit_\${inp.itemId}\`] = 1;
      allItems.add(inp.itemId);
    }
  });`;

content = content.replace(search, replace);

const search2 = `  const minedInputs = RAW_MATERIALS.filter(raw => solution[\`mine_\${raw}\`] && solution[\`mine_\${raw}\`] > 0.0001);`;
const replace2 = `  const minedInputs = RAW_MATERIALS.filter(raw => solution[\`mine_\${raw}\`] && solution[\`mine_\${raw}\`] > 0.0001);
  const importedInputs = inputsLimit.filter(inp => solution[\`import_\${inp.itemId}\`] && solution[\`import_\${inp.itemId}\`] > 0.0001);`;

content = content.replace(search2, replace2);

// Now I need to generate nodes for the imported inputs.
// In solver.js:
//   // 8. Generate Nodes
//   minedInputs.forEach(raw => {
//     nodes.push({ id: `mine_${raw}`, type: 'mine', data: { itemId: raw, rate: solution[`mine_${raw}`] } });
//   });

const search3 = `  minedInputs.forEach(raw => {
    nodes.push({ id: \`mine_\${raw}\`, type: 'mine', data: { itemId: raw, rate: solution[\`mine_\${raw}\`] } });
  });`;

const replace3 = `  minedInputs.forEach(raw => {
    nodes.push({ id: \`mine_\${raw}\`, type: 'mine', data: { itemId: raw, rate: solution[\`mine_\${raw}\`] } });
  });
  
  importedInputs.forEach(inp => {
    nodes.push({ id: \`import_\${inp.itemId}\`, type: 'import', data: { itemId: inp.itemId, rate: solution[\`import_\${inp.itemId}\`] } });
  });`;

content = content.replace(search3, replace3);

fs.writeFileSync('src/engine/solver.js', content, 'utf8');
