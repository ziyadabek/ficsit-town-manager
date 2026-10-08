import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';
import buildings from '../../database/buildings.json';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function PhysicalMachineNode({ id, data }) {
  const activePresetId = useFactoryStore(state => state.activePresetId);
  const nodeId = id || data.id || `${data.recipeId}_${data.machineIndex || 0}`;
  const isBuilt = useFactoryStore(state => 
    Boolean(state.builtNodes[activePresetId || 'free_mode']?.[nodeId])
  );
  const toggleNodeBuilt = useFactoryStore(state => state.toggleNodeBuilt);

  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';

  const building = buildings[data.buildingId];
  const item = items[data.itemId];
  const clockSpeed = data.clockSpeed ?? 100;
  
  const isGenerator = Boolean(
    data.recipeId?.startsWith('recipe_power_') || 
    data.itemId === 'power' ||
    ['coal_generator', 'fuel_generator', 'nuclear_power_plant', 'biomass_burner'].includes(data.buildingId)
  );
  const isNuclear = data.recipeId?.includes('nuclear') || data.buildingId === 'nuclear_power_plant';
  const powerProduced = isGenerator ? (data.rate || (data.outputs?.find(o => o.itemId === 'power')?.rate) || 0) : null;
  
  let defaultRingColor = clockSpeed >= 70 ? '#f97316' : '#ea580c';
  if (isGenerator) {
    defaultRingColor = isNuclear ? '#10b981' : '#eab308';
  }
  const ringColor = isBuilt ? '#22c55e' : defaultRingColor;
  const badgeColor = ringColor;

  const targetPos = isVertical ? Position.Top : Position.Left;
  const sourcePos = isVertical ? Position.Bottom : Position.Right;

  const getInputHandleStyle = (idx, total) => {
    if (isVertical) {
      return { left: `${(idx + 1) * 100 / (total + 1)}%`, top: 4 };
    }
    return { top: `${(idx + 1) * 100 / (total + 1)}%`, left: 4 };
  };

  const getOutputHandleStyle = (idx, total) => {
    if (isVertical) {
      return { left: `${(idx + 1) * 100 / (total + 1)}%`, bottom: 4 };
    }
    return { top: `${(idx + 1) * 100 / (total + 1)}%`, right: 4 };
  };

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
      {/* Круглый узел станка в точности как в оригинале SCIM */}
      <div 
        onClick={() => toggleNodeBuilt(nodeId)}
        className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
          isBuilt ? 'bg-[#15803d] shadow-[0_0_16px_rgba(34,197,94,0.6)]' : 'bg-[#181a20]'
        }`}
        style={{
          border: `3.5px solid ${ringColor}`,
          boxShadow: isBuilt ? '0 0 16px rgba(34,197,94,0.6)' : `0 0 10px ${ringColor}40`
        }}
        title={isBuilt ? 'Построено (нажмите для отмены)' : 'Кликните, чтобы зафиксировать постройку'}
      >
        {building?.icon && (
          <img 
            src={getAssetUrl(building.icon)} 
            alt={building.name} 
            className="w-14 h-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
            onError={e => (e.target.style.display = 'none')}
          />
        )}

        {/* Бейдж молнии для электростанций */}
        {isGenerator && (
          <div 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0b0e14] border flex items-center justify-center text-[10px] shadow-md z-10"
            style={{ borderColor: ringColor, color: ringColor }}
            title="Генератор электроэнергии"
          >
            ⚡
          </div>
        )}

        {/* Номер станка в группе на нижнем краю круга */}
        {data.totalMachinesInGroup > 1 && (
          <div 
            className="absolute -bottom-2 px-1.5 py-0.2 rounded-full bg-[#0b0e14] border text-[9px] font-mono font-bold shadow-md z-10 text-gray-300"
            style={{ borderColor: ringColor }}
          >
            #{(data.machineIndex ?? 0) + 1}
          </div>
        )}

        {/* Input Handles на окружности */}
        {data.inputs && data.inputs.map((inp, idx) => {
          const isFluid = inp.itemId === 'water' || inp.itemId?.includes('oil') || inp.itemId?.includes('fuel') || inp.itemId?.includes('acid');
          return (
            <Handle 
              key={`in-${inp.itemId}-${idx}`} 
              type="target" 
              position={targetPos} 
              id={`in-${inp.itemId}`} 
              style={getInputHandleStyle(idx, data.inputs.length)} 
              className={`w-2.5 h-2.5 !border-none opacity-85 ${isFluid ? '!bg-[#0ea5e9]' : '!bg-[#f97316]'}`} 
              title={`Вход: ${items[inp.itemId]?.name || inp.itemId}`}
            />
          );
        })}
        {(!data.inputs || data.inputs.length === 0) && (
          <Handle 
            type="target" 
            position={targetPos} 
            id="in-generic" 
            className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
          />
        )}

        {/* Output Handles на окружности (power не имеет конвейера) */}
        {data.outputs && data.outputs.map((out, idx) => {
          if (out.itemId === 'power') return null;
          const isWaste = out.itemId === 'nuclear_waste' || out.itemId === 'plutonium_waste';
          const isFluid = out.itemId === 'water' || out.itemId?.includes('oil') || out.itemId?.includes('fuel');
          return (
            <Handle 
              key={`out-${out.itemId}-${idx}`} 
              type="source" 
              position={sourcePos} 
              id={`out-${out.itemId}`} 
              style={getOutputHandleStyle(idx, data.outputs.length)} 
              className={`w-2.5 h-2.5 !border-none opacity-85 ${isWaste ? '!bg-[#22c55e]' : isFluid ? '!bg-[#0ea5e9]' : '!bg-[#3b82f6]'}`} 
              title={`Выход: ${items[out.itemId]?.name || out.itemId}`}
            />
          );
        })}
        {(!isGenerator && (!data.outputs || data.outputs.length === 0)) && (
          <Handle 
            type="source" 
            position={sourcePos} 
            id="out-generic" 
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        )}
      </div>

      {/* Подпись точно как в SCIM под кругом */}
      <div className="flex flex-col items-center text-center mt-2 leading-tight w-full px-1">
        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate w-full" title={building?.name}>
          {building?.name || 'Станок'} {clockSpeed !== 100 ? `(${clockSpeed.toFixed(0)}%)` : ''}
        </span>
        {isGenerator ? (
          <span 
            className="text-[11px] font-black font-mono mt-0.5 tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]"
            style={{ color: ringColor }}
          >
            ⚡ +{powerProduced} MW
          </span>
        ) : (
          <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate w-full" title={item?.name || data.itemId}>
            ({item?.name || data.itemId})
          </span>
        )}
      </div>
    </div>
  );
}
