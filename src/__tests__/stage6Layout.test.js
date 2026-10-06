import { describe, it, expect } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';
import dagre from 'dagre';
import items from '../database/items.json';

describe('Stage 6 Layout Optimization', () => {
  it('tests setting minlen based on nodeDepth difference', () => {
    const p = campaignPresets.find((x) => x.id === 'complex_5');
    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);
    const stageTransits = allTransits['complex_5'] || [];

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
    });

    const getNodeDimensions = (node) => {
      if (node.type === 'splitter' || node.type === 'merger') {
        return { width: 140, height: 130 };
      }
      if (node.type === 'output' || node.type === 'productItem') {
        return { width: 80, height: 130 };
      }
      return { width: 150, height: 130 };
    };

    activeNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node);
      dagreGraph.setNode(node.id, { width, height });
    });

    // 1. Calculate nodeDepth
    const nodeDepth = {};
    activeNodes.forEach((n) => {
      nodeDepth[n.id] = 0;
    });

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 100) {
      changed = false;
      iterations++;
      activeEdges.forEach((e) => {
        const srcDepth = nodeDepth[e.source];
        const newDepth = srcDepth + 1;
        if (newDepth > nodeDepth[e.target]) {
          nodeDepth[e.target] = newDepth;
          changed = true;
        }
      });
    }

    // NEW LOGIC: Set minlen according to nodeDepth difference!
    activeEdges.forEach((edge) => {
      const srcDepth = nodeDepth[edge.source] || 0;
      const tgtDepth = nodeDepth[edge.target] || 0;
      const depthDiff = tgtDepth - srcDepth;
      
      const isInputSource = activeNodes.find((n) => n.id === edge.source)?.data?.isInput;
      const minlen = isInputSource ? Math.max(1, depthDiff) : 1;

      dagreGraph.setEdge(edge.source, edge.target, {
        weight: 3,
        minlen,
      });
    });

    dagre.layout(dagreGraph);

    console.log('--- ALL NODE POSITIONS ---');
    activeNodes.forEach(n => {
      const pos = dagreGraph.node(n.id);
      console.log(`[${n.id}] (${n.type}) => x=${pos.x}, y=${pos.y}`);
    });

    const modularFramePos = dagreGraph.node('import_modular_frame');
    const concretePos = dagreGraph.node('import_concrete');
    const steelPipePos = dagreGraph.node('import_steel_pipe');

    console.log('modularFrame x:', modularFramePos.x, 'concrete x:', concretePos.x, 'steelPipe x:', steelPipePos.x);
    expect(modularFramePos.x).toBe(concretePos.x);
    expect(modularFramePos.x).toBe(steelPipePos.x);
  });
});
