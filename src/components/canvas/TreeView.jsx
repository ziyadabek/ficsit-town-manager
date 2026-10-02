import React, { useState } from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import recipesDB from '../../database/recipes.json';
import itemsDB from '../../database/items.json';
import buildingsDB from '../../database/buildings.json';
import { calculatePower } from '../../engine/overclock';
import { getAssetUrl } from '../../database/assets';


// Recursive Tree Node Component
function TreeNode({ nodeData, level = 0 }) {
  const [isOpen, setIsOpen] = useState(true);
  
  const item = itemsDB[nodeData.itemId];
  const building = buildingsDB[nodeData.buildingId];
  
  const hasChildren = nodeData.children && nodeData.children.length > 0;
  
  return (
    <div className="font-mono text-sm">
      <div 
        className={`flex items-center gap-2 py-1 hover:bg-[#14171d] ${level > 0 ? 'border-l border-[#2a2e39] ml-2 pl-4 relative' : ''}`}
        style={{ paddingLeft: level === 0 ? '0' : '1rem' }}
      >
        {/* Connection lines for children visually */}
        {level > 0 && (
          <div className="absolute left-0 top-1/2 w-4 border-t border-[#2a2e39]"></div>
        )}
        
        {/* Toggle Button */}
        <div className="w-4 h-4 flex items-center justify-center">
          {hasChildren && (
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-400 hover:text-white">
              {isOpen ? '▼' : '▶'}
            </button>
          )}
        </div>
        
        {/* Item Icon */}
        {item && <img src={getAssetUrl(item.icon)} alt={item.name} className="w-5 h-5" />}
        
        {/* Main Text */}
        <span className="text-[#e1e1e6] font-bold">
          {item?.name || nodeData.itemId}
        </span>
        <span className="text-[#f97316]">
          — {nodeData.rate.toFixed(2)} / min
        </span>
        
        <span className="text-gray-500 mx-2">|</span>
        
        {/* Building Info */}
        {building && (
          <div className="flex items-center gap-1 text-gray-300">
            <span className="font-bold">{nodeData.machineCount.toFixed(2)}x</span>
            <img src={getAssetUrl(building.icon)} alt={building.name} className="w-4 h-4 rounded grayscale opacity-70" />
            <span>{building.name}</span>
            <span className="text-[#a855f7] ml-1">({nodeData.powerMW.toFixed(1)} MW)</span>
          </div>
        )}
        
        {/* Byproduct Badge */}
        {nodeData.isByproductLoop && (
          <span className="ml-2 bg-[#0284c7] text-white text-[10px] px-1 rounded">LOOP / BYPRODUCT</span>
        )}
      </div>
      
      {/* Children */}
      {isOpen && hasChildren && (
        <div className="ml-2 border-l border-[#2a2e39]">
          {nodeData.children.map((child, idx) => (
            <TreeNode key={idx} nodeData={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function TreeView() {
  const { targets, nodes: graphNodes } = useFactoryStore();
  
  // Find which recipes were actually used by the LP solver
  const activeRecipeIds = new Set(
    graphNodes.filter(n => n.type === 'machine' && !n.data.isInput).map(n => n.data.recipeId)
  );

  // DFS Builder
  function buildTreeBranch(itemId, rate, visited = new Set()) {
    // Prevent infinite loops in cyclic recipes (e.g. Alumina -> Water -> Alumina)
    if (visited.has(itemId)) {
      return {
        itemId,
        rate,
        isByproductLoop: true,
        children: []
      };
    }

    // Find active recipe for this item
    const recipe = recipesDB.find(r => 
      activeRecipeIds.has(r.id) && r.outputs.some(o => o.itemId === itemId)
    );

    if (!recipe) {
      // It's a raw material or uncrafted item
      let bId = 'miner_mk3';
      if (itemId === 'water') bId = 'water_pump';
      if (itemId === 'crude_oil') bId = 'oil_pump';
      
      const bData = buildingsDB[bId];
      const extRate = itemId === 'water' ? 120 : (itemId === 'crude_oil' ? 120 : 240);
      const machines = rate / extRate;
      const power = (bData?.power || 0) * machines;

      return {
        itemId,
        rate,
        recipeId: null,
        buildingId: bId,
        machineCount: machines,
        clockSpeed: 100,
        powerMW: power,
        children: []
      };
    }

    const outputItem = recipe.outputs.find(o => o.itemId === itemId);
    const machines = rate / outputItem.rate;
    
    const bData = buildingsDB[recipe.buildingId];
    const power = calculatePower(bData?.power || 0, 100) * Math.floor(machines) + 
                  calculatePower(bData?.power || 0, (machines - Math.floor(machines)) * 100);

    const newVisited = new Set(visited).add(itemId);

    const children = recipe.inputs.map(inp => {
      return buildTreeBranch(inp.itemId, inp.rate * machines, newVisited);
    });

    return {
      itemId,
      rate,
      recipeId: recipe.id,
      buildingId: recipe.buildingId,
      machineCount: machines,
      clockSpeed: 100,
      powerMW: power,
      children
    };
  }

  const trees = targets.map(target => buildTreeBranch(target.itemId, target.rate));

  if (trees.length === 0) return <div className="p-8 text-gray-500">Нет целей для отображения.</div>;

  return (
    <div className="p-8 overflow-auto h-full bg-[#0b0d10]">
      {trees.map((tree, idx) => (
        <div key={idx} className="mb-8">
          <TreeNode nodeData={tree} />
        </div>
      ))}
    </div>
  );
}
