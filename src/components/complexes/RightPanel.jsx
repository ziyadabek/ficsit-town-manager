import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useFactoryStore } from '../../store/useFactoryStore';
import items from '../../database/items.json';
import recipesDB from '../../database/recipes.json';
import { getAssetUrl } from '../../database/assets';


function ItemSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const dropdownRef = useRef(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  
  const selectedItem = items[value];
  const allKeys = Object.keys(items).sort((a, b) => items[a].name.localeCompare(items[b].name));

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
      setCoords({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative w-48" ref={ref}>
      <div 
        className="flex items-center gap-2 bg-[#14171d] border border-[#2a2e39] text-[#e1e1e6] px-2 py-1 rounded cursor-pointer hover:border-[#f97316]"
        onClick={openDropdown}
      >
        {selectedItem && selectedItem.icon ? (
          <img src={getAssetUrl(selectedItem.icon)} alt={selectedItem.name} className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
        ) : (
          <div className="w-5 h-5 bg-gray-700 rounded-sm"></div>
        )}
        <span className="truncate">{selectedItem ? selectedItem.name : 'Выберите предмет...'}</span>
        <span className="ml-auto text-xs text-gray-400">▼</span>
      </div>

      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          style={{ top: coords.top + 4, left: coords.left, width: coords.width }}
          className="absolute max-h-60 overflow-y-auto bg-[#14171d] border border-[#2a2e39] rounded shadow-xl z-[9999]"
        >
          {allKeys.map(k => {
            const item = items[k];
            return (
              <div 
                key={k}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2e39] cursor-pointer"
                onClick={() => { onChange(k); setIsOpen(false); }}
              >
                {item.icon ? (
                  <img src={getAssetUrl(item.icon)} alt={item.name} className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
                ) : (
                  <div className="w-5 h-5 bg-gray-700 rounded-sm"></div>
                )}
                <span className="truncate text-[#e1e1e6]">{item.name}</span>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}

function RecipeEquation({ recipe, accentColor = '#f97316' }) {
  if (!recipe || !recipe.inputs || !recipe.outputs) return null;
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-[11px] bg-[#0b0d10] p-1.5 rounded border border-[#2a2e39] mt-1.5 w-full">
      {recipe.inputs.map((inp, idx) => (
        <React.Fragment key={inp.itemId}>
          {idx > 0 && <span className="text-gray-500 font-bold">+</span>}
          <div className="flex items-center gap-1 text-gray-300 bg-[#1a1d24] px-1 py-0.5 rounded" title={items[inp.itemId]?.name}>
            <img src={getAssetUrl(items[inp.itemId]?.icon)} className="w-4 h-4 object-contain" onError={(e) => e.target.style.display='none'} />
            <span className="font-medium">{inp.rate}</span>
          </div>
        </React.Fragment>
      ))}
      <span className="mx-1 font-bold" style={{ color: accentColor }}>➜</span>
      {recipe.outputs.map((out, idx) => (
        <React.Fragment key={out.itemId}>
          {idx > 0 && <span className="text-gray-500 font-bold">+</span>}
          <div className="flex items-center gap-1 text-gray-300 bg-[#1a1d24] px-1 py-0.5 rounded" title={items[out.itemId]?.name}>
            <img src={getAssetUrl(items[out.itemId]?.icon)} className="w-4 h-4 object-contain" onError={(e) => e.target.style.display='none'} />
            <span className="font-medium">{out.rate}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export default function RightPanel() {
  const { 
    targets, addTarget, updateTarget, removeTarget,
    inputsLimit, addInputLimit, updateInputLimit, removeInputLimit,
    options, toggleAltRecipe, setOptimizeMode, activePresetId,
    layoutDirection, setLayoutDirection,
    schematicMode, setSchematicMode,
    frozenStages, unfreezeStage
  } = useFactoryStore();

  const isStageFrozen = !!(activePresetId && frozenStages[activePresetId]?.isFrozen);

  const [tab, setTab] = useState('outputs');

  const alts = recipesDB.filter(r => r.isAlternate && r.buildingId !== 'converter').sort((a, b) => a.name.localeCompare(b.name));
  const converterRecipes = recipesDB.filter(r => r.buildingId === 'converter' && r.isAlternate).sort((a, b) => a.name.localeCompare(b.name));

  const renderPowerInfo = () => {
    if (activePresetId === 'power_2a') {
      return (
        <div className="bg-[#1a2333] border border-[#3b82f6] rounded p-3 m-4 mb-0 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[#3b82f6] font-bold text-xs uppercase tracking-wide">⚡ Генерация этапа</span>
            <span className="text-[#e1e1e6] font-bold text-lg">+1 200 МВт</span>
            <span className="text-gray-400 text-xs mt-1">Чистая мощность ТЭС</span>
          </div>
        </div>
      );
    }
    if (activePresetId === 'power_4a') {
      return (
        <div className="bg-[#1a2333] border border-[#3b82f6] rounded p-3 m-4 mb-0 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[#3b82f6] font-bold text-xs uppercase tracking-wide">⚡ Генерация этапа</span>
            <span className="text-[#e1e1e6] font-bold text-lg">+2 500 МВт</span>
            <span className="text-gray-400 text-xs mt-1">Турботопливо / Топливо</span>
          </div>
        </div>
      );
    }
    if (activePresetId === 'power_8a') {
      return (
        <div className="bg-[#1a2333] border border-[#3b82f6] rounded p-3 m-4 mb-0 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex flex-col">
            <span className="text-[#3b82f6] font-bold text-xs uppercase tracking-wide">⚡ Генерация этапа</span>
            <span className="text-[#e1e1e6] font-bold text-lg">+10 000 МВт</span>
            <span className="text-gray-400 text-xs mt-1">АЭС + утилизация плутония</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-96 bg-[#14171d] border-l border-[#2a2e39] flex flex-col h-full shadow-lg z-20">
      {renderPowerInfo()}

      {/* Баннер Read-Only режима для зафиксированного цеха */}
      {isStageFrozen && (
        <div className="bg-[#0f1f17] border border-[#22c55e] rounded p-3 m-4 mb-1 flex flex-col gap-1.5 shadow-[0_0_12px_rgba(34,197,94,0.15)] shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[#22c55e] font-bold text-xs uppercase tracking-wide flex items-center gap-1.5">
              🔒 ЗАВОД ПОСТРОЕН
            </span>
            <button
              type="button"
              onClick={() => unfreezeStage(activePresetId)}
              className="text-[11px] bg-[#1a2333] hover:bg-[#24334a] text-gray-200 hover:text-white border border-[#2a3b52] px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1"
            >
              🔓 Разморозить
            </button>
          </div>
          <span className="text-[10px] text-gray-400 leading-tight">
            Схема зафиксирована в Read-Only. Рецепты и узлы защищены от случайных изменений.
          </span>
        </div>
      )}

      <div className="flex border-b border-[#2a2e39] shrink-0 mt-2">
        <button onClick={() => setTab('outputs')} className={`flex-1 p-3 text-sm font-bold ${tab === 'outputs' ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-gray-400 hover:text-gray-300'}`}>Продукция</button>
        <button onClick={() => setTab('inputs')} className={`flex-1 p-3 text-sm font-bold ${tab === 'inputs' ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-gray-400 hover:text-gray-300'}`}>Сырье</button>
        <button onClick={() => setTab('options')} className={`flex-1 p-3 text-sm font-bold ${tab === 'options' ? 'text-[#f97316] border-b-2 border-[#f97316]' : 'text-gray-400 hover:text-gray-300'}`}>Опции</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {tab === 'outputs' && (
          <>
            {targets.map(target => (
              <div key={target.id} className="flex items-center justify-between bg-[#0b0d10] p-2 rounded border border-[#2a2e39]">
                {isStageFrozen ? (
                  <div className="flex items-center gap-2 px-2 py-1">
                    {items[target.itemId]?.icon && (
                      <img src={getAssetUrl(items[target.itemId].icon)} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-sm font-semibold text-gray-200">{items[target.itemId]?.name || target.itemId}</span>
                  </div>
                ) : (
                  <ItemSelect value={target.itemId} onChange={(newId) => updateTarget(target.id, { itemId: newId })} />
                )}
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    disabled={isStageFrozen}
                    value={target.rate} 
                    onChange={(e) => updateTarget(target.id, { rate: Number(e.target.value) })} 
                    className={`bg-[#14171d] border border-[#2a2e39] text-white px-2 py-1 rounded w-16 text-right ${isStageFrozen ? 'opacity-70 cursor-not-allowed' : ''}`} 
                  />
                  {!isStageFrozen && (
                    <button onClick={() => removeTarget(target.id)} className="text-gray-500 hover:text-red-500 ml-1">×</button>
                  )}
                </div>
              </div>
            ))}
            {!isStageFrozen ? (
              <button onClick={addTarget} className="w-full py-2 bg-[#f97316] text-black font-bold rounded hover:bg-[#fa9549]">+ ДОБАВИТЬ ПРОДУКТ</button>
            ) : (
              <div className="text-center text-xs text-gray-500 py-1 border border-dashed border-[#2a2e39] rounded">
                🔒 Завод зафиксирован (добавление заблокировано)
              </div>
            )}
          </>
        )}

        {tab === 'inputs' && (
          <>
            <div className="text-xs text-gray-400 mb-2">Лимиты доступного сырья (опционально):</div>
            {inputsLimit.map(inp => (
              <div key={inp.id} className="flex items-center justify-between bg-[#0b0d10] p-2 rounded border border-[#2a2e39]">
                {isStageFrozen ? (
                  <div className="flex items-center gap-2 px-2 py-1">
                    {items[inp.itemId]?.icon && (
                      <img src={getAssetUrl(items[inp.itemId].icon)} alt="" className="w-5 h-5 object-contain" />
                    )}
                    <span className="text-sm font-semibold text-gray-200">{items[inp.itemId]?.name || inp.itemId}</span>
                  </div>
                ) : (
                  <ItemSelect value={inp.itemId} onChange={(newId) => updateInputLimit(inp.id, { itemId: newId })} />
                )}
                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    disabled={isStageFrozen}
                    value={inp.rate} 
                    onChange={(e) => updateInputLimit(inp.id, { rate: Number(e.target.value) })} 
                    className={`bg-[#14171d] border border-[#2a2e39] text-white px-2 py-1 rounded w-16 text-right ${isStageFrozen ? 'opacity-70 cursor-not-allowed' : ''}`} 
                  />
                  {!isStageFrozen && (
                    <button onClick={() => removeInputLimit(inp.id)} className="text-gray-500 hover:text-red-500 ml-1">×</button>
                  )}
                </div>
              </div>
            ))}
            {!isStageFrozen ? (
              <button onClick={addInputLimit} className="w-full py-2 bg-[#22c55e] text-black font-bold rounded hover:bg-green-400">+ ДОБАВИТЬ ЛИМИТ</button>
            ) : (
              <div className="text-center text-xs text-gray-500 py-1 border border-dashed border-[#2a2e39] rounded">
                🔒 Завод зафиксирован
              </div>
            )}
          </>
        )}

        {tab === 'options' && (
          <>
            <div>
              <div className="text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2 border-b border-[#2a2e39] pb-1 flex items-center justify-between">
                <span>Вид схемы</span>
                <span className="text-[10px] text-gray-500 font-normal">Чертеж</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSchematicMode('simple')}
                  className={`py-2 px-3 rounded text-xs font-bold border flex items-center justify-center transition-all ${
                    schematicMode === 'simple'
                      ? 'bg-[#f97316] text-black border-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      : 'bg-[#0b0d10] text-gray-300 border-[#2a2e39] hover:border-gray-500'
                  }`}
                >
                  Обычный
                </button>
                <button
                  type="button"
                  onClick={() => setSchematicMode('realistic')}
                  className={`py-2 px-3 rounded text-xs font-bold border flex items-center justify-center transition-all ${
                    schematicMode === 'realistic'
                      ? 'bg-[#22c55e] text-black border-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]'
                      : 'bg-[#0b0d10] text-gray-300 border-[#2a2e39] hover:border-gray-500'
                  }`}
                >
                  Реалистичный
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2 mt-4 border-b border-[#2a2e39] pb-1">
                Направление схемы
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutDirection('LR')}
                  className={`py-2 px-3 rounded text-xs font-bold border flex items-center justify-center transition-all ${
                    layoutDirection === 'LR'
                      ? 'bg-[#f97316] text-black border-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      : 'bg-[#0b0d10] text-gray-300 border-[#2a2e39] hover:border-gray-500'
                  }`}
                >
                  Вправо
                </button>
                <button
                  type="button"
                  onClick={() => setLayoutDirection('TB')}
                  className={`py-2 px-3 rounded text-xs font-bold border flex items-center justify-center transition-all ${
                    layoutDirection === 'TB'
                      ? 'bg-[#f97316] text-black border-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                      : 'bg-[#0b0d10] text-gray-300 border-[#2a2e39] hover:border-gray-500'
                  }`}
                >
                  Вниз
                </button>
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-[#f97316] uppercase tracking-wider mb-2 mt-4 border-b border-[#2a2e39] pb-1">
                Критерий оптимизации
              </div>
              <select 
                disabled={isStageFrozen}
                value={options.optimize} 
                onChange={e => setOptimizeMode(e.target.value)} 
                className={`w-full bg-[#0b0d10] border border-[#2a2e39] text-white p-2 rounded text-sm ${isStageFrozen ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <option value="power">Минимизировать энергию (МВт)</option>
                <option value="raw">Минимизировать сырье</option>
                <option value="machines">Минимизировать число станков</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-bold text-[#f97316] mb-3 mt-4 flex items-center gap-2 border-b border-[#2a2e39] pb-1">
                Альтернативные рецепты
                {isStageFrozen && <span className="text-[10px] text-gray-500 font-normal ml-auto">🔒 Зафиксировано</span>}
              </div>
              <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {alts.map(alt => {
                  const outItem = alt.outputs?.[0] ? items[alt.outputs[0].itemId] : null;
                  return (
                    <label key={alt.id} className={`flex items-start gap-3 text-sm p-2 rounded transition-colors border border-transparent ${isStageFrozen ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2a2e39] hover:border-[#4b5563]'}`}>
                      <input 
                        type="checkbox" 
                        disabled={isStageFrozen}
                        checked={options.altRecipes.includes(alt.id)}
                        onChange={() => toggleAltRecipe(alt.id)}
                        className="accent-[#f97316] w-4 h-4 min-w-[16px] mt-1"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {outItem?.icon ? (
                            <img src={getAssetUrl(outItem.icon)} alt="" className="w-6 h-6 object-contain rounded bg-[#0b0d10] p-0.5 border border-[#2a2e39]" onError={(e) => e.target.style.display='none'} />
                          ) : (
                            <div className="w-6 h-6 bg-gray-700 rounded border border-[#2a2e39]"></div>
                          )}
                          <span className="flex-1 text-gray-300 font-bold truncate" title={alt.name}>{alt.name}</span>
                        </div>
                        <RecipeEquation recipe={alt} accentColor="#f97316" />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {converterRecipes.length > 0 && (
              <div>
                <div className="text-sm font-bold text-[#a855f7] mb-3 mt-6 flex items-center gap-2 border-b border-[#2a2e39] pb-1">
                  Рецепты конвертера
                  {isStageFrozen && <span className="text-[10px] text-gray-500 font-normal ml-auto">🔒 Зафиксировано</span>}
                </div>
                <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {converterRecipes.map(alt => {
                    const outItem = alt.outputs?.[0] ? items[alt.outputs[0].itemId] : null;
                    return (
                      <label key={alt.id} className={`flex items-start gap-3 text-sm p-2 rounded transition-colors border border-transparent ${isStageFrozen ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer hover:bg-[#2a2e39] hover:border-[#4b5563]'}`}>
                        <input 
                          type="checkbox" 
                          disabled={isStageFrozen}
                          checked={options.altRecipes.includes(alt.id)}
                          onChange={() => toggleAltRecipe(alt.id)}
                          className="accent-[#a855f7] w-4 h-4 min-w-[16px] mt-1"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {outItem?.icon ? (
                              <img src={getAssetUrl(outItem.icon)} alt="" className="w-6 h-6 object-contain rounded bg-[#0b0d10] p-0.5 border border-[#2a2e39]" onError={(e) => e.target.style.display='none'} />
                            ) : (
                              <div className="w-6 h-6 bg-gray-700 rounded border border-[#2a2e39]"></div>
                            )}
                            <span className="flex-1 text-gray-300 font-bold truncate" title={alt.name}>{alt.name}</span>
                          </div>
                          <RecipeEquation recipe={alt} accentColor="#a855f7" />
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
