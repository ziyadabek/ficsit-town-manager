import { describe, it } from 'vitest';
import { solveProductionGraph } from '../engine/solver';
import campaignPresets from '../database/campaignPresets.json';
import { calculateAllTransits } from '../engine/campaignTransitEngine';
import { expandToRealisticGraph } from '../engine/realisticGraphEngine';
import dagre from 'dagre';

describe('Layout Benchmark', () => {
  it('measures layout execution time across campaign stages', () => {
    const stagesState = {};
    Object.keys(campaignPresets).forEach(k => { stagesState[k] = { enabled: true, scale: 1.0 }; });
    const allTransits = calculateAllTransits(stagesState, {});

    console.log('\n--- DAGRE LAYOUT PERFORMANCE BENCHMARK ---');
    for (const [id, preset] of Object.entries(campaignPresets)) {
      const transits = allTransits[id] || [];
      let effectiveInputs = [...(preset.inputsLimit || [])];
      transits.forEach(tr => {
        effectiveInputs = effectiveInputs.filter(inp => inp.itemId !== tr.itemId);
        effectiveInputs.push({ id: 'transit_' + tr.itemId, itemId: tr.itemId, rate: tr.rate, isTransit: true });
      });

      const res = solveProductionGraph(preset.targets, effectiveInputs, preset.options);
      if (!res.feasible) continue;

      const t0 = performance.now();
      const gCompact = new dagre.graphlib.Graph();
      gCompact.setDefaultEdgeLabel(() => ({}));
      gCompact.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 220, ranker: 'network-simplex', marginx: 60, marginy: 60 });
      res.nodes.forEach(n => gCompact.setNode(n.id, { width: 150, height: 130 }));
      res.edges.forEach(e => gCompact.setEdge(e.source, e.target, { weight: 1, minlen: 1 }));
      dagre.layout(gCompact);
      const compactMs = performance.now() - t0;

      const realistic = expandToRealisticGraph(res.nodes, res.edges, { layoutDirection: 'LR', useSplitters: true });
      const t1 = performance.now();
      const gReal = new dagre.graphlib.Graph();
      gReal.setDefaultEdgeLabel(() => ({}));
      gReal.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 220, ranker: 'network-simplex', marginx: 60, marginy: 60 });
      realistic.nodes.forEach(n => gReal.setNode(n.id, { width: 140, height: 130 }));
      realistic.edges.forEach(e => gReal.setEdge(e.source, e.target, { weight: 1, minlen: 1 }));
      dagre.layout(gReal);
      const realMs = performance.now() - t1;

      console.log(
        id.padEnd(12),
        'Compact:', String(res.nodes.length).padStart(3), 'nodes,',
        String(res.edges.length).padStart(3), 'edges ->',
        compactMs.toFixed(2).padStart(7), 'ms |',
        'Realistic:', String(realistic.nodes.length).padStart(3), 'nodes,',
        String(realistic.edges.length).padStart(3), 'edges ->',
        realMs.toFixed(2).padStart(7), 'ms'
      );
    }
  });
});
