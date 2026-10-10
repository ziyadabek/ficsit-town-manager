import { create } from 'zustand';
import { solveProductionGraph } from '../engine/solver';
import { calculateAllTransits } from '../engine/campaignTransitEngine';
import { expandToRealisticGraph } from '../engine/realisticGraphEngine';
import dagre from 'dagre';
import recipesDB from '../database/recipes.json';
import items from '../database/items.json';
import presets from '../database/campaignPresets.json';

// Инициализация состояний всех этапов по умолчанию (все включены, масштаб 1.0)
const initialCampaignStates = {};
presets.forEach(p => {
  initialCampaignStates[p.id] = { enabled: true, scale: 1.0 };
});

import { 
  loadFrozenStages as loadIDBFrozenStages, 
  saveFrozenStages as saveIDBFrozenStages, 
  loadBuiltNodes as loadIDBBuiltNodes,
  saveBuiltNodes as saveIDBBuiltNodes,
  requestPersistence, 
  exportBackupJSON, 
  importBackupJSON 
} from '../services/storageService';

const STORAGE_KEY = 'ficsit_frozen_stages_v2';
const LEGACY_STORAGE_KEY = 'ficsit_frozen_stages_v1';
const BUILT_STORAGE_KEY = 'ficsit_built_nodes_v1';

