/**
 * MainView.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Основной левый панель приложения: таб-бар + контент вкладок.
 *
 * Изменения:
 *  - Добавлен graphCanvasRef → передаётся в <GraphCanvas ref={graphCanvasRef} />
 *  - Добавлен tableContainerRef → указывает на div с таблицей для захвата
 *  - В конце таб-бара (справа) размещён <ExportImageButton />
 *  - complexName выводится из targets (первый target item).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useRef } from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import GraphCanvas from './GraphCanvas';
import TreeView from './TreeView';
import ExportImageButton from '../common/ExportImageButton';
import itemsDB from '../../database/items.json';
import { getAssetUrl } from '../../database/assets';


// ─── ItemsTable ────────────────────────────────────────────────────────────────
function ItemsTable({ summary, tableRef }) {
  if (!summary || !summary.items)
    return <div className="p-4 sm:p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-3 sm:p-6 lg:p-8 overflow-auto h-full min-w-0">
      <table className="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-[#2a2e39] text-gray-400">
            <th className="p-2">Предмет</th>
            <th className="p-2">Производство / мин</th>
            <th className="p-2">Потребление / мин</th>
            <th className="p-2">Логистический маршрут</th>
            <th className="p-2">Баланс</th>
          </tr>
        </thead>
        <tbody>
          {summary.items.map(item => {
            const dbItem  = itemsDB[item.id];
            const balance = item.produced - item.consumed;
            let color     = 'text-gray-300';
            if (balance >  0.001) color = 'text-[#22c55e]';
            if (balance < -0.001) color = 'text-[#ef4444]';

            const inputRef = summary.effectiveInputs?.find(limit => limit.itemId === item.id);
            const isImported = !!inputRef;
            const isTransit = inputRef?.isTransit;
            
            let routeLabel = <span className="text-gray-400">[Локальное производство]</span>;
            if (isTransit) {
              let transInfo = "";
              if (inputRef.transport) {
                 if (inputRef.transport.type === 'tractor') {
                   transInfo = `🚜 Трактор (25 слотов) — ${inputRef.transport.vehicleCount} маш. [${inputRef.transport.tripsPerMinute.toFixed(1)} рейсов/мин]`;
                 } else if (inputRef.transport.type === 'train_fluid') {
                   transInfo = `🛢️ Ж/Д Состав: ${inputRef.transport.vehicleCount} цистерн (1600 м³)`;
                 } else if (inputRef.transport.type === 'train_nuclear') {
                   transInfo = `☢️ Ядерный экспресс: ${inputRef.transport.vehicleCount} вагон (Радиационная изоляция)`;
                 }
              }
              routeLabel = (
                <div className="flex flex-col">
                  <span className="text-[#3b82f6] font-bold">[Транзит: {inputRef.sourceStageName}]</span>
                  {transInfo && <span className="text-xs text-gray-400 mt-1">{transInfo}</span>}
                </div>
              );
            } else if (isImported) {
              routeLabel = <span className="text-[#a855f7] font-bold">[Внешний импорт (Static)]</span>;
            }

            return (
              <tr key={item.id} className="border-b border-[#2a2e39] hover:bg-[#14171d]">
                <td className="p-2 flex items-center gap-2">
                  {dbItem && <img src={getAssetUrl(dbItem.icon)} alt={dbItem.name} className="w-6 h-6" />}
                  <span>{dbItem?.name || item.id}</span>
                </td>
                <td className="p-2 text-[#f97316]">{item.produced.toFixed(2)}</td>
                <td className="p-2 text-[#0284c7]">{item.consumed.toFixed(2)}</td>
                <td className="p-2 text-sm">{routeLabel}</td>
                <td className={`p-2 font-bold ${color}`}>{balance.toFixed(2)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── LogisticsTable ────────────────────────────────────────────────────────────
function LogisticsTable({ summary, tableRef }) {
  if (!summary || !summary.items)
    return <div className="p-4 sm:p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-3 sm:p-6 lg:p-8 overflow-auto h-full min-w-0">
      <table className="w-full text-left border-collapse min-w-[620px]">
        <thead>
          <tr className="border-b border-[#2a2e39] text-gray-400">
            <th className="p-2">Предмет</th>
            <th className="p-2">Макс. поток / мин</th>
            <th className="p-2">Логистический маршрут</th>
            <th className="p-2">Рекомендуемый конвейер / труба</th>
          </tr>
        </thead>
        <tbody>
          {summary.items.map(item => {
            const dbItem  = itemsDB[item.id];
            const maxFlow = Math.max(item.produced, item.consumed);
            if (maxFlow <= 0.001) return null;

            let isFluid    = dbItem?.type === 'fluid';
            let recIcon    = '';
            let recText    = '';
            let alertColor = 'text-gray-300';

            if (isFluid) {
              if (maxFlow <= 300) {
                recIcon = '/icons/Conveyor Supports/Pipes.png';
                recText = 'Труба Mk.1 (300)';
              } else if (maxFlow <= 600) {
                recIcon = '/icons/Conveyor Supports/PipeMK2.png';
                recText = 'Труба Mk.2 (600)';
                alertColor = 'text-yellow-500';
              } else {
                recIcon = '/icons/Conveyor Supports/PipeMK2.png';
                recText = `Несколько труб! (${Math.ceil(maxFlow / 600)}x Mk.2)`;
                alertColor = 'text-red-400 font-bold';
              }
            } else {
              if (maxFlow <= 60) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk1.png';
                recText = 'Конвейер Mk.1 (60)';
              } else if (maxFlow <= 120) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk2.png';
                recText = 'Конвейер Mk.2 (120)';
              } else if (maxFlow <= 270) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk3.png';
                recText = 'Конвейер Mk.3 (270)';
              } else if (maxFlow <= 480) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk4.png';
                recText = 'Конвейер Mk.4 (480)';
              } else if (maxFlow <= 780) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk5.png';
                recText = 'Конвейер Mk.5 (780)';
                alertColor = 'text-yellow-500';
              } else if (maxFlow <= 1200) {
                recIcon = '/icons/Conveyor Supports/ConveyorMk6.png';
                recText = 'Конвейер Mk.6 (1200)';
                alertColor = 'text-orange-500 font-bold';
              } else {
                recIcon = '/icons/Conveyor Supports/ProgrammableSplitter.png';
                recText = `Несколько конвейеров! (${Math.ceil(maxFlow / 1200)}x Mk.6)`;
                alertColor = 'text-red-400 font-bold';
              }
            }

            const inputRef = summary.effectiveInputs?.find(limit => limit.itemId === item.id);
            const isImported = !!inputRef;
            const isTransit = inputRef?.isTransit;
            
            let routeLabel = <span className="text-gray-400">[Локальное производство]</span>;
            if (isTransit) {
              let transInfo = "";
              if (inputRef.transport) {
                 if (inputRef.transport.type === 'tractor') {
                   transInfo = `🚜 Трактор (25 слотов) — ${inputRef.transport.vehicleCount} маш. [${inputRef.transport.tripsPerMinute.toFixed(1)} рейсов/мин]`;
                 } else if (inputRef.transport.type === 'train_fluid') {
                   transInfo = `🛢️ Ж/Д Состав: ${inputRef.transport.vehicleCount} цистерн (1600 м³)`;
                 } else if (inputRef.transport.type === 'train_nuclear') {
                   transInfo = `☢️ Ядерный экспресс: ${inputRef.transport.vehicleCount} вагон (Радиационная изоляция)`;
                 }
              }
              routeLabel = (
                <div className="flex flex-col">
                  <span className="text-[#3b82f6] font-bold">[Транзит: {inputRef.sourceStageName}]</span>
                  {transInfo && <span className="text-xs text-gray-400 mt-1">{transInfo}</span>}
                </div>
              );
            } else if (isImported) {
              routeLabel = <span className="text-[#a855f7] font-bold">[Внешний импорт (Static)]</span>;
            }

            return (
              <tr key={item.id} className="border-b border-[#2a2e39] hover:bg-[#14171d]">
                <td className="p-2 flex items-center gap-2">
                  {dbItem && <img src={getAssetUrl(dbItem.icon)} alt={dbItem.name} className="w-6 h-6" />}
                  <span className="flex items-center gap-2">
                    {dbItem?.name || item.id}
                  </span>
                </td>
                <td className="p-2 font-bold text-[#e1e1e6]">{maxFlow.toFixed(2)}</td>
                <td className="p-2 text-sm">{routeLabel}</td>
                <td className={`p-2 flex items-center gap-2 ${alertColor}`}>
                  <img
                    src={getAssetUrl(recIcon)}
                    alt={recText}
                    className="w-8 h-8 object-contain"
                    onError={e => (e.target.style.display = 'none')}
                  />
                  <span>{recText}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── BuildingsTable ────────────────────────────────────────────────────────────
function BuildingsTable({ summary, tableRef }) {
  if (!summary || !summary.buildings)
    return <div className="p-4 sm:p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-3 sm:p-6 lg:p-8 overflow-auto h-full min-w-0">
      <div className="mb-4 sm:mb-6 text-lg sm:text-xl font-bold text-[#a855f7]">
        Суммарная энергия: {summary.totalPower.toFixed(2)} МВт
      </div>
      <table className="w-full text-left border-collapse min-w-[480px]">
        <thead>
          <tr className="border-b border-[#2a2e39] text-gray-400">
            <th className="p-2">Здание</th>
            <th className="p-2">Количество</th>
            <th className="p-2">Энергия (МВт)</th>
          </tr>
        </thead>
        <tbody>
          {summary.buildings.map(b => (
            <tr key={b.id} className="border-b border-[#2a2e39] hover:bg-[#14171d]">
              <td className="p-2 flex items-center gap-2">
                {b.icon && <img src={getAssetUrl(b.icon)} alt={b.name} className="w-6 h-6" />}
                <span>{b.name || b.id}</span>
              </td>
              <td className="p-2">{b.count.toFixed(2)}</td>
              <td className="p-2 text-[#a855f7]">{b.power.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── MainView ──────────────────────────────────────────────────────────────────
export default function MainView() {
  const activeTab = useFactoryStore(s => s.activeTab);
  const setActiveTab = useFactoryStore(s => s.setActiveTab);
  const summary = useFactoryStore(s => s.summary);
  const targets = useFactoryStore(s => s.targets);
  const activePresetId = useFactoryStore(s => s.activePresetId);
  const frozenStages = useFactoryStore(s => s.frozenStages);
  const freezeCurrentStage = useFactoryStore(s => s.freezeCurrentStage);
  const unfreezeStage = useFactoryStore(s => s.unfreezeStage);
  const addTarget = useFactoryStore(s => s.addTarget);
  const nodes = useFactoryStore(s => s.nodes);
  const builtNodes = useFactoryStore(s => s.builtNodes);
  const markAllNodesBuilt = useFactoryStore(s => s.markAllNodesBuilt);
  const resetBuiltNodes = useFactoryStore(s => s.resetBuiltNodes);
  const isRightPanelOpen = useFactoryStore(s => s.isRightPanelOpen);
  const toggleRightPanel = useFactoryStore(s => s.toggleRightPanel);

  const stageKey = activePresetId || 'free_mode';
  const stageBuilt = builtNodes?.[stageKey] || {};
  const machineNodes = (nodes || []).filter(n => ['machine', 'physicalMachine'].includes(n.type) || n.data?.isInput || n.data?.buildingId);
  const totalCount = machineNodes.length;
  const builtCount = machineNodes.filter(n => stageBuilt[n.id]).length;
  const isAllBuilt = totalCount > 0 && builtCount === totalCount;

  const isStageFrozen = !!(activePresetId && frozenStages[activePresetId]?.isFrozen);

  // Ref на GraphCanvas компонент (для вызова __exportCurrentView / __exportFullGraph)
  const graphCanvasRef = useRef(null);

  // Ref на контейнер активной таблицы (для захвата полного scroll-контента)
  const tableRef = useRef(null);

  // Название комплекса — берём из первого target
  const firstTarget   = targets?.[0];
  const firstItem     = firstTarget ? itemsDB[firstTarget.itemId] : null;
  const complexName   = firstItem
    ? `${firstItem.name} ×${firstTarget.rate}`
    : 'Фабрика FICSIT';

  // Суммарная мощность из summary (для брендированной карточки)
  const totalPower = summary?.totalPower ?? null;

  // ── Tab button helper ──────────────────────────────────────────────────────
  const TabBtn = ({ id, label, accent = false }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={[
        'px-2.5 sm:px-3 py-1.5 rounded text-xs sm:text-sm whitespace-nowrap transition-colors duration-100 shrink-0 cursor-pointer',
        activeTab === id
          ? accent
            ? 'bg-[#2a2e39] text-[#f97316] font-bold shadow-xs'
            : 'bg-[#2a2e39] text-white font-medium shadow-xs'
          : 'text-gray-400 hover:text-gray-200 hover:bg-[#1a1e27]',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 min-w-0 min-h-0 flex flex-col h-full bg-[#0b0d10] relative">

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-1 sm:gap-2 bg-[#14171d] border-b border-[#2a2e39] px-2 py-1.5 sm:py-2 z-10 shrink-0 min-w-0">

        {/* Вкладки слева (горизонтальный скролл без деформации кнопок) */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 shrink min-w-0 pr-1">
          <TabBtn id="network"   label="Граф сети" />
          <TabBtn id="tree"      label="Древовидный список" />
          <TabBtn id="items"     label="Предметы" />
          <TabBtn id="buildings" label="Здания" />
          <TabBtn id="logistics" label="Логистика" accent />
        </div>

        {/* Правая часть: сегментная группа построек + экспорт + переключатель правой панели */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-auto">
          {/* Объединенный сегментный блок управления постройками */}
          {(totalCount > 0 || activePresetId) && (
            <div className="flex items-center h-6 sm:h-7 rounded-md border border-[#2a2e39] bg-[#101318] overflow-hidden shadow-sm select-none">
              {/* 1. Левая часть: Индикатор прогресса со светодиодом */}
              {totalCount > 0 && (
                <div
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 h-full bg-[#14171e] border-r border-[#2a2e39] font-mono text-[11px] sm:text-xs"
                  title="Количество построенных станков на текущем этапе"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full transition-colors ${
                      isAllBuilt
                        ? 'bg-[#22c55e] shadow-[0_0_6px_rgba(34,197,94,0.8)]'
                        : builtCount > 0
                        ? 'bg-[#eab308] shadow-[0_0_6px_rgba(234,179,8,0.7)]'
                        : 'bg-gray-600'
                    }`}
                  />
                  <span className="text-gray-400 font-sans text-[10px] sm:text-[11px] hidden sm:inline">Станки:</span>
                  <span className={`font-bold ${builtCount > 0 ? (isAllBuilt ? 'text-[#22c55e]' : 'text-yellow-400') : 'text-gray-400'}`}>
                    {builtCount}/{totalCount}
                  </span>
                </div>
              )}

              {/* 2. Средняя часть: Быстрое действие с чеклистом (Все / Сбросить) */}
              {totalCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (isAllBuilt) {
                      resetBuiltNodes(stageKey);
                    } else {
                      markAllNodesBuilt(stageKey);
                    }
                  }}
                  title={isAllBuilt ? "Снять отметки постройки со всех станков" : "Отметить все станки как построенные"}
                  className={`flex items-center gap-1 px-2 sm:px-2.5 h-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer border-r border-[#2a2e39] ${
                    isAllBuilt
                      ? 'text-gray-400 hover:text-red-400 hover:bg-[#1f242e]'
                      : 'text-gray-300 hover:text-white hover:bg-[#1c212b]'
                  }`}
                >
                  {isAllBuilt ? (
                    <>
                      <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="hidden md:inline">Сбросить</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="hidden md:inline">Все</span>
                    </>
                  )}
                </button>
              )}

              {/* 3. Правая часть: Главный статус фиксации этапа */}
              {activePresetId && (
                isStageFrozen ? (
                  <button
                    type="button"
                    onClick={() => unfreezeStage(activePresetId)}
                    title="Завод зафиксирован в памяти. Нажмите, чтобы разморозить для внесения правок."
                    className="flex items-center gap-1 px-2 sm:px-3 h-full text-[11px] sm:text-xs font-bold bg-[#14261c] hover:bg-[#1a3826] text-[#22c55e] transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden sm:inline">ЗАКРЕПЛЕН</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!summary || targets.length === 0}
                    onClick={() => {
                      markAllNodesBuilt(stageKey);
                      freezeCurrentStage();
                    }}
                    title="Зафиксировать постройку завода. Сохранит схему в памяти и включит гарантию питания для следующих этапов."
                    className={`flex items-center gap-1 px-2 sm:px-3 h-full text-[11px] sm:text-xs font-bold transition-colors ${
                      !summary || targets.length === 0
                        ? 'opacity-40 cursor-not-allowed text-gray-500 bg-[#12151b]'
                        : 'bg-[#181d26] hover:bg-[#222834] text-[#f97316] hover:text-[#fb923c] cursor-pointer'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Закрепить</span>
                  </button>
                )
              )}
            </div>
          )}

          {/* Кнопка экспорта */}
          <div className="shrink-0">
            <ExportImageButton
              activeTab={activeTab}
              graphCanvasRef={graphCanvasRef}
              complexName={complexName}
              totalPower={totalPower}
              disabled={!summary}
            />
          </div>

          {/* Переключатель правой боковой панели */}
          <button
            type="button"
            onClick={toggleRightPanel}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 h-6 sm:h-7 rounded text-[11px] sm:text-xs font-bold transition-all cursor-pointer border ${
              isRightPanelOpen
                ? 'bg-[#1e232e] text-[#f97316] border-[#f97316]/50 shadow-xs'
                : 'bg-[#181d26] text-gray-200 border-[#2a2e39] hover:bg-[#222834] hover:text-[#f97316]'
            }`}
            title={isRightPanelOpen ? "Скрыть панель параметров" : "Открыть панель параметров и производства"}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden lg:inline">
              {isRightPanelOpen ? 'Скрыть панель' : 'Панель'}
            </span>
            {targets.length > 0 && !isRightPanelOpen && (
              <span className="bg-[#f97316] text-black text-[9px] font-black px-1 rounded-full leading-none">
                {targets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Контент ─────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 min-h-0 relative">
        {/* Плавающая кнопка быстрого открытия панели, если панель скрыта */}
        {!isRightPanelOpen && (
          <button
            type="button"
            onClick={toggleRightPanel}
            className="absolute right-3 top-3 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-[#14171d]/90 hover:bg-[#1f242e] border border-[#f97316]/60 text-white rounded-md shadow-xl backdrop-blur-xs cursor-pointer transition-transform hover:scale-105"
            title="Открыть панель параметров и производства"
          >
            <span className="w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
            <span className="text-xs font-bold text-[#f97316]">Цели и настройки</span>
            {targets.length > 0 && (
              <span className="bg-[#f97316] text-black text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {targets.length}
              </span>
            )}
          </button>
        )}
        {targets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0b0d10] text-gray-400">
            <span className="text-4xl mb-4">➕</span>
            <h2 className="text-xl font-bold text-[#e1e1e6]">{activePresetId ? 'Цех пуст' : 'Свободный режим'}</h2>
            <p className="mt-2 text-center max-w-md">
              Ваш список производства пуст. {activePresetId ? 'Переключитесь на другой этап кампании или добавьте целевой продукт.' : 'Нажмите кнопку + ДОБАВИТЬ ПРОДУКТ на панели справа, чтобы начать проектирование фабрики.'}
            </p>
            {!activePresetId && (
              <button
                onClick={() => addTarget()}
                className="mt-5 px-5 py-2.5 bg-[#f97316] text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-[#fa9549] transition-all shadow-lg hover:shadow-orange-500/20 cursor-pointer flex items-center gap-2"
              >
                <span>+ ДОБАВИТЬ ПРОДУКТ</span>
              </button>
            )}
          </div>
        ) : !summary ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0b0d10] text-[#ef4444]">
            <span className="text-4xl mb-4">⚠️</span>
            <h2 className="text-xl font-bold">Невозможно построить маршрут</h2>
            <p className="text-gray-400 mt-2 max-w-lg text-center">
              Движок не смог найти решение (Infeasible). Скорее всего, заданные лимиты
              входов (Inputs) слишком малы, чтобы произвести требуемое количество
              целевой продукции (Outputs).
            </p>
          </div>
        ) : (
          <>
            {/* Network Graph — ref прокидывается в GraphCanvas */}
            {activeTab === 'network' && (
              <GraphCanvas ref={graphCanvasRef} />
            )}

            {/* Tree View — обычный компонент без ref */}
            {activeTab === 'tree' && <TreeView />}

            {/* Items — tableRef на внутренний div передаётся через prop */}
            {activeTab === 'items' && (
              <ItemsTable summary={summary} tableRef={tableRef} />
            )}

            {/* Buildings */}
            {activeTab === 'buildings' && (
              <BuildingsTable summary={summary} tableRef={tableRef} />
            )}

            {/* Logistics */}
            {activeTab === 'logistics' && (
              <LogisticsTable summary={summary} tableRef={tableRef} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
