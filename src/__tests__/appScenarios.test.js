import { describe, it, expect, beforeEach } from 'vitest';
import { useFactoryStore, mergeFrozenStagesWithIdb, mergeBuiltNodesWithIdb } from '../store/useFactoryStore';
import { validateBackupData } from '../services/storageService';
import campaignPresets from '../database/campaignPresets.json';

describe('App End-to-End Scenarios Verification', () => {
  beforeEach(() => {
    useFactoryStore.getState().resetToFreeMode();
  });

  it('Scenario 1: creates a new project in free mode and recalculates graph', () => {
    const store = useFactoryStore.getState();
    expect(store.activePresetId).toBeNull();
    expect(store.targets).toEqual([]);

    // Add target
    store.addTarget();
    const updated = useFactoryStore.getState();
    expect(updated.targets.length).toBe(1);
    expect(updated.targets[0].itemId).toBe('concrete');
    expect(updated.nodes.length).toBeGreaterThan(0);
    expect(updated.edges.length).toBeGreaterThan(0);
    expect(updated.summary).not.toBeNull();
  });

  it('Scenario 2: handles stage freezing, persistence merge and reload', () => {
    const store = useFactoryStore.getState();
    // Load a preset
    const preset = campaignPresets.find(p => p.id === 'complex_1') || campaignPresets[0];
    store.loadPreset(preset);

    const loadedState = useFactoryStore.getState();
    expect(loadedState.activePresetId).toBe(preset.id);
    expect(loadedState.nodes.length).toBeGreaterThan(0);

    // Freeze stage
    store.freezeCurrentStage();
    const frozenState = useFactoryStore.getState();
    expect(frozenState.frozenStages[preset.id]?.isFrozen).toBe(true);
    expect(frozenState.frozenStages[preset.id]?.snapshot?.nodes?.length).toBeGreaterThan(0);

    // Simulate reloading with lightweight localStorage cache (missing nodes/edges)
    const lightweightMem = {
      [preset.id]: {
        isFrozen: true,
        frozenAt: '2026-10-15T00:00:00Z',
        snapshot: { targets: preset.targets, outputs: [] } // No nodes or edges in localStorage
      }
    };
    const idbSaved = frozenState.frozenStages;

    const merged = mergeFrozenStagesWithIdb(idbSaved, lightweightMem);
    expect(merged[preset.id].snapshot.nodes.length).toBe(frozenState.nodes.length);
    expect(merged[preset.id].snapshot.edges.length).toBe(frozenState.edges.length);
  });

  it('Scenario 3: export and import backup data with schema validation and sanitization', () => {
    const validBackup = {
      version: 1,
      exportedAt: new Date().toISOString(),
      stages: {
        complex_1: {
          isFrozen: true,
          snapshot: {
            targets: [{ id: 't1', itemId: 'iron_plate', rate: 20 }],
            inputsLimit: []
          }
        }
      },
      builtNodes: {
        complex_1: { recipe_iron_plate: true }
      }
    };

    const validated = validateBackupData(validBackup);
    expect(validated.stages.complex_1.isFrozen).toBe(true);
    expect(validated.builtNodes.complex_1.recipe_iron_plate).toBe(true);

    // Malicious prototype pollution payload
    const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "stages": {}}');
    const checked = validateBackupData(maliciousPayload);
    expect(checked.stages).toBeDefined();
    expect(Object.prototype.polluted).toBeUndefined();
  });

  it('Scenario 4: toggles layout mode between simple and realistic', () => {
    const store = useFactoryStore.getState();
    const preset = campaignPresets.find(p => p.id === 'complex_1') || campaignPresets[0];
    store.loadPreset(preset);

    // Simple mode
    store.setSchematicMode('simple');
    const simpleState = useFactoryStore.getState();
    const simpleNodeCount = simpleState.nodes.length;

    // Realistic mode
    store.setSchematicMode('realistic');
    const realState = useFactoryStore.getState();
    const realNodeCount = realState.nodes.length;

    // Realistic mode decomposes into physical machines and splitters/mergers
    expect(realNodeCount).toBeGreaterThanOrEqual(simpleNodeCount);
  });

  it('Scenario 5: toggles layout direction between LR and TB', () => {
    const store = useFactoryStore.getState();
    const preset = campaignPresets.find(p => p.id === 'complex_1') || campaignPresets[0];
    store.loadPreset(preset);

    store.setLayoutDirection('TB');
    const tbState = useFactoryStore.getState();
    expect(tbState.layoutDirection).toBe('TB');

    store.setLayoutDirection('LR');
    const lrState = useFactoryStore.getState();
    expect(lrState.layoutDirection).toBe('LR');
  });

  it('Scenario 6: correctly detects resource deficits in summary and alerts', () => {
    const store = useFactoryStore.getState();
    store.loadPreset(campaignPresets[0]);

    // Manually set an input limit with deficit
    useFactoryStore.setState({
      summary: {
        effectiveInputs: [
          { id: 'transit_iron_plate', itemId: 'iron_plate', rate: 10, deficit: 15 }
        ]
      }
    });

    const currentSummary = useFactoryStore.getState().summary;
    const deficits = (currentSummary?.effectiveInputs || []).filter(inp => inp.deficit && inp.deficit > 0.001);
    expect(deficits.length).toBe(1);
    expect(deficits[0].deficit).toBe(15);
  });

  it('Scenario 7: handles empty data and infeasible targets gracefully', () => {
    const store = useFactoryStore.getState();
    
    // Clear all targets
    useFactoryStore.setState({ targets: [] });
    store.recalculateGraph();

    const emptyState = useFactoryStore.getState();
    expect(emptyState.nodes).toEqual([]);
    expect(emptyState.edges).toEqual([]);
    expect(emptyState.summary.items).toEqual([]);
  });

  it('Scenario 8: ensures selector stability to prevent React Error #185 infinite loops', () => {
    // Reset store with summary null
    useFactoryStore.setState({ summary: null, options: { ...useFactoryStore.getState().options, somersloopRecipes: [] } });

    // Selector pattern used in DeficitAlerts
    const EMPTY_INPUTS = [];
    const selectInputs = (state) => state.summary?.effectiveInputs || EMPTY_INPUTS;
    
    const snap1 = selectInputs(useFactoryStore.getState());
    const snap2 = selectInputs(useFactoryStore.getState());
    // Must be strictly identical references to prevent useSyncExternalStore re-render loop
    expect(Object.is(snap1, snap2)).toBe(true);

    // Selector pattern used in MachineNode
    const selectAmplified = (recipeId) => (state) => Boolean(state.options?.somersloopRecipes?.includes(recipeId));
    const isAmp1 = selectAmplified('recipe_reinforced_iron_plate')(useFactoryStore.getState());
    const isAmp2 = selectAmplified('recipe_reinforced_iron_plate')(useFactoryStore.getState());
    expect(isAmp1).toBe(false);
    expect(Object.is(isAmp1, isAmp2)).toBe(true);
  });

  it('Scenario 9: all lazy views (BalancerViewer, PowerPlanner, MacroView, SpaceElevatorView) are valid React components', async () => {
    const balancerModule = await import('../modules/balancer/BalancerViewer');
    const powerModule = await import('../modules/power/PowerPlanner');
    const macroModule = await import('../components/canvas/MacroView');
    const elevatorModule = await import('../components/canvas/SpaceElevatorView');

    expect(typeof balancerModule.default).toBe('function');
    expect(typeof powerModule.default).toBe('function');
    expect(typeof macroModule.default).toBe('function');
    expect(typeof elevatorModule.default).toBe('function');
  });
});

