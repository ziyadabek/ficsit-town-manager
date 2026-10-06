import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import items from '../../database/items.json';
import presets from '../../database/campaignPresets.json';
import { getAssetUrl } from '../../database/assets';
import { useFactoryStore } from '../../store/useFactoryStore';

// ─── 5 Фаз Проекта «Сборка» (Satisfactory 1.0) ────────────────────────────────
export const SPACE_ELEVATOR_PHASES = [
  {
    phase: 1,
    name: 'Фаза 1: Платформа',
    tier: 'Тир 1-2',
    color: '#38bdf8', // Неоновый голубой
    reward: 'Доступ к Тирам 3 и 4',
    requirements: [
      { itemId: 'smart_plating', count: 50, stageId: 'complex_3', rate: 2, transport: 'belt' }
    ]
  },
  {
    phase: 2,
    name: 'Фаза 2: Каркас',
    tier: 'Тир 3-4',
    color: '#fbbf24', // Янтарный
    reward: 'Доступ к Тирам 5 и 6',
    requirements: [
      { itemId: 'smart_plating', count: 1000, stageId: 'complex_3', rate: 2, transport: 'belt' },
      { itemId: 'versatile_framework', count: 1000, stageId: 'complex_3', rate: 5, transport: 'belt' },
      { itemId: 'automated_wiring', count: 100, stageId: 'complex_3', rate: 2.5, transport: 'belt' }
    ]
  },
  {
    phase: 3,
    name: 'Фаза 3: Системы',
    tier: 'Тир 5-6',
    color: '#34d399', // Изумрудный
    reward: 'Доступ к Тирам 7 и 8',
    requirements: [
      { itemId: 'versatile_framework', count: 2500, stageId: 'complex_3', rate: 5, transport: 'truck' },
      { itemId: 'modular_engine', count: 500, stageId: 'complex_5', rate: 2.5, transport: 'train' },
      { itemId: 'adaptive_control_unit', count: 100, stageId: 'complex_5', rate: 1, transport: 'train' }
    ]
  },
  {
    phase: 4,
    name: 'Фаза 4: Двигатели',
    tier: 'Тир 7-8',
    color: '#a855f7', // Фиолетовый
    reward: 'Доступ к Тиру 9 (Квантовые технологии)',
    requirements: [
      { itemId: 'assembly_director_system', count: 500, stageId: 'complex_8b', rate: 1.5, transport: 'train' },
      { itemId: 'magnetic_field_generator', count: 500, stageId: 'complex_8b', rate: 2, transport: 'train' },
      { itemId: 'thermal_propulsion_rocket', count: 250, stageId: 'complex_8b', rate: 1, transport: 'train' },
      { itemId: 'nuclear_pasta', count: 100, stageId: 'complex_8b', rate: 1, transport: 'train' }
    ]
  },
  {
    phase: 5,
    name: 'Фаза 5: Сборка (Финал)',
    tier: 'Тир 9',
    color: '#ec4899', // Неоновый розовый
    reward: 'Кружка «Лучший работник планеты» (Завершение игры)',
    requirements: [
      { itemId: 'nuclear_pasta', count: 1000, stageId: 'complex_8b', rate: 1, transport: 'train' },
      { itemId: 'biochemical_spacesuit', count: 1000, stageId: 'phase_5', rate: 2.5, transport: 'drone' },
      { itemId: 'ai_expansion_server', count: 256, stageId: 'phase_5', rate: 2.5, transport: 'drone' },
      { itemId: 'ballistic_warp_drive', count: 200, stageId: 'phase_5', rate: 1, transport: 'drone' }
    ]
  }
];

const FACTORY_INFO = {
  complex_3: {
    id: 'complex_3',
    name: 'ЭТАП 4: Сборочный хаб',
    shortName: 'Эт. 4: Сборочный хаб',
    tier: 'Тир 1-4',
    icon: '/icons/Buildings/AssemblerMk1.png',
    accentColor: '#38bdf8'
  },
  complex_5: {
    id: 'complex_5',
    name: 'ЭТАП 6: Машиностроение',
    shortName: 'Эт. 6: Машиностроение',
    tier: 'Тир 5-6',
    icon: '/icons/Buildings/Manufacturer.png',
    accentColor: '#34d399'
  },
  complex_8b: {
    id: 'complex_8b',
    name: 'ЭТАП 10: Верфь Лифта',
    shortName: 'Эт. 10: Верфь Лифта',
    tier: 'Тир 7-8',
    icon: '/icons/Buildings/HadronCollider.png',
    accentColor: '#a855f7'
  },
  phase_5: {
    id: 'phase_5',
    name: 'ЭТАП 11: Квантовая верфь',
    shortName: 'Эт. 11: Квантовая верфь',
    tier: 'Тир 9',
    icon: '/icons/Buildings/QuantumEncoder.png',
    accentColor: '#ec4899'
  }
};

