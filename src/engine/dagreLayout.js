/**
 * dagreLayout.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Чистая функция расчёта позиций узлов графа с помощью Dagre.
 * Используется как в Web Worker, так и в синхронном fallback-режиме (тесты, Node.js).
 * ════════════════════════════════════════════════════════════════════════════════
 */

import dagre from 'dagre';

export function getNodeDimensions(node) {
  if (node.type === 'splitter' || node.type === 'merger') {
    return { width: 140, height: 130 };
  }
  if (node.type === 'output' || node.type === 'productItem') {
    return { width: 80, height: 130 };
  }
  return { width: 150, height: 130 };
}

/**
 * Рассчитывает координаты всех узлов графа.
 * @param {Array} activeNodes
 * @param {Array} activeEdges
 * @param {Object} options
 * @param {string} options.layoutDirection - 'LR' | 'TB'
 * @param {string} options.schematicMode - 'simple' | 'realistic'
 * @returns {Object} Словарь позиций: { [nodeId]: { x, y, width, height } }
 */
export function computeDagrePositions(activeNodes, activeEdges, options = {}) {
  const { layoutDirection = 'LR', schematicMode = 'simple' } = options;

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

  // Добавляем ноды с индивидуальными габаритами
  activeNodes.forEach(node => {
    const { width, height } = getNodeDimensions(node);
    dagreGraph.setNode(node.id, { width, height });
  });

  // 2. Группировка по производственным слоям (Ранжирование)
  // Определение обратных рёбер и циклов рециркуляции (например, темная материя, возврат воды в VIP гидроконтур)
  const fullAdj = {};
  activeEdges.forEach(e => {
    fullAdj[e.source] = fullAdj[e.source] || [];
    fullAdj[e.source].push(e);
  });

  const cycleEdgeIds = new Set();
  const dfsVisited = {};
  const onStack = {};

  // Итеративный DFS для предотвращения переполнения стека вызовов
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
    // 1. Побочные продукты замкнутых циклов
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

  // 3. Оптимизированное вычисление глубин узлов (DAG Toposort за O(V + E))
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

  // Подстраховка для оставшихся неразрешенных связей
  if (queue.length < activeNodes.length) {
    forwardEdges.forEach(e => {
      const sD = nodeDepth[e.source] || 0;
      if (sD + 1 > (nodeDepth[e.target] || 0)) {
        nodeDepth[e.target] = sD + 1;
      }
    });
  }

  // 4. Веса и минимальная длина рёбер
  activeEdges.forEach(edge => {
    const recycle = isRecycleEdge(edge);
    if (recycle) {
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

    const isRawMine = edge.source.startsWith('mine_');
    const minlen = isRawMine ? Math.min(depthDiff, 2) : 1;

    dagreGraph.setEdge(edge.source, edge.target, {
      weight: isRawMine ? 3 : (isLongTransit ? 1 : (isRealistic ? 2 : 3)),
      minlen
    });
  });

  dagre.layout(dagreGraph);

  // Выравнивание по прямой линии в реалистичном режиме
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

  // Формируем результат позиционирования
  const positions = {};
  activeNodes.forEach(node => {
    const pos = dagreGraph.node(node.id) || { x: 0, y: 0 };
    const { width, height } = getNodeDimensions(node);
    positions[node.id] = {
      x: pos.x - (width / 2),
      y: pos.y - (height / 2),
      width,
      height
    };
  });

  return positions;
}
