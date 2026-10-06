/**
 * realisticGraphEngine.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Движок развертки абстрактного графа производства в физическую схему цеха (SCIM).
 *
 * Преобразует:
 *  1. Абстрактные узлы рецептов в физические станки (N полных + 1 остаточный).
 *  2. Входные потоки раздаются деревом разветвителей: у каждого 1 вход и 3 выхода,
 *     поэтому для N потребителей нужно ceil((N-1)/2) разветвителей.
 *  3. Выходные потоки собираются деревом соединителей: у каждого 3 входа и 1 выход,
 *     поэтому для N источников нужно ceil((N-1)/2) соединителей.
 *  4. При useSplitters: false все связи идут напрямую.
 * ════════════════════════════════════════════════════════════════════════════════
 */

export const MAX_PORTS = 3;

/** Минимальное число узлов с 3 портами для N линий. */
export function nodesForLines(n) {
  return n <= 1 ? 0 : Math.ceil((n - 1) / (MAX_PORTS - 1));
}

const IN_HANDLES = ['in', 'in-1', 'in-2'];
const OUT_HANDLES = ['out', 'out-1', 'out-2'];

/**
 * Дерево соединителей: сводит список источников в один выход.
 * sources: [{ nodeId, handle, rate }] -> { nodeId, handle, rate }
 */
function buildMergerTree(sources, idPrefix, itemId, layoutDirection, realNodes, realEdges, subLabel) {
  if (sources.length === 0) return null;
  const queue = [...sources];
  let counter = 0;

  while (queue.length > 1) {
    const group = queue.splice(0, MAX_PORTS);
    counter++;
    const mergerId = `${idPrefix}_${counter}`;
    const total = group.reduce((s, g) => s + g.rate, 0);

    realNodes.push({
      id: mergerId,
      type: 'merger',
      data: { itemId, rate: total, subLabel, layoutDirection }
    });

    group.forEach((src, idx) => {
      realEdges.push({
        id: `edge_${src.nodeId}_${mergerId}_${idx}`,
        source: src.nodeId,
        sourceHandle: src.handle,
        target: mergerId,
        targetHandle: IN_HANDLES[idx],
        data: { rate: src.rate, itemId }
      });
    });

    queue.push({ nodeId: mergerId, handle: 'out', rate: total });
  }

  return queue[0];
}

/**
 * Дерево разветвителей: раздаёт один вход на список потребителей.
 * consumers: [{ nodeId, handle, rate }] (handle — порт приёмника)
 * Возвращает корневую точку подключения { nodeId, handle, rate } для подвода питания.
 */
function buildSplitterTree(consumers, idPrefix, itemId, layoutDirection, realNodes, realEdges, subLabel) {
  if (consumers.length === 0) return null;
  const queue = [...consumers];
  let counter = 0;

  while (queue.length > 1) {
    const group = queue.splice(0, MAX_PORTS);
    counter++;
    const splitterId = `${idPrefix}_${counter}`;
    const total = group.reduce((s, g) => s + g.rate, 0);

    realNodes.push({
      id: splitterId,
      type: 'splitter',
      data: { itemId, rate: total, subLabel, layoutDirection }
    });

    group.forEach((cons, idx) => {
      realEdges.push({
        id: `edge_${splitterId}_${cons.nodeId}_${idx}`,
        source: splitterId,
        sourceHandle: OUT_HANDLES[idx],
        target: cons.nodeId,
        targetHandle: cons.handle,
        data: { rate: cons.rate, itemId }
      });
    });

    queue.push({ nodeId: splitterId, handle: 'in', rate: total });
  }

  return queue[0];
}

