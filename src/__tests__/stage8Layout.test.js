import { describe, it, expect } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';
import dagre from 'dagre';
import items from '../database/items.json';

describe('Stage 8 Layout Fix', () => {
  it('correctly handles water recycling cycle and produces compact layout', () => {
    const p = campaignPresets.find((x) => x.id === 'complex_7');
    expect(p).toBeDefined();

    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);
    const stageTransits = allTransits['complex_7'] || [];

    const effectiveInputs = stageTransits.map((t) => ({
      itemId: t.itemId,
      rate: t.rate,
      isImport: true,
      isTransit: true,
      sourceStageId: t.sourceStageId,
      sourceStageName: t.sourceStageName,
      deficit: t.deficit,
      transport: t.transport,
    }));

    const result = solveProductionGraph(p.targets, effectiveInputs, p.options);
    let activeNodes = [...result.nodes];
    let activeEdges = [...result.edges];

    // Simulating useFactoryStore logic
    const consumedBySourceItem = {};
    activeEdges.forEach((edge) => {
      const key = `${edge.source}_${edge.data?.itemId}`;
      consumedBySourceItem[key] = (consumedBySourceItem[key] || 0) + (edge.data?.rate || 0);
    });

    result.nodes.forEach((node) => {
      if (!node.data?.outputs) return;
      const machines = node.data?.machines || 1;
      node.data.outputs.forEach((outItem) => {
        const itemId = outItem.itemId;
        if (itemId === 'power') return;
        const consumed = consumedBySourceItem[`${node.id}_${itemId}`] || 0;
        const totalProduced = (outItem.rate || 0) * machines;
        const surplus = totalProduced - consumed;
        if (surplus > 0.001) {
          const outNodeId = `out_${node.id}_${itemId}`;
          activeNodes.push({
            id: outNodeId,
            type: 'productItem',
            data: { itemId, rate: surplus, label: 'Конечный продукт' },
          });
          activeEdges.push({
            id: `edge_${node.id}_${outNodeId}_${itemId}`,
            source: node.id,
            sourceHandle: `out-${itemId}`,
            target: outNodeId,
            targetHandle: 'in',
            data: { rate: surplus, itemId, isOutput: true },
          });
        }
      });
    });

    // Splitters
    const edgesBySourceItem = {};
    activeEdges.forEach((edge) => {
      const key = `${edge.source}_${edge.data?.itemId}`;
      if (!edgesBySourceItem[key]) edgesBySourceItem[key] = [];
      edgesBySourceItem[key].push(edge);
    });

    const newEdges = [];
    const processedSplitterKeys = new Set();

    Object.keys(edgesBySourceItem).forEach((key) => {
      const outgoingEdges = edgesBySourceItem[key];
      if (outgoingEdges.length > 1) {
        const firstEdge = outgoingEdges[0];
        const sourceNodeId = firstEdge.source;
        const itemId = firstEdge.data?.itemId;
        const totalRate = outgoingEdges.reduce((sum, e) => sum + (e.data?.rate || 0), 0);
        const splitterId = `spl_scim_${sourceNodeId}_${itemId}`;

        activeNodes.push({
          id: splitterId,
          type: 'splitter',
          data: { itemId, rate: totalRate, subLabel: `(${items[itemId]?.name || itemId})` },
        });

        newEdges.push({
          id: `edge_${sourceNodeId}_${splitterId}`,
          source: sourceNodeId,
          sourceHandle: firstEdge.sourceHandle,
          target: splitterId,
          targetHandle: 'in',
          data: { rate: totalRate, itemId },
        });

        outgoingEdges.forEach((outEdge, idx) => {
          newEdges.push({
            id: `edge_${splitterId}_${outEdge.target}_${idx}`,
            source: splitterId,
            sourceHandle: 'out',
            target: outEdge.target,
            targetHandle: outEdge.targetHandle,
            data: { rate: outEdge.data?.rate, itemId },
          });
        });

        processedSplitterKeys.add(key);
      }
    });

    if (processedSplitterKeys.size > 0) {
      activeEdges = [
        ...activeEdges.filter((e) => !processedSplitterKeys.has(`${e.source}_${e.data?.itemId}`)),
        ...newEdges,
      ];
    }

    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({
      rankdir: 'LR',
      nodesep: 80,
      ranksep: 220,
      ranker: 'network-simplex',
      marginx: 60,
      marginy: 60,
    });

    const getNodeDimensions = (node) => {
      if (node.type === 'splitter' || node.type === 'merger') return { width: 140, height: 130 };
      if (node.type === 'output' || node.type === 'productItem') return { width: 80, height: 130 };
      return { width: 150, height: 130 };
    };

    activeNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node);
      dagreGraph.setNode(node.id, { width, height });
    });

    // 1. Identify Feedback/Recycle Edges to prevent cycles in ranking
    // Ребро является возвратным (feedback), если оно возвращает побочный продукт в VIP Junction
    // или если его source зависит от target.
    const isRecycleEdge = (edge) => {
      const tgtNode = activeNodes.find(n => n.id === edge.target);
      // Возврат воды в VIP гидроконтур от не-шахты
      if (tgtNode?.data?.isVIP && !edge.source.startsWith('mine_') && !edge.source.startsWith('import_')) {
        return true;
      }
      return false;
    };

    const forwardEdges = activeEdges.filter(e => !isRecycleEdge(e));

    // Calculate nodeDepth on FORWARD edges only!
    const nodeDepth = {};
    activeNodes.forEach((n) => {
      nodeDepth[n.id] = 0;
    });

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 50) {
      changed = false;
      iterations++;
      forwardEdges.forEach((e) => {
        const srcDepth = nodeDepth[e.source];
        const newDepth = srcDepth + 1;
        if (newDepth > nodeDepth[e.target]) {
          nodeDepth[e.target] = newDepth;
          changed = true;
        }
      });
    }

    console.log(`Iterations for DAG ranking: ${iterations}`);
    console.log('Node Depths:', Object.entries(nodeDepth).map(([id, d]) => `${id}: ${d}`).join(', '));

    const inputNodeIds = new Set(activeNodes.filter((n) => n.data?.isInput).map((n) => n.id));

    activeEdges.forEach((edge) => {
      const recycle = isRecycleEdge(edge);
      if (recycle) {
        // Для возвратного ребра рециркуляции задаем минимальный вес и minlen: 1, чтобы оно шло назад
        dagreGraph.setEdge(edge.source, edge.target, {
          weight: 0.1,
          minlen: 1,
        });
        return;
      }

      const srcDepth = nodeDepth[edge.source] || 0;
      const tgtDepth = nodeDepth[edge.target] || 0;
      const depthDiff = Math.max(1, tgtDepth - srcDepth);
      const isLongTransit = depthDiff > 1;

      const isFromInput = inputNodeIds.has(edge.source);
      const minlen = isFromInput ? depthDiff : 1;

      dagreGraph.setEdge(edge.source, edge.target, {
        weight: isFromInput ? 4 : (isLongTransit ? 1 : 3),
        minlen,
      });
    });

    dagre.layout(dagreGraph);

    console.log('=== FIXED STAGE 8 NODES ===');
    let maxX = 0;
    activeNodes.forEach((n) => {
      const pos = dagreGraph.node(n.id);
      if (pos.x > maxX) maxX = pos.x;
      console.log(`Node [${n.id}] label="${n.data?.label || n.data?.recipe?.name || n.data?.itemId}" x=${pos.x} y=${pos.y}`);
    });

    console.log(`TOTAL FACTORY WIDTH: ${maxX} px`);
    expect(maxX).toBeLessThan(3500); // Now it should be around 2500px, NOT 68,000px!
  });
});
