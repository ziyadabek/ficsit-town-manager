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
import FlowEdge from './FlowEdge';
import { useGraphExport } from './useGraphExport';

const nodeTypes = { machine: MachineNode };
const edgeTypes = { default: FlowEdge };

const GraphCanvasInner = forwardRef(function GraphCanvasInner(_props, ref) {
  const { nodes: storeNodes, edges: storeEdges, recalculateGraph } = useFactoryStore();

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
    setNodes(storeNodes);
    setEdges(storeEdges.map(e => ({ ...e, type: 'default' })));
    
    // Синхронизируем вызов центрирования: даем React Flow время 
    // отрендерить новые узлы после Dagre, прежде чем вписывать камеру
    if (storeNodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.1, minZoom: 0.01, duration: 400 });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [storeNodes, storeEdges, setNodes, setEdges, fitView]);

  return (
    <div ref={containerRef} className="w-full h-full scim-grid overflow-hidden">
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
