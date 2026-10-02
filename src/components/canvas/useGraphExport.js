import { useCallback } from 'react';
import { useReactFlow, getNodesBounds } from '@xyflow/react';
import { toSvg } from 'html-to-image';
import { BRAND } from '../../engine/exportUtils';

/**
 * Фильтр элементов DOM, которые не должны попасть в итоговый рендер SVG.
 */
function exportFilter(node) {
  if (node?.classList) {
    if (node.classList.contains('react-flow__controls'))        return false;
    if (node.classList.contains('react-flow__panel'))           return false;
    if (node.classList.contains('react-flow__attribution'))     return false;
    if (node.classList.contains('export-exclude'))              return false;
  }
  return true;
}

/**
 * useGraphExport
 * ЕДИНСТВЕННЫЙ бескомпромиссный вариант сохранения чертежа: 
 * Экспорт в векторный SVG (Vector Blueprint) с бесконечным зумом.
 *
 * @param {React.RefObject<HTMLElement>} containerRef — ref на div-контейнер ReactFlow
 * @returns {{ exportSvgBlueprint }}
 */
export function useGraphExport(containerRef) {
  const { getNodes } = useReactFlow();

  const exportSvgBlueprint = useCallback(async () => {
    const el = containerRef?.current;
    if (!el) throw new Error('useGraphExport: containerRef is not attached');

    const nodes = getNodes();
    if (!nodes || nodes.length === 0) {
      throw new Error('useGraphExport: no nodes to export');
    }

    // 1. Получаем точные габариты всех станков
    const bounds = getNodesBounds(nodes);
    const padding = 80; // Инженерный отступ по краям чертежа
    const width = bounds.width + padding * 2;
    const height = bounds.height + padding * 2;

    const viewportEl = el.querySelector('.react-flow__viewport');
    if (!viewportEl) throw new Error('useGraphExport: .react-flow__viewport not found');

    // 2. Генерируем SVG в чистом масштабе 1:1, сдвинув начало координат
    const dataUrl = await toSvg(viewportEl, {
      backgroundColor: BRAND.BG_DARK,
      width: width,
      height: height,
      style: {
        width: `${width}px`,
        height: `${height}px`,
        transform: `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`,
      },
      filter: exportFilter,
    });

    return dataUrl;
  }, [containerRef, getNodes]);

  return { exportSvgBlueprint };
}
