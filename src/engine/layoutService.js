/**
 * layoutService.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Менеджер асинхронного вычисления раскладки графа через Web Worker.
 *
 * Особенности:
 *  - Автоматический fallback на синхронный расчёт в среде Node.js / Vitest.
 *  - Управление жизненным циклом Web Worker (singleton).
 *  - Отмена устаревших запросов через monotonic requestId (защита от race conditions).
 *  - Прозрачный Promise-интерфейс.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import { computeDagrePositions } from './dagreLayout.js';

let workerInstance = null;
let currentRequestId = 0;
let pendingResolvers = new Map();

function getWorker() {
  if (typeof Worker === 'undefined') {
    return null;
  }

  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('./layout.worker.js', import.meta.url),
        { type: 'module' }
      );

      workerInstance.onmessage = (e) => {
        const { id, positions, error, success } = e.data;
        const resolver = pendingResolvers.get(id);
        if (!resolver) return;

        pendingResolvers.delete(id);

        // Игнорируем устаревшие запросы: применяем результат только если это самый свежий запрос
        if (id !== currentRequestId) {
          return;
        }

        if (success) {
          resolver.resolve(positions);
        } else {
          resolver.reject(new Error(error || 'Layout worker error'));
        }
      };

      workerInstance.onerror = (err) => {
        console.warn('[layoutService] Worker error, falling back to sync:', err);
        // Отклоняем все ожидающие запросы
        pendingResolvers.forEach(({ reject }) => {
          reject(err);
        });
        pendingResolvers.clear();
        // Пересоздадим воркер при следующем запросе
        if (workerInstance) {
          workerInstance.terminate();
          workerInstance = null;
        }
      };
    } catch (e) {
      console.warn('[layoutService] Failed to initialize Web Worker, falling back to sync:', e);
      workerInstance = null;
    }
  }

  return workerInstance;
}

/**
 * Вычисляет позиции узлов графа асинхронно через Web Worker (или синхронно в тестах/fallback).
 * @param {Array} activeNodes
 * @param {Array} activeEdges
 * @param {Object} options
 * @returns {Promise<Object>} Словарь { [nodeId]: { x, y, width, height } }
 */
export function calculateGraphLayout(activeNodes, activeEdges, options = {}) {
  const worker = getWorker();

  // Если воркер недоступен (Node.js, тестовое окружение или сбой инициализации) — синхронный fallback
  if (!worker) {
    return Promise.resolve(computeDagrePositions(activeNodes, activeEdges, options));
  }

  return new Promise((resolve, reject) => {
    const id = ++currentRequestId;
    pendingResolvers.set(id, { resolve, reject });

    // Очищаем старые ожидающие промисы
    if (pendingResolvers.size > 10) {
      const keysToDelete = Array.from(pendingResolvers.keys()).filter(k => k < id);
      keysToDelete.forEach(k => pendingResolvers.delete(k));
    }

    try {
      worker.postMessage({
        id,
        activeNodes,
        activeEdges,
        options
      });
    } catch (err) {
      console.warn('[layoutService] Failed to post message to worker, using sync fallback:', err);
      pendingResolvers.delete(id);
      try {
        const syncPositions = computeDagrePositions(activeNodes, activeEdges, options);
        resolve(syncPositions);
      } catch (syncErr) {
        reject(syncErr);
      }
    }
  });
}

/**
 * Синхронный расчёт позиций узлов графа (для мгновенного применения в тестах).
 */
export function calculateGraphLayoutSync(activeNodes, activeEdges, options = {}) {
  return computeDagrePositions(activeNodes, activeEdges, options);
}

/**
 * Отменяет все ожидающие запросы раскладки.
 */
export function cancelPendingLayout() {
  currentRequestId++;
  pendingResolvers.clear();
}
