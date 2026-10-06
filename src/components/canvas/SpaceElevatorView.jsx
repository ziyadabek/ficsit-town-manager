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
  BaseEdge,
  getSmoothStepPath,
  EdgeLabelRenderer,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import items from '../../database/items.json';
import presets from '../../database/campaignPresets.json';
import { getAssetUrl } from '../../database/assets';

// ─── 5 Фаз Космического Лифта (Satisfactory 1.0) ──────────────────────────────
export const SPACE_ELEVATOR_PHASES = [
  {
    phase: 1,
    title: 'Фаза 1: Платформа',
    tier: 'Тир 1-2',
    color: '#38bdf8', // Неоновый голубой
    reward: 'Доступ к Тирам 3 и 4',
    requirements: [
      { itemId: 'smart_plating', count: 50, stageId: 'complex_3', rate: 2 },
    ],
  },
  {
    phase: 2,
    title: 'Фаза 2: Каркас',
    tier: 'Тир 3-4',
    color: '#fbbf24', // Янтарный
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
    color: '#34d399', // Изумрудный
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
    color: '#a855f7', // Фиолетовый
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
    color: '#ec4899', // Неоновый розовый
    reward: 'Кружка «Лучший работник планеты» (Завершение игры)',
    requirements: [
      { itemId: 'nuclear_pasta', count: 1000, stageId: 'complex_8b', rate: 1 },
      { itemId: 'biochemical_spacesuit', count: 1000, stageId: 'phase_5', rate: 2.5 },
      { itemId: 'ai_expansion_server', count: 256, stageId: 'phase_5', rate: 2.5 },
      { itemId: 'ballistic_warp_drive', count: 200, stageId: 'phase_5', rate: 1 },
    ],
  },
];

const STAGE_NAMES = {
  complex_3: 'Эт. 4: Сборочный хаб',
  complex_5: 'Эт. 6: Машиностроение',
  complex_8b: 'Эт. 10: Верфь Лифта',
  phase_5: 'Эт. 11: Квантовая верфь',
};