// Синхронный мгновенный снимок из localStorage для моментального старта UI
function loadInitialFrozenStages() {
  try {
    let raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    }
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveFrozenStages(stages) {
  // Асинхронно сохраняем в IndexedDB (без лимитов памяти)
  saveIDBFrozenStages(stages);
  return true;
}

function loadInitialBuiltNodes() {
  try {
    const raw = localStorage.getItem(BUILT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function saveBuiltNodesState(builtNodes) {
  saveIDBBuiltNodes(builtNodes);
  try {
    localStorage.setItem(BUILT_STORAGE_KEY, JSON.stringify(builtNodes));
  } catch (e) {}
  return true;
}

export const useFactoryStore = create((set, get) => ({
  // Graph state
  nodes: [],
  edges: [],
  
  // Model Config
  targets: [],
  inputsLimit: [], // e.g. { id: 'inp_1', itemId: 'crude_oil', rate: 600 }
  options: {
    altRecipes: [], // Array of recipe ids
    somersloopRecipes: [], // Array of amplified recipe ids
    optimize: 'raw', // 'power', 'raw', 'machines'
    maxBelt: 1200, // 60, 120, 270, 480, 780, 1200
    maxPipe: 600, // 300, 600
    useSplitters: true, // Использовать разветвитель/соединитель
    minerPurity: 'normal',
    oilPurity: 'normal',
    waterPurity: 'normal',
    gasPurity: 'normal',
    powerShards: 0,
    somersloops: 0,
    reuseBuildings: true,
    maxTier: 'unlimited'
  },
  
  // State for modes
  selectedPresetType: 'production', // 'production' or 'power'
  powerConfig: null,
  activePresetId: null,
  layoutDirection: 'LR', // 'LR' (Вправо) | 'TB' (Вниз)
  schematicMode: 'simple', // 'simple' (Компактный SCIM) | 'realistic' (Реалистичный цех SCIM)
  
  // Campaign Stages State
  campaignStagesState: initialCampaignStates,
  frozenStages: loadInitialFrozenStages(),
  builtNodes: loadInitialBuiltNodes(),

  // Results
  summary: null,
  activeTab: 'network', // 'network', 'tree', 'items', 'buildings'

  setLayoutDirection: (dir) => {
    set({ layoutDirection: dir });
    get().recalculateGraph();
  },

  setSchematicMode: (mode) => {
    set({ schematicMode: mode });
    get().recalculateGraph();
  },

  freezeCurrentStage: () => {
    const { activePresetId, nodes, edges, summary, targets, inputsLimit, options, layoutDirection, schematicMode, frozenStages } = get();
    if (!activePresetId || !summary) return;

    // Вычисляем фактические выходы этапа (outputs) для транзитной сети
    const outputs = (summary.items || [])
      .filter(item => (item.produced - item.consumed) > 0.001)
      .map(item => ({
        itemId: item.id,
        rate: item.produced - item.consumed
      }));

    const snapshot = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      summary: JSON.parse(JSON.stringify(summary)),
      outputs
    };

    const updatedFrozenStages = {
      ...frozenStages,
      [activePresetId]: {
        isFrozen: true,
        frozenAt: new Date().toISOString(),
        targets: JSON.parse(JSON.stringify(targets)),
        inputsLimit: JSON.parse(JSON.stringify(inputsLimit)),
        options: JSON.parse(JSON.stringify(options)),
        layoutDirection,
        schematicMode,
        snapshot
      }
    };

    saveFrozenStages(updatedFrozenStages);
    set({ frozenStages: updatedFrozenStages });
  },

  unfreezeStage: (stageId) => {
    const { frozenStages, activePresetId } = get();
    const targetId = stageId || activePresetId;
    if (!targetId || !frozenStages[targetId]) return;

    const updated = {
      ...frozenStages,
      [targetId]: {
        ...frozenStages[targetId],
        isFrozen: false
      }
    };

    saveFrozenStages(updated);
    set({ frozenStages: updated });

    if (targetId === activePresetId) {
      get().recalculateGraph();
    }
  },

  toggleNodeBuilt: (nodeId, targetStageId) => {
    const { builtNodes, activePresetId } = get();
    const stageKey = targetStageId || activePresetId || 'free_mode';
    const currentStageNodes = builtNodes[stageKey] || {};
    const isCurrentlyBuilt = Boolean(currentStageNodes[nodeId]);

    const updatedStageNodes = { ...currentStageNodes };
    if (!isCurrentlyBuilt) {
      updatedStageNodes[nodeId] = true;
    } else {
      delete updatedStageNodes[nodeId];
    }

    const nextBuiltNodes = {
      ...builtNodes,
      [stageKey]: updatedStageNodes
    };

    saveBuiltNodesState(nextBuiltNodes);
    set({ builtNodes: nextBuiltNodes });
  },

  isNodeBuilt: (nodeId, targetStageId) => {
    const { builtNodes, activePresetId } = get();
    const stageKey = targetStageId || activePresetId || 'free_mode';
    return Boolean(builtNodes[stageKey]?.[nodeId]);
  },

  markAllNodesBuilt: (targetStageId) => {
    const { builtNodes, activePresetId, nodes } = get();
    const stageKey = targetStageId || activePresetId || 'free_mode';
    const updatedStageNodes = { ...(builtNodes[stageKey] || {}) };

    nodes.forEach(n => {
      if (['machine', 'physicalMachine'].includes(n.type) || n.data?.isInput || n.data?.buildingId) {
        updatedStageNodes[n.id] = true;
      }
    });

    const nextBuiltNodes = {
      ...builtNodes,
      [stageKey]: updatedStageNodes
    };

    saveBuiltNodesState(nextBuiltNodes);
    set({ builtNodes: nextBuiltNodes });
  },

  resetBuiltNodes: (targetStageId) => {
    const { builtNodes, activePresetId } = get();
    const stageKey = targetStageId || activePresetId || 'free_mode';
    const nextBuiltNodes = {
      ...builtNodes,
      [stageKey]: {}
    };
    saveBuiltNodesState(nextBuiltNodes);
    set({ builtNodes: nextBuiltNodes });
  },

  storageInitRevision: 0,

  initStorage: async () => {
    requestPersistence();
    const currentRev = (get().storageInitRevision || 0) + 1;
    set({ storageInitRevision: currentRev });

    try {
      const [stages, built] = await Promise.all([
        loadIDBFrozenStages(),
        loadIDBBuiltNodes()
      ]);

      // Проверяем, что за время асинхронного чтения не было новых действий пользователя или новой инициализации
      if (get().storageInitRevision !== currentRev) {
        return;
      }

      if (stages && typeof stages === 'object' && Object.keys(stages).length > 0) {
        // Объединяем с текущими frozenStages (если пользователь успел что-то заморозить в первые миллисекунды)
        const currentFrozen = get().frozenStages || {};
        const mergedStages = { ...stages, ...currentFrozen };
        set({ frozenStages: mergedStages });
        const { activePresetId } = get();
        if (activePresetId && mergedStages[activePresetId]) {
          const currentPreset = presets.find(p => p.id === activePresetId);
          if (currentPreset) get().loadPreset(currentPreset);
        }
      }
      if (built && typeof built === 'object' && Object.keys(built).length > 0) {
        const currentBuilt = get().builtNodes || {};
        const mergedBuilt = { ...built, ...currentBuilt };
        set({ builtNodes: mergedBuilt });
      }
    } catch (e) {
      console.warn('initStorage failed:', e);
    }
  },

  exportBackup: () => {
    exportBackupJSON(get().frozenStages, get().builtNodes);
  },

  importBackup: async (file) => {
    try {
      const { stages, builtNodes } = await importBackupJSON(file);
      await saveIDBFrozenStages(stages);
      set({ frozenStages: stages });
      if (builtNodes && typeof builtNodes === 'object') {
        await saveIDBBuiltNodes(builtNodes);
        set({ builtNodes });
      }
      const { activePresetId } = get();
      if (activePresetId && stages[activePresetId]) {
        const currentPreset = presets.find(p => p.id === activePresetId);
        if (currentPreset) get().loadPreset(currentPreset);
      }
      get().recalculateGraph();
      return { success: true };
    } catch (err) {
      console.error('Import failed:', err);
      return { success: false, error: err.message };
    }
  },

  loadPreset: (preset) => {
    const { frozenStages } = get();
    const frozen = frozenStages[preset.id];

    if (frozen && frozen.isFrozen) {
      // LP SOLVER BYPASS (0 ms LOAD)
      set({
        selectedPresetType: preset.type === 'power' ? 'power' : 'production',
        powerConfig: preset.powerConfig || null,
        activePresetId: preset.id,
        targets: frozen.targets,
        inputsLimit: frozen.inputsLimit,
        options: frozen.options,
        layoutDirection: frozen.layoutDirection || get().layoutDirection,
        schematicMode: frozen.schematicMode || 'simple',
        nodes: frozen.snapshot.nodes,
        edges: frozen.snapshot.edges,
        summary: frozen.snapshot.summary
      });
      return;
    }

    if (preset.type === 'power') {
      set({
        selectedPresetType: 'power',
        schematicMode: 'simple',
        powerConfig: preset.powerConfig,
        activePresetId: preset.id,
        targets: [
          { id: `target_power_${preset.id}`, itemId: 'power', rate: preset.powerConfig.targetMW },
          ...(preset.targets || [])
        ],
        inputsLimit: preset.inputsLimit || [],
        options: { ...get().options, generatorId: preset.powerConfig.generatorId, altRecipes: preset.options?.altRecipes || get().options.altRecipes }
      });
      get().recalculateGraph();
    } else {
      set({
        selectedPresetType: 'production',
        schematicMode: 'simple',
        targets: preset.targets || [],
        inputsLimit: preset.inputsLimit || [],
        options: { ...get().options, generatorId: null, ...preset.options },
        activePresetId: preset.id
      });
      get().recalculateGraph();
    }
  },

  resetToFreeMode: () => {
    set({
      selectedPresetType: 'production',
      schematicMode: 'simple',
      powerConfig: null,
      activePresetId: null,
      targets: [],
      inputsLimit: [],
      nodes: [],
      edges: [],
      summary: null
    });
  },

  // Actions
  setActiveTab: (tab) => set({ activeTab: tab }),

  toggleStage: (stageId) => {
    set((state) => ({
      campaignStagesState: {
        ...state.campaignStagesState,
        [stageId]: {
          ...state.campaignStagesState[stageId],
          enabled: !state.campaignStagesState[stageId].enabled
        }
      }
    }));
    get().recalculateGraph();
  },

  setStageScale: (stageId, scale) => {
    set((state) => ({
      campaignStagesState: {
        ...state.campaignStagesState,
        [stageId]: {
          ...state.campaignStagesState[stageId],
          scale: Math.max(0, scale)
        }
      }
    }));
    get().recalculateGraph();
  },

  addTarget: () => {
    const targets = [...get().targets, { id: `target_${Date.now()}`, itemId: 'concrete', rate: 10 }];
    set({ targets });
    get().recalculateGraph();
  },
  
  setOption: (key, value) => {
    set(state => ({
      options: {
        ...state.options,
        [key]: value
      }
    }));
    get().recalculateGraph();
  },

  updateTarget: (id, data) => {
    const targets = get().targets.map(t => t.id === id ? { ...t, ...data } : t);
    let updatedAltRecipes = [...get().options.altRecipes];
    if (data.recipeId) {
      const rec = recipesDB.find(r => r.id === data.recipeId);
      if (rec && rec.isAlternate && !updatedAltRecipes.includes(data.recipeId)) {
        updatedAltRecipes.push(data.recipeId);
      }
    }
    set({ 
      targets,
      options: {
        ...get().options,
        altRecipes: updatedAltRecipes
      }
    });
    get().recalculateGraph();
  },
  
  removeTarget: (id) => {
    const targets = get().targets.filter(t => t.id !== id);
    set({ targets });
    get().recalculateGraph();
  },

  addInputLimit: () => {
    const inputsLimit = [...get().inputsLimit, { id: `inp_${Date.now()}`, itemId: 'crude_oil', rate: 600 }];
    set({ inputsLimit });
    get().recalculateGraph();
  },

  updateInputLimit: (id, data) => {
    const inputsLimit = get().inputsLimit.map(t => t.id === id ? { ...t, ...data } : t);
    set({ inputsLimit });
    get().recalculateGraph();
  },

  removeInputLimit: (id) => {
    const inputsLimit = get().inputsLimit.filter(t => t.id !== id);
    set({ inputsLimit });
    get().recalculateGraph();
  },

  toggleAltRecipe: (recipeId) => {
    const alts = [...get().options.altRecipes];
    if (alts.includes(recipeId)) {
      alts.splice(alts.indexOf(recipeId), 1);
    } else {
      alts.push(recipeId);
    }
    set({ options: { ...get().options, altRecipes: alts } });
    get().recalculateGraph();
  },

  toggleSomersloop: (recipeId) => {
    const loops = get().options.somersloopRecipes ? [...get().options.somersloopRecipes] : [];
    if (loops.includes(recipeId)) {
      loops.splice(loops.indexOf(recipeId), 1);
    } else {
      loops.push(recipeId);
    }
    set({ options: { ...get().options, somersloopRecipes: loops } });
    get().recalculateGraph();
  },

  setOptimizeMode: (mode) => {
    set({ options: { ...get().options, optimize: mode } });
    get().recalculateGraph();
  },

  recalculateGraph: () => {
    const { targets, inputsLimit, options, activePresetId, campaignStagesState, layoutDirection = 'LR', schematicMode = 'simple', frozenStages = {} } = get();
    
    // Если текущий этап заморожен, обходим солвер и сохраняем кэш
    if (activePresetId && frozenStages[activePresetId]?.isFrozen) {
      return;
    }

    // Рассчитываем сквозной транзит с гарантированным питанием от замороженных этапов
    const transitsByTarget = calculateAllTransits(campaignStagesState, frozenStages);
    const myTransits = transitsByTarget[activePresetId] || [];

    // Применяем масштаб текущего этапа к его целям (targets)
    const currentScale = campaignStagesState[activePresetId]?.scale || 1.0;
    const scaledTargets = targets.map(t => ({
      ...t,
      rate: t.rate * currentScale
    }));

    // Сливаем статические лимиты и динамические транзиты
    let effectiveInputs = [...inputsLimit];
    
    myTransits.forEach(transit => {
      // Удаляем статический лимит для этого предмета, если он был задан вручную в пресете
      effectiveInputs = effectiveInputs.filter(inp => inp.itemId !== transit.itemId);
      // Добавляем транзит как входящий ресурс
      effectiveInputs.push({
        id: `transit_${transit.itemId}`,
        itemId: transit.itemId,
        rate: transit.rate,
        isTransit: true,
        sourceStageName: transit.sourceStageName,
        deficit: transit.deficit,
        transport: transit.transport
      });
    });

    const result = solveProductionGraph(scaledTargets, effectiveInputs, options);
    
    // Inject raw limits and transits back into summary for UI use
    if (result.feasible) {
      result.summary.effectiveInputs = effectiveInputs;
    }
    
    if (result.feasible) {
      let activeNodes = result.nodes;
      let activeEdges = result.edges;

      // Если включен Реалистичный вид — распаковываем станки, сплиттеры и мерджеры
      if (schematicMode === 'realistic') {
        const realistic = expandToRealisticGraph(result.nodes, result.edges, {
          layoutDirection,
          somersloopRecipes: options.somersloopRecipes,
          maxBelt: options.maxBelt,
          useSplitters: options.useSplitters !== false
        });
        activeNodes = realistic.nodes;
        activeEdges = realistic.edges;
      } else {
        // В компактном режиме SCIM также подключаем 3D-иконки конечных предметов на выходе
        activeNodes = [...result.nodes];
        activeEdges = [...result.edges];

        const consumedBySourceItem = {};
        activeEdges.forEach(edge => {
          const key = `${edge.source}_${edge.data?.itemId}`;
          consumedBySourceItem[key] = (consumedBySourceItem[key] || 0) + (edge.data?.rate || 0);
        });

        result.nodes.forEach(node => {
          if (!node.data?.outputs) return;
          const machines = node.data?.machines || 1;
          node.data.outputs.forEach(outItem => {
            const itemId = outItem.itemId;
            if (itemId === 'power') return; // Электроэнергия отображается внутри самого терминала генератора
            const consumed = consumedBySourceItem[`${node.id}_${itemId}`] || 0;
            const totalProduced = (outItem.rate || 0) * machines;
            const surplus = totalProduced - consumed;
            if (surplus > 0.001) {
              const outNodeId = `out_${node.id}_${itemId}`;
              activeNodes.push({
                id: outNodeId,
                type: 'productItem',
                data: {
                  itemId,
                  rate: surplus,
                  label: 'Конечный продукт',
                  layoutDirection
                }
              });
              activeEdges.push({
                id: `edge_${node.id}_${outNodeId}_${itemId}`,
                source: node.id,
                sourceHandle: `out-${itemId}`,
                target: outNodeId,
                targetHandle: 'in',
                data: { rate: surplus, itemId, isOutput: true }
              });
            }
          });
        });

        // Добавление конечных продуктов для неизрасходованных входных ресурсов (транзит/импорт на склад Лифта)
        result.nodes.forEach(node => {
          if (!node.data?.isInput) return;
          const itemId = node.data.itemId;
          if (!itemId) return;
          const consumed = consumedBySourceItem[`${node.id}_${itemId}`] || 0;
          const surplus = (node.data.rate || 0) - consumed;
          if (surplus > 0.001) {
            const outNodeId = `out_${node.id}_${itemId}`;
            activeNodes.push({
              id: outNodeId,
              type: 'productItem',
              data: {
                itemId,
                rate: surplus,
                label: 'Конечный продукт',
                layoutDirection
              }
            });
            activeEdges.push({
              id: `edge_${node.id}_${outNodeId}_${itemId}`,
              source: node.id,
              sourceHandle: `out-${itemId}`,
              target: outNodeId,
              targetHandle: 'in',
              data: { rate: surplus, itemId, isOutput: true }
            });
          }
        });

        // Вставка конвейерных разветвителей при опции "Использовать разветвитель/соединитель: Да" (SCIM)
        if (options.useSplitters !== false) {
          const edgesBySourceItem = {};
          activeEdges.forEach(edge => {
            const key = `${edge.source}_${edge.data?.itemId}`;
            if (!edgesBySourceItem[key]) edgesBySourceItem[key] = [];
            edgesBySourceItem[key].push(edge);
          });

          const newEdges = [];
          const processedSplitterKeys = new Set();

          Object.keys(edgesBySourceItem).forEach(key => {
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
                data: {
                  itemId,
                  rate: totalRate,
                  subLabel: `(${items[itemId]?.name || itemId})`,
                  layoutDirection
                }
              });

              newEdges.push({
                id: `edge_${sourceNodeId}_${splitterId}`,
                source: sourceNodeId,
                sourceHandle: firstEdge.sourceHandle,
                target: splitterId,
                targetHandle: 'in',
                data: { rate: totalRate, itemId }
              });

              outgoingEdges.forEach((outEdge, idx) => {
                newEdges.push({
                  id: `edge_${splitterId}_${outEdge.target}_${idx}`,
                  source: splitterId,
                  sourceHandle: 'out',
                  target: outEdge.target,
                  targetHandle: outEdge.targetHandle,
                  data: { rate: outEdge.data?.rate, itemId }
                });
              });

              processedSplitterKeys.add(key);
            }
          });

          if (processedSplitterKeys.size > 0) {
            activeEdges = [
              ...activeEdges.filter(e => !processedSplitterKeys.has(`${e.source}_${e.data?.itemId}`)),
              ...newEdges
            ];
          }
        }
      }

      // Подсчет и добавление логистических строений в сводку (Summary)
      if (result.summary?.buildings) {
        const logisticsCounts = {
          splitter: 0,
          merger: 0,
          pipeline_junction: 0,
          pipeline_t_junction: 0
        };
        activeNodes.forEach(node => {
          if (node.type === 'splitter') {
            const isFluid = items[node.data?.itemId]?.type === 'fluid';
            if (isFluid) logisticsCounts.pipeline_junction++;
            else logisticsCounts.splitter++;
          } else if (node.type === 'merger') {
            const isFluid = items[node.data?.itemId]?.type === 'fluid';
            if (isFluid) logisticsCounts.pipeline_t_junction++;
            else logisticsCounts.merger++;
          }
        });

        result.summary.buildings = result.summary.buildings.filter(b => 
          !['conveyor_splitter', 'conveyor_merger', 'pipeline_junction', 'pipeline_t_junction'].includes(b.id)
        );

        if (logisticsCounts.splitter > 0) {
          result.summary.buildings.push({
            id: 'conveyor_splitter',
            name: 'Конвейерный разветвитель',
            count: logisticsCounts.splitter,
            power: 0,
            icon: '/icons/Conveyor Supports/ConveyorSplitter.png'
          });
        }
        if (logisticsCounts.merger > 0) {
          result.summary.buildings.push({
            id: 'conveyor_merger',
            name: 'Конвейерный соединитель',
            count: logisticsCounts.merger,
            power: 0,
            icon: '/icons/Conveyor Supports/ConveyorMerger.png'
          });
        }
        if (logisticsCounts.pipeline_junction > 0) {
          result.summary.buildings.push({
            id: 'pipeline_junction',
            name: 'Трубный перекресток',
            count: logisticsCounts.pipeline_junction,
            power: 0,
            icon: '/icons/Conveyor Supports/PipelineJunction.png'
          });
        }
        if (logisticsCounts.pipeline_t_junction > 0) {
          result.summary.buildings.push({
            id: 'pipeline_t_junction',
            name: 'Трубный тройник',
            count: logisticsCounts.pipeline_t_junction,
            power: 0,
            icon: '/icons/Conveyor Supports/PipelineTJunction.png'
          });
        }
      }

      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      
      const isRealistic = schematicMode === 'realistic';
      const nodeSep = 80;
      const rankSep = layoutDirection === 'LR' ? 220 : 180;

      // 1. Конфигурация Dagre Graph
      dagreGraph.setGraph({ 
        rankdir: layoutDirection,
        align: undefined,
        nodesep: nodeSep,
        ranksep: rankSep,
        ranker: 'network-simplex',
        marginx: 60,
        marginy: 60
      });

      // Функция определения размеров ноды для Dagre (единый SCIM стандарт высоты 130px для идеального выравнивания портов)
      const getNodeDimensions = (node) => {
        if (node.type === 'splitter' || node.type === 'merger') {
          return { width: 140, height: 130 };
        }
        if (node.type === 'output' || node.type === 'productItem') {
          return { width: 80, height: 130 };
        }
        return { width: 150, height: 130 };
      };

      // Добавляем ноды с индивидуальными габаритами
      activeNodes.forEach(node => {
        const { width, height } = getNodeDimensions(node);
        dagreGraph.setNode(node.id, { width, height });
      });

      // 3. Группировка по производственным слоям (Ранжирование)
      // Определение обратных рёбер и циклов рециркуляции (например, темная материя, возврат воды в VIP гидроконтур)
      const fullAdj = {};
      activeEdges.forEach(e => {
        fullAdj[e.source] = fullAdj[e.source] || [];
        fullAdj[e.source].push(e);
      });

      const cycleEdgeIds = new Set();
      const dfsVisited = {};
      const onStack = {};

      // Итеративный DFS для предотвращения переполнения стека вызовов (Stack Overflow)
      function detectCyclesIterative(startNodeId) {
        if (dfsVisited[startNodeId]) return;

        const stack = [{ node: startNodeId, edgeIndex: 0 }];
        dfsVisited[startNodeId] = true;
        onStack[startNodeId] = true;

        while (stack.length > 0) {
          const current = stack[stack.length - 1];
          const neighbors = fullAdj[current.node] || [];

          if (current.edgeIndex < neighbors.length) {
            const edge = neighbors[current.edgeIndex];
            current.edgeIndex++;

            const targetId = edge.target;
            if (!dfsVisited[targetId]) {
              dfsVisited[targetId] = true;
              onStack[targetId] = true;
              stack.push({ node: targetId, edgeIndex: 0 });
            } else if (onStack[targetId]) {
              cycleEdgeIds.add(edge.id);
            }
          } else {
            onStack[current.node] = false;
            stack.pop();
          }
        }
      }

      // Обходим граф, начиная со входных узлов (шахты, транзит), затем остальные
      activeNodes.filter(n => n.data?.isInput).forEach(n => {
        if (!dfsVisited[n.id]) detectCyclesIterative(n.id);
      });
      activeNodes.forEach(n => {
        if (!dfsVisited[n.id]) detectCyclesIterative(n.id);
      });

      const isRecycleEdge = (edge) => {
        // 1. Побочные продукты замкнутых циклов (например, остаток темной материи из суперпозиционного осциллятора)
        if (edge.data?.itemId === 'dark_matter_residue') {
          return true;
        }
        // 2. Возврат побочной воды в VIP гидроконтур
        const tgtNode = activeNodes.find(n => n.id === edge.target);
        if (tgtNode?.data?.isVIP && !edge.source.startsWith('mine_') && !edge.source.startsWith('import_')) {
          return true;
        }
        // 3. Обратные ребра циклов, обнаруженные DFS
        if (cycleEdgeIds.has(edge.id)) {
          return true;
        }
        return false;
      };

      const forwardEdges = activeEdges.filter(e => !isRecycleEdge(e));

      // 4. Оптимизированное вычисление глубин узлов (DAG Toposort за O(V + E) без блокирующих O(V*E) циклов)
      const forwardAdj = {};
      const inDegree = {};
      activeNodes.forEach(n => {
        forwardAdj[n.id] = [];
        inDegree[n.id] = 0;
      });

      forwardEdges.forEach(e => {
        if (forwardAdj[e.source]) forwardAdj[e.source].push(e.target);
        if (inDegree[e.target] !== undefined) inDegree[e.target]++;
      });

      const nodeDepth = {};
      const queue = [];

      activeNodes.forEach(n => {
        nodeDepth[n.id] = 0;
        if (inDegree[n.id] === 0) {
          queue.push(n.id);
        }
      });

      let qHead = 0;
      while (qHead < queue.length) {
        const u = queue[qHead++];
        const curDepth = nodeDepth[u] || 0;
        const targets = forwardAdj[u] || [];

        for (let i = 0; i < targets.length; i++) {
          const v = targets[i];
          if (curDepth + 1 > (nodeDepth[v] || 0)) {
            nodeDepth[v] = curDepth + 1;
          }
          inDegree[v]--;
          if (inDegree[v] === 0) {
            queue.push(v);
          }
        }
      }

      // Подстраховка для оставшихся неразрешенных связей (если в forwardEdges остался редкий остаточный микроцикл)
      if (queue.length < activeNodes.length) {
        forwardEdges.forEach(e => {
          const sD = nodeDepth[e.source] || 0;
          if (sD + 1 > (nodeDepth[e.target] || 0)) {
            nodeDepth[e.target] = sD + 1;
          }
        });
      }

      // 2. Веса и минимальная длина рёбер
      activeEdges.forEach(edge => {
        const recycle = isRecycleEdge(edge);
        if (recycle) {
          // Обратное ребро рециркуляции направляется назад с минимальным весом
          dagreGraph.setEdge(edge.source, edge.target, {
            weight: 0.1,
            minlen: 1
          });
          return;
        }

        const srcDepth = nodeDepth[edge.source] || 0;
        const tgtDepth = nodeDepth[edge.target] || 0;
        const depthDiff = Math.max(1, tgtDepth - srcDepth);
        const isLongTransit = depthDiff > 1; 
        
        // Для сырьевых шахт (mine_) minlen фиксирует их слева (не более 1-2 рангов)
        // Для импорта/транзита (import_) minlen = 1 позволяет разместить узел ближе к целевому цеху
        const isRawMine = edge.source.startsWith('mine_');
        const minlen = isRawMine ? Math.min(depthDiff, 2) : 1;

        dagreGraph.setEdge(edge.source, edge.target, {
          weight: isRawMine ? 3 : (isLongTransit ? 1 : (isRealistic ? 2 : 3)),
          minlen
        });
      });

      dagre.layout(dagreGraph);

      // В реалистичном режиме выравниваем разветвители и трубные перекрестки,
      // соединенные по прямой линии (out-1 -> in), а также входные шахты,
      // чтобы две главные линии шли строго по середине без перекосов
      if (schematicMode === 'realistic') {
        activeEdges.forEach(edge => {
          if (edge.sourceHandle === 'out-1' && edge.targetHandle === 'in') {
            const srcNode = dagreGraph.node(edge.source);
            const tgtNode = dagreGraph.node(edge.target);
            if (srcNode && tgtNode) {
              srcNode.y = tgtNode.y;
            }
          }
        });

        // Выравниваем входные узлы (шахты, вода) по целевым узлам
        activeEdges.forEach(edge => {
          const src = activeNodes.find(n => n.id === edge.source);
          if (src?.data?.isInput) {
            const srcNode = dagreGraph.node(edge.source);
            const tgtNode = dagreGraph.node(edge.target);
            if (srcNode && tgtNode) {
              srcNode.y = tgtNode.y;
            }
          }
        });
      }

      const layoutedNodes = activeNodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id) || { x: 0, y: 0 };
        const { width, height } = getNodeDimensions(node);
        return {
          ...node,
          data: {
            ...node.data,
            layoutDirection
          },
          position: {
            x: nodeWithPosition.x - (width / 2),
            y: nodeWithPosition.y - (height / 2)
          }
        };
      });

      const styledEdges = activeEdges.map(edge => {
        const isFluid = edge.data?.itemId === 'water' || edge.data?.itemId?.includes('oil') || edge.data?.itemId?.includes('fuel');
        return {
          ...edge,
          type: 'default',
          markerEnd: {
            type: 'arrowclosed',
            color: isFluid ? '#3b82f6' : '#f97316',
            width: 14,
            height: 14
          }
        };
      });

      set({ nodes: layoutedNodes, edges: styledEdges, summary: result.summary });
    } else {
      console.warn("Graph is infeasible");
      set({ summary: null }); 
    }
  }
}));
