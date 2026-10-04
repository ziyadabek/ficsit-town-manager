import React, { useState, useEffect } from 'react';
import items from '../../../database/items.json';
import { getAssetUrl } from '../../../database/assets';
import ItemSelectDropdown from './ItemSelectDropdown';
import RecipeSelectorDropdown from './RecipeSelectorDropdown';

function DebouncedRateInput({ initialValue, onChange, disabled }) {
  const [val, setVal] = useState(initialValue);

  useEffect(() => {
    setVal(initialValue);
  }, [initialValue]);

  const commit = (newVal) => {
    const parsed = Number(newVal);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
  };

  return (
    <input 
      type="number" 
      step="any"
      disabled={disabled}
      value={val} 
      onChange={(e) => {
        setVal(e.target.value);
      }}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit(e.target.value);
        }
      }}
      className={`bg-white text-black font-bold font-mono px-2 py-1 rounded w-20 text-center text-sm shadow-inner ${
        disabled ? 'opacity-70 cursor-not-allowed bg-gray-300' : ''
      }`} 
    />
  );
}

export default function TargetsTab({
  targets,
  isStageFrozen,
  onRemoveTarget,
  onUpdateTarget,
  onAddTarget,
  onStep
}) {
  return (
    <>
      {/* Синяя плашка с подсказкой SCIM */}
      <div className="bg-[#1a3860]/70 border border-[#2b568e] text-cyan-200 text-xs p-3 rounded-md leading-relaxed shadow-sm">
        Введите количество, которое вы хотите производить в минуту. Система рассчитает оптимальную цепочку производства.
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
                {/* Название предмета как в оригинале SCIM */}
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[#f97316] truncate">
                    {item?.name || target.itemId}
                  </span>
                  {!isStageFrozen && (
                    <button 
                      onClick={() => onRemoveTarget(target.id)} 
                      className="text-gray-400 hover:text-red-400 font-bold px-1.5 py-0.5 rounded text-sm transition-colors cursor-pointer"
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
                    onChange={(recId) => onUpdateTarget(target.id, { recipeId: recId })} 
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
                      onClick={() => onStep(target.id, target.rate, -10, 1)}
                      className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="-10"
                    >
                      |&lt;
                    </button>
                    <button 
                      onClick={() => onStep(target.id, target.rate, -1, 0.1)}
                      className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="-1"
                    >
                      &lt;
                    </button>
                  </>
                )}
                
                <DebouncedRateInput 
                  initialValue={target.rate}
                  disabled={isStageFrozen}
                  onChange={(val) => onUpdateTarget(target.id, { rate: val })}
                />

                {!isStageFrozen && (
                  <>
                    <button 
                      onClick={() => onStep(target.id, target.rate, 1)}
                      className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors cursor-pointer"
                      title="+1"
                    >
                      &gt;
                    </button>
                    <button 
                      onClick={() => onStep(target.id, target.rate, 10)}
                      className="w-7 h-7 bg-[#2a303c] hover:bg-[#384152] text-gray-300 font-bold rounded text-xs flex items-center justify-center transition-colors cursor-pointer"
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
        <div className="pt-2 space-y-2">
          <ItemSelectDropdown 
            selectedItemId="" 
            onChange={(newId) => {
              onAddTarget(newId);
            }} 
          />
          <button 
            onClick={() => onAddTarget('concrete')} 
            className="w-full py-2.5 bg-[#f97316] text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-[#fa9549] transition-colors shadow-md cursor-pointer"
          >
            + ДОБАВИТЬ ПРОДУКТ ПО УМОЛЧАНИЮ
          </button>
        </div>
      ) : (
        <div className="text-center text-xs text-gray-500 py-2 border border-dashed border-[#2d3340] rounded flex items-center justify-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Завод зафиксирован (добавление заблокировано)</span>
        </div>
      )}
    </>
  );
}