export function expandToRealisticGraph(abstractNodes, abstractEdges, options = {}) {
  const layoutDirection = options.layoutDirection || 'LR';
  const useSplitters = options.useSplitters !== false;
  const realNodes = [];
  const realEdges = [];

  // recipeNodeId -> { itemId: { nodeId, handleId, rate, isDirect, machines } }
  const recipeItemOutputs = {};

  // 1. Входные и VIP узлы без изменений
  abstractNodes.forEach(node => {
    if (node.data?.isInput || node.data?.isVIP) {
      realNodes.push({
        ...node,
        data: { ...node.data, layoutDirection }
      });
    }
  });

  // 2. Распаковка в физические станки
  const recipeGroups = {};

  abstractNodes.forEach(node => {
    if (node.data?.isInput || node.data?.isVIP) return;

    const data = node.data;
    const machinesCount = data.machines || 1;
    const isAmplified = Array.isArray(options.somersloopRecipes)
      ? options.somersloopRecipes.includes(data.recipeId)
      : Boolean(options.somersloopRecipes && options.somersloopRecipes[data.recipeId]);
    const outMult = isAmplified ? 2.0 : 1.0;

    const fullCount = Math.floor(machinesCount);
    const remainder = machinesCount - fullCount;
    const hasFraction = remainder > 0.001;
    const totalPhysical = fullCount + (hasFraction ? 1 : 0);

    const physicalMachines = [];

    const makeMachine = (index, fraction) => {
      const pNode = {
        id: `${node.id}_m${index}`,
        type: 'physicalMachine',
        data: {
          machineIndex: index,
          totalMachinesInGroup: totalPhysical,
          recipeId: data.recipeId,
          buildingId: data.buildingId,
          label: data.label,
          clockSpeed: fraction * 100,
          isAmplified,
          power: (data.power / machinesCount) * fraction,
          itemId: data.itemId,
          rate: (data.outputs?.[0]?.rate || 0) * fraction * outMult,
          inputs: (data.inputs || []).map(inp => ({ itemId: inp.itemId, rate: inp.rate * fraction })),
          outputs: (data.outputs || []).map(out => ({ itemId: out.itemId, rate: out.rate * fraction * outMult })),
          layoutDirection
        }
      };
      physicalMachines.push(pNode);
      realNodes.push(pNode);
    };

    for (let i = 1; i <= fullCount; i++) makeMachine(i, 1);
    if (hasFraction) makeMachine(fullCount + 1, remainder);

    recipeGroups[node.id] = { originalNode: node, machines: physicalMachines };
  });

  // 3. Выходы: дерево соединителей или прямые выходы
  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const machines = group.machines;
    const outputs = group.originalNode.data?.outputs || [];

    recipeItemOutputs[recipeNodeId] = {};

    outputs.forEach(outItem => {
      const itemId = outItem.itemId;
      if (itemId === 'power') return;

      const totalProduced = machines.reduce((sum, m) => {
        const o = m.data.outputs.find(out => out.itemId === itemId);
        return sum + (o?.rate || 0);
      }, 0);

      if (machines.length === 1 || !useSplitters) {
        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: machines[0].id,
          handleId: `out-${itemId}`,
          rate: totalProduced,
          isDirect: !useSplitters && machines.length > 1,
          machines
        };
      } else {
        const sources = machines.map(m => ({
          nodeId: m.id,
          handle: `out-${itemId}`,
          rate: m.data.outputs.find(o => o.itemId === itemId)?.rate || 0
        }));
        const root = buildMergerTree(
          sources, `mrg_${recipeNodeId}_${itemId}`, itemId, layoutDirection,
          realNodes, realEdges, 'Сбор'
        );
        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: root.nodeId,
          handleId: root.handle,
          rate: totalProduced
        };
      }
    });
  });

  // Выходы сырья / импорта
  abstractNodes.forEach(node => {
    if (node.data?.isInput) {
      const itemId = node.data.itemId;
      recipeItemOutputs[node.id] = {
        [itemId]: { nodeId: node.id, handleId: `out-${itemId}`, rate: node.data.rate }
      };
    }
  });

  // 4. Входящие потоки для каждого потребителя
  const incomingFlowsByTargetItem = {};

  abstractEdges.forEach(edge => {
    const targetId = edge.target;
    const itemId = edge.data?.itemId;
    const rate = edge.data?.rate || 0;
    const sourceId = edge.source;

    if (!incomingFlowsByTargetItem[targetId]) incomingFlowsByTargetItem[targetId] = {};
    if (!incomingFlowsByTargetItem[targetId][itemId]) incomingFlowsByTargetItem[targetId][itemId] = [];

    const sourceInfo = recipeItemOutputs[sourceId]?.[itemId] || {
      nodeId: sourceId,
      handleId: edge.sourceHandle || `out-${itemId}`,
      rate
    };

    incomingFlowsByTargetItem[targetId][itemId].push({ abstractSourceId: sourceId, sourceInfo, rate });
  });

  // 5. Входы: дерево разветвителей или прямое подключение
  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const machines = group.machines;
    const inputs = group.originalNode.data?.inputs || [];

    inputs.forEach(inpItem => {
      const itemId = inpItem.itemId;
      const feeds = incomingFlowsByTargetItem[recipeNodeId]?.[itemId] || [];

      if (machines.length === 1 || !useSplitters) {
        // Прямое подключение: распределяем фиды по станкам
        let currentFeedIdx = 0;
        let feedRemaining = feeds[0]?.rate || 0;

        machines.forEach(machine => {
          let needed = machine.data.inputs.find(i => i.itemId === itemId)?.rate || 0;

          while (needed > 0.001 && currentFeedIdx < feeds.length) {
            const feed = feeds[currentFeedIdx];
            const sourceInfo = feed.sourceInfo;
            const take = Math.min(needed, feedRemaining);

            if (sourceInfo.isDirect && sourceInfo.machines) {
              sourceInfo.machines.forEach(sm => {
                const sRate = take / sourceInfo.machines.length;
                if (sRate > 0.001) {
                  realEdges.push({
                    id: `edge_${sm.id}_${machine.id}_${itemId}_${currentFeedIdx}`,
                    source: sm.id,
                    sourceHandle: `out-${itemId}`,
                    target: machine.id,
                    targetHandle: `in-${itemId}`,
                    data: { rate: sRate, itemId }
                  });
                }
              });
            } else {
              realEdges.push({
                id: `edge_${sourceInfo.nodeId}_${machine.id}_${itemId}_${currentFeedIdx}`,
                source: sourceInfo.nodeId,
                sourceHandle: sourceInfo.handleId,
                target: machine.id,
                targetHandle: `in-${itemId}`,
                data: { rate: take, itemId }
              });
            }

            needed -= take;
            feedRemaining -= take;

            if (feedRemaining <= 0.001) {
              currentFeedIdx++;
              feedRemaining = feeds[currentFeedIdx]?.rate || 0;
            }
          }
        });
        return;
      }

      // Дерево разветвителей на все станки группы
      const consumers = machines.map(m => ({
        nodeId: m.id,
        handle: `in-${itemId}`,
        rate: m.data.inputs.find(i => i.itemId === itemId)?.rate || 0
      })).filter(c => c.rate > 0.001);

      const root = buildSplitterTree(
        consumers, `spl_${recipeNodeId}_${itemId}`, itemId, layoutDirection,
        realNodes, realEdges, 'Раздача'
      );
      if (!root || feeds.length === 0) return;

      // Несколько источников сначала собираются деревом соединителей
      const feedSources = feeds.map(f => ({
        nodeId: f.sourceInfo.isDirect && f.sourceInfo.machines ? f.sourceInfo.machines[0].id : f.sourceInfo.nodeId,
        handle: f.sourceInfo.isDirect && f.sourceInfo.machines ? `out-${itemId}` : f.sourceInfo.handleId,
        rate: f.rate
      }));
      const feedRoot = buildMergerTree(
        feedSources, `feed_mrg_${recipeNodeId}_${itemId}`, itemId, layoutDirection,
        realNodes, realEdges, 'Сбор сырья'
      );

      realEdges.push({
        id: `edge_${feedRoot.nodeId}_${root.nodeId}_${itemId}_feed`,
        source: feedRoot.nodeId,
        sourceHandle: feedRoot.handle,
        target: root.nodeId,
        targetHandle: root.handle,
        data: { rate: feedRoot.rate, itemId }
      });
    });
  });

  // 6. Конечные продукты
  const consumedRateBySourceItem = {};
  abstractEdges.forEach(edge => {
    const key = `${edge.source}_${edge.data?.itemId}`;
    consumedRateBySourceItem[key] = (consumedRateBySourceItem[key] || 0) + (edge.data?.rate || 0);
  });

  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const outputs = group.originalNode.data?.outputs || [];

    outputs.forEach(outItem => {
      const itemId = outItem.itemId;
      const sourceInfo = recipeItemOutputs[recipeNodeId]?.[itemId];
      if (!sourceInfo) return;

      const consumed = consumedRateBySourceItem[`${recipeNodeId}_${itemId}`] || 0;
      const surplus = sourceInfo.rate - consumed;
      if (surplus <= 0.001) return;

      const outNodeId = `out_${recipeNodeId}_${itemId}`;
      realNodes.push({
        id: outNodeId,
        type: 'productItem',
        data: { itemId, rate: surplus, label: 'Конечный продукт', layoutDirection }
      });

      if (sourceInfo.isDirect && sourceInfo.machines) {
        sourceInfo.machines.forEach(sm => {
          const smRate = sm.data.outputs.find(o => o.itemId === itemId)?.rate || 0;
          const portion = (surplus / sourceInfo.rate) * smRate;
          if (portion > 0.001) {
            realEdges.push({
              id: `edge_${sm.id}_${outNodeId}_${itemId}`,
              source: sm.id,
              sourceHandle: `out-${itemId}`,
              target: outNodeId,
              targetHandle: 'in',
              data: { rate: portion, itemId, isOutput: true }
            });
          }
        });
      } else {
        realEdges.push({
          id: `edge_${sourceInfo.nodeId}_${outNodeId}_${itemId}`,
          source: sourceInfo.nodeId,
          sourceHandle: sourceInfo.handleId,
          target: outNodeId,
          targetHandle: 'in',
          data: { rate: surplus, itemId, isOutput: true }
        });
      }
    });
  });

  abstractNodes.forEach(node => {
    if (!node.data?.isInput) return;
    const itemId = node.data.itemId;
    const consumed = consumedRateBySourceItem[`${node.id}_${itemId}`] || 0;
    const surplus = (node.data.rate || 0) - consumed;
    if (surplus <= 0.001) return;

    const outNodeId = `out_${node.id}_${itemId}`;
    realNodes.push({
      id: outNodeId,
      type: 'productItem',
      data: { itemId, rate: surplus, label: 'Конечный продукт', layoutDirection }
    });
    realEdges.push({
      id: `edge_${node.id}_${outNodeId}_${itemId}`,
      source: node.id,
      sourceHandle: `out-${itemId}`,
      target: outNodeId,
      targetHandle: 'in',
      data: { rate: surplus, itemId, isOutput: true }
    });
  });

  return { nodes: realNodes, edges: realEdges };
}
