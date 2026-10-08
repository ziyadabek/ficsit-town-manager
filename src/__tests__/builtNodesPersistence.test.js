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
});