// ─── Узел 1: Фабрика-поставщик (Минималистичный круг SCIM 80×80) ───────────────
function ScimFactoryNode({ data }) {
  const isSelected = data.isSelected;
  const accent = data.accentColor || '#f97316';

  return (
    <div
      onClick={data.onClick}
      className="flex flex-col items-center justify-center relative select-none w-[150px] py-1 cursor-pointer group"
    >
      <div
        className={`w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all group-hover:scale-105 ${
          isSelected ? 'ring-2 ring-white' : ''
        }`}
        style={{
          border: `3px solid ${accent}`,
          boxShadow: `0 0 12px ${accent}44`
        }}
        title={`Нажмите для просмотра цеха: ${data.name}`}
      >
        {/* 3D Иконка здания фабрики */}
        {data.icon && (
          <img
            src={getAssetUrl(data.icon)}
            alt={data.name}
            className="w-13 h-13 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            onError={e => (e.target.style.display = 'none')}
          />
        )}

        {/* Верхний пилл: Тир */}
        <div
          className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black font-mono shadow-md z-10 text-black whitespace-nowrap"
          style={{ background: accent }}
        >
          {data.tier}
        </div>

        {/* Нижний пилл: Кол-во деталей проекта */}
        <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#0b0e14] border border-[#2a2e39] text-[9px] font-bold text-gray-300 shadow-md z-10 whitespace-nowrap group-hover:border-white">
          {data.partCount} дет.
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ right: 4 }}
          className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80"
        />
      </div>

      {/* Подпись под кругом */}
      <div className="flex flex-col items-center text-center mt-2 leading-tight w-full px-1">
        <span className="text-xs font-semibold text-white drop-shadow truncate w-full group-hover:text-[#f97316] transition-colors">
          {data.shortName}
        </span>
        <span className="text-[9px] text-gray-500 font-medium truncate w-full mt-0.5">
          Цех-поставщик
        </span>
      </div>
    </div>
  );
}

// ─── Узел 2: Деталь Проекта «Сборка» (Минималистичный круг SCIM 80×80) ─────────
function ScimPartNode({ data }) {
  const item = items[data.itemId] || { name: data.itemId, icon: '' };
  const phaseInfo = SPACE_ELEVATOR_PHASES.find(p => p.phase === data.phase);
  const color = phaseInfo?.color || '#f97316';
  const isSelected = data.isSelected;

  return (
    <div
      onClick={data.onClick}
      className="flex flex-col items-center justify-center relative select-none w-[150px] py-1 cursor-pointer group"
    >
      <div
        className={`w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all group-hover:scale-105 ${
          isSelected ? 'ring-2 ring-white scale-105' : ''
        }`}
        style={{
          border: `3px solid ${color}`,
          boxShadow: `0 0 10px ${color}44`
        }}
        title={`${item.name} • Фаза ${data.phase}: ${data.count} шт`}
      >
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ left: 4 }}
          className="w-2.5 h-2.5 !border-none opacity-80"
          styleSheet={{ background: color }}
        />

        {/* 3D Иконка предмета */}
        {item.icon && (
          <img
            src={getAssetUrl(item.icon)}
            alt={item.name}
            className="w-13 h-13 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            onError={e => (e.target.style.display = 'none')}
          />
        )}

        {/* Верхний пилл: Номер фазы */}
        <div
          className="absolute -top-2 px-2 py-0.5 rounded-full text-[9px] font-black font-mono shadow-md z-10 text-black whitespace-nowrap"
          style={{ background: color }}
        >
          Фаза {data.phase}
        </div>

        {/* Нижний пилл: Темп подачи */}
        <div className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#0b0e14] border border-[#2a2e39] text-[9px] font-black font-mono text-[#22c55e] shadow-md z-10 whitespace-nowrap">
          +{data.rate}/м
        </div>

        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ right: 4 }}
          className="w-2.5 h-2.5 !border-none opacity-80"
          styleSheet={{ background: color }}
        />
      </div>

      {/* Подпись под кругом */}
      <div className="flex flex-col items-center text-center mt-2 leading-tight w-full px-1">
        <span className="text-xs font-semibold text-white drop-shadow truncate w-full group-hover:text-amber-400 transition-colors">
          {item.name}
        </span>
        <span className="text-[10px] text-gray-400 font-mono font-medium truncate w-full mt-0.5">
          {data.count.toLocaleString()} шт
        </span>
      </div>
    </div>
  );
}

