/**
 * storageService.js
 * ════════════════════════════════════════════════════════════════════════════════
 * Постоянное хранилище на базе нативного W3C IndexedDB API.
 * 
 * - Не требует сторонних библиотек (0 КБ в бандл)
 * - 100% совместимо со статическим хостингом (GitHub Pages / HTTPS / localhost)
 * - Поддерживает гигабайты данных без QuotaExceededError
 * - Автоматически мигрирует существующие данные из localStorage
 * - Предоставляет экспорт/импорт резервных копий .json
 * ════════════════════════════════════════════════════════════════════════════════
 */

const DB_NAME = 'ficsit_factory_db';
const DB_VERSION = 1;
const STORE_NAME = 'stages_store';
const STAGES_KEY = 'frozen_stages_v2';
const LEGACY_STORAGE_KEY = 'ficsit_frozen_stages_v2';
const OLD_LEGACY_KEY = 'ficsit_frozen_stages_v1';
const BUILT_NODES_KEY = 'built_nodes_v1';
const LEGACY_BUILT_STORAGE_KEY = 'ficsit_built_nodes_v1';

/**
 * Открывает или создает базу данных IndexedDB.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Запрашивает у браузера статус постоянного хранения (не удалять при нехватке места).
 */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      return isPersisted;
    }
  } catch (e) {
    console.warn('[storageService] Failed to request storage persistence:', e);
  }
  return false;
}

/**
 * Загружает замороженные этапы фабрики.
 * Если в IndexedDB пусто, проверяет localStorage и мигрирует данные.
 * @returns {Promise<Record<string, any>>}
 */
export async function loadFrozenStages() {
  try {
    const db = await openDB();
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STAGES_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('[storageService] IndexedDB read failed, trying localStorage fallback:', err);
  }

  // Fallback и автомиграция из localStorage
  try {
    let raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      raw = localStorage.getItem(OLD_LEGACY_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Мигрируем в IndexedDB в фоновом режиме
        saveFrozenStages(parsed).catch(e => console.warn('[storageService] Background migration to IndexedDB failed:', e));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[storageService] localStorage fallback read failed:', e);
  }

  return {};
}

/**
 * Сохраняет замороженные этапы в IndexedDB (и легкую копию в localStorage).
 * @param {Record<string, any>} stages
 * @returns {Promise<boolean>}
 */
export async function saveFrozenStages(stages) {
  let savedToIDB = false;

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(stages, STAGES_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    savedToIDB = true;
  } catch (err) {
    console.warn('[storageService] Failed to save to IndexedDB:', err);
  }

  // Также сохраняем легкую копию в localStorage на случай сбоев браузера
  try {
    const lightweight = {};
    Object.keys(stages).forEach(k => {
      const s = stages[k];
      lightweight[k] = {
        ...s,
        snapshot: {
          outputs: s.snapshot?.outputs || [],
          summary: s.snapshot?.summary || {}
        }
      };
    });
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(lightweight));
  } catch (e) {
    // Quota exceeded в localStorage допустим, так как основные данные уже в IndexedDB
  }

  return savedToIDB;
}

/**
 * Загружает статусы построенных станков (built nodes).
 * @returns {Promise<Record<string, Record<string, boolean>>>}
 */
export async function loadBuiltNodes() {
  try {
    const db = await openDB();
    const data = await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(BUILT_NODES_KEY);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    if (data && typeof data === 'object') {
      return data;
    }
  } catch (err) {
    console.warn('[storageService] IndexedDB read built nodes failed, trying localStorage fallback:', err);
  }

  try {
    const raw = localStorage.getItem(LEGACY_BUILT_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        saveBuiltNodes(parsed).catch(e => console.warn('[storageService] Background migration of built nodes failed:', e));
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[storageService] localStorage built nodes read failed:', e);
  }

  return {};
}

/**
 * Сохраняет статусы построенных станков в IndexedDB и localStorage.
 * @param {Record<string, Record<string, boolean>>>} builtNodes
 * @returns {Promise<boolean>}
 */
export async function saveBuiltNodes(builtNodes) {
  let savedToIDB = false;
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(builtNodes, BUILT_NODES_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    savedToIDB = true;
  } catch (err) {
    console.warn('[storageService] Failed to save built nodes to IndexedDB:', err);
  }

  try {
    localStorage.setItem(LEGACY_BUILT_STORAGE_KEY, JSON.stringify(builtNodes));
  } catch (e) {
    // Quota fallback
  }

  return savedToIDB;
}

/**
 * Экспортирует текущее состояние цехов и построенных станков в файл .json для скачивания.
 * @param {Record<string, any>} stages
 * @param {Record<string, Record<string, boolean>>>} builtNodes
 */
export function exportBackupJSON(stages, builtNodes = {}) {
  const payload = {
    app: 'FICSIT Factory Architect',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    stages,
    builtNodes
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  let blobUrl = null;
  let dataStr = null;

  if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    blobUrl = URL.createObjectURL(blob);
  } else {
    dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(jsonStr);
  }

  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', blobUrl || dataStr);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  downloadAnchor.setAttribute('download', `ficsit_factory_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => {
    if (downloadAnchor.parentNode) {
      document.body.removeChild(downloadAnchor);
    }
    if (blobUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
      URL.revokeObjectURL(blobUrl);
    }
  }, 400);
}

