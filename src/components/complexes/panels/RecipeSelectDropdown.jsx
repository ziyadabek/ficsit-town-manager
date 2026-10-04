import React, { useState, useRef, useEffect } from 'react';
import recipesDB from '../../../database/recipes.json';
import items from '../../../database/items.json';
import { getAssetUrl } from '../../../database/assets';

/**
 * Dropdown component for selecting recipes with formula previews
 */
export default function RecipeSelectDropdown({ target, onSelectRecipe, disabled }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableRecipes = recipesDB.filter(r => 
    r.outputs && r.outputs.some(out => out.itemId === target.itemId)
  );

  if (availableRecipes.length === 0) return null;

  const currentRecipe = target.recipeId 
    ? availableRecipes.find(r => r.id === target.recipeId) || availableRecipes[0]
    : availableRecipes.find(r => !r.isAlternate) || availableRecipes[0];

  return (
    <div className="relative mt-2" ref={dropdownRef}>
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-[#15171e] border border-[#2d3340] rounded px-2.5 py-1.5 flex items-center justify-between text-xs cursor-pointer hover:border-[#f97316]/60 transition-colors ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      >
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className={`text-[10px] px-1 rounded font-bold uppercase shrink-0 ${
            currentRecipe?.isAlternate ? 'bg-[#f97316]/20 text-[#f97316]' : 'bg-[#2a2e39] text-gray-300'
          }`}>
            {currentRecipe?.isAlternate ? 'Альт' : 'Стандарт'}
          </span>
          <span className="text-gray-200 truncate font-medium">
            {currentRecipe?.name || 'Рецепт'}
          </span>
        </div>
        <span className="text-gray-400 text-[10px] ml-1 shrink-0">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-[#1a1c24] border border-[#3b4252] rounded shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-[#2a2e39]">
          {availableRecipes.map(recipe => (
            <div 
              key={recipe.id}
              onClick={() => {
                onSelectRecipe(recipe.id);
                setIsOpen(false);
              }}
              className={`p-2 cursor-pointer hover:bg-[#252936] transition-colors ${
                recipe.id === currentRecipe?.id ? 'bg-[#2a2e38]' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${recipe.isAlternate ? 'text-[#f97316]' : 'text-gray-200'}`}>
                  {recipe.isAlternate ? '✦ ' : ''}{recipe.name}
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {recipe.outputs.find(o => o.itemId === target.itemId)?.rate || 0} шт/мин
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-gray-400">
                {recipe.inputs.map((inp, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-[#12141a] px-1.5 py-0.5 rounded border border-[#2a2e39]/60">
                    <img src={getAssetUrl(items[inp.itemId]?.icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    <span>{inp.rate}</span>
                  </span>
                ))}
                <span>➔</span>
                {recipe.outputs.map((out, idx) => (
                  <span key={idx} className="flex items-center gap-1 bg-[#12141a] px-1.5 py-0.5 rounded border border-[#2a2e39]/60">
                    <img src={getAssetUrl(items[out.itemId]?.icon)} alt="" className="w-3.5 h-3.5 object-contain" />
                    <span>{out.rate}</span>
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
