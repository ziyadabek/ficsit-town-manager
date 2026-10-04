/**
 * realisticGraphEngine.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Движок развертки абстрактного графа производства в физическую схему цеха (SCIM).
 *
 * Преобразует:
 *  1. Абстрактные узлы рецептов (напр. Ассемблер x5.2) в физические станки:
 *     - N_full станков по 100% мощности
 *     - 1 станок с остаточным оверклоком (напр. 20%)
 *  2. Входные потоки разводятся через цепочки Конвейерных Разветвителей (Splitter Manifold).
 *  3. Выходные потоки собираются через цепочки Конвейерных Соединителей (Merger Manifold).
 *  4. Сохраняет корректные связи (Edges) с расчетом потоков и скоростей лент.
 * ════════════════════════════════════════════════════════════════════════════════
 */

export function expandToRealisticGraph(abstractNodes, abstractEdges, options = {}) {
  const layoutDirection = options.layoutDirection || 'LR';
  const realNodes = [];
  const realEdges = [];

  // Карта входов для каждой группы рецептов: recipeId -> { itemId: [ { sourceNodeId, sourceHandle, rate } ] }
  const recipeItemSources = {};

  // Карта выходов для каждой группы рецептов: recipeId -> { itemId: { outputNodeId, outputHandle, totalRate } }
  const recipeItemOutputs = {};

  // 1. Пропускаем входные узлы (mine_*, import_*) и VIP узлы без изменений
  abstractNodes.forEach(node => {
    if (node.data?.isInput || node.data?.isVIP) {
      realNodes.push({
        ...node,
        data: {
          ...node.data,
          layoutDirection
        }
      });
    }
  });

  // 2. Распаковываем производственные узлы
  const recipeGroups = {};

  abstractNodes.forEach(node => {
    if (node.data?.isInput || node.data?.isVIP) return;

    const data = node.data;
    const machinesCount = data.machines || 1;
    const isAmplified = options.somersloopRecipes?.includes(data.recipeId);
    const outMult = isAmplified ? 2.0 : 1.0;

    // Определяем количество физических машин
    const fullCount = Math.floor(machinesCount);
    const remainder = machinesCount - fullCount;
    const hasFraction = remainder > 0.001;
    const totalPhysical = fullCount + (hasFraction ? 1 : 0);

    const physicalMachines = [];

    // Создаем полные станки (100%)
    for (let i = 1; i <= fullCount; i++) {
      const mId = `${node.id}_m${i}`;
      const singleInputs = (data.inputs || []).map(inp => ({
        itemId: inp.itemId,
        rate: inp.rate
      }));
      const singleOutputs = (data.outputs || []).map(out => ({
        itemId: out.itemId,
        rate: out.rate * outMult
      }));

      const pNode = {
        id: mId,
        type: 'physicalMachine',
        data: {
          machineIndex: i,
          totalMachinesInGroup: totalPhysical,
          recipeId: data.recipeId,
          buildingId: data.buildingId,
          label: data.label,
          clockSpeed: 100,
          isAmplified,
          power: data.power / machinesCount,
          itemId: data.itemId,
          rate: (data.outputs?.[0]?.rate || 0) * outMult,
          inputs: singleInputs,
          outputs: singleOutputs,
          layoutDirection
        }
      };
      physicalMachines.push(pNode);
      realNodes.push(pNode);
    }

    // Создаем остаточный станок (< 100%)
    if (hasFraction) {
      const fracIndex = fullCount + 1;
      const fracClock = remainder * 100;
      const mId = `${node.id}_m${fracIndex}`;

      const singleInputs = (data.inputs || []).map(inp => ({
        itemId: inp.itemId,
        rate: inp.rate * remainder
      }));
      const singleOutputs = (data.outputs || []).map(out => ({
        itemId: out.itemId,
        rate: out.rate * remainder * outMult
      }));

      const pNode = {
        id: mId,
        type: 'physicalMachine',
        data: {
          machineIndex: fracIndex,
          totalMachinesInGroup: totalPhysical,
          recipeId: data.recipeId,
          buildingId: data.buildingId,
          label: data.label,
          clockSpeed: fracClock,
          isAmplified,
          power: (data.power / machinesCount) * remainder,
          itemId: data.itemId,
          rate: (data.outputs?.[0]?.rate || 0) * remainder * outMult,
          inputs: singleInputs,
          outputs: singleOutputs,
          layoutDirection
        }
      };
      physicalMachines.push(pNode);
      realNodes.push(pNode);
    }

    recipeGroups[node.id] = {
      originalNode: node,
      machines: physicalMachines
    };
  });

  // 3. Строим выходные конвейерные соединители (Mergers) для каждого продукта каждого рецепта
  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const machines = group.machines;
    const outputs = group.originalNode.data?.outputs || [];

    recipeItemOutputs[recipeNodeId] = {};

    outputs.forEach(outItem => {
      const itemId = outItem.itemId;
      if (itemId === 'power') return; // Энергия передается без конвейеров

      if (machines.length === 1) {
        // Если станок всего 1, соединители не нужны
        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: machines[0].id,
          handleId: `out-${itemId}`,
          rate: machines[0].data.outputs.find(o => o.itemId === itemId)?.rate || 0
        };
      } else {
        // Создаем цепочку Merger (Merger Manifold)
        // machines[0] + machines[1] -> Merger 1 -> Merger 2 (+ machines[2]) -> ...
        let prevMergerId = null;
        let cumulativeRate = 0;

        for (let m = 0; m < machines.length - 1; m++) {
          const mergerId = `mrg_${recipeNodeId}_${itemId}_${m + 1}`;
          const currentMachine = machines[m];
          const nextMachine = machines[m + 1];

          const mRate = currentMachine.data.outputs.find(o => o.itemId === itemId)?.rate || 0;
          const nextMRate = nextMachine.data.outputs.find(o => o.itemId === itemId)?.rate || 0;

          if (m === 0) {
            cumulativeRate = mRate + nextMRate;
          } else {
            cumulativeRate += nextMRate;
          }

          const mergerNode = {
            id: mergerId,
            type: 'merger',
            data: {
              itemId,
              rate: cumulativeRate,
              branchRate: nextMRate,
              mainRate: m === 0 ? mRate : cumulativeRate - nextMRate,
              subLabel: `Шаг ${m + 1} из ${machines.length - 1}`,
              layoutDirection
            }
          };
          realNodes.push(mergerNode);

          if (m === 0) {
            // Подключаем machine[0] и machine[1] к первому Merger
            realEdges.push({
              id: `edge_${currentMachine.id}_${mergerId}`,
              source: currentMachine.id,
              sourceHandle: `out-${itemId}`,
              target: mergerId,
              targetHandle: 'in',
              data: { rate: mRate, itemId }
            });
            realEdges.push({
              id: `edge_${nextMachine.id}_${mergerId}`,
              source: nextMachine.id,
              sourceHandle: `out-${itemId}`,
              target: mergerId,
              targetHandle: 'in-branch',
              data: { rate: nextMRate, itemId }
            });
          } else {
            // Подключаем предыдущий merger к текущему merger
            realEdges.push({
              id: `edge_${prevMergerId}_${mergerId}`,
              source: prevMergerId,
              sourceHandle: 'out',
              target: mergerId,
              targetHandle: 'in',
              data: { rate: cumulativeRate - nextMRate, itemId }
            });
            // Подключаем nextMachine в боковой порт merger
            realEdges.push({
              id: `edge_${nextMachine.id}_${mergerId}`,
              source: nextMachine.id,
              sourceHandle: `out-${itemId}`,
              target: mergerId,
              targetHandle: 'in-branch',
              data: { rate: nextMRate, itemId }
            });
          }

          prevMergerId = mergerId;
        }

        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: prevMergerId,
          handleId: 'out',
          rate: cumulativeRate
        };
      }
    });
  });

  // Для узлов сырья / импорта регистрируем их выходы
  abstractNodes.forEach(node => {
    if (node.data?.isInput) {
      const itemId = node.data.itemId;
      recipeItemOutputs[node.id] = {
        [itemId]: {
          nodeId: node.id,
          handleId: `out-${itemId}`,
          rate: node.data.rate
        }
      };
    }
  });

  // 4. Анализируем абстрактные ребра, чтобы сгруппировать источники для каждого потребителя
  const incomingFlowsByTargetItem = {};

  abstractEdges.forEach(edge => {
    const targetId = edge.target;
    const itemId = edge.data?.itemId;
    const rate = edge.data?.rate || 0;
    const sourceId = edge.source;

    if (!incomingFlowsByTargetItem[targetId]) {
      incomingFlowsByTargetItem[targetId] = {};
    }
    if (!incomingFlowsByTargetItem[targetId][itemId]) {
      incomingFlowsByTargetItem[targetId][itemId] = [];
    }

    // Находим реальный узел-источник (мерджер или станок или входной узел)
    const sourceInfo = recipeItemOutputs[sourceId]?.[itemId] || {
      nodeId: sourceId,
      handleId: edge.sourceHandle || `out-${itemId}`,
      rate
    };

    incomingFlowsByTargetItem[targetId][itemId].push({
      abstractSourceId: sourceId,
      realSourceId: sourceInfo.nodeId,
      sourceHandle: sourceInfo.handleId,
      rate
    });
  });

  // 5. Строим входные конвейерные разветвители (Splitters) для каждого рецепта
  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const machines = group.machines;
    const inputs = group.originalNode.data?.inputs || [];

    inputs.forEach(inpItem => {
      const itemId = inpItem.itemId;
      const feeds = incomingFlowsByTargetItem[recipeNodeId]?.[itemId] || [];
      const totalRequired = machines.reduce((sum, m) => {
        const inp = m.data.inputs.find(i => i.itemId === itemId);
        return sum + (inp?.rate || 0);
      }, 0);

      if (machines.length === 1) {
        // Всего 1 станок — разветвитель не нужен!
        // Соединяем фиды напрямую со станком (или через мерджер фидов, если их несколько)
        if (feeds.length === 1) {
          realEdges.push({
            id: `edge_${feeds[0].realSourceId}_${machines[0].id}_${itemId}`,
            source: feeds[0].realSourceId,
            sourceHandle: feeds[0].sourceHandle,
            target: machines[0].id,
            targetHandle: `in-${itemId}`,
            data: { rate: feeds[0].rate, itemId }
          });
        } else if (feeds.length > 1) {
          // Объединяем несколько фидов в один мерджер перед станком
          const mergerId = `feed_mrg_${recipeNodeId}_${itemId}`;
          const totalFeedRate = feeds.reduce((s, f) => s + f.rate, 0);
          realNodes.push({
            id: mergerId,
            type: 'merger',
            data: { itemId, rate: totalFeedRate, subLabel: 'Вход', layoutDirection }
          });
          feeds.forEach((f, idx) => {
            realEdges.push({
              id: `edge_${f.realSourceId}_${mergerId}_${idx}`,
              source: f.realSourceId,
              sourceHandle: f.sourceHandle,
              target: mergerId,
              targetHandle: idx === 0 ? 'in' : 'in-branch',
              data: { rate: f.rate, itemId }
            });
          });
          realEdges.push({
            id: `edge_${mergerId}_${machines[0].id}`,
            source: mergerId,
            sourceHandle: 'out',
            target: machines[0].id,
            targetHandle: `in-${itemId}`,
            data: { rate: totalFeedRate, itemId }
          });
        }
      } else {
        // Машин 2 или больше: строим Splitter Manifold
        // Цепочка: Входной фид -> S_1 -> S_2 -> ... -> S_{M-1} -> machines
        const splittersCount = machines.length - 1;
        const splitterIds = [];
        let remainingFlow = totalRequired;

        for (let s = 0; s < splittersCount; s++) {
          const sId = `spl_${recipeNodeId}_${itemId}_${s + 1}`;
          splitterIds.push(sId);

          const machineDemand = machines[s].data.inputs.find(i => i.itemId === itemId)?.rate || 0;
          const nextRemaining = remainingFlow - machineDemand;
          const passRate = s < splittersCount - 1 
            ? nextRemaining 
            : (machines[machines.length - 1].data.inputs.find(i => i.itemId === itemId)?.rate || 0);

          realNodes.push({
            id: sId,
            type: 'splitter',
            data: {
              itemId,
              rate: remainingFlow,
              branchRate: machineDemand,
              passRate: passRate,
              subLabel: `Шаг ${s + 1} из ${splittersCount}`,
              layoutDirection
            }
          });

          // Отвод в машину s
          realEdges.push({
            id: `edge_${sId}_${machines[s].id}`,
            source: sId,
            sourceHandle: 'out-branch',
            target: machines[s].id,
            targetHandle: `in-${itemId}`,
            data: { rate: machineDemand, itemId }
          });

          remainingFlow -= machineDemand;

          // Соединение со следующим сплиттером
          if (s < splittersCount - 1) {
            const nextSId = `spl_${recipeNodeId}_${itemId}_${s + 2}`;
            realEdges.push({
              id: `edge_${sId}_${nextSId}`,
              source: sId,
              sourceHandle: 'out',
              target: nextSId,
              targetHandle: 'in',
              data: { rate: remainingFlow, itemId }
            });
          } else {
            // Последний сплиттер отдает прямой поток в последнюю машину
            const lastMachineDemand = machines[machines.length - 1].data.inputs.find(i => i.itemId === itemId)?.rate || 0;
            realEdges.push({
              id: `edge_${sId}_${machines[machines.length - 1].id}`,
              source: sId,
              sourceHandle: 'out',
              target: machines[machines.length - 1].id,
              targetHandle: `in-${itemId}`,
              data: { rate: lastMachineDemand, itemId }
            });
          }
        }

        // Подключаем входящие фиды к первому сплиттеру S_1
        const firstSplitterId = splitterIds[0];
        if (feeds.length === 1) {
          realEdges.push({
            id: `edge_${feeds[0].realSourceId}_${firstSplitterId}_feed`,
            source: feeds[0].realSourceId,
            sourceHandle: feeds[0].sourceHandle,
            target: firstSplitterId,
            targetHandle: 'in',
            data: { rate: feeds[0].rate, itemId }
          });
        } else if (feeds.length > 1) {
          // Если фидов несколько, предварительно объединяем их через Merger
          const feedMergerId = `feed_mrg_${recipeNodeId}_${itemId}`;
          const totalFeedRate = feeds.reduce((s, f) => s + f.rate, 0);
          realNodes.push({
            id: feedMergerId,
            type: 'merger',
            data: { itemId, rate: totalFeedRate, subLabel: 'Сбор сырья', layoutDirection }
          });
          feeds.forEach((f, idx) => {
            realEdges.push({
              id: `edge_${f.realSourceId}_${feedMergerId}_${idx}`,
              source: f.realSourceId,
              sourceHandle: f.sourceHandle,
              target: feedMergerId,
              targetHandle: idx === 0 ? 'in' : 'in-branch',
              data: { rate: f.rate, itemId }
            });
          });
          realEdges.push({
            id: `edge_${feedMergerId}_${firstSplitterId}`,
            source: feedMergerId,
            sourceHandle: 'out',
            target: firstSplitterId,
            targetHandle: 'in',
            data: { rate: totalFeedRate, itemId }
          });
        }
      }
    });
  });

  // 6. Создаем узлы конечного продукта (Output Nodes) для целевых продуктов и остатков (SCIM)
  const consumedRateBySourceItem = {};
  abstractEdges.forEach(edge => {
    const key = `${edge.source}_${edge.data?.itemId}`;
    consumedRateBySourceItem[key] = (consumedRateBySourceItem[key] || 0) + (edge.data?.rate || 0);
  });

  // 6.1. Выходы производственных рецептов (после Mergers или одиночных станков)
  Object.keys(recipeGroups).forEach(recipeNodeId => {
    const group = recipeGroups[recipeNodeId];
    const outputs = group.originalNode.data?.outputs || [];

    outputs.forEach(outItem => {
      const itemId = outItem.itemId;
      const sourceInfo = recipeItemOutputs[recipeNodeId]?.[itemId];
      if (!sourceInfo) return;

      const consumed = consumedRateBySourceItem[`${recipeNodeId}_${itemId}`] || 0;
      const surplus = sourceInfo.rate - consumed;

      if (surplus > 0.001) {
        const outNodeId = `out_${recipeNodeId}_${itemId}`;
        realNodes.push({
          id: outNodeId,
          type: 'productItem',
          data: {
            itemId,
            rate: surplus,
            label: 'Конечный продукт',
            layoutDirection
          }
        });

        realEdges.push({
          id: `edge_${sourceInfo.nodeId}_${outNodeId}_${itemId}`,
          source: sourceInfo.nodeId,
          sourceHandle: sourceInfo.handleId,
          target: outNodeId,
          targetHandle: 'in',
          data: {
            rate: surplus,
            itemId
          }
        });
      }
    });
  });

  // 6.2. Выходы сырья/импорта (если само сырье является целевым продуктом)
  abstractNodes.forEach(node => {
    if (node.data?.isInput) {
      const itemId = node.data.itemId;
      const consumed = consumedRateBySourceItem[`${node.id}_${itemId}`] || 0;
      const surplus = (node.data.rate || 0) - consumed;

      if (surplus > 0.001) {
        const outNodeId = `out_${node.id}_${itemId}`;
        realNodes.push({
          id: outNodeId,
          type: 'productItem',
          data: {
            itemId,
            rate: surplus,
            label: 'Конечный продукт',
            layoutDirection
          }
        });

        realEdges.push({
          id: `edge_${node.id}_${outNodeId}_${itemId}`,
          source: node.id,
          sourceHandle: `out-${itemId}`,
          target: outNodeId,
          targetHandle: 'in',
          data: {
            rate: surplus,
            itemId
          }
        });
      }
    }
  });

  return {
    nodes: realNodes,
    edges: realEdges
  };
}
