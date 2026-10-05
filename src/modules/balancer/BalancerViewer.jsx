/**
 * BalancerViewer.jsx
 * ════════════════════════════════════════════════════════════════════════════════
 * Интерактивный визуализатор конвейерных балансировщиков Satisfactory.
 * Отображает схемы с плавными дугами Безье и 3D-моделями сплиттеров и мерджеров.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { BALANCERS } from './balancerCatalog';
import InputTriangleNode from './components/InputTriangleNode';
import OutputDiamondNode from './components/OutputDiamondNode';
import BalancerSplitterNode from './components/BalancerSplitterNode';
import BalancerMergerNode from './components/BalancerMergerNode';
import BalancerCurvedEdge from './components/BalancerCurvedEdge';

const nodeTypes = {
  balancerInput: InputTriangleNode,
  balancerOutput: OutputDiamondNode,
  balancerSplitter: BalancerSplitterNode,
  balancerMerger: BalancerMergerNode,
};

const edgeTypes = {
  balancerCurved: BalancerCurvedEdge,
};

function BalancerViewerInner() {
  const [selectedId, setSelectedId] = useState('1to2');
  const { fitView } = useReactFlow();

  const currentBalancer = useMemo(() => {
    return BALANCERS.find(b => b.id === selectedId) || BALANCERS[0];
  }, [selectedId]);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Загрузка узлов и ребер при смене схемы
  const loadPreset = useCallback((preset) => {
    setNodes(preset.nodes.map(n => ({ ...n })));
    setEdges(
      preset.edges.map(e => ({
        ...e,
        animated: true,
      }))
    );
  }, [setNodes, setEdges]);

  // При смене выбранного балансировщика
  useEffect(() => {
    if (currentBalancer) {
      loadPreset(currentBalancer);
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 400 });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [currentBalancer, loadPreset, fitView]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0d10] text-[#e1e1e6] overflow-hidden select-none">
      {/* Верхняя панель быстрого выбора соотношений балансировщиков */}
      <div className="bg-[#14171d] border-b border-[#2a2e39] px-4 py-2 flex items-center shrink-0 z-10 shadow-lg">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-thin scrollbar-thumb-[#2a2e39] w-full">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-2 shrink-0">
            Балансировщики:
          </span>
          {BALANCERS.map(b => {
            const isActive = b.id === selectedId;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedId(b.id)}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 border ${
                  isActive
                    ? 'bg-[#f97316] text-black border-[#f97316] shadow-[0_0_10px_rgba(249,115,22,0.4)]'
                    : 'bg-[#1c202a] text-gray-300 border-[#2a2e39] hover:bg-[#252b38] hover:text-white'
                }`}
              >
                {b.ratio}
              </button>
            );
          })}
        </div>
      </div>

      {/* Холст схемы балансировщика */}
      <div className="flex-1 w-full h-full relative overflow-hidden bg-[#0e1117]">
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
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={1.5} 
            color="#2a2e39" 
          />
          <Controls 
            position="bottom-left" 
            showInteractive={false} 
            fitViewOptions={{ padding: 0.2 }} 
          />
        </ReactFlow>

        {/* Легенда в нижнем правом углу */}
        <div className="absolute bottom-3 right-3 bg-[#14171d]/90 backdrop-blur-md border border-[#2a2e39] rounded-lg p-3 text-[11px] shadow-2xl flex flex-col gap-1.5 pointer-events-none z-10 max-w-xs">
          <div className="font-bold text-gray-300 border-b border-[#2a2e39] pb-1 mb-0.5 flex items-center justify-between">
            <span>Условные обозначения</span>
            <span className="text-[10px] text-[#f97316] font-normal">Конвейеры Satisfactory</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 flex items-center justify-center text-[#ef4444] font-bold">▲</span>
            <span className="text-gray-300">Вход конвейера (Входящий поток)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 flex items-center justify-center text-[#60a5fa] font-bold">◆</span>
            <span className="text-gray-300">Выход конвейера (Исходящий поток)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-700 rounded-sm inline-block border border-gray-500"></span>
            <span className="text-gray-300">Разветвитель (1 вход → 3 выхода)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-700 rounded-sm inline-block border border-gray-500"></span>
            <span className="text-gray-300">Соединитель (3 входа → 1 выход)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-0.5 bg-gradient-to-r from-red-500 via-green-500 to-blue-500 rounded"></span>
            <span className="text-gray-300">Плавные дуговые конвейерные ленты</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BalancerViewer() {
  return (
    <ReactFlowProvider>
      <BalancerViewerInner />
    </ReactFlowProvider>
  );
}
