/**
 * exportUtils.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Набор утилит для экспорта UI в PNG высокого разрешения.
 *
 * Использует:
 *  - html-to-image  (toPng / toSvg)
 *  - Canvas2D API   (брендированная карточка FICSIT)
 *
 * Все публичные функции возвращают Promise<string> (dataURL) или void.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { toPng } from 'html-to-image';

// ─── FICSIT Brand Constants ───────────────────────────────────────────────────
export const BRAND = {
  BG_DARK:    '#0b0d10',
  BG_PANEL:   '#14171d',
  BORDER:     '#2a2e39',
  ACCENT:     '#f97316',
  TEXT_MAIN:  '#e1e1e6',
  TEXT_GRAY:  '#6b7280',
  GREEN:      '#22c55e',
  RED:        '#ef4444',
  BLUE:       '#3b82f6',
  PURPLE:     '#a855f7',
};

// ─── Default html-to-image options ───────────────────────────────────────────
const DEFAULT_CAPTURE_OPTIONS = {
  backgroundColor: BRAND.BG_DARK,
  pixelRatio: 3,                  // 3x → стандартный HD; 4x → 4K Ultra-HD
  cacheBust: true,                // предотвращает CORS-кэш браузера
  useCORS: true,
  // Фильтрация: убираем элементы UI-управления из снимка
  filter: (node) => {
    if (node?.classList) {
      // Скрываем кнопки управления ReactFlow и кнопку экспорта
      if (node.classList.contains('react-flow__controls'))   return false;
      if (node.classList.contains('react-flow__panel'))      return false;
      if (node.classList.contains('export-exclude'))         return false;
    }
    return true;
  },
};

// ─── generateFilename ─────────────────────────────────────────────────────────
/**
 * Генерирует имя файла с текущей датой.
 * @param {string} prefix  — например 'FICSIT_Factory_Graph'
 * @param {string} [tag]   — например 'Computer_x10'
 * @param {string} [ext]   — расширение без точки, по умолчанию 'png'
 * @returns {string}
 */
export function generateFilename(prefix, tag = '', ext = 'png') {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, '0');
  const dd   = String(now.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  const tagPart = tag ? `_${tag.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '')}` : '';
  return `${prefix}${tagPart}_${dateStr}.${ext}`;
}

// ─── downloadDataUrl ──────────────────────────────────────────────────────────
/**
 * Вызывает скачивание файла через синтетический клик по <a>.
 * @param {string} dataUrl   — base64 data URL
 * @param {string} filename  — имя файла для сохранения
 */
export function downloadDataUrl(dataUrl, filename) {
  const a = document.createElement('a');
  a.href     = filename.endsWith('.svg')
    ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dataUrl)
    : dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  // Небольшая задержка перед удалением, чтобы браузер успел обработать клик
  setTimeout(() => document.body.removeChild(a), 500);
}

// ─── captureElement ───────────────────────────────────────────────────────────
/**
 * Захватывает DOM-элемент в PNG.
 * @param {HTMLElement} element
 * @param {object}      [overrides]  — переопределяет DEFAULT_CAPTURE_OPTIONS
 * @returns {Promise<string>}        — dataURL png
 */
export async function captureElement(element, overrides = {}) {
  if (!element) throw new Error('captureElement: element is null');

  const options = {
    ...DEFAULT_CAPTURE_OPTIONS,
    ...overrides,
  };

  // html-to-image может упасть на первом вызове из-за CORS-кэша иконок.
  // Делаем до 2 попыток.
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const dataUrl = await toPng(element, options);
      return dataUrl;
    } catch (err) {
      lastError = err;
      console.warn(`[exportUtils] captureElement attempt ${attempt} failed:`, err);
      // При повторной попытке сбрасываем кэш
      options.cacheBust = true;
      await new Promise(r => setTimeout(r, 300));
    }
  }
  throw lastError;
}

// ─── captureFullScrollContent ─────────────────────────────────────────────────
/**
 * Захватывает DOM-элемент целиком, включая скрытый по скроллу контент.
 * Временно раскрывает overflow, делает снимок, возвращает обратно.
 *
 * @param {HTMLElement} element        — контейнер таблицы / списка
 * @param {object}      [overrides]    — доп. опции для html-to-image
 * @returns {Promise<string>}          — dataURL
 */
export async function captureFullScrollContent(element, overrides = {}) {
  if (!element) throw new Error('captureFullScrollContent: element is null');

  // Сохраняем оригинальные стили
  const origOverflow    = element.style.overflow;
  const origMaxHeight   = element.style.maxHeight;
  const origHeight      = element.style.height;

  // Раскрываем полный контент
  element.style.overflow  = 'visible';
  element.style.maxHeight = 'none';
  element.style.height    = 'auto';

  // Даём браузеру перерисоваться
  await new Promise(r => requestAnimationFrame(r));
  await new Promise(r => requestAnimationFrame(r));

  const fullHeight = element.scrollHeight;
  const fullWidth  = element.scrollWidth;

  try {
    const dataUrl = await captureElement(element, {
      width:  fullWidth,
      height: fullHeight,
      ...overrides,
    });
    return dataUrl;
  } finally {
    // Восстанавливаем стили в любом случае
    element.style.overflow  = origOverflow;
    element.style.maxHeight = origMaxHeight;
    element.style.height    = origHeight;
  }
}

