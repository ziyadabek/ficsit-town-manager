/**
 * GraphCanvas.jsx
 * ════════════════════════════════════════════════════════════════════════════════
 * Визуальный холст React Flow с поддержкой SVG-экспорта (Vector Blueprint).
 *
 * Особенности:
 *  - Компонент обернут в forwardRef, чтобы родитель (MainView) мог иметь ref.
 *  - useImperativeHandle открывает на ref метод:
 *      __exportSvgBlueprint() - экспорт векторного чертежа
 *  - Внешний containerRef используется хуком useGraphExport.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  ReactFlow,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFactoryStore } from '../../store/useFactoryStore';
import MachineNode from './MachineNode';
import SplitterNode from './SplitterNode';
import MergerNode from './MergerNode';
import PhysicalMachineNode from './PhysicalMachineNode';
import OutputNode from './OutputNode';
import FlowEdge from './FlowEdge';
import { useGraphExport } from './useGraphExport';

const nodeTypes = { 
  machine: MachineNode,
  splitter: SplitterNode,
  merger: MergerNode,
  physicalMachine: PhysicalMachineNode,
  productItem: OutputNode,
  output: OutputNode
};
const edgeTypes = { default: FlowEdge };

const GraphCanvasInner = forwardRef(function GraphCanvasInner(_props, ref) {
  const storeNodes = useFactoryStore(s => s.nodes);
  const storeEdges = useFactoryStore(s => s.edges);
  const recalculateGraph = useFactoryStore(s => s.recalculateGraph);
  const layoutDirection = useFactoryStore(s => s.layoutDirection);
  const schematicMode = useFactoryStore(s => s.schematicMode);
  const isCalculatingLayout = useFactoryStore(s => s.isCalculatingLayout);
  const isRightPanelOpen = useFactoryStore(s => s.isRightPanelOpen);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Ref на DOM-контейнер ReactFlow
  const containerRef = useRef(null);

  // Хуки экспорта SVG и контроля камеры
  const { exportSvgBlueprint } = useGraphExport(containerRef);
  const { fitView } = useReactFlow();

  // Пробрасываем метод экспорта наружу
  useImperativeHandle(ref, () => ({
    __exportSvgBlueprint: exportSvgBlueprint,
  }), [exportSvgBlueprint]);

  // Первичный расчет
  useEffect(() => {
    recalculateGraph();
  }, [recalculateGraph]);

  // Синхронизация с store и автоцентрирование камеры
  useEffect(() => {
    const validNodes = Array.isArray(storeNodes) ? storeNodes : [];
    const validEdges = Array.isArray(storeEdges) ? storeEdges : [];
    setNodes(validNodes);
    setEdges(validEdges.map(e => ({ ...e, type: 'default' })));
    
    // Синхронизируем вызов центрирования: даем React Flow время 
    // отрендерить новые узлы после Dagre, прежде чем вписывать камеру
    if (storeNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, minZoom: 0.01, duration: 400 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [storeNodes, storeEdges, layoutDirection, schematicMode, setNodes, setEdges, fitView]);

  // Автоцентрирование при открытии/закрытии боковой панели
  useEffect(() => {
    if (storeNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, minZoom: 0.01, duration: 300 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isRightPanelOpen, fitView]);

  // Обработка изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (storeNodes.length > 0) {
        fitView({ padding: 0.1, minZoom: 0.01, duration: 200 });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [storeNodes.length, fitView]);

  return (
    <div ref={containerRef} className="w-full h-full scim-grid overflow-hidden relative flex-1 min-w-0 min-h-0">
      {isCalculatingLayout && (
        <div className="absolute top-3 right-3 z-50 bg-[#1e232d]/90 backdrop-blur border border-[#f97316]/50 text-white text-xs px-3 py-1.5 rounded-full shadow-xl flex items-center gap-2 pointer-events-none animate-pulse">
          <svg className="w-3.5 h-3.5 text-[#f97316] animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          <span className="font-mono text-[11px] text-gray-200">Расчёт топологии графа...</span>
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        minZoom={0.01}
        maxZoom={3.0}
        fitView
        fitViewOptions={{ padding: 0.1, minZoom: 0.01 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls position="bottom-left" showInteractive={true} fitViewOptions={{ padding: 0.1, minZoom: 0.01 }} />
      </ReactFlow>
    </div>
  );
});

const GraphCanvas = forwardRef(function GraphCanvas(_props, ref) {
  return (
    <ReactFlowProvider>
      <GraphCanvasInner ref={ref} />
    </ReactFlowProvider>
  );
});

export default GraphCanvas;
