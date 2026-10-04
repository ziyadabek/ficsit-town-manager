import React, { useState, useEffect } from 'react';
import items from '../../../database/items.json';
import { getAssetUrl } from '../../../database/assets';
import ItemSelectDropdown from './ItemSelectDropdown';

function DebouncedLimitInput({ initialValue, onChange, disabled }) {
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
      disabled={disabled}
      value={val} 
      onChange={(e) => setVal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') commit(e.target.value);
      }}
      className={`bg-white text-black font-bold font-mono px-2 py-1 rounded w-20 text-center text-xs shadow-inner ${
        disabled ? 'opacity-70 cursor-not-allowed bg-gray-300' : ''
      }`} 
    />
  );
}

export default function InputsTab({
  inputsLimit,
  isStageFrozen,
  onUpdateInputLimit,
  onRemoveInputLimit,
  onAddInputLimit
}) {
  return (
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
              <DebouncedLimitInput 
                initialValue={inp.rate}
                disabled={isStageFrozen}
                onChange={(newRate) => onUpdateInputLimit(inp.id, { rate: newRate })}
              />
              <span className="text-[10px] text-gray-400">/мин</span>
              {!isStageFrozen && (
                <button 
                  onClick={() => onRemoveInputLimit(inp.id)} 
                  className="text-gray-400 hover:text-red-400 text-sm ml-1 font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        );
      })}

      {!isStageFrozen ? (
        <button 
          onClick={onAddInputLimit} 
          className="w-full py-2.5 bg-[#22c55e] text-black font-bold text-xs uppercase tracking-wider rounded hover:bg-green-400 transition-colors shadow-md mt-2 cursor-pointer"
        >
          + ДОБАВИТЬ ЛИМИТ
        </button>
      ) : (
        <div className="text-center text-xs text-gray-500 py-2 border border-dashed border-[#2d3340] rounded">
          🔒 Завод зафиксирован
        </div>
      )}
    </>
  );
}
