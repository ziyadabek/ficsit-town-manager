import React, { useEffect } from 'react';
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
import { useFactoryStore } from '../../store/useFactoryStore';

// ─── Корпоративная цветовая карта FICSIT ─────────────────────────────────────
// Каждая категория ресурсов — свой технический цвет на дисплее SCADA
const ITEM_COLORS = {
  // Строительные материалы и конструкции — стальной серый
  concrete:                '#94a3b8',
  iron_plate:              '#9ca3af',
  steel_pipe:              '#78716c',
  screws:                  '#6b7280',
  modular_frame:           '#a8a29e',
  heavy_modular_frame:     '#64748b',
  encased_industrial_beam: '#6b7280',

  // Двигатели и электроника — индиго/синий
  motor:                   '#818cf8',
  computer:                '#3b82f6',
  supercomputer:           '#60a5fa',

  // Нефтехимия и полимеры — янтарный
  plastic:                 '#fbbf24',
  petroleum_coke:          '#d97706',

  // Алюминий и системы охлаждения — бирюзовый
  aluminum_casing:         '#22d3ee',
  aluminum_sheet:          '#06b6d4',
  cooling_system:          '#67e8f9',

  // Ядерные материалы — радиационный зелёный
  uranium:                 '#4ade80',
  nuclear_pasta:           '#c084fc',
};

const LEGEND = [
  { color: '#94a3b8', label: 'Строительство' },
  { color: '#818cf8', label: 'Электроника' },
  { color: '#fbbf24', label: 'Топливо/Полимеры' },
  { color: '#22d3ee', label: 'Алюминий' },
  { color: '#4ade80', label: 'Ядерные' },
  { color: '#f97316', label: 'Прочее' },
];

const getEdgeColor = (itemId) => ITEM_COLORS[itemId] || '#f97316';

// ─── Узел этапа кампании ──────────────────────────────────────────────────────
const MacroStageNode = ({ data }) => {
  const isPower = data.stageType === 'power';
  const accent   = isPower ? '#22c55e' : '#f97316';
  const glow     = isPower ? '0 0 16px rgba(34,197,94,0.18)' : '0 0 16px rgba(249,115,22,0.18)';
  const stripe   = isPower
    ? 'bg-[repeating-linear-gradient(45deg,#22c55e,#22c55e_8px,#0b0d10_8px,#0b0d10_16px)]'
    : 'bg-[repeating-linear-gradient(45deg,#f97316,#f97316_8px,#0b0d10_8px,#0b0d10_16px)]';
  const gradFrom = isPower ? 'from-[#22c55e]/15' : 'from-[#f97316]/15';
  const divider  = isPower ? 'border-[#22c55e]/30' : 'border-[#f97316]/30';
  const typeTag  = isPower ? 'ЭЛЕКТРОСТАНЦИЯ' : 'ЦЕХ / ЗАВОД';

  return (
    <div
      className={`bg-[#14171d] rounded-md w-[250px] flex flex-col relative overflow-hidden`}
      style={{ border: `2px solid ${accent}`, boxShadow: glow }}
    >
      {/* Полосатый FICSIT-декор сверху */}
      <div className={`h-2 w-full ${stripe}`} />

      <div className={`p-3 bg-gradient-to-b ${gradFrom} to-transparent border-b ${divider}`}>
        <h3
          className="text-center font-black uppercase tracking-widest text-[11px] drop-shadow-md leading-tight"
          style={{ color: accent }}
        >
          {data.name}
        </h3>
        <p className="text-center text-[9px] text-gray-500 font-bold tracking-wider mt-1">{typeTag}</p>
      </div>

      <div className="px-3 py-2 bg-[#0b0d10] flex justify-between items-center">
        <span className="text-[10px] text-gray-500">Статус</span>
        {data.isFrozen ? (
          <span className="text-[10px] text-[#22c55e] font-bold flex items-center gap-1">
            <svg className="w-3 h-3 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            ПОСТРОЕН
          </span>
        ) : (
          <span className="text-[10px] text-[#fa9549] font-bold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fa9549] animate-pulse"></span>
            В ПРОЕКТЕ
          </span>
        )}
      </div>

      {/* Входные хэндлы — сверху */}
      {(data.inputs || []).map((itemId, idx, arr) => (
        <Handle
          key={`in-${itemId}`}
          type="target"
          id={`target-${itemId}`}
          position={Position.Top}
          style={{
            left: `${((idx + 1) / (arr.length + 1)) * 100}%`,
            background: getEdgeColor(itemId),
            border: '2px solid #0b0d10',
            width: 12, height: 12,
          }}
          title={`↓ ${itemId}`}
        />
      ))}
      {/* Выходные хэндлы — снизу */}
      {(data.outputs || []).map((itemId, idx, arr) => (
        <Handle
          key={`out-${itemId}`}
          type="source"
          id={`source-${itemId}`}
          position={Position.Bottom}
          style={{
            left: `${((idx + 1) / (arr.length + 1)) * 100}%`,
            background: getEdgeColor(itemId),
            border: '2px solid #0b0d10',
            width: 12, height: 12,
          }}
          title={`↓ ${itemId}`}
        />
      ))}
    </div>
  );
};

const nodeTypes = { macroStage: MacroStageNode };
const edgeTypes = { macroEdge: MacroEdge };

