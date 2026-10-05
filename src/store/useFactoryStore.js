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
  requestPersistence, 
  exportBackupJSON, 
  importBackupJSON 
} from '../services/storageService';

const STORAGE_KEY = 'ficsit_frozen_stages_v2';
const LEGACY_STORAGE_KEY = 'ficsit_frozen_stages_v1';

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

  initStorage: async () => {
    requestPersistence();
    try {
      const stages = await loadIDBFrozenStages();
      if (stages && typeof stages === 'object' && Object.keys(stages).length > 0) {
        set({ frozenStages: stages });
        const { activePresetId } = get();
        if (activePresetId && stages[activePresetId]) {
          const currentPreset = presets.find(p => p.id === activePresetId);
          if (currentPreset) get().loadPreset(currentPreset);
        }
      }
    } catch (e) {
      console.warn('initStorage failed:', e);
    }
  },

  exportBackup: () => {
    exportBackupJSON(get().frozenStages);
  },

  importBackup: async (file) => {
    try {
      const stages = await importBackupJSON(file);
      await saveIDBFrozenStages(stages);
      set({ frozenStages: stages });
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
        schematicMode: frozen.schematicMode || get().schematicMode,
        nodes: frozen.snapshot.nodes,
        edges: frozen.snapshot.edges,
        summary: frozen.snapshot.summary
      });
      return;
    }

    if (preset.type === 'power') {
      set({
        selectedPresetType: 'power',
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
      const nodeDepth = {};
      let changed = true;
      let iterations = 0;
      const MAX_DEPTH = 100;
      
      while (changed && iterations < MAX_DEPTH) {
        changed = false;
        iterations++;
        
        activeNodes.forEach(n => {
          if (nodeDepth[n.id] === undefined) {
            nodeDepth[n.id] = 0;
            changed = true;
          }
        });
        activeEdges.forEach(e => {
          if (nodeDepth[e.source] !== undefined) {
            const newDepth = nodeDepth[e.source] + 1;
            if (nodeDepth[e.target] === undefined || newDepth > nodeDepth[e.target]) {
              nodeDepth[e.target] = newDepth;
              changed = true;
            }
          }
        });
      }

      // 2. Веса и минимальная длина рёбер
      activeEdges.forEach(edge => {
        const depthDiff = Math.abs((nodeDepth[edge.target] || 0) - (nodeDepth[edge.source] || 0));
        const isLongTransit = depthDiff > 1; 
        
        dagreGraph.setEdge(edge.source, edge.target, {
          weight: isLongTransit ? 1 : (isRealistic ? 2 : 3),
          minlen: 1
        });
      });

      dagre.layout(dagreGraph);

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
