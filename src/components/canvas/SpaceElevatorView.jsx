import React, { useEffect, useState, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  Handle,
  Position,
  MarkerType,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import items from '../../database/items.json';
import presets from '../../database/campaignPresets.json';
import { getAssetUrl } from '../../database/assets';
import MacroEdge from './MacroEdge';

// ─── Цветовая схема деталей Проекта «Сборка» ──────────────────────────────────
export const ITEM_COLORS = {
  smart_plating:            '#38bdf8', // Неоновый голубой
  versatile_framework:      '#fbbf24', // Янтарный
  automated_wiring:         '#818cf8', // Индиго
  modular_engine:           '#34d399', // Изумрудный
  adaptive_control_unit:    '#22d3ee', // Бирюзовый
  assembly_director_system: '#c084fc', // Сиреневый
  magnetic_field_generator: '#f43f5e', // Розово-красный
  thermal_propulsion_rocket:'#fb923c', // Оранжевый
  nuclear_pasta:            '#a855f7', // Фиолетовый
  biochemical_spacesuit:    '#ec4899', // Неоновый розовый
  ai_expansion_server:      '#e879f9', // Маджента
  ballistic_warp_drive:     '#38bdf8', // Квантовый голубой
};

export const getEdgeColor = (itemId) => ITEM_COLORS[itemId] || '#f59e0b';

// ─── Фазы Космического Лифта (Satisfactory 1.0) ──────────────────────────────
export const SPACE_ELEVATOR_PHASES = [
  {
    phase: 1,
    title: 'Фаза 1: Платформа',
    tier: 'Тир 1-2',
    color: '#38bdf8',
    reward: 'Доступ к Тирам 3 и 4',
    requirements: [
      { itemId: 'smart_plating', count: 50, stageId: 'complex_3', rate: 2 },
    ],
  },
  {
    phase: 2,
    title: 'Фаза 2: Каркас',
    tier: 'Тир 3-4',
    color: '#fbbf24',
    reward: 'Доступ к Тирам 5 и 6',
    requirements: [
      { itemId: 'smart_plating', count: 1000, stageId: 'complex_3', rate: 2 },
      { itemId: 'versatile_framework', count: 1000, stageId: 'complex_3', rate: 5 },
      { itemId: 'automated_wiring', count: 100, stageId: 'complex_3', rate: 2.5 },
    ],
  },
  {
    phase: 3,
    title: 'Фаза 3: Системы',
    tier: 'Тир 5-6',
    color: '#34d399',
    reward: 'Доступ к Тирам 7 и 8',
    requirements: [
      { itemId: 'versatile_framework', count: 2500, stageId: 'complex_3', rate: 5 },
      { itemId: 'modular_engine', count: 500, stageId: 'complex_5', rate: 2.5 },
      { itemId: 'adaptive_control_unit', count: 100, stageId: 'complex_5', rate: 1 },
    ],
  },
  {
    phase: 4,
    title: 'Фаза 4: Двигатели',
    tier: 'Тир 7-8',
    color: '#a855f7',
    reward: 'Доступ к Тиру 9 (Квантовые технологии)',
    requirements: [
      { itemId: 'assembly_director_system', count: 500, stageId: 'complex_8b', rate: 1.5 },
      { itemId: 'magnetic_field_generator', count: 500, stageId: 'complex_8b', rate: 2 },
      { itemId: 'thermal_propulsion_rocket', count: 250, stageId: 'complex_8b', rate: 1 },
      { itemId: 'nuclear_pasta', count: 100, stageId: 'complex_8b', rate: 1 },
    ],
  },
  {
    phase: 5,
    title: 'Фаза 5: Сборка (Финал)',
    tier: 'Тир 9',
    color: '#ec4899',
    reward: 'Кружка «Лучший работник планеты» (Завершение игры)',
    requirements: [
      { itemId: 'nuclear_pasta', count: 1000, stageId: 'complex_8b', rate: 1 },
      { itemId: 'biochemical_spacesuit', count: 1000, stageId: 'phase_5', rate: 2.5 },
      { itemId: 'ai_expansion_server', count: 256, stageId: 'phase_5', rate: 2.5 },
      { itemId: 'ballistic_warp_drive', count: 200, stageId: 'phase_5', rate: 1 },
    ],
  },
];

// Фабрики-поставщики
const SUPPLIER_FACTORIES = [
  {
    id: 'complex_3',
    name: 'ЭТАП 4: СБОРОЧНО-МЕТИЗНЫЙ ХАБ',
    tier: 'Тир 1-4',
    accent: '#38bdf8',
    items: ['smart_plating', 'versatile_framework', 'automated_wiring'],
  },
  {
    id: 'complex_5',
    name: 'ЭТАП 6: МАШИНОСТРОИТЕЛЬНЫЙ КОМПЛЕКС',
    tier: 'Тир 5-6',
    accent: '#34d399',
    items: ['modular_engine', 'adaptive_control_unit'],
  },
  {
    id: 'complex_8b',
    name: 'ЭТАП 10: ВЕРФЬ КОСМИЧЕСКОГО ЛИФТА',
    tier: 'Тир 7-8',
    accent: '#a855f7',
    items: [
      'assembly_director_system',
      'magnetic_field_generator',
      'thermal_propulsion_rocket',
      'nuclear_pasta',
    ],
  },
  {
    id: 'phase_5',
    name: 'ЭТАП 11: КВАНТОВАЯ ВЕРФЬ',
    tier: 'Тир 9',
    accent: '#ec4899',
    items: ['biochemical_spacesuit', 'ai_expansion_server', 'ballistic_warp_drive'],
  },
];

// Все транзитные маршруты в Лифт
export const ELEVATOR_ROUTES = [
  // Этап 4
  { source: 'complex_3', target: 'space_elevator', itemId: 'smart_plating', phase: [1, 2], rate: 2 },
  { source: 'complex_3', target: 'space_elevator', itemId: 'versatile_framework', phase: [2, 3], rate: 5 },
  { source: 'complex_3', target: 'space_elevator', itemId: 'automated_wiring', phase: [2], rate: 2.5 },
  // Этап 6
  { source: 'complex_5', target: 'space_elevator', itemId: 'modular_engine', phase: [3], rate: 2.5 },
  { source: 'complex_5', target: 'space_elevator', itemId: 'adaptive_control_unit', phase: [3], rate: 1 },
  // Этап 10
  { source: 'complex_8b', target: 'space_elevator', itemId: 'assembly_director_system', phase: [4], rate: 1.5 },
  { source: 'complex_8b', target: 'space_elevator', itemId: 'magnetic_field_generator', phase: [4], rate: 2 },
  { source: 'complex_8b', target: 'space_elevator', itemId: 'thermal_propulsion_rocket', phase: [4], rate: 1 },
  { source: 'complex_8b', target: 'space_elevator', itemId: 'nuclear_pasta', phase: [4, 5], rate: 1 },
  // Этап 11
  { source: 'phase_5', target: 'space_elevator', itemId: 'biochemical_spacesuit', phase: [5], rate: 2.5 },
  { source: 'phase_5', target: 'space_elevator', itemId: 'ai_expansion_server', phase: [5], rate: 2.5 },
  { source: 'phase_5', target: 'space_elevator', itemId: 'ballistic_warp_drive', phase: [5], rate: 1 },
];

const LEGEND = [
  { color: '#38bdf8', label: 'Фаза 1: Платформа' },
  { color: '#fbbf24', label: 'Фаза 2: Каркас' },
  { color: '#34d399', label: 'Фаза 3: Системы' },
  { color: '#a855f7', label: 'Фаза 4: Двигатели' },
  { color: '#ec4899', label: 'Фаза 5: Квантовая сборка' },
];

// ─── Узел 1: Фабрика-поставщик (Стиль MacroStageNode из Карты) ────────────────
const MacroFactoryNode = ({ data }) => {
  const accent = data.accent || '#f97316';
  const glow = `0 0 16px ${accent}2e`;
  const stripe = `bg-[repeating-linear-gradient(45deg,${accent},${accent}_8px,#0b0d10_8px,#0b0d10_16px)]`;

  return (
    <div
      onClick={data.onClick}
      className="bg-[#14171d] rounded-md w-[260px] flex flex-col relative overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] group shadow-xl"
      style={{ border: `2px solid ${accent}`, boxShadow: glow }}
    >
      {/* Полосатый FICSIT-декор сверху */}
      <div className={`h-2 w-full ${stripe}`} />

      <div className="p-3 bg-gradient-to-b from-[#1a1f29] to-transparent border-b border-[#2a2e39]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0b0d10] text-gray-300 border border-[#2a2e39]">
            {data.tier}
          </span>
          <span className="text-[9px] font-bold text-gray-400 group-hover:text-amber-400 transition-colors">
            Открыть цех →
          </span>
        </div>
        <h3 className="font-black uppercase tracking-wider text-[11px] leading-tight text-white group-hover:text-amber-400 transition-colors">
          {data.name}
        </h3>
        <p className="text-[9px] text-gray-400 font-bold tracking-wider mt-1">
          ПОСТАВЩИК ПРОЕКТА «СБОРКА»
        </p>
      </div>

      <div className="px-3 py-2 bg-[#0b0d10] flex justify-between items-center text-[10px]">
        <span className="text-gray-400">Статус</span>
        <span className="font-bold text-emerald-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          АКТИВЕН
        </span>
      </div>

      {/* Выходные хэндлы — справа */}
      {(data.outputs || []).map((itemId, idx, arr) => (
        <Handle
          key={`out-${itemId}`}
          type="source"
          id={`source-${itemId}`}
          position={Position.Right}
          style={{
            top: `${((idx + 1) / (arr.length + 1)) * 100}%`,
            background: getEdgeColor(itemId),
            border: '2px solid #0b0d10',
            width: 12,
            height: 12,
          }}
          title={`Выход: ${items[itemId]?.name || itemId}`}
        />
      ))}
    </div>
  );
};

// ─── Узел 2: Космический Лифт (Флагманская карточка FICSIT) ───────────────────
const MacroElevatorNode = ({ data }) => {
  const accent = '#f59e0b';
  const glow = '0 0 24px rgba(245,158,11,0.3)';
  const stripe = 'bg-[repeating-linear-gradient(45deg,#f59e0b,#f59e0b_8px,#0b0d10_8px,#0b0d10_16px)]';
  const elevatorIcon = getAssetUrl('/icons/Buildings/SpaceElevator.png');

  return (
    <div
      className="bg-[#14171d] rounded-md w-[290px] flex flex-col relative overflow-hidden shadow-2xl"
      style={{ border: `2px solid ${accent}`, boxShadow: glow }}
    >
      {/* Полосатый FICSIT-декор сверху */}
      <div className={`h-2.5 w-full ${stripe}`} />

      <div className="p-3 bg-gradient-to-b from-[#f59e0b]/20 to-transparent border-b border-[#f59e0b]/30 flex items-center gap-3">
        <img
          src={elevatorIcon}
          alt="Космический лифт"
          className="w-11 h-11 object-contain shrink-0 filter drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-black uppercase tracking-wider text-[12.5px] text-[#f59e0b] leading-tight truncate">
            Космический Лифт
          </h3>
          <p className="text-[9.5px] text-gray-300 font-bold tracking-wider mt-0.5">
            ПРОЕКТ «СБОРКА» (ФАЗЫ 1-5)
          </p>
        </div>
      </div>

      <div className="px-3 py-2 bg-[#0b0d10] border-b border-[#2a2e39]/60 flex justify-between items-center text-[10px]">
        <span className="text-gray-400">Питание</span>
        <span className="font-mono text-emerald-400 font-bold">★ 0 МВт (Пассивное)</span>
      </div>

      <div className="px-3 py-2 bg-[#0b0d10] border-b border-[#2a2e39]/60 flex justify-between items-center text-[10px]">
        <span className="text-gray-400">Шлюзы снабжения</span>
        <span className="font-mono text-[#f59e0b] font-bold">
          {data.inputs?.length || 11} линий приема
        </span>
      </div>

      <div className="px-3 py-2 bg-[#12151c] flex items-center justify-between text-[10px]">
        <span className="text-gray-400">Статус</span>
        <span className="text-[#f59e0b] font-black uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-pulse"></span>
          ГОТОВ К ЗАПУСКУ
        </span>
      </div>

      {/* Входные хэндлы — слева */}
      {(data.inputs || []).map((itemId, idx, arr) => (
        <Handle
          key={`in-${itemId}`}
          type="target"
          id={`target-${itemId}`}
          position={Position.Left}
          style={{
            top: `${((idx + 1) / (arr.length + 1)) * 100}%`,
            background: getEdgeColor(itemId),
            border: '2px solid #0b0d10',
            width: 12,
            height: 12,
          }}
          title={`Вход: ${items[itemId]?.name || itemId}`}
        />
      ))}
    </div>
  );
};

const nodeTypes = {
  macroFactory: MacroFactoryNode,
  macroElevator: MacroElevatorNode,
};

const edgeTypes = {
  macroEdge: MacroEdge,
};

// ─── Главный компонент SpaceElevatorView ──────────────────────────────────────
export default function SpaceElevatorView({ onNavigateStage }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPhase, setSelectedPhase] = useState('all');

  // Подсветка связности при наведении курсора
  const onNodeMouseEnter = (_, node) => {
    const id = node.id;
    const connected = new Set([id]);
    edges.forEach((e) => {
      if (e.source === id) connected.add(e.target);
      if (e.target === id) connected.add(e.source);
    });
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: {
          ...n.style,
          opacity: connected.has(n.id) ? 1 : 0.15,
          transition: 'opacity 0.25s',
        },
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: {
          ...e.style,
          opacity: e.source === id || e.target === id ? 1 : 0.05,
          transition: 'opacity 0.25s',
        },
      }))
    );
  };

  const onNodeMouseLeave = () => {
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        style: { ...n.style, opacity: 1, transition: 'opacity 0.25s' },
      }))
    );
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        style: { ...e.style, opacity: 1, transition: 'opacity 0.25s' },
      }))
    );
  };

  // Построение графа через Dagre (чистая карта LR как в MacroView)
  useEffect(() => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: 'LR',
      nodesep: 80,
      ranksep: 380,
      marginx: 40,
      marginy: 40,
    });
    g.setDefaultEdgeLabel(() => ({}));

    // Фильтрация маршрутов по выбранной фазе
    const activeRoutes = ELEVATOR_ROUTES.filter((r) => {
      if (selectedPhase === 'all') return true;
      return r.phase.includes(selectedPhase);
    });

    // Определяем активные входы для лифта и выходы для фабрик
    const factoryOutputs = {};
    const elevatorInputs = new Set();

    SUPPLIER_FACTORIES.forEach((f) => {
      factoryOutputs[f.id] = new Set();
    });

    activeRoutes.forEach((r) => {
      factoryOutputs[r.source]?.add(r.itemId);
      elevatorInputs.add(r.itemId);
    });

    // 1. Узлы фабрик-поставщиков
    const factoryNodes = SUPPLIER_FACTORIES.map((f) => {
      const outputs = Array.from(factoryOutputs[f.id] || f.items);
      g.setNode(f.id, { width: 260, height: 110 });

      return {
        id: f.id,
        type: 'macroFactory',
        data: {
          name: f.name,
          tier: f.tier,
          accent: f.accent,
          outputs,
          onClick: () => {
            const preset = presets.find((p) => p.id === f.id);
            if (preset && onNavigateStage) {
              onNavigateStage(preset);
            }
          },
        },
        position: { x: 0, y: 0 },
      };
    });

    // 2. Узел Космического Лифта
    const allElevatorItems =
      selectedPhase === 'all'
        ? Array.from(new Set(ELEVATOR_ROUTES.map((r) => r.itemId)))
        : Array.from(elevatorInputs);

    g.setNode('space_elevator', { width: 290, height: 160 });
    const elevatorNode = {
      id: 'space_elevator',
      type: 'macroElevator',
      data: {
        inputs: allElevatorItems,
      },
      position: { x: 0, y: 0 },
    };

    // 3. Рёбра (Конвейерные линии MacroEdge)
    const pairGroups = {};
    activeRoutes.forEach((route) => {
      const key = `${route.source}__${route.target}`;
      if (!pairGroups[key]) pairGroups[key] = [];
      pairGroups[key].push(route.itemId);
    });

    const newEdges = activeRoutes.map((route, idx) => {
      const color = getEdgeColor(route.itemId);
      const itemInfo = items[route.itemId] || { name: route.itemId, icon: '' };
      const pairKey = `${route.source}__${route.target}`;
      const group = pairGroups[pairKey];
      const trackIndex = group.indexOf(route.itemId);
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
        style: { strokeWidth: 2.5, stroke: color },
        markerEnd: { type: MarkerType.ArrowClosed, color },
        data: {
          icon: itemInfo.icon,
          rate: route.rate,
          name: itemInfo.name,
          color,
          trackIndex,
          totalTracks,
        },
      };
    });

    dagre.layout(g);

    const layoutedNodes = [...factoryNodes, elevatorNode].map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: {
          x: pos.x - pos.width / 2,
          y: pos.y - pos.height / 2,
        },
      };
    });

    setNodes(layoutedNodes);
    setEdges(newEdges);
  }, [selectedPhase, onNavigateStage, setNodes, setEdges]);

  // Сводка выбранной фазы
  const activePhaseData = useMemo(() => {
    if (selectedPhase === 'all') {
      return {
        title: 'Все фазы проекта (1-5)',
        desc: 'Полная карта сквозного снабжения Космического Лифта всеми 12 орбитальными деталями из 4-х комплексов.',
        items: [
          { name: 'Умная обшивка', count: 1050 },
          { name: 'Универсальный каркас', count: 3500 },
          { name: 'Автоматическая проводка', count: 100 },
          { name: 'Модульный двигатель', count: 500 },
          { name: 'Адаптивный блок управления', count: 100 },
          { name: 'Система управл. сборкой', count: 500 },
          { name: 'Генератор магнитного поля', count: 500 },
          { name: 'Терморакетный двигатель', count: 250 },
          { name: 'Ядерная паста', count: 1100 },
          { name: 'Биохимический скафандр', count: 1000 },
          { name: 'Сервер расш. ИИ', count: 256 },
          { name: 'Баллистический варп-двигатель', count: 200 },
        ],
      };
    }
    const p = SPACE_ELEVATOR_PHASES.find((item) => item.phase === selectedPhase);
    return {
      title: p?.title || `Фаза ${selectedPhase}`,
      desc: `${p?.reward} • ${p?.tier}`,
      items: (p?.requirements || []).map((r) => ({
        name: items[r.itemId]?.name || r.itemId,
        count: r.count,
      })),
    };
  }, [selectedPhase]);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative">
      {/* ── FICSIT SCADA панель легенды и фильтров (стиль MacroView) ── */}
      <div className="absolute top-4 left-4 z-10 bg-[#14171d] border-2 border-[#f59e0b] p-4 rounded shadow-2xl pointer-events-auto w-72">
        <div className="flex items-center gap-2 mb-1">
          <img
            src={getAssetUrl('/icons/Buildings/SpaceElevator.png')}
            alt="Космический лифт"
            className="w-5 h-5 object-contain"
          />
          <h2 className="text-[#f59e0b] font-black text-sm uppercase tracking-wider">
            Проект «Сборка»
          </h2>
        </div>
        <p className="text-gray-400 text-[10px] mb-3">
          Космический Лифт • FICSIT Orbital Delivery
        </p>

        {/* Переключатель фаз */}
        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">
          Фильтр по фазам
        </p>
        <div className="grid grid-cols-3 gap-1 mb-3">
          <button
            onClick={() => setSelectedPhase('all')}
            className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
              selectedPhase === 'all'
                ? 'bg-[#f59e0b] text-black shadow'
                : 'bg-[#0b0d10] text-gray-300 hover:bg-[#1f242f] border border-[#2a2e39]'
            }`}
          >
            Все (1-5)
          </button>
          {[1, 2, 3, 4, 5].map((ph) => (
            <button
              key={ph}
              onClick={() => setSelectedPhase(ph)}
              className={`px-2 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                selectedPhase === ph
                  ? 'bg-[#f59e0b] text-black shadow'
                  : 'bg-[#0b0d10] text-gray-300 hover:bg-[#1f242f] border border-[#2a2e39]'
              }`}
            >
              Фаза {ph}
            </button>
          ))}
        </div>

        {/* Сводка выбранной фазы */}
        <div className="p-2.5 rounded bg-[#0b0d10] border border-[#2a2e39] mb-3">
          <div className="text-[10px] font-bold text-gray-200 mb-1 flex justify-between">
            <span>{activePhaseData.title}</span>
            <span className="text-[#f59e0b] font-mono">
              {activePhaseData.items.length} предм.
            </span>
          </div>
          <div className="text-[9px] text-gray-400 leading-tight mb-2">
            {activePhaseData.desc}
          </div>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
            {activePhaseData.items.map((it) => (
              <div
                key={it.name}
                className="flex items-center justify-between text-[9px] font-mono"
              >
                <span className="text-gray-300 truncate max-w-[160px]">
                  {it.name}
                </span>
                <span className="text-[#f59e0b] font-bold shrink-0">
                  {it.count.toLocaleString()} шт
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Легенда цветов */}
        <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">
          Фазы проекта
        </p>
        <div className="flex flex-col gap-1">
          {LEGEND.map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                className="w-3.5 h-1 rounded-full shrink-0"
                style={{ background: color }}
              />
              <span className="text-[9px] text-gray-400 truncate">{label}</span>
            </div>
          ))}
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
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1e2330" gap={28} size={2} />
        <Controls
          className="bg-[#14171d] border border-[#2a2e39] fill-[#e1e1e6]"
          showInteractive={false}
        />
      </ReactFlow>
    </div>
  );
}
