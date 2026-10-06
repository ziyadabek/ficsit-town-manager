import { describe, it, expect } from 'vitest';
import campaignPresets from '../database/campaignPresets.json';
import { solveProductionGraph } from '../engine/solver.js';
import { calculateAllTransits } from '../engine/campaignTransitEngine.js';
import dagre from 'dagre';

describe('Stage 11 Compact Layout Analysis', () => {
  it('analyzes nodes, edges, and coordinates for stage 11 in compact mode', () => {
    const p = campaignPresets.find(x => x.id === 'phase_5');
    const stagesState = campaignPresets.reduce((acc, stage) => {
      acc[stage.id] = { enabled: true, scale: 1.0 };
      return acc;
    }, {});

    const allTransits = calculateAllTransits(stagesState);
    const stageTransits = allTransits[p.id] || [];
    const effectiveInputs = stageTransits.map(t => ({
      itemId: t.itemId,
      rate: t.rate,
      isImport: true,
      isTransit: true,
      sourceStageId: t.sourceStageId,
      sourceStageName: t.sourceStageName,
      deficit: t.deficit,
      transport: t.transport,
    }));

    (p.inputsLimit || []).forEach(inp => {
      if (!effectiveInputs.some(e => e.itemId === inp.itemId)) {
        effectiveInputs.push({
          id: `inp_${inp.itemId}`,
          itemId: inp.itemId,
          rate: inp.rate,
          isImport: true,
          isTransit: false,
        });
      }
    });

    const targets = (p.targets || []).map((t, idx) => ({ id: 'target_' + idx, itemId: t.itemId, rate: t.rate }));
    const result = solveProductionGraph(targets, effectiveInputs, p.options || {});

    console.log(`Phase 5 result: ${result.nodes.length} nodes, ${result.edges.length} edges`);

    // Let's replicate dagre layout logic from useFactoryStore.js
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    const layoutDirection = 'LR';
    const nodeSep = 80;
    const rankSep = 220;

    dagreGraph.setGraph({
      rankdir: layoutDirection,
      align: undefined,
      nodesep: nodeSep,
      ranksep: rankSep,
      ranker: 'network-simplex',
      marginx: 60,
      marginy: 60,
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

    result.nodes.forEach(node => {
      const { width, height } = getNodeDimensions(node);
      dagreGraph.setNode(node.id, { width, height });
    });

    const isRecycleEdge = (edge) => {
      const tgtNode = result.nodes.find(n => n.id === edge.target);
      if (tgtNode?.data?.isVIP && !edge.source.startsWith('mine_') && !edge.source.startsWith('import_')) {
        return true;
      }
      return false;
    };

    const forwardEdges = result.edges.filter(e => !isRecycleEdge(e));
    const nodeDepth = {};
    result.nodes.forEach(n => {
      nodeDepth[n.id] = 0;
    });

    let changed = true;
    let iterations = 0;
    const MAX_DEPTH = 30;
    while (changed && iterations < MAX_DEPTH) {
      changed = false;
      iterations++;
      forwardEdges.forEach(e => {
        if (nodeDepth[e.source] !== undefined) {
          const newDepth = nodeDepth[e.source] + 1;
          if (nodeDepth[e.target] === undefined || newDepth > nodeDepth[e.target]) {
            nodeDepth[e.target] = newDepth;
            changed = true;
          }
        }
      });
    }

    const inputNodeIds = new Set(result.nodes.filter(n => n.data?.isInput).map(n => n.id));

    result.edges.forEach(edge => {
      const recycle = isRecycleEdge(edge);
      if (recycle) {
        dagreGraph.setEdge(edge.source, edge.target, { weight: 0.1, minlen: 1 });
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

    // Let's analyze coordinates and edge lengths
    const coords = {};
    let minX = Infinity, maxX = -Infinity;
    result.nodes.forEach(n => {
      const pos = dagreGraph.node(n.id);
      coords[n.id] = pos;
      if (pos.x < minX) minX = pos.x;
      if (pos.x > maxX) maxX = pos.x;
    });

    console.log(`Graph total width: ${maxX - minX}px (from ${minX} to ${maxX})`);

    const edgeLengths = result.edges.map(e => {
      const src = coords[e.source];
      const tgt = coords[e.target];
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      return {
        edgeId: e.id,
        source: e.source,
        target: e.target,
        itemId: e.data?.itemId,
        rate: e.data?.rate,
        dx,
        dy,
        dist,
        srcDepth: nodeDepth[e.source],
        tgtDepth: nodeDepth[e.target],
      };
    });

    edgeLengths.sort((a, b) => b.dx - a.dx);

    console.log('--- Top 20 longest edges by dx ---');
    edgeLengths.slice(0, 20).forEach(e => {
      console.log(`Edge ${e.source} -> ${e.target} (${e.itemId}, rate=${e.rate}): dx=${e.dx}, dy=${e.dy}, dist=${Math.round(e.dist)}, srcDepth=${e.srcDepth}, tgtDepth=${e.tgtDepth}`);
    });

    // Detect cycles to filter back-edges
    const fullAdj = {};
    result.edges.forEach(e => {
      fullAdj[e.source] = fullAdj[e.source] || [];
      fullAdj[e.source].push(e);
    });

    const cycleEdges = new Set();
    const dfsVisited = {};
    const dfsStack = {};

    function dfs(u) {
      dfsVisited[u] = true;
      dfsStack[u] = true;
      for (const e of (fullAdj[u] || [])) {
        if (!dfsVisited[e.target]) {
          dfs(e.target);
        } else if (dfsStack[e.target]) {
          // e is a back-edge!
          cycleEdges.add(e.id);
          console.log(`Identified back-edge: ${e.source} -> ${e.target} (${e.data?.itemId})`);
        }
      }
      dfsStack[u] = false;
    }

    result.nodes.forEach(n => {
      if (!dfsVisited[n.id]) dfs(n.id);
    });

    const isRecycleEdgeV2 = (edge) => {
      if (edge.data?.itemId === 'dark_matter_residue') return true;
      const tgtNode = result.nodes.find(n => n.id === edge.target);
      if (tgtNode?.data?.isVIP && !edge.source.startsWith('mine_') && !edge.source.startsWith('import_')) {
        return true;
      }
      if (cycleEdges.has(edge.id)) return true;
      return false;
    };

    const cleanForwardEdges = result.edges.filter(e => !isRecycleEdgeV2(e));
    const cleanNodeDepth = {};
    result.nodes.forEach(n => {
      cleanNodeDepth[n.id] = 0;
    });

    changed = true;
    iterations = 0;
    while (changed && iterations < 30) {
      changed = false;
      iterations++;
      cleanForwardEdges.forEach(e => {
        if (cleanNodeDepth[e.source] !== undefined) {
          const newDepth = cleanNodeDepth[e.source] + 1;
          if (cleanNodeDepth[e.target] === undefined || newDepth > cleanNodeDepth[e.target]) {
            cleanNodeDepth[e.target] = newDepth;
            changed = true;
          }
        }
      });
    }

    console.log('Clean node depths iterations:', iterations);
    const cleanDepthsDist = {};
    result.nodes.forEach(n => {
      const d = cleanNodeDepth[n.id];
      cleanDepthsDist[d] = (cleanDepthsDist[d] || 0) + 1;
    });
    console.log('Clean node depth distribution:', cleanDepthsDist);

    // Now test Dagre with clean depths
    const testDagre = new dagre.graphlib.Graph();
    testDagre.setDefaultEdgeLabel(() => ({}));
    testDagre.setGraph({
      rankdir: layoutDirection,
      align: undefined,
      nodesep: nodeSep,
      ranksep: rankSep,
      ranker: 'network-simplex',
      marginx: 60,
      marginy: 60,
    });

    result.nodes.forEach(node => {
      const { width, height } = getNodeDimensions(node);
      testDagre.setNode(node.id, { width, height });
    });

    result.edges.forEach(edge => {
      const recycle = isRecycleEdgeV2(edge);
      if (recycle) {
        testDagre.setEdge(edge.source, edge.target, { weight: 0.1, minlen: 1 });
        return;
      }
      const srcDepth = cleanNodeDepth[edge.source] || 0;
      const tgtDepth = cleanNodeDepth[edge.target] || 0;
      const depthDiff = Math.max(1, tgtDepth - srcDepth);
      const isLongTransit = depthDiff > 1;
      const isFromInput = inputNodeIds.has(edge.source);
      const minlen = 1;
      testDagre.setEdge(edge.source, edge.target, {
        weight: isFromInput ? 2 : (isLongTransit ? 1 : 3),
        minlen,
      });
    });

    dagre.layout(testDagre);

    // Proposed layout algorithm:
    const proposedAdj = {};
    result.edges.forEach(e => {
      proposedAdj[e.source] = proposedAdj[e.source] || [];
      proposedAdj[e.source].push(e);
    });

    const proposedCycleEdges = new Set();
    const pDfsVisited = {};
    const pDfsStack = {};

    function pDfs(u) {
      pDfsVisited[u] = true;
      pDfsStack[u] = true;
      for (const e of (proposedAdj[u] || [])) {
        if (!pDfsVisited[e.target]) {
          pDfs(e.target);
        } else if (pDfsStack[e.target]) {
          proposedCycleEdges.add(e.id);
        }
      }
      pDfsStack[u] = false;
    }

    // Traverse starting with inputs first
    result.nodes.filter(n => n.data?.isInput).forEach(n => {
      if (!pDfsVisited[n.id]) pDfs(n.id);
    });
    result.nodes.forEach(n => {
      if (!pDfsVisited[n.id]) pDfs(n.id);
    });

    const isRecycleEdgeFinal = (edge) => {
      // 1. Byproduct recycling loops (e.g. dark matter residue from superposition oscillator)
      if (edge.data?.itemId === 'dark_matter_residue') return true;
      // 2. VIP water recycling loop
      const tgtNode = result.nodes.find(n => n.id === edge.target);
      if (tgtNode?.data?.isVIP && !edge.source.startsWith('mine_') && !edge.source.startsWith('import_')) {
        return true;
      }
      // 3. General topological back-edges
      if (proposedCycleEdges.has(edge.id)) return true;
      return false;
    };

    const cleanForward = result.edges.filter(e => !isRecycleEdgeFinal(e));
    const depthsFinal = {};
    result.nodes.forEach(n => { depthsFinal[n.id] = 0; });

    let pChanged = true;
    let pIter = 0;
    while (pChanged && pIter < 30) {
      pChanged = false;
      pIter++;
      cleanForward.forEach(e => {
        if (depthsFinal[e.source] !== undefined) {
          const newD = depthsFinal[e.source] + 1;
          if (depthsFinal[e.target] === undefined || newD > depthsFinal[e.target]) {
            depthsFinal[e.target] = newD;
            pChanged = true;
          }
        }
      });
    }

    const proposedDagre = new dagre.graphlib.Graph();
    proposedDagre.setDefaultEdgeLabel(() => ({}));
    proposedDagre.setGraph({
      rankdir: layoutDirection,
      align: undefined,
      nodesep: nodeSep,
      ranksep: rankSep,
      ranker: 'network-simplex',
      marginx: 60,
      marginy: 60,
    });

    result.nodes.forEach(node => {
      const { width, height } = getNodeDimensions(node);
      proposedDagre.setNode(node.id, { width, height });
    });

    result.edges.forEach(edge => {
      const recycle = isRecycleEdgeFinal(edge);
      if (recycle) {
        proposedDagre.setEdge(edge.source, edge.target, { weight: 0.1, minlen: 1 });
        return;
      }
      const sD = depthsFinal[edge.source] || 0;
      const tD = depthsFinal[edge.target] || 0;
      const depthDiff = Math.max(1, tD - sD);
      const isLongTransit = depthDiff > 1;

      // Imports (transit trucks/trains/drones) should be placed near their consumers (minlen=1)
      // Raw mines keep reasonable placement (minlen=1..2)
      const isRawMine = edge.source.startsWith('mine_');
      const minlen = isRawMine ? Math.min(depthDiff, 2) : 1;

      proposedDagre.setEdge(edge.source, edge.target, {
        weight: isRawMine ? 3 : (isLongTransit ? 1 : 3),
        minlen,
      });
    });

    dagre.layout(proposedDagre);

    let pMinX = Infinity, pMaxX = -Infinity;
    result.nodes.forEach(n => {
      const pos = proposedDagre.node(n.id);
      if (pos.x < pMinX) pMinX = pos.x;
      if (pos.x > pMaxX) pMaxX = pos.x;
    });
    console.log(`Proposed layout width: ${pMaxX - pMinX}px (from ${pMinX} to ${pMaxX})`);

    const pLengths = result.edges.map(e => {
      const src = proposedDagre.node(e.source);
      const tgt = proposedDagre.node(e.target);
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      return {
        edgeId: e.id,
        source: e.source,
        target: e.target,
        itemId: e.data?.itemId,
        dx,
        dy,
        dist: Math.round(Math.sqrt(dx * dx + dy * dy)),
      };
    });
    pLengths.sort((a, b) => b.dx - a.dx);
    console.log('--- Proposed Top 10 longest edges ---');
    expect(pMaxX - pMinX).toBeLessThan(4000);
  });

  it('verifies useFactoryStore sets compact nodes and edges for phase_5 preset', async () => {
    const { useFactoryStore } = await import('../store/useFactoryStore.js');
    const p = campaignPresets.find(x => x.id === 'phase_5');
    useFactoryStore.getState().loadPreset(p);

    const nodes = useFactoryStore.getState().nodes;
    const edges = useFactoryStore.getState().edges;

    expect(nodes.length).toBeGreaterThan(0);
    expect(edges.length).toBeGreaterThan(0);

    let minX = Infinity, maxX = -Infinity;
    nodes.forEach(n => {
      if (n.position.x < minX) minX = n.position.x;
      if (n.position.x > maxX) maxX = n.position.x;
    });

    const totalWidth = maxX - minX;
    console.log(`useFactoryStore Stage 11 totalWidth: ${totalWidth}px`);

    nodes.sort((a,b) => a.position.x - b.position.x).forEach(n => {
      console.log(`Node ${n.id} [${n.type}]: x=${n.position.x}, y=${n.position.y}`);
    });

    // Check longest edge dx
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const edgeDxList = [];
    edges.forEach(e => {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        const dx = Math.abs(tgt.position.x - src.position.x);
        edgeDxList.push({ id: e.id, source: e.source, target: e.target, item: e.data?.itemId, dx });
      }
    });

    edgeDxList.sort((a, b) => b.dx - a.dx);
    console.log('--- Top 10 edges by dx in useFactoryStore ---');
    edgeDxList.slice(0, 10).forEach(e => {
      console.log(`Edge ${e.source} -> ${e.target} (${e.item}): dx=${e.dx}`);
    });

    expect(totalWidth).toBeLessThan(5500);
    // Prior to fix, maxDx was > 15,600px! Now maxDx is only ~2,200px across the entire tier-9 factory.
    expect(edgeDxList[0].dx).toBeLessThan(2500);
  });
});
