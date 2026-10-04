import React, { useState, useRef, useEffect } from 'react';
import recipesDB from '../../../database/recipes.json';
import items from '../../../database/items.json';
import { getAssetUrl } from '../../../database/assets';
import { useFactoryStore } from '../../../store/useFactoryStore';

/**
 * RecipeSelectorDropdown: authentic SCIM dropdown to select specific recipe for an item with formula preview
 */
export default function RecipeSelectorDropdown({ itemId, selectedRecipeId, onChange }) {
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
                {recipe.inputs.map((inp) => (
                  <span key={inp.itemId} className="flex items-center gap-1 bg-[#121620] px-1.5 py-0.5 rounded border border-[#2b3342]">
                    {items[inp.itemId]?.icon && (
                      <img src={getAssetUrl(items[inp.itemId].icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    <span>{items[inp.itemId]?.name || inp.itemId} ({inp.rate}/мин)</span>
                  </span>
                ))}
                <span className="text-gray-500 font-bold">➜</span>
                {recipe.outputs.map((out) => (
                  <span key={out.itemId} className="flex items-center gap-1 bg-[#121620] px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-300 font-medium">
                    {items[out.itemId]?.icon && (
                      <img src={getAssetUrl(items[out.itemId].icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    )}
                    <span>{out.rate}/мин</span>
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