// ─── Основной компонент ───────────────────────────────────────────────────────
export default function MacroView() {
  const frozenStages = useFactoryStore(state => state.frozenStages);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onNodeMouseEnter = (_, node) => {
    const id = node.id;
    const connected = new Set([id]);
    edges.forEach(e => {
      if (e.source === id) connected.add(e.target);
      if (e.target === id) connected.add(e.source);
    });
    setNodes(nds => nds.map(n => ({
      ...n, style: { ...n.style, opacity: connected.has(n.id) ? 1 : 0.12, transition: 'opacity 0.25s' }
    })));
    setEdges(eds => eds.map(e => ({
      ...e, style: { ...e.style, opacity: (e.source === id || e.target === id) ? 1 : 0.03, transition: 'opacity 0.25s' }
    })));
  };

  const onNodeMouseLeave = () => {
    setNodes(nds => nds.map(n => ({ ...n, style: { ...n.style, opacity: 1, transition: 'opacity 0.25s' } })));
    setEdges(eds => eds.map(e => ({ ...e, style: { ...e.style, opacity: 1, transition: 'opacity 0.25s' } })));
  };

  useEffect(() => {
    // Собираем входы/выходы для каждого этапа
    const connections = {};
    presets.forEach(p => { connections[p.id] = { inputs: new Set(), outputs: new Set() }; });
    STAGE_TRANSIT_ROUTES.forEach(route => {
      connections[route.source]?.outputs.add(route.itemId);
      connections[route.target]?.inputs.add(route.itemId);
    });

    // Dagre: LR — кампания читается слева направо как временна́я шкала
    // Это естественно снижает количество пересечений рёбер, т.к.
    // более поздние этапы всегда оказываются правее ранних.
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 250, ranksep: 600 });
    g.setDefaultEdgeLabel(() => ({}));

    const newNodes = presets.map(preset => {
      g.setNode(preset.id, { width: 250, height: 90 });
      return {
        id: preset.id,
        type: 'macroStage',
        data: {
          name: preset.name,
          stageType: preset.type,
          isFrozen: !!frozenStages?.[preset.id]?.isFrozen,
          inputs:  Array.from(connections[preset.id]?.inputs  || []),
          outputs: Array.from(connections[preset.id]?.outputs || []),
        },
        position: { x: 0, y: 0 }
      };
    });

    // Группируем маршруты по паре (source → target), чтобы смещение рёбер
    // считалось локально внутри каждой пары, а не глобально по всем 15 предметам.
    // Это держит иконки/цифры близко к линии (max ±20px вместо ±196px).
    const pairGroups = {};
    STAGE_TRANSIT_ROUTES.forEach(route => {
      const key = `${route.source}__${route.target}`;
      if (!pairGroups[key]) pairGroups[key] = [];
      pairGroups[key].push(route.itemId);
    });

    const newEdges = STAGE_TRANSIT_ROUTES.map((route, idx) => {
      const color    = getEdgeColor(route.itemId);
      const itemInfo = items[route.itemId] || { name: route.itemId, icon: '' };
      const pairKey    = `${route.source}__${route.target}`;
      const group      = pairGroups[pairKey];
      const trackIndex  = group.indexOf(route.itemId);
      const totalTracks = group.length;
      g.setEdge(route.source, route.target);
      return {
        id: `e-${route.source}-${route.target}-${route.itemId}-${idx}`,
        source: route.source,
        target: route.target,
        sourceHandle: `source-${route.itemId}`,
        targetHandle: `target-${route.itemId}`,
        type: 'macroEdge',
        animated: true,
        style:     { strokeWidth: 2.5, stroke: color },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: {
          icon:        itemInfo.icon,
          rate:        route.baseRate,
          name:        itemInfo.name,
          color,
          trackIndex,
          totalTracks,
        },
      };
    });

    dagre.layout(g);

    setNodes(newNodes.map(node => {
      const pos = g.node(node.id);
      return { ...node, position: { x: pos.x - pos.width / 2, y: pos.y - pos.height / 2 } };
    }));
    setEdges(newEdges);
  }, [setNodes, setEdges, frozenStages]);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative">
      {/* ── FICSIT SCADA панель легенды ── */}
      <div className="absolute top-4 left-4 z-10 bg-[#14171d] border-2 border-[#f97316] p-4 rounded shadow-lg pointer-events-none w-52">
        <h2 className="text-[#f97316] font-black text-sm uppercase tracking-wider">Карта логистики</h2>
        <p className="text-gray-500 text-[10px] mt-0.5 mb-3">FICSIT Global Transit v1.0</p>

        {/* Легенда рёбер */}
        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Потоки ресурсов</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-3">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-4 h-1 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-[9px] text-gray-400 truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Легенда узлов */}
        <p className="text-[9px] text-gray-500 uppercase tracking-widest mb-1.5">Типы объектов</p>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm flex-shrink-0" style={{ border: '2px solid #f97316' }} />
            <span className="text-[9px] text-gray-400">ЦЕХ / ЗАВОД</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm flex-shrink-0" style={{ border: '2px solid #22c55e' }} />
            <span className="text-[9px] text-gray-400">⚡ Электростанция</span>
          </div>
        </div>
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
        minZoom={0.05}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e2330" gap={28} size={2} />
        <Controls className="bg-[#14171d] border border-[#2a2e39] fill-[#e1e1e6]" showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
