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

import React, { useEffect, useRef } from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import GraphCanvas from './GraphCanvas';
import TreeView from './TreeView';
import ExportImageButton from '../common/ExportImageButton';
import itemsDB from '../../database/items.json';
import { getAssetUrl } from '../../database/assets';


// ─── ItemsTable ────────────────────────────────────────────────────────────────
function ItemsTable({ summary, tableRef }) {
  if (!summary || !summary.items)
    return <div className="p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-8 overflow-auto h-full">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#2a2e39] text-gray-400">
            <th className="p-2">Предмет</th>
            <th className="p-2">Produced / min</th>
            <th className="p-2">Consumed / min</th>
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
  const { inputsLimit } = useFactoryStore();
  if (!summary || !summary.items)
    return <div className="p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-8 overflow-auto h-full">
      <table className="w-full text-left border-collapse">
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
    return <div className="p-8 text-gray-500">Нет данных для отображения.</div>;

  return (
    <div ref={tableRef} className="p-8 overflow-auto h-full">
      <div className="mb-6 text-xl font-bold text-[#a855f7]">
        Суммарная энергия: {summary.totalPower.toFixed(2)} МВт
      </div>
      <table className="w-full text-left border-collapse">
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
  const {
    activeTab,
    setActiveTab,
    summary,
    recalculateGraph,
    targets,
    activePresetId,
    frozenStages,
    freezeCurrentStage,
    unfreezeStage
  } = useFactoryStore();

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

  useEffect(() => {
    if (!summary && targets.length > 0) {
      recalculateGraph();
    }
  }, [summary, targets.length, recalculateGraph]);

  // ── Tab button helper ──────────────────────────────────────────────────────
  const TabBtn = ({ id, label, accent = false }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={[
        'px-4 py-2 rounded text-sm transition-colors duration-100',
        activeTab === id
          ? accent
            ? 'bg-[#2a2e39] text-[#f97316] font-bold'
            : 'bg-[#2a2e39] text-white'
          : 'text-gray-400 hover:text-gray-200',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0d10] relative">

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 bg-[#14171d] border-b border-[#2a2e39] p-2 z-10">

        {/* Вкладки слева */}
        <TabBtn id="network"   label="Граф сети" />
        <TabBtn id="tree"      label="Древовидный список" />
        <TabBtn id="items"     label="Предметы" />
        <TabBtn id="buildings" label="Здания" />
        <TabBtn id="logistics" label="Логистика и конвейеры" accent />

        {/* Разделитель */}
        <div className="flex-1" />

        {/* Кнопка фиксации постройки этапа */}
        {activePresetId && (
          isStageFrozen ? (
            <button
              type="button"
              onClick={() => unfreezeStage(activePresetId)}
              title="Завод зафиксирован как построенный в игре. Нажмите, чтобы разморозить для перестройки."
              className="px-3 py-1.5 rounded text-xs font-bold bg-[#14231a] hover:bg-[#1b3324] text-[#22c55e] border border-[#22c55e] flex items-center gap-1.5 shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all mr-2 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-[#22c55e]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>ПОСТРОЕНО</span>
            </button>
          ) : (
            <button
              type="button"
              disabled={!summary || targets.length === 0}
              onClick={freezeCurrentStage}
              title="Зафиксировать постройку завода. Заблокирует изменения и сохранит схему в трекере прогресса."
              className={`px-3 py-1.5 rounded text-xs font-bold border flex items-center gap-1.5 transition-all mr-2 cursor-pointer ${
                !summary || targets.length === 0
                  ? 'opacity-40 cursor-not-allowed border-[#2a2e39] text-gray-500 bg-[#14171d]'
                  : 'bg-[#14171d] hover:bg-[#1f242d] text-[#fa9549] border-[#fa9549]/60 hover:border-[#fa9549] hover:shadow-[0_0_8px_rgba(250,149,73,0.3)]'
              }`}
            >
              <svg className="w-3.5 h-3.5 text-[#fa9549]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span>Зафиксировать постройку</span>
            </button>
          )
        )}

        {/* Кнопка экспорта — крайний правый угол */}
        <div className="border-r border-[#2a2e39] pr-2 mr-1">
          <ExportImageButton
            activeTab={activeTab}
            graphCanvasRef={graphCanvasRef}
            complexName={complexName}
            totalPower={totalPower}
            disabled={!summary}
          />
        </div>
      </div>

      {/* ── Контент ─────────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {targets.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-[#0b0d10] text-gray-400">
            <span className="text-4xl mb-4">➕</span>
            <h2 className="text-xl font-bold text-[#e1e1e6]">{activePresetId ? 'Цех пуст' : 'Свободный режим'}</h2>
            <p className="mt-2 text-center max-w-md">
              Ваш список производства пуст. {activePresetId ? 'Переключитесь на другой этап кампании или добавьте целевой продукт.' : 'Нажмите кнопку + ДОБАВИТЬ ПРОДУКТ на панели справа, чтобы начать проектирование фабрики.'}
            </p>
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
