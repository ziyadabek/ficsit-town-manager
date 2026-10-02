import React, { useMemo, useEffect } from 'react';
import { 
  ReactFlow,
  Background, 
  Controls, 
  Handle, 
  Position, 
  MarkerType,
  useNodesState,
  useEdgesState
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import presets from '../../database/campaignPresets.json';
import { STAGE_TRANSIT_ROUTES } from '../../engine/campaignTransitEngine';
import items from '../../database/items.json';
import MacroEdge from './MacroEdge';

// Helper to get item name/icon
const getItemInfo = (itemId) => {
  const item = items?.[itemId];
  return item || { name: itemId, icon: '' };
};

// --- Custom Node Component ---
const MacroStageNode = ({ data }) => {
  return (
    <div className="bg-[#14171d] border-2 border-[#f97316] rounded-md shadow-[0_0_15px_rgba(249,115,22,0.15)] w-[260px] flex flex-col relative overflow-hidden">
      {/* Striped hazard pattern at the top edge */}
      <div className="h-2 w-full bg-[repeating-linear-gradient(45deg,#f97316,#f97316_10px,#0b0d10_10px,#0b0d10_20px)]" />
      
      <div className="p-3 bg-gradient-to-b from-[#f97316]/20 to-transparent border-b border-[#f97316]/30">
        <h3 className="text-center font-black text-[#f97316] uppercase tracking-widest text-sm drop-shadow-md">
          {data.name}
        </h3>
        <p className="text-center text-[10px] text-gray-400 font-bold tracking-wide mt-1">ЦЕХ / ЗАВОД</p>
      </div>

      <div className="p-3 bg-[#0b0d10]">
        <div className="text-xs text-gray-400 flex justify-between">
          <span>Статус:</span>
          <span className="text-green-400 font-bold">ОНЛАЙН</span>
        </div>
      </div>

      {(data.inputs || []).map((itemId, idx) => (
        <Handle 
          key={`in-${itemId}`}
          type="target" 
          id={`target-${itemId}`} 
          position={Position.Top} 
          style={{ left: `${(idx + 1) * (100 / ((data.inputs?.length || 0) + 1))}%` }}
          className="w-3 h-3 bg-[#3b82f6] border-2 border-[#0b0d10]" 
          title={`Input: ${itemId}`}
        />
      ))}
      {(data.outputs || []).map((itemId, idx) => (
        <Handle 
          key={`out-${itemId}`}
          type="source" 
          id={`source-${itemId}`} 
          position={Position.Bottom} 
          style={{ left: `${(idx + 1) * (100 / ((data.outputs?.length || 0) + 1))}%` }}
          className="w-3 h-3 bg-[#f97316] border-2 border-[#0b0d10]" 
          title={`Output: ${itemId}`}
        />
      ))}
    </div>
  );
};

const nodeTypes = {
  macroStage: MacroStageNode
};

const edgeTypes = {
  macroEdge: MacroEdge
};

export default function MacroView() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeMouseEnter = (_, node) => {
    const hoveredId = node.id;
    const connected = new Set([hoveredId]);
    edges.forEach(e => {
      if (e.source === hoveredId) connected.add(e.target);
      if (e.target === hoveredId) connected.add(e.source);
    });
    
    setNodes(nds => nds.map(n => ({
      ...n,
      style: { ...n.style, opacity: connected.has(n.id) ? 1 : 0.2, transition: 'opacity 0.3s' }
    })));

    setEdges(eds => eds.map(e => ({
      ...e,
      style: { ...e.style, opacity: (e.source === hoveredId || e.target === hoveredId) ? 1 : 0.05, transition: 'opacity 0.3s' }
    })));
  };

  const onNodeMouseLeave = () => {
    setNodes(nds => nds.map(n => ({
      ...n,
      style: { ...n.style, opacity: 1, transition: 'opacity 0.3s' }
    })));
    setEdges(eds => eds.map(e => ({
      ...e,
      style: { ...e.style, opacity: 1, transition: 'opacity 0.3s' }
    })));
  };

  useEffect(() => {
    // Generate graph data
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 250, ranksep: 600 }); // Much larger ranksep to give room for the Main Bus
    g.setDefaultEdgeLabel(() => ({}));

    const stageConnections = {};
    presets.forEach(p => {
      stageConnections[p.id] = { inputs: new Set(), outputs: new Set() };
    });
    STAGE_TRANSIT_ROUTES.forEach(route => {
      if (stageConnections[route.source]) stageConnections[route.source].outputs.add(route.itemId);
      if (stageConnections[route.target]) stageConnections[route.target].inputs.add(route.itemId);
    });

    const newNodes = presets.map((preset) => {
      g.setNode(preset.id, { width: 260, height: 100 });
      return {
        id: preset.id,
        type: 'macroStage',
        data: { 
          name: preset.name, 
          id: preset.id,
          inputs: Array.from(stageConnections[preset.id]?.inputs || []),
          outputs: Array.from(stageConnections[preset.id]?.outputs || [])
        },
        position: { x: 0, y: 0 } // Dagre will set this
      };
    });

    const uniqueItems = Array.from(new Set(STAGE_TRANSIT_ROUTES.map(r => r.itemId))).sort();
    
    const newEdges = STAGE_TRANSIT_ROUTES.map((route, idx) => {
      const trackIndex = uniqueItems.indexOf(route.itemId);
      const edgeId = `e-${route.source}-${route.target}-${route.itemId}-${idx}`;
      g.setEdge(route.source, route.target);

      const itemInfo = items[route.itemId] || { name: route.itemId, icon: '' };
      return {
        id: edgeId,
        source: route.source,
        target: route.target,
        sourceHandle: `source-${route.itemId}`,
        targetHandle: `target-${route.itemId}`,
        type: 'macroEdge',
        data: {
          icon: itemInfo.icon,
          rate: route.baseRate,
          name: itemInfo.name,
          trackIndex,
          totalTracks: uniqueItems.length
        },
        animated: true,
        style: { strokeWidth: 3, stroke: '#f97316' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#f97316' }
      };
    });

    // Run Dagre Layout
    dagre.layout(g);

    const layoutedNodes = newNodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - nodeWithPosition.width / 2,
          y: nodeWithPosition.y - nodeWithPosition.height / 2
        }
      };
    });

    setNodes(layoutedNodes);
    setEdges(newEdges);
  }, [setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative">
      <div className="absolute top-4 left-4 z-10 bg-[#14171d] border-2 border-[#f97316] p-4 rounded shadow-lg pointer-events-none">
        <h2 className="text-[#f97316] font-black text-lg uppercase tracking-wider">Глобальная карта логистики</h2>
        <p className="text-gray-400 text-sm mt-1">Отображение связей между макро-заводами</p>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#2a2e39" gap={30} size={2} />
        <Controls 
          className="bg-[#14171d] border border-[#2a2e39] fill-[#e1e1e6]" 
          showInteractive={false} 
        />
      </ReactFlow>
    </div>
  );
}
