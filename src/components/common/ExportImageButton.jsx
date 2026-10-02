/**
 * ExportImageButton.jsx
 * ════════════════════════════════════════════════════════════════════════════════
 * Векторный экспорт (SVG) чертежа фабрики.
 * ════════════════════════════════════════════════════════════════════════════════
 */

import React, { useState, useCallback } from 'react';
import { generateFilename } from '../../engine/exportUtils';

function IconPenTool({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/>
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/>
      <circle cx="11" cy="11" r="2"/>
    </svg>
  );
}

function IconLoader({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className="animate-spin">
      <line x1="12" y1="2"  x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93"  x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2"  y1="12" x2="6"  y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
      <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  );
}

export default function ExportImageButton({
  activeTab      = 'network',
  graphCanvasRef = null,
  complexName    = 'Factory Complex',
  disabled       = false,
}) {
  const [status,  setStatus]  = useState(null); // null | 'loading' | 'done' | 'error'
  const [message, setMessage] = useState('');

  const startLoading = useCallback((msg) => {
    setStatus('loading');
    setMessage(msg);
  }, []);

  const finishOk = useCallback(() => {
    setStatus('done');
    setMessage('Сохранено!');
    setTimeout(() => setStatus(null), 2500);
  }, []);

  const finishError = useCallback((err) => {
    console.error('[ExportImageButton]', err);
    setStatus('error');
    setMessage('Ошибка экспорта');
    setTimeout(() => setStatus(null), 3000);
  }, []);

  function makeTag() {
    return complexName
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, '')
      .trim()
      .replace(/\s+/g, '_')
      .slice(0, 40);
  }

  const handleExportSvg = useCallback(async () => {
    // Экспорт чертежа доступен только на вкладке графа
    if (activeTab !== 'network') {
       // Если пользователь не на вкладке 'network', кнопка вообще скрыта (см. ниже условие),
       // но добавим защиту
       return;
    }
    
    startLoading('Генерация вектора (SVG)...');
    try {
      const exportFn = graphCanvasRef?.current?.__exportSvgBlueprint;
      if (typeof exportFn !== 'function') {
        throw new Error('Функция __exportSvgBlueprint не найдена на graphCanvasRef');
      }
      
      const dataUrl = await exportFn();
      const filename = generateFilename('FICSIT_Vector_Blueprint', makeTag(), 'svg');
      
      // Скачивание SVG
      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();
      
      finishOk();
    } catch (err) {
      finishError(err);
    }
  }, [activeTab, graphCanvasRef, complexName, startLoading, finishOk, finishError]);

  const isLoading  = status === 'loading';
  const isDisabled = disabled || isLoading;

  // Если не на вкладке сети, кнопку можно скрыть или задизейблить,
  // так как экспорт только чертежа
  if (activeTab !== 'network') {
     return null; 
  }

  return (
    <div className="relative export-exclude group">
      <button
        onClick={() => !isDisabled && handleExportSvg()}
        disabled={isDisabled}
        title="Векторный формат без потери качества при любом приближении"
        className={[
          'flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium',
          'border transition-all duration-150 select-none',
          isDisabled
            ? 'bg-[#0b0d10] border-[#1e2028] text-gray-600 cursor-not-allowed'
            : 'bg-[#14171d] border-[#2a2e39] text-[#e1e1e6] hover:border-[#f97316] hover:text-[#f97316] cursor-pointer',
        ].join(' ')}
      >
        {isLoading ? (
          <>
            <IconLoader size={15} />
            <span className="hidden sm:inline text-xs text-gray-400 max-w-[180px] truncate">
              {message}
            </span>
          </>
        ) : (
          <>
            <IconPenTool size={15} />
            <span className="hidden sm:inline">Экспорт чертежа</span>
          </>
        )}
      </button>

      {/* Всплывающая подсказка (Tooltip) */}
      <div className="absolute right-0 top-full mt-2 hidden group-hover:block w-48 bg-[#0b0d10] border border-[#2a2e39] text-xs text-gray-400 p-2 rounded shadow-xl z-50 pointer-events-none">
        Векторный формат без потери качества при любом приближении.
      </div>

      {(status === 'done' || status === 'error') && (
        <div
          className={[
            'absolute right-0 top-full mt-1 px-3 py-1 rounded text-xs font-bold whitespace-nowrap z-50',
            status === 'done'
              ? 'bg-[#22c55e]/20 border border-[#22c55e] text-[#22c55e]'
              : 'bg-[#ef4444]/20 border border-[#ef4444] text-[#ef4444]',
          ].join(' ')}
        >
          {message}
        </div>
      )}
    </div>
  );
}
