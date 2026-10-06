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

// ─── Константы Фаз Проекта «Сборка» (Satisfactory 1.0) ────────────────────────
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
    reward: 'Кружка «Лучший работник планеты» (Финал сюжета 1.0)',
    requirements: [
      { itemId: 'nuclear_pasta', count: 1000, stageId: 'complex_8b', rate: 1, transport: 'train' },
      { itemId: 'biochemical_spacesuit', count: 1000, stageId: 'phase_5', rate: 2.5, transport: 'drone' },
      { itemId: 'ai_expansion_server', count: 256, stageId: 'phase_5', rate: 2.5, transport: 'drone' },
      { itemId: 'ballistic_warp_drive', count: 200, stageId: 'phase_5', rate: 1, transport: 'drone' }
    ]
  }
];

const TRANSPORT_ICONS = {
  belt: '📦 Конвейер',
  truck: '🚜 Трактор',
  train: '🚂 Поезд',
  drone: '🛸 Дрон'
};

// ─── Узел: Цех-поставщик (Factory Stage Node) ───────────────────────────────────
function FactoryStageNode({ data }) {
  const isSelected = data.isSelected;
  return (
    <div
      onClick={data.onSelectStage}
      className={`bg-[#14171d] rounded-lg p-3 w-[260px] border transition-all cursor-pointer relative shadow-xl ${
        isSelected
          ? 'border-[#f97316] ring-2 ring-[#f97316]/50 shadow-[0_0_20px_rgba(249,115,22,0.35)]'
          : 'border-[#2a2e39] hover:border-gray-400'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-[#f97316] text-black tracking-wider">
          {data.tier}
        </span>
        <span className="text-[10px] text-gray-400 font-mono">ID: {data.stageId}</span>
      </div>
      <h4 className="text-xs font-black text-white uppercase tracking-wide leading-snug">
        {data.name}
      </h4>
      <div className="mt-2 pt-2 border-t border-[#2a2e39] flex items-center justify-between text-[10px] text-gray-400">
        <span>Компонентов проекта:</span>
        <span className="font-bold text-[#f97316]">{data.partCount} шт</span>
      </div>
      <div className="mt-1 text-[9px] text-blue-400 font-semibold flex items-center gap-1 hover:text-blue-300">
        <span>Перейти к фабрике этапа →</span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-3 !h-3 !bg-[#f97316] !border-2 !border-[#0b0d10]"
      />
    </div>
  );
}

// ─── Узел: Компонент Проекта «Сборка» (Project Part Node) ───────────────────────
function ProjectPartNode({ data }) {
  const item = items[data.itemId] || { name: data.itemId, icon: '' };
  const phaseInfo = SPACE_ELEVATOR_PHASES.find(p => p.phase === data.phase);
  const color = phaseInfo?.color || '#f97316';
  const isSelected = data.isSelected;

  // Расчет примерного времени закрытия (минут)
  const etaMinutes = data.rate > 0 ? Math.ceil(data.count / data.rate) : 0;
  const etaHours = (etaMinutes / 60).toFixed(1);

  return (
    <div
      className={`bg-[#14171d] rounded-lg p-2.5 w-[220px] border transition-all relative shadow-lg ${
        isSelected
          ? 'ring-2 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
          : 'border-[#2a2e39] hover:border-gray-500'
      }`}
      style={{ borderColor: isSelected ? color : '#2a2e39' }}
    >
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        className="!w-2.5 !h-2.5 !border-2 !border-[#0b0d10]"
        style={{ background: color }}
      />
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-md bg-[#0b0d10] border p-1 flex items-center justify-center shrink-0"
          style={{ borderColor: `${color}66` }}
        >
          {item.icon ? (
            <img src={getAssetUrl(item.icon)} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-base">📦</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold text-white truncate" title={item.name}>
            {item.name}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="text-[9px] font-black px-1 py-0.2 rounded text-black"
              style={{ background: color }}
            >
              Фаза {data.phase}
            </span>
            <span className="text-[10px] font-bold text-gray-300">
              {data.count.toLocaleString()} шт
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-[#2a2e39] flex items-center justify-between text-[10px]">
        <span className="text-gray-400">Темп:</span>
        <span className="font-mono font-bold text-[#22c55e]">+{data.rate}/м</span>
        <span className="text-gray-400">ETA:</span>
        <span className="font-mono font-bold text-amber-400">~{etaHours}ч</span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        id="out"
        className="!w-2.5 !h-2.5 !border-2 !border-[#0b0d10]"
        style={{ background: color }}
      />
    </div>
  );
}

// ─── Узел: Центральный КОСМИЧЕСКИЙ ЛИФТ (Space Elevator Super Node) ──────────────
function SpaceElevatorSuperNode({ data }) {
  const elevatorIcon = getAssetUrl('/icons/Buildings/SpaceElevator.png');

  return (
    <div className="bg-[#14171d] rounded-2xl w-[380px] border-2 border-[#f59e0b] shadow-[0_0_35px_rgba(245,158,11,0.35)] relative overflow-hidden flex flex-col">
      {/* Верхний полосатый FICSIT-декор */}
      <div className="h-3 w-full bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_12px,#0b0d10_12px,#0b0d10_24px)]" />

      {/* Шапка Космического Лифта */}
      <div className="p-4 bg-gradient-to-b from-[#f59e0b]/20 to-transparent border-b border-[#f59e0b]/30 flex items-center gap-3">
        <div className="w-16 h-16 rounded-xl bg-[#0b0d10]/90 border border-[#f59e0b]/60 p-2 flex items-center justify-center shrink-0 shadow-inner">
          <img
            src={elevatorIcon}
            alt="Космический лифт"
            className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-[#f59e0b] text-black uppercase tracking-wider">
              ГЛОБАЛЬНОЕ СТРОЕНИЕ
            </span>
            <span className="text-[9px] font-bold text-green-400">● 0 МВт (Пассивно)</span>
          </div>
          <h2 className="text-base font-black text-white uppercase tracking-wider mt-1 drop-shadow">
            КОСМИЧЕСКИЙ ЛИФТ
          </h2>
          <p className="text-[10px] text-gray-300 font-semibold tracking-wide">
            Проект «Сборка» • 5/5 Фаз
          </p>
        </div>
      </div>

      {/* 6 Входных конвейерных портов на левой грани */}
      {[0, 1, 2, 3, 4, 5].map((portIdx) => (
        <Handle
          key={`elevator-port-${portIdx}`}
          type="target"
          position={Position.Left}
          id={`port-${portIdx}`}
          style={{
            top: `${28 + portIdx * 12}%`,
            width: 14,
            height: 14,
            background: '#f59e0b',
            border: '2px solid #0b0d10',
          }}
          title={`Порт загрузки ${portIdx + 1} (Конвейер Mk.5/Mk.6)`}
        />
      ))}

      {/* Индикаторы прогресса всех 5 Фаз */}
      <div className="p-4 space-y-2.5 bg-[#0b0d10]/60 flex-1">
        <div className="flex items-center justify-between text-[11px] font-bold text-gray-300 mb-1">
          <span>Снабжение фаз строительства:</span>
          <span className="text-[#f59e0b] font-mono">100% Готовность</span>
        </div>

        {SPACE_ELEVATOR_PHASES.map((p) => (
          <div
            key={p.phase}
            className="bg-[#14171d] border border-[#2a2e39] rounded-lg p-2 transition-colors hover:border-gray-500"
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="font-bold text-white flex items-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
                />
                {p.name}
              </span>
              <span className="font-mono text-gray-400">{p.tier}</span>
            </div>
            <div className="w-full bg-[#0b0d10] h-1.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '100%', background: p.color }}
              />
            </div>
            <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
              <span>{p.requirements.length} детали</span>
              <span className="text-gray-300 font-mono">Статус: Подключено</span>
            </div>
          </div>
        ))}
      </div>

      {/* Нижняя полоса статуса */}
      <div className="p-3 bg-[#0b0d10] border-t border-[#2a2e39] flex items-center justify-between text-[10px]">
        <span className="text-gray-400">Портов загрузки:</span>
        <span className="font-mono font-bold text-white">6 × Mk.5 (780/м)</span>
        <span className="text-gray-400">Финал:</span>
        <span className="font-bold text-pink-400">Тир 9 Завершён</span>
      </div>
    </div>
  );
}

// ─── Ребро конвейера (Animated Belt Edge) ─────────────────────────────────────────
function ElevatorBeltEdge({
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
  const item = items[data?.itemId] || { name: data?.itemId, icon: '' };

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
          strokeWidth: 2.5,
          filter: `drop-shadow(0 0 4px ${color}66)`,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            borderColor: color,
          }}
          className="nodrag nopan bg-[#0b0d10] border rounded-md px-2 py-0.5 shadow-lg flex items-center gap-1.5 z-20 text-[10px]"
          title={`${item.name} (${data?.rate}/м)`}
        >
          {item.icon && (
            <img src={getAssetUrl(item.icon)} alt={item.name} className="w-3.5 h-3.5 object-contain" />
          )}
          <span className="font-mono font-bold" style={{ color }}>
            +{data?.rate}/м
          </span>
          {data?.transport && (
            <span className="text-[9px] text-gray-400 font-mono">
              [{TRANSPORT_ICONS[data.transport]?.slice(0, 2) || '📦'}]
            </span>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = {
  factoryStage: FactoryStageNode,
  projectPart: ProjectPartNode,
  spaceElevator: SpaceElevatorSuperNode,
};

const edgeTypes = {
  elevatorEdge: ElevatorBeltEdge,
};

// ─── Основной компонент SpaceElevatorView ──────────────────────────────────────
export default function SpaceElevatorView({ onNavigateStage }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPhase, setSelectedPhase] = useState('all'); // 'all' | 1 | 2 | 3 | 4 | 5

  const loadPreset = useFactoryStore((state) => state.loadPreset);

  const handleSelectFactory = useCallback(
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

  // Построение графа сети Космического Лифта через Dagre
  useEffect(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'LR',
      nodesep: 50,
      ranksep: 220,
      marginx: 60,
      marginy: 60,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // 1. Узлы Фабрик (Поставщиков)
    const factoryStageMap = {
      complex_3: { id: 'complex_3', name: 'ЭТАП 4: Сборочно-метизный хаб', tier: 'Тир 1-4', parts: [] },
      complex_5: { id: 'complex_5', name: 'ЭТАП 6: Тяжелое машиностроение', tier: 'Тир 5-6', parts: [] },
      complex_8b: { id: 'complex_8b', name: 'ЭТАП 10: Верфь Космического Лифта', tier: 'Тир 7-8', parts: [] },
      phase_5: { id: 'phase_5', name: 'ЭТАП 11: Квантовая верфь', tier: 'Тир 9', parts: [] },
    };

    // Наполняем фабрики деталями
    SPACE_ELEVATOR_PHASES.forEach((p) => {
      p.requirements.forEach((req) => {
        if (factoryStageMap[req.stageId]) {
          factoryStageMap[req.stageId].parts.push(req);
        }
      });
    });

    const factoryNodes = Object.values(factoryStageMap).map((f) => {
      g.setNode(`factory_${f.id}`, { width: 260, height: 110 });
      return {
        id: `factory_${f.id}`,
        type: 'factoryStage',
        data: {
          stageId: f.id,
          name: f.name,
          tier: f.tier,
          partCount: f.parts.length,
          isSelected: false,
          onSelectStage: () => handleSelectFactory(f.id),
        },
        position: { x: 0, y: 0 },
      };
    });

    // 2. Узлы Деталей Проекта «Сборка»
    const partNodes = [];
    const internalEdges = [];

    SPACE_ELEVATOR_PHASES.forEach((p) => {
      p.requirements.forEach((req, idx) => {
        const nodeId = `part_${p.phase}_${req.itemId}`;
        g.setNode(nodeId, { width: 220, height: 95 });

        const isFiltered = selectedPhase !== 'all' && selectedPhase !== p.phase;

        partNodes.push({
          id: nodeId,
          type: 'projectPart',
          data: {
            phase: p.phase,
            itemId: req.itemId,
            count: req.count,
            rate: req.rate,
            stageId: req.stageId,
            isSelected: selectedPhase === p.phase,
          },
          style: { opacity: isFiltered ? 0.2 : 1, transition: 'opacity 0.25s' },
          position: { x: 0, y: 0 },
        });

        // Ребро: Фабрика ──► Деталь
        const factoryNodeId = `factory_${req.stageId}`;
        g.setEdge(factoryNodeId, nodeId);
        internalEdges.push({
          id: `edge_${factoryNodeId}_${nodeId}`,
          source: factoryNodeId,
          target: nodeId,
          type: 'elevatorEdge',
          data: {
            itemId: req.itemId,
            rate: req.rate,
            transport: req.transport,
            color: p.color,
          },
          animated: true,
          style: { opacity: isFiltered ? 0.1 : 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: p.color },
        });

        // Ребро: Деталь ──► Космический Лифт (через порт)
        const portIdx = (idx + p.phase) % 6;
        g.setEdge(nodeId, 'space_elevator');
        internalEdges.push({
          id: `edge_${nodeId}_elevator`,
          source: nodeId,
          target: 'space_elevator',
          targetHandle: `port-${portIdx}`,
          type: 'elevatorEdge',
          data: {
            itemId: req.itemId,
            rate: req.rate,
            transport: req.transport,
            color: p.color,
          },
          animated: true,
          style: { opacity: isFiltered ? 0.1 : 1 },
          markerEnd: { type: MarkerType.ArrowClosed, color: p.color },
        });
      });
    });

    // 3. Центральный Супер-Узел: КОСМИЧЕСКИЙ ЛИФТ
    g.setNode('space_elevator', { width: 380, height: 480 });
    const elevatorNode = {
      id: 'space_elevator',
      type: 'spaceElevator',
      data: {
        totalPhases: 5,
        connectedParts: 12,
      },
      position: { x: 0, y: 0 },
    };

    dagre.layout(g);

    // Сборка финальных координат
    const allGraphNodes = [...factoryNodes, ...partNodes, elevatorNode].map((n) => {
      const pos = g.node(n.id);
      return {
        ...n,
        position: {
          x: pos.x - pos.width / 2,
          y: pos.y - pos.height / 2,
        },
      };
    });

    setNodes(allGraphNodes);
    setEdges(internalEdges);
  }, [selectedPhase, handleSelectFactory, setNodes, setEdges]);

  // Статистика для верхней плашки
  const totalItemsCount = useMemo(() => {
    let sum = 0;
    SPACE_ELEVATOR_PHASES.forEach((p) => {
      p.requirements.forEach((r) => {
        sum += r.count;
      });
    });
    return sum;
  }, []);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative scim-grid overflow-hidden">
      {/* ── FICSIT Панель управления Проектом «Сборка» ── */}
      <div className="absolute top-4 left-4 z-20 bg-[#14171d]/95 backdrop-blur border border-[#f59e0b] p-4 rounded-xl shadow-2xl max-w-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] animate-ping" />
          <h2 className="text-[#f59e0b] font-black text-sm uppercase tracking-wider">
            ПРОЕКТ «СБОРКА»
          </h2>
        </div>
        <p className="text-gray-400 text-[10px] mb-3">
          Орбитальный Космический Лифт • Satisfactory 1.0
        </p>

        {/* Быстрые фильтры по фазам */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setSelectedPhase('all')}
            className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
              selectedPhase === 'all'
                ? 'bg-[#f59e0b] text-black'
                : 'bg-[#1e232e] text-gray-300 hover:bg-[#2a2e39]'
            }`}
          >
            Все 5 фаз
          </button>
          {SPACE_ELEVATOR_PHASES.map((p) => (
            <button
              key={p.phase}
              onClick={() => setSelectedPhase(p.phase)}
              className={`px-2 py-1 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                selectedPhase === p.phase
                  ? 'text-black'
                  : 'bg-[#1e232e] text-gray-300 hover:bg-[#2a2e39]'
              }`}
              style={{
                background: selectedPhase === p.phase ? p.color : undefined,
              }}
            >
              Фаза {p.phase}
            </button>
          ))}
        </div>

        {/* Сводка прогресса */}
        <div className="space-y-1.5 text-[10px] pt-2 border-t border-[#2a2e39] text-gray-300">
          <div className="flex justify-between">
            <span className="text-gray-400">Суммарный запрос деталей:</span>
            <span className="font-mono font-bold text-white">
              {totalItemsCount.toLocaleString()} шт
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Задействовано комплексов:</span>
            <span className="font-mono font-bold text-[#f97316]">4 мега-завода</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Портов в основании Лифта:</span>
            <span className="font-mono font-bold text-[#22c55e]">6 конвейерных входов</span>
          </div>
        </div>
      </div>

      {/* ── React Flow Холст Сети ── */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.1}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.15 }}
      >
        <Background color="#1e232e" gap={24} size={1} />
        <Controls
          position="bottom-left"
          className="!bg-[#14171d] !border-[#2a2e39] !fill-[#f97316]"
        />
      </ReactFlow>
    </div>
  );
}