// ─── buildSpecCard ────────────────────────────────────────────────────────────
/**
 * Строит брендированную карточку спецификации поверх уже захваченного dataUrl.
 * Добавляет:
 *   • верхнюю шапку с логотипом FICSIT, названием комплекса, датой
 *   • строку энергобаланса (генерация / потребление / профицит)
 *   • нижний штамп «FICSIT Inc. — Certified Production Spec»
 *
 * @param {string} contentDataUrl    — PNG dataURL захваченной таблицы
 * @param {object} meta
 * @param {string} meta.complexName  — название комплекса / пресета
 * @param {number} [meta.totalPower] — потребление МВт (null → не показываем)
 * @param {string} [meta.tab]        — текущая вкладка ('items'|'buildings'|'logistics'|'network')
 * @returns {Promise<string>}        — новый dataURL с карточкой
 */
export async function buildSpecCard(contentDataUrl, meta = {}) {
  const {
    complexName = 'Factory Complex',
    totalPower  = null,
    tab         = 'items',
  } = meta;

  // Загружаем оригинальное изображение
  const img = await new Promise((resolve, reject) => {
    const i  = new Image();
    i.onload  = () => resolve(i);
    i.onerror = reject;
    i.src     = contentDataUrl;
  });

  const HEADER_H = 80;   // высота шапки
  const FOOTER_H = 40;   // высота подвала
  const PADDING  = 24;
  const canvasW  = Math.max(img.width, 800);
  const canvasH  = img.height + HEADER_H + FOOTER_H;

  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  // ── Фон ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = BRAND.BG_DARK;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── Шапка ─────────────────────────────────────────────────────────────────
  // Фон шапки
  ctx.fillStyle = BRAND.BG_PANEL;
  ctx.fillRect(0, 0, canvasW, HEADER_H);

  // Нижняя линия шапки
  ctx.strokeStyle = BRAND.ACCENT;
  ctx.lineWidth   = 2;
  ctx.beginPath();
  ctx.moveTo(0, HEADER_H);
  ctx.lineTo(canvasW, HEADER_H);
  ctx.stroke();

  // Логотип FICSIT — оранжевый прямоугольник с буквой F
  const logoX = PADDING;
  const logoY = (HEADER_H - 40) / 2;
  ctx.fillStyle = BRAND.ACCENT;
  ctx.beginPath();
  ctx.roundRect(logoX, logoY, 40, 40, 4);
  ctx.fill();
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('F', logoX + 20, logoY + 20);

  // Название FICSIT
  ctx.fillStyle  = BRAND.ACCENT;
  ctx.font       = 'bold 14px sans-serif';
  ctx.textAlign  = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('FICSIT Inc.', logoX + 52, logoY + 2);

  // Subtitle
  ctx.fillStyle = BRAND.TEXT_GRAY;
  ctx.font      = '11px sans-serif';
  ctx.fillText('Production Architect v2.0', logoX + 52, logoY + 20);

  // Название комплекса — центр
  ctx.fillStyle    = BRAND.TEXT_MAIN;
  ctx.font         = 'bold 20px sans-serif';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(complexName, canvasW / 2, HEADER_H / 2);

  // Дата + вкладка — правый угол
  const now     = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const tabLabel = {
    items: 'Баланс предметов',
    buildings: 'Здания и энергия',
    logistics: 'Логистика и конвейеры',
    network: 'Граф сети',
    tree: 'Древовидный список',
  }[tab] || tab;

  ctx.fillStyle    = BRAND.TEXT_GRAY;
  ctx.font         = '11px monospace';
  ctx.textAlign    = 'right';
  ctx.textBaseline = 'top';
  ctx.fillText(dateStr, canvasW - PADDING, logoY + 2);
  ctx.fillStyle = BRAND.ACCENT;
  ctx.fillText(`[${tabLabel}]`, canvasW - PADDING, logoY + 18);

  // Энергобаланс под датой (если есть)
  if (totalPower !== null) {
    ctx.fillStyle    = BRAND.PURPLE;
    ctx.font         = 'bold 12px monospace';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`⚡ ${totalPower.toFixed(1)} MW`, canvasW - PADDING, HEADER_H - 10);
  }

  // ── Контент таблицы ───────────────────────────────────────────────────────
  // Масштабируем изображение в доступную ширину
  const imgDrawW = canvasW;
  const imgDrawH = (img.height / img.width) * canvasW;
  ctx.drawImage(img, 0, HEADER_H, imgDrawW, imgDrawH);

  // ── Подвал ────────────────────────────────────────────────────────────────
  const footerY = canvasH - FOOTER_H;

  ctx.fillStyle = BRAND.BG_PANEL;
  ctx.fillRect(0, footerY, canvasW, FOOTER_H);

  // Верхняя линия подвала
  ctx.strokeStyle = BRAND.BORDER;
  ctx.lineWidth   = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(canvasW, footerY);
  ctx.stroke();

  // Штамп
  ctx.fillStyle    = BRAND.TEXT_GRAY;
  ctx.font         = '11px monospace';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'FICSIT Inc. — Certified Production Specification  |  Generated by FICSIT Architect',
    canvasW / 2,
    footerY + FOOTER_H / 2,
  );

  return canvas.toDataURL('image/png');
}
