/**
 * layout.worker.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Web Worker для асинхронного расчёта координат узлов графа Dagre.
 * Предотвращает зависание основного UI-потока браузера на крупных схемах (до 2 с).
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { computeDagrePositions } from './dagreLayout.js';

self.onmessage = function (e) {
  const { id, activeNodes, activeEdges, options } = e.data;

  try {
    const positions = computeDagrePositions(activeNodes, activeEdges, options);
    self.postMessage({ id, positions, success: true });
  } catch (err) {
    self.postMessage({ id, error: err?.message || String(err), success: false });
  }
};
