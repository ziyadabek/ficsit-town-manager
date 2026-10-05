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
 * Экспортирует текущее состояние цехов в файл .json для скачивания пользователем.
 * @param {Record<string, any>} stages
 */
export function exportBackupJSON(stages) {
  const payload = {
    app: 'FICSIT Factory Architect',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    stages
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  downloadAnchor.setAttribute('download', `ficsit_factory_backup_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => document.body.removeChild(downloadAnchor), 300);
}

/**
 * Импортирует и валидирует файл резервной копии .json.
 * @param {File} file
 * @returns {Promise<Record<string, any>>}
 */
export function importBackupJSON(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected'));

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const parsed = JSON.parse(text);
        const stages = parsed.stages || parsed;
        if (typeof stages !== 'object' || stages === null) {
          throw new Error('Некорректный формат файла сохранения');
        }
        resolve(stages);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
