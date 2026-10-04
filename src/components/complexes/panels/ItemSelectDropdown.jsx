import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import items from '../../../database/items.json';
import { getAssetUrl } from '../../../database/assets';

export default function ItemSelectDropdown({ selectedItemId, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const ref = useRef(null);
  const dropdownRef = useRef(null);

  const selectedItem = items[selectedItemId];

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        ref.current && !ref.current.contains(event.target) &&
        dropdownRef.current && !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredKeys = Object.keys(items).filter(k => {
    const item = items[k];
    if (item.type === 'building' || item.type === 'power') return false;
    return item.name.toLowerCase().includes(search.toLowerCase());
  });

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