/**
 * Валидирует и очищает структуру данных резервной копии.
 * Защищает от Prototype Pollution и поврежденных данных.
 * @param {any} rawData
 * @returns {{ stages: Record<string, any>, builtNodes: Record<string, Record<string, boolean>> }}
 */
export function validateBackupData(rawData) {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw new Error('Файл резервной копии должен содержать JSON-объект');
  }

  // Защита от Prototype Pollution
  const sanitize = (val, depth = 0) => {
    if (depth > 15 || val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) return val.map(v => sanitize(v, depth + 1));
    const clean = {};
    for (const key of Object.keys(val)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      clean[key] = sanitize(val[key], depth + 1);
    }
    return clean;
  };

  const cleanData = sanitize(rawData);
  const rawStages = cleanData.stages || (cleanData && !cleanData.stages && !cleanData.builtNodes ? cleanData : {});
  const rawBuiltNodes = cleanData.builtNodes || {};

  if (!rawStages || typeof rawStages !== 'object' || Array.isArray(rawStages)) {
    throw new Error('Некорректная структура цехов (stages)');
  }

  // Валидируем stages
  const validatedStages = {};
  for (const [stageId, stage] of Object.entries(rawStages)) {
    if (typeof stageId !== 'string' || !stage || typeof stage !== 'object' || Array.isArray(stage)) {
      continue;
    }
    
    // Проверка targets если заданы
    const validTargets = [];
    if (Array.isArray(stage.targets)) {
      for (const t of stage.targets) {
        if (t && typeof t.itemId === 'string' && typeof t.rate === 'number' && !isNaN(t.rate) && t.rate >= 0) {
          validTargets.push({
            id: String(t.id || `target_${Date.now()}_${Math.random()}`),
            itemId: t.itemId,
            rate: t.rate,
            ...(t.recipeId ? { recipeId: String(t.recipeId) } : {})
          });
        }
      }
    }

    // Проверка inputsLimit если заданы
    const validInputs = [];
    if (Array.isArray(stage.inputsLimit)) {
      for (const inp of stage.inputsLimit) {
        if (inp && typeof inp.itemId === 'string' && typeof inp.rate === 'number' && !isNaN(inp.rate) && inp.rate >= 0) {
          validInputs.push({
            id: String(inp.id || `inp_${Date.now()}_${Math.random()}`),
            itemId: inp.itemId,
            rate: inp.rate
          });
        }
      }
    }

    // Проверка snapshot если задан
    let validSnapshot = undefined;
    if (stage.snapshot && typeof stage.snapshot === 'object') {
      validSnapshot = {
        nodes: Array.isArray(stage.snapshot.nodes) ? stage.snapshot.nodes : [],
        edges: Array.isArray(stage.snapshot.edges) ? stage.snapshot.edges : [],
        outputs: Array.isArray(stage.snapshot.outputs) ? stage.snapshot.outputs : [],
        summary: stage.snapshot.summary && typeof stage.snapshot.summary === 'object' ? stage.snapshot.summary : {}
      };
    }

    validatedStages[stageId] = {
      isFrozen: Boolean(stage.isFrozen),
      frozenAt: stage.frozenAt ? String(stage.frozenAt) : new Date().toISOString(),
      targets: validTargets,
      inputsLimit: validInputs,
      options: stage.options && typeof stage.options === 'object' ? stage.options : {},
      layoutDirection: ['LR', 'TB'].includes(stage.layoutDirection) ? stage.layoutDirection : 'LR',
      schematicMode: ['simple', 'realistic'].includes(stage.schematicMode) ? stage.schematicMode : 'simple',
      ...(validSnapshot ? { snapshot: validSnapshot } : {})
    };
  }

  // Валидируем builtNodes
  const validatedBuiltNodes = {};
  if (rawBuiltNodes && typeof rawBuiltNodes === 'object' && !Array.isArray(rawBuiltNodes)) {
    for (const [stageKey, nodeMap] of Object.entries(rawBuiltNodes)) {
      if (typeof stageKey !== 'string' || !nodeMap || typeof nodeMap !== 'object' || Array.isArray(nodeMap)) {
        continue;
      }
      const cleanMap = {};
      for (const [nodeId, isBuilt] of Object.entries(nodeMap)) {
        if (typeof nodeId === 'string' && typeof isBuilt === 'boolean') {
          cleanMap[nodeId] = isBuilt;
        }
      }
      validatedBuiltNodes[stageKey] = cleanMap;
    }
  }

  return {
    stages: validatedStages,
    builtNodes: validatedBuiltNodes
  };
}

/**
 * Импортирует и валидирует файл резервной копии .json.
 * @param {File} file
 * @returns {Promise<{ stages: Record<string, any>, builtNodes: Record<string, any> }>}
 */
export function importBackupJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Файл не выбран'));
    if (file.size && file.size > 50 * 1024 * 1024) {
      return reject(new Error('Файл превышает допустимый размер 50 МБ'));
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        const validated = validateBackupData(parsed);
        resolve(validated);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