// ─── Узел 3: КОСМИЧЕСКИЙ ЛИФТ (Центральный SCIM Терминал 110×110) ──────────────
function ScimElevatorNode({ data }) {
  const isSelected = data.isSelected;
  const elevatorIcon = getAssetUrl('/icons/Buildings/SpaceElevator.png');

  return (
    <div
      onClick={data.onClick}
      className="flex flex-col items-center justify-center relative select-none w-[180px] py-1 cursor-pointer group"
    >
      <div
        className={`w-28 h-28 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_6px_20px_rgba(0,0,0,0.9)] transition-all group-hover:scale-105 ${
          isSelected ? 'ring-2 ring-white scale-105' : ''
        }`}
        style={{
          border: '4px solid #f59e0b',
          boxShadow: '0 0 20px rgba(245,158,11,0.45)'
        }}
        title="Космический Лифт: Орбитальный проект «Сборка» (5/5 Фаз)"
      >
        {/* 6 Входных портов для конвейеров: по 2 порта с 3-х сторон (Верх, Лево, Низ) */}
        {/* Верхняя сторона (Север) — 2 порта */}
        <Handle
          type="target"
          position={Position.Top}
          id="port-top-0"
          style={{ left: '30%', top: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 1 (Север-А)"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="port-top-1"
          style={{ left: '70%', top: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 2 (Север-Б)"
        />

        {/* Левая сторона (Запад) — 2 порта */}
        <Handle
          type="target"
          position={Position.Left}
          id="port-left-0"
          style={{ top: '30%', left: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 3 (Запад-А)"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="port-left-1"
          style={{ top: '70%', left: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 4 (Запад-Б)"
        />

        {/* Нижняя сторона (Юг) — 2 порта */}
        <Handle
          type="target"
          position={Position.Bottom}
          id="port-bottom-0"
          style={{ left: '30%', bottom: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 5 (Юг-А)"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="port-bottom-1"
          style={{ left: '70%', bottom: -5 }}
          className="w-3 h-3 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-sm opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 6 (Юг-Б)"
        />

        {/* Консоль терминала на 4-й (правой) стороне */}
        <div
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 px-1 py-0.5 rounded bg-[#1e293b] border border-[#f59e0b]/70 text-[7.5px] font-black font-mono text-[#f59e0b] shadow-md z-10 pointer-events-none whitespace-nowrap"
          title="Терминал управления и запуска"
        >
          ТЕРМИНАЛ
        </div>

        {/* 3D Иконка Космического Лифта */}
        <img
          src={elevatorIcon}
          alt="Космический лифт"
          className="w-20 h-20 object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          onError={e => (e.target.style.display = 'none')}
        />

        {/* Верхний пилл: Пассивное питание и раскладка портов */}
        <div className="absolute -top-3.5 px-2 py-0.5 rounded-full bg-[#0b0e14] border border-[#f59e0b] text-[8.5px] font-black font-mono text-[#f59e0b] shadow-lg z-10 pointer-events-none whitespace-nowrap">
          ★ 0 МВт • 6 ВХОДОВ (3×2)
        </div>

        {/* Нижний пилл: Проект Сборка */}
        <div className="absolute -bottom-3.5 px-2 py-0.5 rounded-full bg-[#f59e0b] text-black text-[8.5px] font-black font-mono shadow-lg z-10 pointer-events-none whitespace-nowrap">
          5 / 5 ФАЗ
        </div>
      </div>

      {/* Подпись под узлом */}
      <div className="flex flex-col items-center text-center mt-3 leading-tight w-full px-1">
        <span className="text-xs font-black text-[#f59e0b] uppercase tracking-wider drop-shadow truncate w-full">
          КОСМИЧЕСКИЙ ЛИФТ
        </span>
        <span className="text-[10px] text-gray-400 font-medium truncate w-full mt-0.5">
          Проект «Сборка» (Финал 1.0)
        </span>
      </div>
    </div>
  );
}

// ─── Ребро графа (Минималистичный конвейер) ────────────────────────────────────
function ScimElevatorEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const color = data?.color || '#f59e0b';

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: color,
          strokeWidth: 2,
          filter: `drop-shadow(0 0 3px ${color}44)`,
        }}
      />
      {data?.rate && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'none',
              borderColor: color,
            }}
            className="bg-[#0b0d10] border rounded-full px-1.5 py-0.2 shadow text-[9px] font-mono font-bold"
          >
            <span style={{ color }}>+{data.rate}/м</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = {
  scimFactory: ScimFactoryNode,
  scimPart: ScimPartNode,
  scimElevator: ScimElevatorNode,
};

const edgeTypes = {
  scimElevatorEdge: ScimElevatorEdge,
};

// ─── Главный компонент SpaceElevatorView ──────────────────────────────────────
export default function SpaceElevatorView({ onNavigateStage }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPhase, setSelectedPhase] = useState('all'); // 'all' | 1 | 2 | 3 | 4 | 5
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadPreset = useFactoryStore((state) => state.loadPreset);

  const handleSelectFactoryStage = useCallback(
    (stageId) => {
      const preset = presets.find((p) => p.id === stageId);
      if (preset) {
        loadPreset(preset);
        if (onNavigateStage) {
          onNavigateStage(preset);
        }
      }
    },
    [loadPreset, onNavigateStage]
  );

  // Построение чистого, воздушного графа сети через Dagre
  useEffect(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'LR',
      nodesep: 40,
      ranksep: 220,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // 1. Узлы Фабрик (Поставщики слева)
    const activeFactories = ['complex_3', 'complex_5', 'complex_8b', 'phase_5'];
    const factoryNodeObjs = activeFactories.map((stageId) => {
      const f = FACTORY_INFO[stageId];
      const partCount = SPACE_ELEVATOR_PHASES.flatMap(p => p.requirements).filter(r => r.stageId === stageId).length;

      g.setNode(`factory_${stageId}`, { width: 150, height: 130 });

      return {
        id: `factory_${stageId}`,
        type: 'scimFactory',
        data: {
          stageId,
          name: f.name,
          shortName: f.shortName,
          tier: f.tier,
          icon: f.icon,
          accentColor: f.accentColor,
          partCount,
          isSelected: selectedNodeData?.stageId === stageId,
          onClick: () => {
            setSelectedNodeData({ type: 'factory', stageId, ...f, partCount });
            setIsSidebarOpen(true);
          },
        },
        position: { x: 0, y: 0 },
      };
    });

    // 2. Узлы Деталей Проекта (Колонна по центру)
    const partNodeObjs = [];
    const edgeObjs = [];

    SPACE_ELEVATOR_PHASES.forEach((p) => {
      p.requirements.forEach((req, reqIdx) => {
        const nodeId = `part_${p.phase}_${req.itemId}`;
        g.setNode(nodeId, { width: 150, height: 130 });

        const isFiltered = selectedPhase !== 'all' && selectedPhase !== p.phase;

        partNodeObjs.push({
          id: nodeId,
          type: 'scimPart',
          data: {
            phase: p.phase,
            itemId: req.itemId,
            count: req.count,
            rate: req.rate,
            stageId: req.stageId,
            isSelected: selectedNodeData?.itemId === req.itemId && selectedNodeData?.phase === p.phase,
            onClick: () => {
              setSelectedNodeData({ type: 'part', phase: p.phase, ...req });
              setIsSidebarOpen(true);
            },
          },
          style: { opacity: isFiltered ? 0.15 : 1, transition: 'opacity 0.25s' },
          position: { x: 0, y: 0 },
        });

        // Ребро 1: Фабрика ──► Деталь
        const factoryNodeId = `factory_${req.stageId}`;
        g.setEdge(factoryNodeId, nodeId);
        edgeObjs.push({
          id: `e_${factoryNodeId}_${nodeId}`,
          source: factoryNodeId,
          target: nodeId,
          type: 'scimElevatorEdge',
          data: { color: p.color, rate: req.rate },
          animated: true,
          style: { opacity: isFiltered ? 0.1 : 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: p.color },
        });

        // Ребро 2: Деталь ──► Космический Лифт (через 6 портов на 3-х сторонах: Верх, Лево, Низ)
        let targetHandleId = 'port-left-0';
        if (p.phase <= 2) {
          // Фазы 1 и 2 приходят сверху в Северные порты (Top)
          targetHandleId = reqIdx % 2 === 0 ? 'port-top-0' : 'port-top-1';
        } else if (p.phase === 3) {
          // Фаза 3 приходит в Западные порты слева (Left)
          targetHandleId = reqIdx % 2 === 0 ? 'port-left-0' : 'port-left-1';
        } else if (p.phase === 4) {
          // Фаза 4 распределяется между Западными и Южными портами
          targetHandleId = reqIdx < 2
            ? (reqIdx === 0 ? 'port-left-0' : 'port-left-1')
            : (reqIdx === 2 ? 'port-bottom-0' : 'port-bottom-1');
        } else {
          // Фаза 5 приходит снизу в Южные порты (Bottom)
          targetHandleId = reqIdx % 2 === 0 ? 'port-bottom-0' : 'port-bottom-1';
        }

        g.setEdge(nodeId, 'space_elevator');
        edgeObjs.push({
          id: `e_${nodeId}_elevator`,
          source: nodeId,
          target: 'space_elevator',
          targetHandle: targetHandleId,
          type: 'scimElevatorEdge',
          data: { color: p.color, rate: req.rate },
          animated: true,
          style: { opacity: isFiltered ? 0.1 : 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: p.color },
        });
      });
    });

    // 3. Центральный Супер-Узел: КОСМИЧЕСКИЙ ЛИФТ (Справа)
    g.setNode('space_elevator', { width: 180, height: 150 });
    const elevatorNodeObj = {
      id: 'space_elevator',
      type: 'scimElevator',
      data: {
        isSelected: selectedNodeData?.type === 'elevator',
        onClick: () => {
          setSelectedNodeData({ type: 'elevator' });
          setIsSidebarOpen(true);
        },
      },
      position: { x: 0, y: 0 },
    };

    dagre.layout(g);

    // Сборка финальных координат узлов
    const layoutedNodes = [...factoryNodeObjs, ...partNodeObjs, elevatorNodeObj].map((n) => {
      const pos = g.node(n.id) || { x: 0, y: 0, width: 150, height: 130 };
      return {
        ...n,
        position: {
          x: pos.x - pos.width / 2,
          y: pos.y - pos.height / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(edgeObjs);
  }, [selectedPhase, selectedNodeData, setNodes, setEdges]);

  // Подсчёт суммарного количества деталей
  const totalPartsSum = useMemo(() => {
    return SPACE_ELEVATOR_PHASES.flatMap(p => p.requirements).reduce((acc, r) => acc + r.count, 0);
  }, []);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative scim-grid overflow-hidden">
      {/* ── Верхний лаконичный FICSIT HUD (Фильтры по фазам) ── */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-2 bg-[#14171d]/90 backdrop-blur border border-[#2a2e39] px-3 py-1.5 rounded-full shadow-2xl">
        <button
          onClick={() => setSelectedPhase('all')}
          className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors cursor-pointer ${
            selectedPhase === 'all'
              ? 'bg-[#f59e0b] text-black shadow-[0_0_10px_rgba(245,158,11,0.5)]'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Все 5 фаз
        </button>

        {SPACE_ELEVATOR_PHASES.map((p) => {
          const isActive = selectedPhase === p.phase;
          return (
            <button
              key={p.phase}
              onClick={() => setSelectedPhase(p.phase)}
              className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
                isActive ? 'text-black shadow-md' : 'text-gray-400 hover:text-white'
              }`}
              style={{
                background: isActive ? p.color : undefined,
                boxShadow: isActive ? `0 0 10px ${p.color}66` : undefined,
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: isActive ? '#000' : p.color }}
              />
              Фаза {p.phase}
            </button>
          );
        })}

        <div className="h-4 w-px bg-[#2a2e39] mx-1" />

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`px-3 py-1 text-[11px] font-bold rounded-full transition-colors cursor-pointer flex items-center gap-1.5 ${
            isSidebarOpen
              ? 'bg-[#2a2e39] text-[#f59e0b] border border-[#f59e0b]/50'
              : 'text-gray-300 hover:text-white hover:bg-[#1e232e]'
          }`}
          title="Сводка проекта «Сборка»"
        >
          <span>📋</span>
          <span>{isSidebarOpen ? 'Скрыть панель' : 'Инфо-сводка'}</span>
        </button>
      </div>

      {/* ── React Flow Холст Сети ── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.12 }}
      >
        <Background color="#1e232e" gap={28} size={1} />
        <Controls
          position="bottom-left"
          className="!bg-[#14171d] !border-[#2a2e39] !fill-[#f97316]"
        />
      </ReactFlow>

      {/* ── Аккуратная выезжающая боковая панель подробностей (Right Drawer) ── */}
      {isSidebarOpen && (
        <div className="absolute top-0 right-0 h-full w-84 bg-[#14171d]/95 backdrop-blur border-l border-[#2a2e39] shadow-2xl z-30 p-5 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2e39] mb-4">
              <div className="flex items-center gap-2">
                <img
                  src={getAssetUrl('/icons/Buildings/SpaceElevator.png')}
                  alt="Лифт"
                  className="w-5 h-5 object-contain"
                />
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  ПРОЕКТ «СБОРКА»
                </h3>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Карточка выбранного элемента */}
            {selectedNodeData?.type === 'part' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-[#0b0d10] p-3 rounded-lg border border-[#2a2e39]">
                  <img
                    src={getAssetUrl(items[selectedNodeData.itemId]?.icon)}
                    alt=""
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      {items[selectedNodeData.itemId]?.name}
                    </h4>
                    <span className="text-[10px] text-amber-400 font-semibold">
                      Фаза {selectedNodeData.phase} • {selectedNodeData.count.toLocaleString()} шт
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-[#2a2e39]/60">
                    <span className="text-gray-400">Темп производства:</span>
                    <span className="font-mono font-bold text-[#22c55e]">
                      +{selectedNodeData.rate} шт/мин
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2a2e39]/60">
                    <span className="text-gray-400">Расчетное время (ETA):</span>
                    <span className="font-mono font-bold text-amber-400">
                      ~{(selectedNodeData.count / selectedNodeData.rate / 60).toFixed(1)} ч
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#2a2e39]/60">
                    <span className="text-gray-400">Цех-поставщик:</span>
                    <span className="font-semibold text-white">
                      {FACTORY_INFO[selectedNodeData.stageId]?.name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectFactoryStage(selectedNodeData.stageId)}
                  className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] text-black font-black text-xs uppercase rounded cursor-pointer transition-colors shadow-lg"
                >
                  Перейти к фабрике этапа →
                </button>
              </div>
            ) : selectedNodeData?.type === 'factory' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 bg-[#0b0d10] p-3 rounded-lg border border-[#2a2e39]">
                  <img
                    src={getAssetUrl(selectedNodeData.icon)}
                    alt=""
                    className="w-12 h-12 object-contain"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-white">{selectedNodeData.name}</h4>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {selectedNodeData.tier}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  Этот комплекс снабжает Космический Лифт {selectedNodeData.partCount} компонентами
                  проекта.
                </p>

                <button
                  onClick={() => handleSelectFactoryStage(selectedNodeData.stageId)}
                  className="w-full py-2 bg-[#f97316] hover:bg-[#ea580c] text-black font-black text-xs uppercase rounded cursor-pointer transition-colors shadow-lg"
                >
                  Открыть детальный цех →
                </button>
              </div>
            ) : (
              /* Сводка по всем 5 фазам */
              <div className="space-y-3">
                <div className="text-[11px] text-gray-400 mb-2">
                  Прогресс пяти фаз Проекта «Сборка»:
                </div>
                {SPACE_ELEVATOR_PHASES.map((p) => (
                  <div
                    key={p.phase}
                    className="p-2.5 rounded-lg bg-[#0b0d10] border border-[#2a2e39] text-xs"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ background: p.color }}
                        />
                        {p.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">{p.tier}</span>
                    </div>
                    <div className="text-[10px] text-gray-400 mb-1">
                      {p.requirements.length} компонентов • {p.reward}
                    </div>
                    <div className="w-full bg-[#181a20] h-1.5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: '100%', background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#2a2e39] text-[10px] text-gray-400 flex justify-between">
            <span>Всего деталей:</span>
            <span className="font-mono font-bold text-white">{totalPartsSum.toLocaleString()} шт</span>
          </div>
        </div>
      )}
    </div>
  );
}
