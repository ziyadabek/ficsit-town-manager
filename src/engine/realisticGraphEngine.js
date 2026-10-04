/**
 * realisticGraphEngine.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Движок развертки абстрактного графа производства в физическую схему цеха (SCIM).
 *
 * Преобразует:
 *  1. Абстрактные узлы рецептов (напр. Ассемблер x5.2) в физические станки:
 *     - N_full станков по 100% мощности
 *     - 1 станок с остаточным оверклоком (напр. 20%)
 *  2. Входные потоки разводятся через конвейерные разветвители (Splitter Manifold)
 *     или напрямую при useSplitters: false.
 *  3. Выходные потоки собираются через соединители (Merger Manifold)
 *     или направляются напрямую при useSplitters: false.
 *  4. Сохраняет параллельное выравнивание станков в одном слое/колонке,
 *     предотвращая диагональную лестницу ("ёлку") в Dagre.
 * ════════════════════════════════════════════════════════════════════════════════
 */

export function expandToRealisticGraph(abstractNodes, abstractEdges, options = {}) {
  const layoutDirection = options.layoutDirection || 'LR';
  const useSplitters = options.useSplitters !== false;
  const realNodes = [];
  const realEdges = [];

  // Карта выходов для каждой группы рецептов: recipeId -> { itemId: { nodeId, handleId, rate, machines } }
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

  // 2. Распаковываем производственные узлы в физические машины
  const recipeGroups = {};

  abstractNodes.forEach(node => {
    if (node.data?.isInput || node.data?.isVIP) return;

    const data = node.data;
    const machinesCount = data.machines || 1;
    const isAmplified = options.somersloopRecipes?.includes(data.recipeId);
    const outMult = isAmplified ? 2.0 : 1.0;

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

  // 3. Выходная логистика: соединители (Mergers) или прямые выходы станков
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
        // Одиночный станок или режим без разветвителей/соединителей
        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: machines[0].id,
          handleId: `out-${itemId}`,
          rate: totalProduced,
          isDirect: !useSplitters && machines.length > 1,
          machines
        };
      } else {
        // Компактный SCIM соединитель (Merger) для всей группы станков
        const mergerId = `mrg_${recipeNodeId}_${itemId}`;
        const mergerNode = {
          id: mergerId,
          type: 'merger',
          data: {
            itemId,
            rate: totalProduced,
            subLabel: `Сбор (${machines.length} станков)`,
            layoutDirection
          }
        };
        realNodes.push(mergerNode);

        machines.forEach((m, idx) => {
          const mRate = m.data.outputs.find(o => o.itemId === itemId)?.rate || 0;
          realEdges.push({
            id: `edge_${m.id}_${mergerId}_${itemId}`,
            source: m.id,
            sourceHandle: `out-${itemId}`,
            target: mergerId,
            targetHandle: idx === 0 ? 'in' : 'in-branch',
            data: { rate: mRate, itemId }
          });
        });

        recipeItemOutputs[recipeNodeId][itemId] = {
          nodeId: mergerId,
          handleId: 'out',
          rate: totalProduced
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

  // 4. Анализируем абстрактные ребра и собираем потоки к потребителям
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

    const sourceInfo = recipeItemOutputs[sourceId]?.[itemId] || {
      nodeId: sourceId,
      handleId: edge.sourceHandle || `out-${itemId}`,
      rate
    };

    incomingFlowsByTargetItem[targetId][itemId].push({
      abstractSourceId: sourceId,
      sourceInfo,
      rate
    });
  });

  // 5. Входная логистика: разветвители (Splitters) или прямое подключение
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

      if (machines.length === 1 || !useSplitters) {
        // Прямое подключение к станкам без разветвителя
        let currentFeedIdx = 0;
        let feedRemaining = feeds[0]?.rate || 0;

        machines.forEach(machine => {
          let needed = machine.data.inputs.find(i => i.itemId === itemId)?.rate || 0;

          while (needed > 0.001 && currentFeedIdx < feeds.length) {
            const feed = feeds[currentFeedIdx];
            const sourceInfo = feed.sourceInfo;
            const take = Math.min(needed, feedRemaining);

            if (sourceInfo.isDirect && sourceInfo.machines) {
              // Если источник сам работает без сплиттеров/мерджеров
              sourceInfo.machines.forEach(sm => {
                const sRate = (take / sourceInfo.machines.length);
                if (sRate > 0.001) {
                  realEdges.push({
                    id: `edge_${sm.id}_${machine.id}_${itemId}_${Math.random().toString(36).substr(2, 5)}`,
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
      } else {
        // Компактный SCIM разветвитель (Splitter) для всей группы станков
        const splitterId = `spl_${recipeNodeId}_${itemId}`;
        const splitterNode = {
          id: splitterId,
          type: 'splitter',
          data: {
            itemId,
            rate: totalRequired,
            subLabel: `Раздача (${machines.length} станков)`,
            layoutDirection
          }
        };
        realNodes.push(splitterNode);

        // Подключаем входящие фиды к разветвителю
        if (feeds.length === 1) {
          const feed = feeds[0];
          realEdges.push({
            id: `edge_${feed.sourceInfo.nodeId}_${splitterId}_${itemId}`,
            source: feed.sourceInfo.nodeId,
            sourceHandle: feed.sourceInfo.handleId,
            target: splitterId,
            targetHandle: 'in',
            data: { rate: feed.rate, itemId }
          });
        } else if (feeds.length > 1) {
          // Если фидов несколько, собираем их через входной мерджер
          const feedMergerId = `feed_mrg_${recipeNodeId}_${itemId}`;
          const totalFeedRate = feeds.reduce((s, f) => s + f.rate, 0);
          realNodes.push({
            id: feedMergerId,
            type: 'merger',
            data: { itemId, rate: totalFeedRate, subLabel: 'Сбор сырья', layoutDirection }
          });
          feeds.forEach((f, idx) => {
            realEdges.push({
              id: `edge_${f.sourceInfo.nodeId}_${feedMergerId}_${idx}`,
              source: f.sourceInfo.nodeId,
              sourceHandle: f.sourceInfo.handleId,
              target: feedMergerId,
              targetHandle: idx === 0 ? 'in' : 'in-branch',
              data: { rate: f.rate, itemId }
            });
          });
          realEdges.push({
            id: `edge_${feedMergerId}_${splitterId}`,
            source: feedMergerId,
            sourceHandle: 'out',
            target: splitterId,
            targetHandle: 'in',
            data: { rate: totalFeedRate, itemId }
          });
        }

        // Подключаем разветвитель ко всем станкам группы
        machines.forEach(machine => {
          const mDemand = machine.data.inputs.find(i => i.itemId === itemId)?.rate || 0;
          if (mDemand > 0.001) {
            realEdges.push({
              id: `edge_${splitterId}_${machine.id}_${itemId}`,
              source: splitterId,
              sourceHandle: 'out',
              target: machine.id,
              targetHandle: `in-${itemId}`,
              data: { rate: mDemand, itemId }
            });
          }
        });
      }
    });
  });

  // 6. Создаем узлы конечного продукта (Output Nodes) для целевых продуктов и остатков (SCIM)
  const consumedRateBySourceItem = {};
  abstractEdges.forEach(edge => {
    const key = `${edge.source}_${edge.data?.itemId}`;
    consumedRateBySourceItem[key] = (consumedRateBySourceItem[key] || 0) + (edge.data?.rate || 0);
  });

  // 6.1. Выходы производственных рецептов
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
      }
    });
  });

  // 6.2. Выходы сырья/импорта
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
          data: { rate: surplus, itemId, isOutput: true }
        });
      }
    }
  });

  return {
    nodes: realNodes,
    edges: realEdges
  };
}
