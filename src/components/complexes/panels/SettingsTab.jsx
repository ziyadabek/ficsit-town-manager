import React from 'react';
import recipesDB from '../../../database/recipes.json';

export default function SettingsTab({
  layoutDirection,
  schematicMode,
  options,
  isStageFrozen,
  onSetLayoutDirection,
  onSetSchematicMode,
  onToggleAltRecipe,
  onSetOption,
  onSetOptimizeMode
}) {
  return (
    <div className="space-y-4 text-xs">
      {/* Верхние выпадающие списки: Направление и Вид схемы */}
      <div className="space-y-2 pb-3 border-b border-[#2d3340]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-gray-200 font-medium">Направление</span>
          <select 
            value={layoutDirection} 
            onChange={e => onSetLayoutDirection(e.target.value)}
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
            onChange={e => onSetSchematicMode(e.target.value)}
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
                onToggleAltRecipe(e.target.value);
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

      {/* Секция: Чистота месторождений и скорость */}
      <div className="pt-2 border-t border-[#2d3340]">
        <div className="text-[#f97316] font-bold text-sm mb-2">Чистота месторождений и скорость</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Добыча руды</span>
            <select 
              value={options.minerPurity || 'normal'}
              onChange={e => onSetOption('minerPurity', e.target.value)}
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
              onChange={e => onSetOption('oilPurity', e.target.value)}
              className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
            >
              <option value="impure">Экстрактор нефти (Бедное месторождение)</option>
              <option value="normal">Экстрактор нефти (Обычное месторождение)</option>
              <option value="pure">Экстрактор нефти (Чистое месторождение)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Добыча воды</span>
            <select 
              value={options.waterPurity || 'normal'}
              onChange={e => onSetOption('waterPurity', e.target.value)}
              className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
            >
              <option value="impure">Экстрактор воды (Бедное месторождение)</option>
              <option value="normal">Экстрактор воды (Обычное месторождение)</option>
              <option value="pure">Экстрактор воды (Чистое месторождение)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Добыча газа</span>
            <select 
              value={options.gasPurity || 'normal'}
              onChange={e => onSetOption('gasPurity', e.target.value)}
              className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
            >
              <option value="impure">Экстрактор скважины (Бедное месторождение)</option>
              <option value="normal">Экстрактор скважины (Обычное месторождение)</option>
              <option value="pure">Экстрактор скважины (Чистое месторождение)</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Максимальная скорость ленты</span>
            <select 
              value={options.maxBelt || 1200}
              onChange={e => onSetOption('maxBelt', Number(e.target.value))}
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
              onChange={e => onSetOption('maxPipe', Number(e.target.value))}
              className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
            >
              <option value={300}>Трубопровод ур. 1 / 300 м³</option>
              <option value={600}>Трубопровод ур. 2 / 600 м³</option>
            </select>
          </div>
        </div>
      </div>

      {/* Секция: Разгон станков (Экспериментально) */}
      <div className="pt-2 border-t border-[#2d3340]">
        <div className="text-[#f97316] font-bold text-sm mb-2">Разгон станков (Экспериментально)</div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Доступные энергомодули</span>
            <input 
              type="number" 
              min="0"
              value={options.powerShards || 0}
              onChange={e => onSetOption('powerShards', Number(e.target.value))}
              className="bg-white text-black font-bold font-mono px-3 py-1 rounded w-48 text-center text-xs shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Доступные Петлевики</span>
            <input 
              type="number" 
              min="0"
              value={options.somersloops || 0}
              onChange={e => onSetOption('somersloops', Number(e.target.value))}
              className="bg-white text-black font-bold font-mono px-3 py-1 rounded w-48 text-center text-xs shadow-inner"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Применять строения повторно при возможности</span>
            <select 
              value={options.reuseBuildings !== false ? 'yes' : 'no'}
              onChange={e => onSetOption('reuseBuildings', e.target.value === 'yes')}
              className="bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-2.5 py-1.5 rounded border border-[#6b7685] cursor-pointer w-48 truncate"
            >
              <option value="yes">Да</option>
              <option value="no">Нет</option>
            </select>
          </div>

          {/* ОПЦИЯ: Использовать разветвитель/соединитель (Ключевая опция из оригинального SCIM) */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-gray-200">Использовать разветвитель/соединитель</span>
            <select 
              value={options.useSplitters !== false ? 'yes' : 'no'}
              onChange={e => onSetOption('useSplitters', e.target.value === 'yes')}
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
              onChange={e => onSetOption('maxTier', e.target.value)}
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
          onChange={e => onSetOptimizeMode(e.target.value)} 
          className="w-full bg-[#8f9aa8] text-[#14171f] font-semibold text-xs px-3 py-2 rounded border border-[#6b7685] cursor-pointer"
        >
          <option value="raw">Минимизировать сырье (Рекомендуется)</option>
          <option value="power">Минимизировать энергию (МВт)</option>
          <option value="machines">Минимизировать число станков</option>
        </select>
      </div>
    </div>
  );
}
