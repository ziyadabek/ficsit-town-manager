import React, { useState, useRef, useEffect } from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import items from '../../database/items.json';

// Custom Dropdown for Item Selection with Icons
function ItemSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  
  const selectedItem = items[value];
  const allKeys = Object.keys(items);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-52" ref={ref}>
      <div 
        className="flex items-center gap-2 bg-[#14171d] border border-[#2a2e39] text-[#e1e1e6] px-2 py-1 rounded cursor-pointer hover:border-[#f97316]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedItem && <img src={selectedItem.icon} alt={selectedItem.name} className="w-5 h-5" />}
        <span className="truncate">{selectedItem ? selectedItem.name : 'Select item...'}</span>
        <span className="ml-auto text-xs text-gray-400">▼</span>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full max-h-60 overflow-y-auto bg-[#14171d] border border-[#2a2e39] rounded shadow-xl z-50">
          {allKeys.map(k => {
            const item = items[k];
            return (
              <div 
                key={k}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#2a2e39] cursor-pointer"
                onClick={() => {
                  onChange(k);
                  setIsOpen(false);
                }}
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5" />
                <span className="truncate text-[#e1e1e6]">{item.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ManualInput() {
  const { targets, updateTarget } = useFactoryStore();

  return (
    <div className="absolute top-4 left-4 z-10 bg-[#14171d] border border-[#2a2e39] rounded-md shadow-lg text-sm text-[#e1e1e6] w-[450px] max-h-[90vh] overflow-visible">
      <div className="p-2 border-b border-[#2a2e39] font-bold text-[#f97316]">
        SCIM Production Matrix (LP Solver)
      </div>
      <div className="p-4 flex flex-col gap-3">
        {targets.map((target, idx) => (
          <div key={idx} className="flex items-center justify-between bg-[#0b0d10] p-2 rounded">
            <ItemSelect 
              value={target.itemId}
              onChange={(newId) => updateTarget(idx, { itemId: newId })}
            />
            
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={target.rate} 
                onChange={(e) => updateTarget(idx, { rate: Number(e.target.value) })}
                className="bg-[#14171d] border border-[#2a2e39] text-white px-2 py-1 rounded w-20 text-right"
              />
              <span className="text-gray-400">/min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