// ─── Узел 1: Деталь Проекта (Круг SCIM 80×80) ─────────────────────────────────
function ScimPartNode({ data }) {
  const item = items[data.itemId] || { name: data.itemId, icon: '' };
  const color = data.color || '#38bdf8';

  const handlePos =
    data.targetSide === 'top'
      ? Position.Bottom
      : data.targetSide === 'bottom'
      ? Position.Top
      : Position.Right;

  return (
    <div
      onClick={data.onClick}
      className="flex flex-col items-center justify-center relative select-none w-[140px] py-1 cursor-pointer group"
      title={`${item.name} (${data.count.toLocaleString()} шт) • Кликните для перехода в цех`}
    >
      <div
        className="w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform group-hover:scale-105"
        style={{
          border: `3px solid ${color}`,
          boxShadow: `0 0 12px ${color}44`,
        }}
      >
        {/* 3D Иконка предмета */}
        {item.icon && (
          <img
            src={getAssetUrl(item.icon)}
            alt={item.name}
            className="w-13 h-13 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
            onError={(e) => (e.target.style.display = 'none')}
          />
        )}

        {/* Верхний пилл: Номер фазы */}
        <div
          className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[8.5px] font-black font-mono shadow-md z-10 text-black whitespace-nowrap"
          style={{ background: color }}
        >
          Фаза {data.phase}
        </div>

        {/* Нижний пилл: Темп подачи */}
        <div className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-[#0b0e14] border border-[#2a2e39] text-[8.5px] font-black font-mono text-[#22c55e] shadow-md z-10 whitespace-nowrap">
          +{data.rate}/м
        </div>

        {/* Выходной порт, направленный в сторону порта лифта */}
        <Handle
          type="source"
          position={handlePos}
          id="out"
          style={{
            background: color,
            border: '2px solid #0b0e14',
            width: 10,
            height: 10,
          }}
          className="opacity-90"
        />
      </div>

      {/* Подпись под кругом */}
      <div className="flex flex-col items-center text-center mt-3 leading-tight w-full px-1">
        <span className="text-xs font-bold text-white drop-shadow truncate w-full group-hover:text-amber-400 transition-colors">
          {item.name}
        </span>
        <span className="text-[10px] text-amber-400 font-mono font-bold truncate w-full mt-0.5">
          {data.count.toLocaleString()} шт
        </span>
        <span className="text-[9px] text-gray-500 truncate w-full mt-0.5 group-hover:text-gray-300 transition-colors">
          ← {data.stageName}
        </span>
      </div>
    </div>
  );
}

// ─── Узел 2: Космический Лифт (Центральный узел 110×110 с 6 портами на 3-х сторонах)
function ScimElevatorNode({ data }) {
  const elevatorIcon = getAssetUrl('/icons/Buildings/SpaceElevator.png');

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[170px] py-1 cursor-default group">
      <div
        className="w-28 h-28 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_6px_24px_rgba(0,0,0,0.9)] transition-transform hover:scale-105"
        style={{
          border: '4px solid #f59e0b',
          boxShadow: '0 0 24px rgba(245,158,11,0.45)',
        }}
        title="Космический Лифт: Проект «Сборка» (5 Фаз)"
      >
        {/* ── 6 ВХОДНЫХ ПОРТОВ (по 2 порта с 3-х сторон: Верх, Лево, Низ) ── */}

        {/* Верхняя сторона (Север): 2 порта */}
        <Handle
          type="target"
          position={Position.Top}
          id="port-top-0"
          style={{ left: '30%', top: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 1 (Север-А: Фазы 1-2)"
        />
        <Handle
          type="target"
          position={Position.Top}
          id="port-top-1"
          style={{ left: '70%', top: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 2 (Север-Б: Фазы 1-2)"
        />

        {/* Левая сторона (Запад): 2 порта */}
        <Handle
          type="target"
          position={Position.Left}
          id="port-left-0"
          style={{ top: '30%', left: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 3 (Запад-А: Фазы 3-4)"
        />
        <Handle
          type="target"
          position={Position.Left}
          id="port-left-1"
          style={{ top: '70%', left: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 4 (Запад-Б: Фазы 3-4)"
        />

        {/* Нижняя сторона (Юг): 2 порта */}
        <Handle
          type="target"
          position={Position.Bottom}
          id="port-bottom-0"
          style={{ left: '30%', bottom: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 5 (Юг-А: Фазы 4-5)"
        />
        <Handle
          type="target"
          position={Position.Bottom}
          id="port-bottom-1"
          style={{ left: '70%', bottom: -6 }}
          className="w-3.5 h-3.5 !bg-[#f59e0b] !border-2 !border-[#0b0e14] !rounded-xs shadow-md opacity-90 hover:scale-125 transition-transform"
          title="Входной порт 6 (Юг-Б: Фазы 4-5)"
        />

        {/* Правая сторона (Восток): Консоль управления и запуска */}
        <div
          className="absolute -right-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-[#1e293b] border border-[#f59e0b]/80 text-[8px] font-black font-mono text-[#f59e0b] shadow-md z-10 pointer-events-none whitespace-nowrap"
          title="Консоль терминала и отправки"
        >
          ТЕРМИНАЛ
        </div>

        {/* 3D Иконка Космического Лифта */}
        <img
          src={elevatorIcon}
          alt="Космический лифт"
          className="w-20 h-20 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
          onError={(e) => (e.target.style.display = 'none')}
        />

        {/* Нижний пилл: Фазы */}
        <div className="absolute -bottom-3.5 px-2.5 py-0.5 rounded-full bg-[#f59e0b] text-black text-[8.5px] font-black font-mono shadow-lg z-10 pointer-events-none whitespace-nowrap">
          5 / 5 ФАЗ
        </div>
      </div>

      {/* Подпись под узлом */}
      <div className="flex flex-col items-center text-center mt-3.5 leading-tight w-full px-1">
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

// ─── Ребро графа (Плавный конвейер со счетчиком темпа) ────────────────────────
function CompactConveyorEdge({
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
          strokeWidth: 2.5,
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
            className="bg-[#0b0d10] border rounded-full px-1.5 py-0.2 shadow-md text-[9px] font-mono font-bold z-10"
          >
            <span style={{ color }}>+{data.rate}/м</span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

const nodeTypes = {
  scimPart: ScimPartNode,
  scimElevator: ScimElevatorNode,
};

const edgeTypes = {
  compactConveyor: CompactConveyorEdge,
};

// ─── Главный компонент SpaceElevatorView ──────────────────────────────────────
export default function SpaceElevatorView({ onNavigateStage }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Подсветка связей при наведении
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

  // Построение компактного органичного графа без пустых расстояний
  useEffect(() => {
    const elevatorPos = { x: 580, y: 340 };
    const elevatorNode = {
      id: 'space_elevator',
      type: 'scimElevator',
      position: elevatorPos,
      data: {},
    };

    const newNodes = [];
    const newEdges = [];

    // Конфигурация секторов и позиций узлов деталей
    // При "Все фазы":
    //  - Северный сектор (сверху): Фазы 1 и 2 ──► port-top-0, port-top-1
    //  - Западный сектор (слева):  Фазы 3 и 4 ──► port-left-0, port-left-1
    //  - Южный сектор (снизу):     Фазы 4 и 5 ──► port-bottom-0, port-bottom-1
    if (selectedPhase === 'all') {
      // 1. Северный сектор (Сверху, Y: 100)
      const topItems = [
        { phase: 1, itemId: 'smart_plating', count: 50, stageId: 'complex_3', rate: 2, port: 'port-top-0', x: 380, y: 100 },
        { phase: 2, itemId: 'smart_plating', count: 1000, stageId: 'complex_3', rate: 2, port: 'port-top-0', x: 530, y: 100 },
        { phase: 2, itemId: 'versatile_framework', count: 1000, stageId: 'complex_3', rate: 5, port: 'port-top-1', x: 680, y: 100 },
        { phase: 2, itemId: 'automated_wiring', count: 100, stageId: 'complex_3', rate: 2.5, port: 'port-top-1', x: 830, y: 100 },
      ];

      // 2. Западный сектор (Слева, X: 170 и 340)
      const leftItems = [
        { phase: 3, itemId: 'versatile_framework', count: 2500, stageId: 'complex_3', rate: 5, port: 'port-left-0', x: 170, y: 270 },
        { phase: 3, itemId: 'modular_engine', count: 500, stageId: 'complex_5', rate: 2.5, port: 'port-left-0', x: 340, y: 270 },
        { phase: 3, itemId: 'adaptive_control_unit', count: 100, stageId: 'complex_5', rate: 1, port: 'port-left-1', x: 170, y: 430 },
        { phase: 4, itemId: 'assembly_director_system', count: 500, stageId: 'complex_8b', rate: 1.5, port: 'port-left-1', x: 340, y: 430 },
      ];

      // 3. Южный сектор (Снизу, Y: 580)
      const bottomItems = [
        { phase: 4, itemId: 'magnetic_field_generator', count: 500, stageId: 'complex_8b', rate: 2, port: 'port-bottom-0', x: 230, y: 580 },
        { phase: 4, itemId: 'thermal_propulsion_rocket', count: 250, stageId: 'complex_8b', rate: 1, port: 'port-bottom-0', x: 380, y: 580 },
        { phase: 4, itemId: 'nuclear_pasta', count: 100, stageId: 'complex_8b', rate: 1, port: 'port-bottom-0', x: 530, y: 580 },
        { phase: 5, itemId: 'nuclear_pasta', count: 1000, stageId: 'complex_8b', rate: 1, port: 'port-bottom-1', x: 680, y: 580 },
        { phase: 5, itemId: 'biochemical_spacesuit', count: 1000, stageId: 'phase_5', rate: 2.5, port: 'port-bottom-1', x: 830, y: 580 },
        { phase: 5, itemId: 'ai_expansion_server', count: 256, stageId: 'phase_5', rate: 2.5, port: 'port-bottom-1', x: 980, y: 580 },
        { phase: 5, itemId: 'ballistic_warp_drive', count: 200, stageId: 'phase_5', rate: 1, port: 'port-bottom-1', x: 1130, y: 580 },
      ];

      const allItems = [
        ...topItems.map((it) => ({ ...it, targetSide: 'top' })),
        ...leftItems.map((it) => ({ ...it, targetSide: 'left' })),
        ...bottomItems.map((it) => ({ ...it, targetSide: 'bottom' })),
      ];

      allItems.forEach((it, idx) => {
        const nodeId = `part_${it.phase}_${it.itemId}_${idx}`;
        const phaseData = SPACE_ELEVATOR_PHASES.find((p) => p.phase === it.phase);
        const stageName = STAGE_NAMES[it.stageId] || it.stageId;

        newNodes.push({
          id: nodeId,
          type: 'scimPart',
          position: { x: it.x, y: it.y },
          data: {
            itemId: it.itemId,
            count: it.count,
            phase: it.phase,
            rate: it.rate,
            color: phaseData.color,
            targetSide: it.targetSide,
            stageName,
            onClick: () => {
              const preset = presets.find((p) => p.id === it.stageId);
              if (preset && onNavigateStage) {
                onNavigateStage(preset);
              }
            },
          },
        });

        newEdges.push({
          id: `e_${nodeId}_elevator`,
          source: nodeId,
          target: 'space_elevator',
          targetHandle: it.port,
          type: 'compactConveyor',
          animated: true,
          data: {
            color: phaseData.color,
            rate: it.rate,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: phaseData.color,
          },
        });
      });
    } else {
      // Режим отдельной Фазы (1, 2, 3, 4 или 5)
      const p = SPACE_ELEVATOR_PHASES.find((item) => item.phase === selectedPhase);
      if (p) {
        p.requirements.forEach((req, idx) => {
          let pos = { x: 580, y: 140 };
          let targetSide = 'top';
          let targetPort = 'port-top-0';

          if (selectedPhase === 1) {
            pos = { x: 580, y: 140 };
            targetSide = 'top';
            targetPort = 'port-top-0';
          } else if (selectedPhase === 2) {
            const xs = [440, 580, 720];
            pos = { x: xs[idx] || 580, y: 140 };
            targetSide = 'top';
            targetPort = idx === 0 ? 'port-top-0' : 'port-top-1';
          } else if (selectedPhase === 3) {
            const ys = [220, 340, 460];
            pos = { x: 300, y: ys[idx] || 340 };
            targetSide = 'left';
            targetPort = idx === 0 ? 'port-left-0' : 'port-left-1';
          } else if (selectedPhase === 4) {
            if (idx < 2) {
              const ys = [280, 400];
              pos = { x: 320, y: ys[idx] };
              targetSide = 'left';
              targetPort = idx === 0 ? 'port-left-0' : 'port-left-1';
            } else {
              const xs = [510, 670];
              pos = { x: xs[idx - 2], y: 550 };
              targetSide = 'bottom';
              targetPort = idx === 2 ? 'port-bottom-0' : 'port-bottom-1';
            }
          } else if (selectedPhase === 5) {
            const xs = [380, 520, 660, 800];
            pos = { x: xs[idx] || 580, y: 550 };
            targetSide = 'bottom';
            targetPort = idx % 2 === 0 ? 'port-bottom-0' : 'port-bottom-1';
          }

          const nodeId = `part_${p.phase}_${req.itemId}_${idx}`;
          const stageName = STAGE_NAMES[req.stageId] || req.stageId;

          newNodes.push({
            id: nodeId,
            type: 'scimPart',
            position: pos,
            data: {
              itemId: req.itemId,
              count: req.count,
              phase: p.phase,
              rate: req.rate,
              color: p.color,
              targetSide,
              stageName,
              onClick: () => {
                const preset = presets.find((pr) => pr.id === req.stageId);
                if (preset && onNavigateStage) {
                  onNavigateStage(preset);
                }
              },
            },
          });

          newEdges.push({
            id: `e_${nodeId}_elevator`,
            source: nodeId,
            target: 'space_elevator',
            targetHandle: targetPort,
            type: 'compactConveyor',
            animated: true,
            data: {
              color: p.color,
              rate: req.rate,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: p.color,
            },
          });
        });
      }
    }

    setNodes([...newNodes, elevatorNode]);
    setEdges(newEdges);
  }, [selectedPhase, onNavigateStage, setNodes, setEdges]);

  // Сводка выбранной фазы для SCADA панели
  const activePhaseData = useMemo(() => {
    if (selectedPhase === 'all') {
      return {
        title: 'Все фазы проекта (1-5)',
        desc: 'Сквозное снабжение орбитального терминала компонентами проекта.',
        reward: 'Кружка «Лучший работник планеты» (Завершение игры)',
        items: [
          { name: 'Умная обшивка', count: 1050, phase: '1, 2' },
          { name: 'Универсальный каркас', count: 3500, phase: '2, 3' },
          { name: 'Автоматическая проводка', count: 100, phase: '2' },
          { name: 'Модульный двигатель', count: 500, phase: '3' },
          { name: 'Адаптивный блок управления', count: 100, phase: '3' },
          { name: 'Система управл. сборкой', count: 500, phase: '4' },
          { name: 'Генератор магнитного поля', count: 500, phase: '4' },
          { name: 'Терморакетный двигатель', count: 250, phase: '4' },
          { name: 'Ядерная паста', count: 1100, phase: '4, 5' },
          { name: 'Биохимический скафандр', count: 1000, phase: '5' },
          { name: 'Сервер расш. ИИ', count: 256, phase: '5' },
          { name: 'Баллистический варп-двигатель', count: 200, phase: '5' },
        ],
      };
    }
    const p = SPACE_ELEVATOR_PHASES.find((item) => item.phase === selectedPhase);
    return {
      title: p?.title || `Фаза ${selectedPhase}`,
      desc: `${p?.tier} • ${p?.reward}`,
      reward: p?.reward,
      items: (p?.requirements || []).map((r) => ({
        name: items[r.itemId]?.name || r.itemId,
        count: r.count,
        phase: p.phase,
      })),
    };
  }, [selectedPhase]);

  return (
    <div className="w-full h-full bg-[#0b0d10] relative">
      {/* ── FICSIT SCADA панель легенды и фильтров (с кнопкой скрытия) ── */}
      {isPanelCollapsed ? (
        <button
          onClick={() => setIsPanelCollapsed(false)}
          className="absolute top-4 left-4 z-10 bg-[#14171d]/95 hover:bg-[#1f242f] border border-[#f59e0b] px-3 py-1.5 rounded shadow-2xl flex items-center gap-2 cursor-pointer transition-all"
          title="Показать панель проекта"
        >
          <img
            src={getAssetUrl('/icons/Buildings/SpaceElevator.png')}
            alt="Лифт"
            className="w-4 h-4 object-contain"
          />
          <span className="text-xs font-bold text-[#f59e0b]">Проект «Сборка»</span>
          <span className="text-[10px] text-gray-400 font-mono">Развернуть ▾</span>
        </button>
      ) : (
        <div className="absolute top-4 left-4 z-10 bg-[#14171d] border-2 border-[#f59e0b] p-4 rounded shadow-2xl pointer-events-auto w-72">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <img
                src={getAssetUrl('/icons/Buildings/SpaceElevator.png')}
                alt="Космический лифт"
                className="w-5 h-5 object-contain"
              />
              <h2 className="text-[#f59e0b] font-black text-sm uppercase tracking-wider">
                Проект «Сборка»
              </h2>
            </div>
            <button
              onClick={() => setIsPanelCollapsed(true)}
              className="px-2 py-0.5 rounded text-[10px] text-gray-400 hover:text-white hover:bg-[#2a2e39] border border-[#2a2e39] font-mono cursor-pointer transition-colors"
              title="Скрыть панель"
            >
              Скрыть ▲
            </button>
          </div>
          <p className="text-gray-400 text-[10px] mb-3">
            Орбитальный терминал • Satisfactory 1.0
          </p>

          {/* Переключатель фаз */}
          <p className="text-[9px] text-gray-400 uppercase tracking-widest mb-1.5 font-bold">
            Фазы снабжения
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

          {/* Сводка деталей выбранной фазы */}
          <div className="p-2.5 rounded bg-[#0b0d10] border border-[#2a2e39]">
            <div className="text-[10px] font-bold text-gray-200 mb-1 flex justify-between">
              <span>{activePhaseData.title}</span>
              <span className="text-[#f59e0b] font-mono">
                {activePhaseData.items.length} предм.
              </span>
            </div>
            <div className="text-[9px] text-gray-400 leading-tight mb-2">
              {activePhaseData.desc}
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {activePhaseData.items.map((it) => (
                <div
                  key={`${it.name}_${it.count}`}
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
        </div>
      )}

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
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
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
