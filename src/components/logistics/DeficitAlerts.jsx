import React from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import items from '../../database/items.json';

export default function DeficitAlerts() {
  const { deficits } = useFactoryStore();
  const deficitItems = Object.keys(deficits);

  if (deficitItems.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-10 bg-[#14171d] border border-[#ef4444] rounded-md shadow-lg p-4 text-sm w-80">
      <h3 className="font-bold text-[#ef4444] mb-2 flex items-center gap-2">
        <span>⚠️</span> Межзаводской дефицит
      </h3>
      <ul className="flex flex-col gap-2">
        {deficitItems.map(itemKey => {
          const item = items[itemKey];
          return (
            <li key={itemKey} className="flex items-center justify-between bg-[#0b0d10] p-2 rounded border border-[#2a2e39]">
              <div className="flex items-center gap-2">
                {item && <img src={item.icon} alt={item.name} className="w-5 h-5" />}
                <span className="text-[#e1e1e6]">{item?.name || itemKey}</span>
              </div>
              <span className="font-bold text-[#ef4444]">-{deficits[itemKey].toFixed(1)} / min</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
