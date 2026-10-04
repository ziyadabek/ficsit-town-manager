import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFactoryStore } from '../../store/useFactoryStore';
import items from '../../database/items.json';
import recipesDB from '../../database/recipes.json';
import { getAssetUrl } from '../../database/assets';

/**
 * ItemSelect: выпадающий список выбора предмета
 */
function ItemSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState('');
  
  const selectedItem = items[value];
  const allKeys = Object.keys(items)
    .filter(k => items[k]?.type !== 'special')
    .sort((a, b) => items[a].name.localeCompare(items[b].name));

  const filteredKeys = search 
    ? allKeys.filter(k => items[k].name.toLowerCase().includes(search.toLowerCase()))
    : allKeys;

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ref.current && !ref.current.contains(event.target) &&
        (!dropdownRef.current || !dropdownRef.current.contains(event.target))
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openDropdown = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: Math.max(rect.width, 240) });
    }
    setIsOpen(!isOpen);
    setSearch('');
  };

  return (
    <div className="relative flex-1" ref={ref}>
      <div 
        className="flex items-center gap-2 bg-[#2a303c] border border-[#3e4756] text-[#e1e1e6] px-2.5 py-1.5 rounded cursor-pointer hover:border-[#f97316] transition-colors"
        onClick={openDropdown}
      >
        {selectedItem && selectedItem.icon ? (
          <img src={getAssetUrl(selectedItem.icon)} alt="" className="w-5 h-5 object-contain" />
        ) : (
          <div className="w-5 h-5 bg-gray-700 rounded-sm"></div>
        )}
        <span className="truncate text-xs font-semibold">{selectedItem ? selectedItem.name : 'Выберите предмет...'}</span>
        <span className="ml-auto text-[10px] text-gray-400">▼</span>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ top: coords.top + 4, left: coords.left, width: coords.width }}
          className="absolute max-h-64 overflow-y-auto bg-[#1c212b] border border-[#3e4756] rounded-lg shadow-2xl z-[9999] flex flex-col"
        >
          <div className="p-1.5 border-b border-[#2d3545] sticky top-0 bg-[#1c212b]">
            <input 
              type="text" 
              placeholder="Поиск предмета..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-[#13171f] text-white text-xs px-2 py-1 rounded border border-[#2d3545] focus:outline-none focus:border-[#f97316]"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto flex-1 divide-y divide-[#262e3d]">
            {filteredKeys.map(k => {
              const item = items[k];
              return (
                <div 
                  key={k}
                  className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-[#283244] cursor-pointer transition-colors"
                  onClick={() => { onChange(k); setIsOpen(false); }}
                >
                  {item.icon ? (
                    <img src={getAssetUrl(item.icon)} alt="" className="w-5 h-5 object-contain" />
                  ) : (
                    <div className="w-5 h-5 bg-gray-700 rounded-sm"></div>
                  )}
                  <span className="truncate text-xs text-[#e1e1e6]">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/**
 * RecipeSelectorDropdown: выпадающий список выбора конкретного рецепта с формулами (как в оригинале SCIM)
 */
function RecipeSelectorDropdown({ itemId, selectedRecipeId, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const summary = useFactoryStore(state => state.summary);
  const matchingRecipes = recipesDB.filter(r => r.outputs?.some(o => o.itemId === itemId));
  
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (matchingRecipes.length <= 1) return null;

  const activeSummaryRecipeId = summary?.recipes?.find(sr => matchingRecipes.some(mr => mr.id === sr.id))?.id;
  const currentRecipe = matchingRecipes.find(r => r.id === selectedRecipeId) 
    || matchingRecipes.find(r => r.id === activeSummaryRecipeId)
    || matchingRecipes.find(r => !r.isAlternate)
    || matchingRecipes[0];

  return (
    <div className="relative mt-1" ref={ref}>
      <button 
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-2.5 py-1 text-xs bg-[#8f9aa8] hover:bg-[#9faab8] text-[#14171f] font-semibold rounded transition-colors"
      >
        <span className="truncate">{currentRecipe?.name}</span>
        <span className="text-[10px] ml-1">▾</span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-84 max-w-[90vw] bg-[#1a1f29] border border-[#3e4858] rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-[#2a3444]">
          {matchingRecipes.map(recipe => (
            <div 
              key={recipe.id}
              onClick={() => { onChange(recipe.id); setOpen(false); }}
              className={`p-2.5 hover:bg-[#262f3f] cursor-pointer transition-colors ${recipe.id === currentRecipe?.id ? 'bg-[#222b3a]' : ''}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-bold ${recipe.isAlternate ? 'text-amber-400' : 'text-white'}`}>
                  {recipe.name}
                </span>
                {recipe.isAlternate && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                    Альт.
                  </span>
                )}
              </div>

              {/* Формула рецепта: Inputs -> Output с иконками */}
              <div className="flex items-center gap-1.5 text-[11px] text-gray-300 flex-wrap">
                {recipe.inputs.map((inp, idx) => (
                  <span key={inp.itemId} className="flex items-center gap-1 bg-[#121620] px-1.5 py-0.5 rounded border border-[#2b3342]">
                    {items[inp.itemId]?.icon && (
                      <img src={getAssetUrl(items[inp.itemId].icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    <span>{items[inp.itemId]?.name || inp.itemId} ({inp.rate}/min)</span>
                  </span>
                ))}
                <span className="text-gray-500 font-bold">➜</span>
                {recipe.outputs.map((out) => (
                  <span key={out.itemId} className="flex items-center gap-1 bg-[#121620] px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-300 font-medium">
                    {items[out.itemId]?.icon && (
                      <img src={getAssetUrl(items[out.itemId].icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    <span>{out.rate}/min</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
    unfreezeStage
  } = useFactoryStore();

  const isStageFrozen = activePresetId && frozenStages[activePresetId]?.isFrozen;

  // Вспомогательная функция степпера изменения количества
  const handleStep = (targetId, currentRate, delta, minVal = 0) => {
    const newRate = Math.max(minVal, Math.round((currentRate + delta) * 10) / 10);
    updateTarget(targetId, { rate: newRate });
  };

  return (
    <div className="w-96 bg-[#1f2229] border-l border-[#2a2e39] flex flex-col h-full z-10 select-none shadow-2xl">
      {/* Шапка табов в точности как в оригинале SCIM */}
      <div className="flex border-b border-[#2e3340] bg-[#1a1c23]">
        <button
          onClick={() => setTab('targets')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all ${
            tab === 'targets'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#f97316]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#20232c]'
          }`}
        >
          Что производить
        </button>
        <button
          onClick={() => setTab('inputs')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all ${
            tab === 'inputs'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#f97316]'
              : 'text-gray-400 hover:text-gray-200 hover:bg-[#20232c]'
          }`}
        >
          Из чего производить
        </button>
        <button
          onClick={() => setTab('options')}
          className={`flex-1 py-3 px-2 text-center text-xs font-bold tracking-wide transition-all ${
            tab === 'options'
              ? 'bg-[#2a2e38] text-white border-t-2 border-t-[#f97316]'
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
            <span>🔒 ЗАВОД ПОСТРОЕН</span>
            <span className="text-[10px] text-emerald-300/80 font-mono">(Read-Only)</span>
          </div>
          <button
            onClick={() => unfreezeStage(activePresetId)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 underline"
          >
            [🔓 Разморозить]
          </button>
        </div>
      )}

      {/* Контент табов */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-[#e1e1e6]">
        
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ВКЛАДКА 1: ЧТО ПРОИЗВОДИТЬ (Скриншот 3)                             */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'targets' && (
          <>
            {/* Синяя плашка с подсказкой SCIM */}
            <div className="bg-[#1a3860]/70 border border-[#2b568e] text-cyan-200 text-xs p-3 rounded-md leading-relaxed shadow-sm">
              Enter the number you wish to produce per minute. The system calculates the optimal valid production chain.
            </div>

            {targets.map(target => {
              const item = items[target.itemId];
              return (
                <div key={target.id} className="bg-[#181b22] p-3 rounded-lg border border-[#2d3340] shadow-md space-y-2">
                  <div className="flex items-start gap-3">
                    {/* 3D Иконка продукта */}
                    <div className="w-14 h-14 rounded-lg bg-[#12141a] border border-[#2d3340] flex items-center justify-center p-1 shrink-0">
                      {item?.icon ? (
                        <img src={getAssetUrl(item.icon)} alt="" className="w-12 h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-700 rounded"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Оранжевое название предмета как в оригинале SCIM */}
                      <div className="flex items-center justify-between">
                        <span className="text-base font-bold text-[#f97316] truncate">
                          {item?.name || target.itemId}
                        </span>
                        {!isStageFrozen && (
                          <button 
                            onClick={() => removeTarget(target.id)} 
                            className="text-gray-400 hover:text-red-400 font-bold px-1.5 py-0.5 rounded text-sm transition-colors"
                            title="Удалить"
                          >
                            ×
                          </button>
                        )}
                      </div>

                      {/* Селектор конкретного рецепта прямо в строке (как в SCIM) */}
                      {!isStageFrozen ? (
                        <RecipeSelectorDropdown 
                          itemId={target.itemId} 
                          selectedRecipeId={target.recipeId} 
                          onChange={(recId) => updateTarget(target.id, { recipeId: recId })} 
                        />
                      ) : (
                        <div className="text-[11px] text-gray-400 mt-1">Рецепт зафиксирован</div>
                      )}
                    </div>
                  </div>

                  {/* Степпер количества: |<<, <, input, >, >>| */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#242934] mt-2">
                    <span className="text-xs text-gray-400 font-medium">Шт / мин:</span>
                    <div className="flex items-center gap-1">
                      {!isStageFrozen && (
                        <>
                          <button 
                            onClick={() => handleStep(target.id, target.rate, -10, 1)}
                            className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors"
                            title="-10"
                          >
                            |&lt;
                          </button>
                          <button 
                            onClick={() => handleStep(target.id, target.rate, -1, 0.1)}
                            className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors"
                            title="-1"
                          >
                            &lt;
                          </button>
                        </>
                      )}
                      
                      <input 
                        type="number" 
                        step="any"
                        disabled={isStageFrozen}
                        value={target.rate} 
                        onChange={(e) => updateTarget(target.id, { rate: Number(e.target.value) })} 
                        className={`bg-white text-black font-bold font-mono px-2 py-1 rounded w-20 text-center text-sm shadow-inner ${isStageFrozen ? 'opacity-70 cursor-not-allowed bg-gray-300' : ''}`} 
                      />

                      {!isStageFrozen && (
                        <>
                          <button 
                            onClick={() => handleStep(target.id, target.rate, 1)}
                            className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors"
                            title="+1"
                          >
                            &gt;
                          </button>
                          <button 
                            onClick={() => handleStep(target.id, target.rate, 10)}
                            className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors"
                            title="+10"
                          >
                            &gt;|
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {!isStageFrozen ? (
              <div className="pt-2">
                <ItemSelect value="" onChange={(newId) => {
                  const targets = [...useFactoryStore.getState().targets, { id: `target_${Date.now()}`, itemId: newId, rate: 10 }];
                  useFactoryStore.setState({ targets });
                  useFactoryStore.getState().recalculateGraph();
                }} />
                <button 
                  onClick={addTarget} 
                  className="w-full mt-2 py-2.5 bg-[#f97316] text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-[#fa9549] transition-colors shadow-md"
                >
                  + ДОБАВИТЬ ПРОДУКТ
                </button>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 py-2 border border-dashed border-[#2d3340] rounded">
                🔒 Завод зафиксирован (добавление заблокировано)
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ВКЛАДКА 2: ИЗ ЧЕГО ПРОИЗВОДИТЬ                                      */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'inputs' && (
          <>
            <div className="text-xs text-gray-400 mb-2">Лимиты доступного сырья (опционально):</div>
            {inputsLimit.map(inp => {
              const item = items[inp.itemId];
              return (
                <div key={inp.id} className="bg-[#181b22] p-3 rounded-lg border border-[#2d3340] shadow-sm flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {item?.icon && (
                      <img src={getAssetUrl(item.icon)} alt="" className="w-8 h-8 object-contain shrink-0" />
                    )}
                    <span className="text-xs font-bold text-gray-200 truncate">{item?.name || inp.itemId}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input 
                      type="number" 
                      disabled={isStageFrozen}
                      value={inp.rate} 
                      onChange={(e) => updateInputLimit(inp.id, { rate: Number(e.target.value) })} 
                      className={`bg-white text-black font-bold font-mono px-2 py-1 rounded w-20 text-center text-xs shadow-inner ${isStageFrozen ? 'opacity-70 cursor-not-allowed bg-gray-300' : ''}`} 
                    />
                    <span className="text-[10px] text-gray-400">/мин</span>
                    {!isStageFrozen && (
                      <button onClick={() => removeInputLimit(inp.id)} className="text-gray-400 hover:text-red-400 text-sm ml-1 font-bold">×</button>
                    )}
                  </div>
                </div>
              );
            })}

            {!isStageFrozen ? (
              <button 
                onClick={addInputLimit} 
                className="w-full py-2.5 bg-[#22c55e] text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-green-400 transition-colors shadow-md mt-2"
              >
                + ДОБАВИТЬ ЛИМИТ
              </button>
            ) : (
              <div className="text-center text-xs text-gray-500 py-2 border border-dashed border-[#2d3340] rounded">
                🔒 Завод зафиксирован
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* ВКЛАДКА 3: НАСТРОЙКИ (Скриншоты 1 и 2 в точности как в оригинале)     */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {tab === 'options' && (
          <div className="space-y-4 text-xs">
            
            {/* Верхние выпадающие списки: Направление и Вид схемы */}
            <div className="space-y-2 pb-3 border-b border-[#2d3340]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-200 font-medium">Направление</span>
                <select 
                  value={layoutDirection} 
                  onChange={e => setLayoutDirection(e.target.value)}
                  className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] hover:bg-[#9faab8] focus:outline-none cursor-pointer w-48 truncate"
                >
                  <option value="LR">Стрелка вправо</option>
                  <option value="TB">Стрелка вниз</option>
                </select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-gray-200 font-medium">Вид схемы</span>
                <select 
                  value={schematicMode} 
                  onChange={e => setSchematicMode(e.target.value)}
                  className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] hover:bg-[#9faab8] focus:outline-none cursor-pointer w-48 truncate"
                >
                  <option value="simple">Обычный</option>
                  <option value="realistic">Реалистичный</option>
                </select>
              </div>
            </div>

            {/* Секция: Альтернативные чертежи */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[#f97316] font-bold text-sm">Альтернативные чертежи</span>
                <span className="text-[10px] text-gray-400 font-mono">
                  Активно: {options.altRecipes?.length || 0}
                </span>
              </div>
              <div className="relative">
                <select 
                  disabled={isStageFrozen}
                  onChange={(e) => {
                    if (e.target.value) {
                      toggleAltRecipe(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] hover:bg-[#9faab8] focus:outline-none cursor-pointer w-full"
                >
                  <option value="">+ Включить / выключить альтернативный рецепт...</option>
                  {recipesDB.filter(r => r.isAlternate).map(r => (
                    <option key={r.id} value={r.id}>
                      {options.altRecipes?.includes(r.id) ? '✓ ' : '+ '} {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Секция: Purity and Speed */}
            <div className="pt-2 border-t border-[#2d3340]">
              <div className="text-[#f97316] font-bold text-sm mb-2">Purity and Speed</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Добыча руды</span>
                  <select 
                    value={options.minerPurity || 'normal'}
                    onChange={e => setOption('minerPurity', e.target.value)}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value="impure">Буровая установка ур. 1 (Бедное)</option>
                    <option value="normal">Буровая установка ур. 2 (Обычное месторождение)</option>
                    <option value="pure">Буровая установка ур. 3 (Чистое месторождение)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Добыча нефти</span>
                  <select 
                    value={options.oilPurity || 'normal'}
                    onChange={e => setOption('oilPurity', e.target.value)}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value="impure">Экстрактор нефти (Бедное месторождение)</option>
                    <option value="normal">Экстрактор нефти (Обычное месторождение)</option>
                    <option value="pure">Экстрактор нефти (Чистое месторождение)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Добыча воды</span>
                  <select className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate">
                    <option>Экстрактор воды (Обычное месторождение)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Добыча газа</span>
                  <select className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate">
                    <option>Экстрактор скважины (Обычное месторождение)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Максимальная скорость ленты</span>
                  <select 
                    value={options.maxBelt || 1200}
                    onChange={e => setOption('maxBelt', Number(e.target.value))}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value={60}>Конвейерная лента ур. 1 / 60 ресурсов в мин</option>
                    <option value={120}>Конвейерная лента ур. 2 / 120 ресурсов в мин</option>
                    <option value={270}>Конвейерная лента ур. 3 / 270 ресурсов в мин</option>
                    <option value={480}>Конвейерная лента ур. 4 / 480 ресурсов в мин</option>
                    <option value={780}>Конвейерная лента ур. 5 / 780 ресурсов в мин</option>
                    <option value={1200}>Конвейерная лента ур. 6 / 1 200 ресурсов в мин</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Максимальная скорость трубопровода</span>
                  <select 
                    value={options.maxPipe || 600}
                    onChange={e => setOption('maxPipe', Number(e.target.value))}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value={300}>Трубопровод ур. 1 / 300 м³</option>
                    <option value={600}>Трубопровод ур. 2 / 600 м³</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Секция: Overclocking (Experimental) */}
            <div className="pt-2 border-t border-[#2d3340]">
              <div className="text-[#f97316] font-bold text-sm mb-2">Overclocking (Experimental)</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Доступные энергомодули</span>
                  <input 
                    type="number" 
                    min="0"
                    value={options.powerShards || 0}
                    onChange={e => setOption('powerShards', Number(e.target.value))}
                    className="bg-white text-black font-bold font-mono px-3 py-1 rounded w-48 text-center text-xs shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Доступные Петлевики</span>
                  <input 
                    type="number" 
                    min="0"
                    value={options.somersloops || 0}
                    onChange={e => setOption('somersloops', Number(e.target.value))}
                    className="bg-white text-black font-bold font-mono px-3 py-1 rounded w-48 text-center text-xs shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Применять строения повторно при возможности</span>
                  <select 
                    value={options.reuseBuildings !== false ? 'yes' : 'no'}
                    onChange={e => setOption('reuseBuildings', e.target.value === 'yes')}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                  </select>
                </div>

                {/* ОПЦИЯ: Использовать разветвитель/соединитель (Ключевая опция из скриншота 2!) */}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Использовать разветвитель/соединитель</span>
                  <select 
                    value={options.useSplitters !== false ? 'yes' : 'no'}
                    onChange={e => setOption('useSplitters', e.target.value === 'yes')}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value="yes">Да</option>
                    <option value="no">Нет</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-200">Планировщик максимального уровня</span>
                  <select 
                    value={options.maxTier || 'unlimited'}
                    onChange={e => setOption('maxTier', e.target.value)}
                    className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
                  >
                    <option value="unlimited">Без ограничения</option>
                    <option value="tier1">Уровень 1-2</option>
                    <option value="tier2">Уровень 3-4</option>
                    <option value="tier3">Уровень 5-6</option>
                    <option value="tier4">Уровень 7-8</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Секция: Критерий оптимизации */}
            <div className="pt-2 border-t border-[#2d3340]">
              <div className="text-[#f97316] font-bold text-sm mb-2">Критерий оптимизации</div>
              <select 
                disabled={isStageFrozen}
                value={options.optimize} 
                onChange={e => setOptimizeMode(e.target.value)} 
                className="w-full bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-3 py-2 rounded border border-[#6b7685] cursor-pointer"
              >
                <option value="raw">Минимизировать сырье (Рекомендуется)</option>
                <option value="power">Минимизировать энергию (МВт)</option>
                <option value="machines">Минимизировать число станков</option>
              </select>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
