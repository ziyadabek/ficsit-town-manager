import React, { useState } from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import TargetsTab from './panels/TargetsTab';
import InputsTab from './panels/InputsTab';
import SettingsTab from './panels/SettingsTab';

export default function RightPanel() {
  const [tab, setTab] = useState('targets'); // 'targets' | 'inputs' | 'options'
  
  const { 
    targets, 
    inputsLimit, 
    options, 
    layoutDirection,
    schematicMode,
    addTarget, 
    updateTarget, 
    removeTarget, 
    addInputLimit, 
    updateInputLimit, 
    removeInputLimit, 
    toggleAltRecipe, 
    setOptimizeMode,
    setLayoutDirection,
    setSchematicMode,
    setOption,
    activePresetId,
    frozenStages,
    unfreezeStage,
    resetToFreeMode
  } = useFactoryStore();

  const isStageFrozen = Boolean(activePresetId && frozenStages[activePresetId]?.isFrozen);

  // Вспомогательная функция степпера изменения количества
  const handleStep = (targetId, currentRate, delta, minVal = 0) => {
    const newRate = Math.max(minVal, Math.round((currentRate + delta) * 10) / 10);
    updateTarget(targetId, { rate: newRate });
  };

  const handleAddTargetWithItem = (itemId) => {
    const newTargets = [...targets, { id: `target_${Date.now()}`, itemId, rate: 10 }];
    useFactoryStore.setState({ targets: newTargets });
    useFactoryStore.getState().recalculateGraph();
  };

  return (
    <div className="w-96 bg-[#1f2229] border-l border-[#2a2e39] flex flex-col h-full z-10 select-none shadow-2xl">
      {/* Шапка табов в стиле SCIM */}
      <div className="flex border-b border-[#2e3340] bg-[#1a1c23]">
        <button
          onClick={() => setTab('targets')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all cursor-pointer ${
            tab === 'targets'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#f97316]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#20232c]'
          }`}
        >
          Что производить
        </button>
        <button
          onClick={() => setTab('inputs')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all cursor-pointer ${
            tab === 'inputs'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#22c55e]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#20232c]'
          }`}
        >
          Ограничения
        </button>
        <button
          onClick={() => setTab('options')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all cursor-pointer ${
            tab === 'options'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#3b82f6]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#20232c]'
          }`}
        >
          Настройки
        </button>
      </div>

      {/* Баннер заморозки этапа */}
      {isStageFrozen && (
        <div className="bg-emerald-950/70 border-b border-emerald-500/40 px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <svg className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>ЗАВОД ПОСТРОЕН</span>
            <span className="text-[10px] text-emerald-300/80 font-mono">(Только чтение)</span>
          </div>
          <button
            onClick={() => unfreezeStage(activePresetId)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            [Разморозить]
          </button>
        </div>
      )}

      {/* Контент табов */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[#e1e1e6]">
        {tab === 'targets' && (
          <TargetsTab 
            targets={targets}
            activePresetId={activePresetId}
            isStageFrozen={isStageFrozen}
            onRemoveTarget={removeTarget}
            onUpdateTarget={updateTarget}
            onAddTarget={handleAddTargetWithItem}
            onStep={handleStep}
            onClearAll={resetToFreeMode}
          />
        )}

        {tab === 'inputs' && (
          <InputsTab 
            inputsLimit={inputsLimit}
            isStageFrozen={isStageFrozen}
            onUpdateInputLimit={updateInputLimit}
            onRemoveInputLimit={removeInputLimit}
            onAddInputLimit={addInputLimit}
          />
        )}

        {tab === 'options' && (
          <SettingsTab 
            layoutDirection={layoutDirection}
            schematicMode={schematicMode}
            options={options}
            isStageFrozen={isStageFrozen}
            onSetLayoutDirection={setLayoutDirection}
            onSetSchematicMode={setSchematicMode}
            onToggleAltRecipe={toggleAltRecipe}
            onSetOption={setOption}
            onSetOptimizeMode={setOptimizeMode}
          />
        )}
      </div>
    </div>
  );
}
