import { create } from 'zustand';
import { solveProductionGraph } from '../engine/solver';
import { calculateAllTransits } from '../engine/campaignTransitEngine';
import dagre from 'dagre';
import recipesDB from '../database/recipes.json';
import presets from '../database/campaignPresets.json';

// Инициализация состояний всех этапов по умолчанию (все включены, масштаб 1.0)
const initialCampaignStates = {};
presets.forEach(p => {
  initialCampaignStates[p.id] = { enabled: true, scale: 1.0 };
});

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
    maxBelt: 5 // 1 to 6
  },
  
  // State for modes
  selectedPresetType: 'production', // 'production' or 'power'
  powerConfig: null,
  activePresetId: null,
  
  // Campaign Stages State
  campaignStagesState: initialCampaignStates,

  // Results
  summary: null,
  activeTab: 'network', // 'network', 'tree', 'items', 'buildings'

  loadPreset: (preset) => {
    if (preset.type === 'power') {
      set({
        selectedPresetType: 'power',
        powerConfig: preset.powerConfig,
        activePresetId: preset.id,
        targets: [{ id: `target_power_${preset.id}`, itemId: 'power', rate: preset.powerConfig.targetMW }],
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
  
  updateTarget: (id, data) => {
    const targets = get().targets.map(t => t.id === id ? { ...t, ...data } : t);
    set({ targets });
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
    const { targets, inputsLimit, options, activePresetId, campaignStagesState } = get();
    
    // Рассчитываем сквозной транзит
    const transitsByTarget = calculateAllTransits(campaignStagesState);
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
      const dagreGraph = new dagre.graphlib.Graph();
      dagreGraph.setDefaultEdgeLabel(() => ({}));
      
      // 1. Конфигурация Dagre Graph (эвристическое упорядочивание слоев)
      dagreGraph.setGraph({ 
        rankdir: 'LR',
        align: 'DL', // Выравнивание по базовой линии
        nodesep: 40,  // Вертикальный зазор между нодами в одном ранге
        ranksep: 80,  // Горизонтальный зазор между этапами (минимизирует растягивание)
        ranker: 'tight-tree', // Критично: минимизирует длину ребер (компактная горизонтальная структура)
        marginx: 50,
        marginy: 50
      });

      // Добавляем ноды с точными габаритами (MachineNode: 340x220)
      result.nodes.forEach(node => {
        dagreGraph.setNode(node.id, { width: 340, height: 220 });
      });

      // 3. Группировка по производственным слоям (Ранжирование / Virtual Ranks)
      // Вычисляем виртуальную глубину (Depth) каждой ноды от источников сырья
      const nodeDepth = {};
      let changed = true;
      let iterations = 0;
      const MAX_DEPTH = 100; // Ограничитель на случай циклических зависимостей (например, вода в Алюминии)
      
      while (changed && iterations < MAX_DEPTH) {
        changed = false;
        iterations++;
        
        result.nodes.forEach(n => {
          if (nodeDepth[n.id] === undefined) {
            nodeDepth[n.id] = 0; // Инициализация начальной глубины
            changed = true;
          }
        });
        result.edges.forEach(e => {
          if (nodeDepth[e.source] !== undefined) {
            const newDepth = nodeDepth[e.source] + 1;
            if (nodeDepth[e.target] === undefined || newDepth > nodeDepth[e.target]) {
              nodeDepth[e.target] = newDepth;
              changed = true;
            }
          }
        });
      }

      // 2. Веса и минимальная длина рёбер (Edge Minlen & Weight Tuning)
      result.edges.forEach(edge => {
        const depthDiff = Math.abs((nodeDepth[edge.target] || 0) - (nodeDepth[edge.source] || 0));
        // Длинные транзитные связи перепрыгивают больше 1 слоя (например, Вода/Пластик к финишным нодам)
        const isLongTransit = depthDiff > 1; 
        
        dagreGraph.setEdge(edge.source, edge.target, {
          weight: isLongTransit ? 1 : 3, // Локальные связи (3) тянут узлы сильнее друг к другу
          minlen: 1 // Предотвращает смещение финишных нод слишком далеко вправо из-за одного длинного ребра
        });
      });

      dagre.layout(dagreGraph);

      const layoutedNodes = result.nodes.map(node => {
        const nodeWithPosition = dagreGraph.node(node.id);
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - 170, // Половина ширины 340
            y: nodeWithPosition.y - 110  // Половина высоты 220
          }
        };
      });

      const styledEdges = result.edges.map(edge => ({
        ...edge,
        type: 'default', // Custom edge type FlowEdge is named 'default' in edgeTypes mapping
      }));

      set({ nodes: layoutedNodes, edges: styledEdges, summary: result.summary });
    } else {
      console.warn("Graph is infeasible");
      set({ summary: null }); 
    }
  }
}));
