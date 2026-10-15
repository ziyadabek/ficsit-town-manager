import { describe, it, expect, beforeEach } from 'vitest';

// Setup browser globals for Node test environment
const storageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

globalThis.localStorage = storageMock;

class MockFileReader {
  readAsText(blob) {
    setTimeout(() => {
      this.result = blob._text;
      this.onload?.({ target: this });
    }, 5);
  }
}
globalThis.FileReader = MockFileReader;

import { useFactoryStore } from '../store/useFactoryStore';
import { loadBuiltNodes, saveBuiltNodes, importBackupJSON } from '../services/storageService';

describe('Built Nodes Persistence and Toggle Logic', () => {
  beforeEach(() => {
    localStorage.clear();
    const store = useFactoryStore.getState();
    store.resetBuiltNodes('test_stage');
    store.resetBuiltNodes('free_mode');
  });

  it('toggles building built state and saves to store and memory', () => {
    const store = useFactoryStore.getState();
    const nodeId = 'recipe_iron_ingot';

    expect(store.isNodeBuilt(nodeId, 'test_stage')).toBe(false);

    // Toggle ON
    store.toggleNodeBuilt(nodeId, 'test_stage');
    expect(useFactoryStore.getState().isNodeBuilt(nodeId, 'test_stage')).toBe(true);

    // Verify localStorage persistence
    const raw = localStorage.getItem('ficsit_built_nodes_v1');
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw);
    expect(parsed.test_stage?.[nodeId]).toBe(true);

    // Toggle OFF
    store.toggleNodeBuilt(nodeId, 'test_stage');
    expect(useFactoryStore.getState().isNodeBuilt(nodeId, 'test_stage')).toBe(false);

    const updatedRaw = localStorage.getItem('ficsit_built_nodes_v1');
    const updatedParsed = JSON.parse(updatedRaw);
    expect(updatedParsed.test_stage?.[nodeId]).toBeUndefined();
  });

  it('marks all nodes as built and resets properly', () => {
    useFactoryStore.setState({
      nodes: [
        { id: 'recipe_iron_plate', type: 'machine', data: { recipeId: 'iron_plate' } },
        { id: 'recipe_iron_rod', type: 'machine', data: { recipeId: 'iron_rod' } },
        { id: 'mine_iron_ore', type: 'machine', data: { isInput: true } }
      ]
    });

    const store = useFactoryStore.getState();
    store.markAllNodesBuilt('test_stage');

    expect(useFactoryStore.getState().isNodeBuilt('recipe_iron_plate', 'test_stage')).toBe(true);
    expect(useFactoryStore.getState().isNodeBuilt('recipe_iron_rod', 'test_stage')).toBe(true);
    expect(useFactoryStore.getState().isNodeBuilt('mine_iron_ore', 'test_stage')).toBe(true);

    // Reset
    store.resetBuiltNodes('test_stage');
    expect(useFactoryStore.getState().isNodeBuilt('recipe_iron_plate', 'test_stage')).toBe(false);
    expect(useFactoryStore.getState().isNodeBuilt('recipe_iron_rod', 'test_stage')).toBe(false);
    expect(useFactoryStore.getState().isNodeBuilt('mine_iron_ore', 'test_stage')).toBe(false);
  });

  it('supports storageService loadBuiltNodes and saveBuiltNodes fallback', async () => {
    const mockData = {
      complex_1: {
        recipe_iron_ingot: true,
        recipe_iron_plate: true
      }
    };

    await saveBuiltNodes(mockData);
    const loaded = await loadBuiltNodes();
    expect(loaded.complex_1?.recipe_iron_ingot).toBe(true);
    expect(loaded.complex_1?.recipe_iron_plate).toBe(true);
  });

  it('includes builtNodes in backup export and import', async () => {
    const mockBuilt = {
      complex_1: { 'recipe_smelter_1': true }
    };
    const mockStages = {
      complex_1: { isFrozen: true }
    };

    const mockFile = {
      _text: JSON.stringify({
        app: 'FICSIT Factory Architect',
        version: '2.0',
        stages: mockStages,
        builtNodes: mockBuilt
      })
    };

    const result = await importBackupJSON(mockFile);
    expect(result.stages.complex_1.isFrozen).toBe(true);
    expect(result.builtNodes.complex_1.recipe_smelter_1).toBe(true);
  });

  it('mergeFrozenStagesWithIdb preserves full IDB snapshot nodes/edges when localStorage has lightweight outputs', async () => {
    const { mergeFrozenStagesWithIdb } = await import('../store/useFactoryStore');
    const idbStages = {
      complex_1: {
        isFrozen: true,
        frozenAt: '2026-10-15T00:00:00.000Z',
        snapshot: {
          nodes: [{ id: 'n1', type: 'machine' }, { id: 'n2', type: 'machine' }],
          edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
          outputs: [{ itemId: 'iron_plate', rate: 20 }],
          summary: { totalPower: 50 }
        }
      }
    };

    // Lightweight copy like in localStorage (no nodes, no edges)
    const memoryStages = {
      complex_1: {
        isFrozen: true,
        frozenAt: '2026-10-15T00:00:00.000Z',
        snapshot: {
          outputs: [{ itemId: 'iron_plate', rate: 20 }],
          summary: { totalPower: 50 }
        }
      }
    };

    const merged = mergeFrozenStagesWithIdb(idbStages, memoryStages);
    expect(Array.isArray(merged.complex_1.snapshot.nodes)).toBe(true);
    expect(merged.complex_1.snapshot.nodes.length).toBe(2);
    expect(merged.complex_1.snapshot.edges.length).toBe(1);
  });

  it('validateBackupData strips prototype pollution and validates structure', async () => {
    const { validateBackupData } = await import('../services/storageService');
    const maliciousJson = JSON.parse(`{
      "__proto__": { "polluted": true },
      "stages": {
        "complex_1": {
          "isFrozen": true,
          "targets": [
            { "id": "t1", "itemId": "iron_plate", "rate": 60 },
            { "id": "t2", "itemId": "bad_rate", "rate": "invalid" }
          ],
          "inputsLimit": [
            { "id": "inp1", "itemId": "iron_ore", "rate": 120 }
          ]
        }
      },
      "builtNodes": {
        "complex_1": {
          "node_1": true,
          "node_invalid": "not_a_bool"
        }
      }
    }`);

    const validated = validateBackupData(maliciousJson);
    expect(({})['polluted']).toBeUndefined();
    expect(validated.stages.complex_1).toBeDefined();
    // Valid target kept, invalid rate target filtered out
    expect(validated.stages.complex_1.targets.length).toBe(1);
    expect(validated.stages.complex_1.targets[0].itemId).toBe('iron_plate');
    expect(validated.stages.complex_1.inputsLimit.length).toBe(1);
    // Valid built node kept, non-boolean filtered out
    expect(validated.builtNodes.complex_1.node_1).toBe(true);
    expect(validated.builtNodes.complex_1.node_invalid).toBeUndefined();
  });
});
