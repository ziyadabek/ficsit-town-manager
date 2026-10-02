import fs from 'fs';
let content = fs.readFileSync('src/engine/solver.js', 'utf8');

const search = `  minedInputs.forEach(raw => {
    producers[raw] = producers[raw] || [];
    producers[raw].push({ nodeId: \`mine_\${raw}\`, rate: solution[\`mine_\${raw}\`] });
  });`;

const replace = `  minedInputs.forEach(raw => {
    producers[raw] = producers[raw] || [];
    producers[raw].push({ nodeId: \`mine_\${raw}\`, rate: solution[\`mine_\${raw}\`] });
  });
  
  importedInputs.forEach(inp => {
    producers[inp.itemId] = producers[inp.itemId] || [];
    producers[inp.itemId].push({ nodeId: \`import_\${inp.itemId}\`, rate: solution[\`import_\${inp.itemId}\`] });
  });`;

content = content.replace(search, replace);


const search2 = `  importedInputs.forEach(inp => {
    nodes.push({ id: \`import_\${inp.itemId}\`, type: 'import', data: { itemId: inp.itemId, rate: solution[\`import_\${inp.itemId}\`] } });
  });`;

const replace2 = `  importedInputs.forEach(inp => {
    const rate = solution[\`import_\${inp.itemId}\`];
    nodes.push({
      id: \`import_\${inp.itemId}\`,
      type: 'machine', // Using machine type but styled differently via custom node or just data properties
      data: {
        label: (itemsDB[inp.itemId]?.name || inp.itemId) + ' (Import)',
        itemId: inp.itemId,
        rate: rate,
        isInput: true,
        isImport: true
      }
    });
    
    if (!summaryItems[inp.itemId]) summaryItems[inp.itemId] = { id: inp.itemId, produced: 0, consumed: 0 };
    summaryItems[inp.itemId].produced += rate;
  });`;

content = content.replace(search2, replace2);

fs.writeFileSync('src/engine/solver.js', content, 'utf8');
