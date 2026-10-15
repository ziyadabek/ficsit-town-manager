import React from 'react';
import { useFactoryStore } from '../../store/useFactoryStore';
import items from '../../database/items.json';
import { getAssetUrl } from '../../database/assets';


const EMPTY_INPUTS = [];

export default function DeficitAlerts() {
  const effectiveInputs = useFactoryStore(state => state.summary?.effectiveInputs) || EMPTY_INPUTS;
  const deficits = effectiveInputs.filter(inp => inp && inp.deficit && inp.deficit > 0.001);

  if (deficits.length === 0) return null;

  return (
    <div className="absolute top-4 right-4 z-30 bg-[#14171d]/95 backdrop-blur border border-[#ef4444] rounded-md shadow-2xl p-4 text-sm w-84 max-h-[80vh] overflow-y-auto">
      <h3 className="font-bold text-[#ef4444] mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span>⚠️</span> Межзаводской дефицит
        </span>
        <span className="text-xs font-mono font-normal text-red-400/80">({deficits.length})</span>
      </h3>
      <ul className="flex flex-col gap-2">
        {deficits.map(inp => {
          const item = items[inp.itemId];
          return (
            <li key={inp.id || inp.itemId} className="flex items-center justify-between bg-[#0b0d10] p-2 rounded border border-[#2a2e39]">
              <div className="flex items-center gap-2 min-w-0">
                {item && <img src={getAssetUrl(item.icon)} alt={item.name} className="w-5 h-5 shrink-0" />}
                <div className="flex flex-col truncate">
                  <span className="text-[#e1e1e6] text-xs font-bold truncate">{item?.name || inp.itemId}</span>
                  {inp.sourceStageName && (
                    <span className="text-[10px] text-gray-400 truncate">из: {inp.sourceStageName}</span>
                  )}
                </div>
              </div>
              <span className="font-bold text-[#ef4444] shrink-0 text-xs font-mono">-{inp.deficit.toFixed(1)}/м</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
