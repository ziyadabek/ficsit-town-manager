import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getItemIcon, getBuildingIcon } from '../../database/assets';
import buildings from '../../database/buildings.json';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';
import { getAssetUrl } from '../../database/assets';


export default function MachineNode({ data }) {
  const somersloopRecipes = useFactoryStore(state => state.options.somersloopRecipes) || [];
  const toggleSomersloop = useFactoryStore(state => state.toggleSomersloop);
  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';
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

  const isInput = data.isInput;
  const isVIP = data.isVIP;

  if (isVIP) {
    const item = items[data.itemId];
    return (
      <div className="bg-[#1a202c] border-2 border-[#38bdf8] rounded-md shadow-[0_0_20px_rgba(56,189,248,0.4)] p-4 min-w-[300px] text-center text-[#e1e1e6] relative z-10">
        <div className="text-sm text-[#38bdf8] mb-2 font-bold flex items-center justify-center gap-2">
          <span className="text-xl">💧</span> Замкнутый гидроконтур
        </div>
        <div className="text-xs text-gray-300 mb-3 text-left">
          <div className="flex justify-between items-center mb-1">
            <span>Возврат побочной воды:</span>
            <span className="font-bold text-[#38bdf8]">{data.byproduct.toFixed(1)} м³/мин</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Внешняя подпитка (Помпы):</span>
            <span className="font-bold text-[#f97316]">{data.makeup.toFixed(1)} м³/мин</span>
          </div>
        </div>
        <div className="text-[10px] text-gray-400 mt-2 p-2 bg-[#0b0d10] border border-[#2a2e39] rounded">
          ⚠️ Рекомендуется подача через приоритетный клапан (VIP Junction) для предотвращения гидроудара.
        </div>
        
        <Handle type="target" position={targetPos} id={`in-${data.itemId}`} className="w-4 h-4 bg-[#f97316]" />
        <Handle type="source" position={sourcePos} id={`out-${data.itemId}`} className="w-4 h-4 bg-[#38bdf8]" />
      </div>
    );
  }

  if (isInput) {
    const item = items[data.itemId];
    
    if (data.isImport) {
      if (data.isTransit) {
        // Special UI for Inter-Stage Transit
        const hasDeficit = data.deficit && data.deficit > 0.001;
        
        let transTitle = "Входящий транзит";
        let transIcon = "/icons/Vehicles/tractor.png";
        let transSub = "";
        
        if (data.transport) {
          if (data.transport.type === 'tractor') {
            transTitle = `Трактор (25 слотов)`;
            transIcon = "/icons/Vehicles/tractor.png";
            transSub = `${data.transport.vehicleCount} маш. [${data.transport.tripsPerMinute.toFixed(1)} рейс/м]`;
          } else if (data.transport.type === 'train_fluid') {
            transTitle = `Ж/Д Состав: ${data.transport.vehicleCount} цистерн`;
            transIcon = "/icons/Vehicles/fluid_freight_car.png";
            transSub = `(1600 м³ / вагон)`;
          } else if (data.transport.type === 'train_nuclear') {
            transTitle = `Ядерный экспресс: ${data.transport.vehicleCount} вагон`;
            transIcon = "/icons/Vehicles/locomotive.png";
            transSub = `(Радиационная изоляция)`;
          }
        }

        return (
          <div className={`bg-[#101926] border-2 ${hasDeficit ? 'border-[#f97316] shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)]'} rounded-md p-3 min-w-[240px] text-center text-[#e1e1e6] relative z-10`}>
            <div className={`text-xs ${hasDeficit ? 'text-[#f97316]' : 'text-[#3b82f6]'} mb-1 font-bold flex flex-col items-center justify-center gap-1`}>
              <div className="flex items-center gap-1">
                <img src={getAssetUrl(transIcon)} alt="Transport" className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
                {transTitle}
              </div>
              {transSub && <span className="text-[10px] text-gray-400">{transSub}</span>}
              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">← {data.sourceStageName}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-2 bg-[#0b0d10] p-2 rounded">
              {item && <img src={getAssetUrl(item.icon)} alt={item.name} className="w-8 h-8" />}
              <div className="text-right">
                <div className="text-sm font-bold">{item?.name}</div>
                <div className="text-xs text-[#22c55e] font-bold">+{data.rate.toFixed(1)} / min</div>
              </div>
            </div>

            {hasDeficit && (
              <div className="mt-2 text-[10px] bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/50 rounded px-2 py-1 font-bold">
                ⚠️ Дефицит транзита: -{data.deficit.toFixed(1)} / min
              </div>
            )}
            <Handle type="source" position={sourcePos} id={`out-${data.itemId}`} className={`w-4 h-4 ${hasDeficit ? 'bg-[#f97316]' : 'bg-[#3b82f6]'}`} />
          </div>
        );
      }

      return (
        <div className="bg-[#14171d] border-2 border-[#3b82f6] rounded-md shadow-[0_0_15px_rgba(59,130,246,0.2)] p-3 min-w-[200px] text-center text-[#e1e1e6] relative z-10">
          <div className="text-xs text-[#3b82f6] mb-1 font-bold flex items-center justify-center gap-1">
            <img src={getAssetUrl('/icons/Conveyor Supports/TrainStation.png')} alt="Train" className="w-4 h-4" />
            Входящий ж/д экспресс
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 bg-[#0b0d10] p-2 rounded">
            {item && <img src={getAssetUrl(item.icon)} alt={item.name} className="w-8 h-8" />}
            <div className="text-right">
              <div className="text-sm font-bold">{item?.name}</div>
              <div className="text-xs text-[#22c55e] font-bold">+{data.rate.toFixed(1)} / min</div>
            </div>
          </div>
          <Handle type="source" position={sourcePos} id={`out-${data.itemId}`} className="w-4 h-4 bg-[#3b82f6]" />
        </div>
      );
    }

    const isFluid = item?.type === 'fluid';
    const minerIcon = isFluid 
      ? (data.itemId === 'crude_oil' ? '/icons/Buildings/OilPump.png' : '/icons/Buildings/Waterpump.png')
      : '/icons/Buildings/MinerMk2.png';

    return (
      <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
        <div 
          className="w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] border-[3.5px] border-[#f97316] transition-transform hover:scale-105"
          style={{ boxShadow: '0 0 10px rgba(249,115,22,0.4)' }}
        >
          <img 
            src={getAssetUrl(minerIcon)} 
            alt="Miner" 
            className="w-14 h-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
            onError={e => { e.target.src = getAssetUrl(item?.icon); }}
          />
          <Handle 
            type="source" 
            position={sourcePos} 
            id={`out-${data.itemId}`} 
            style={isVertical ? { bottom: 4 } : { right: 4 }}
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        </div>
        <div className="flex flex-col items-center text-center mt-2 leading-tight">
          <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            {isFluid ? 'Экстрактор' : 'Буровая установка'}
          </span>
          <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
            ({item ? item.name : data.itemId})
          </span>
        </div>
      </div>
    );
  }

  const building = buildings[data.buildingId];
  const item = items[data.itemId];
  const isGenerator = data.outputs?.some(out => out.itemId === 'power');

  if (isGenerator) {
    const powerOut = (data.outputs.find(out => out.itemId === 'power')?.rate || 0) * (data.machines || 1);
    return (
      <div className="bg-[#1a202c] border-2 border-[#facc15] rounded-md shadow-[0_0_20px_rgba(250,204,21,0.3)] min-w-[280px] text-[#e1e1e6] relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-[#facc15]/30 bg-[#facc15]/10 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {building && <img src={getAssetUrl(building.icon)} alt={building.name} className="w-8 h-8 object-contain shrink-0 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />}
            <span className="font-bold text-[#facc15] truncate" title={building?.name}>{building?.name || 'Генератор'}</span>
          </div>
          <div className="text-[10px] bg-[#facc15] text-black px-1.5 py-0.5 rounded font-bold shrink-0 whitespace-nowrap">⚡ ЭЛЕКТРОСТАНЦИЯ</div>
        </div>
        
        {/* Body */}
        <div className="p-4 text-center">
          <div className="text-gray-400 text-sm mb-1">Генерация (МВт)</div>
          <div className="text-4xl font-black text-[#facc15] drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]">
            +{powerOut.toFixed(1)} MW
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {data.machines.toFixed(2)} шт. ({(data.machines % 1 !== 0 ? (data.machines % 1) * 100 : 100).toFixed(0)}%)
          </div>
        </div>

        {/* Handles */}
        {data.inputs && data.inputs.map((inp, idx) => (
          <Handle 
            key={`in-${inp.itemId}-${idx}`} 
            type="target" 
            position={targetPos} 
            id={`in-${inp.itemId}`} 
            style={getInputHandleStyle(idx, data.inputs.length)} 
            className="w-4 h-4 bg-[#f97316]" 
          />
        ))}
        {data.outputs && data.outputs.map((out, idx) => (
          out.itemId !== 'power' && (
            <Handle 
              key={`out-${out.itemId}-${idx}`} 
              type="source" 
              position={sourcePos} 
              id={`out-${out.itemId}`} 
              style={getOutputHandleStyle(idx, data.outputs.length)} 
              className={`w-4 h-4 ${out.itemId === 'nuclear_waste' ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`} 
            />
          )
        ))}
      </div>
    );
  }

  const supportsSomersloop = building?.somersloopSlots > 0;
  const isAmplified = somersloopRecipes.includes(data.recipeId);

  const ringColor = isAmplified ? '#a855f7' : (data.machines >= 1 ? '#22c55e' : '#f97316');
  const machineCountStr = data.machines ? ` (${data.machines.toFixed(1)} шт)` : '';

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
      {/* Круглый узел станка в точности как в оригинале SCIM */}
      <div 
        className="w-20 h-20 rounded-full bg-[#181a20] flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-transform hover:scale-105"
        style={{
          border: `3.5px solid ${ringColor}`,
          boxShadow: `0 0 10px ${ringColor}40`
        }}
      >
        {building?.icon && (
          <img 
            src={getAssetUrl(building.icon)} 
            alt={building.name} 
            className="w-14 h-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
            onError={e => (e.target.style.display = 'none')}
          />
        )}

        {/* Кнопка Somersloop */}
        {supportsSomersloop && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleSomersloop(data.recipeId); }}
            title="Усилитель Somersloop"
            className={`absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0b0d10] border border-[#a855f7] flex items-center justify-center transition-transform hover:scale-125 z-20 ${
              isAmplified ? 'shadow-[0_0_6px_#a855f7]' : 'opacity-40 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
          >
            <img src={getAssetUrl('/icons/Tools/somersloop.png')} className="w-3.5 h-3.5 object-contain" alt="S" />
          </button>
        )}

        {/* Input Handles на окружности */}
        {data.inputs && data.inputs.map((inp, idx) => (
          <Handle 
            key={`in-${inp.itemId}-${idx}`} 
            type="target" 
            position={targetPos} 
            id={`in-${inp.itemId}`} 
            style={getInputHandleStyle(idx, data.inputs.length)} 
            className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
          />
        ))}
        {(!data.inputs || data.inputs.length === 0) && (
          <Handle 
            type="target" 
            position={targetPos} 
            id="in-generic" 
            style={isVertical ? { top: 4 } : { left: 4 }}
            className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
          />
        )}

        {/* Output Handles на окружности */}
        {data.outputs && data.outputs.map((out, idx) => (
          <Handle 
            key={`out-${out.itemId}-${idx}`} 
            type="source" 
            position={sourcePos} 
            id={`out-${out.itemId}`} 
            style={getOutputHandleStyle(idx, data.outputs.length)} 
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        ))}
        {(!data.outputs || data.outputs.length === 0) && (
          <Handle 
            type="source" 
            position={sourcePos} 
            id="out-generic" 
            style={isVertical ? { bottom: 4 } : { right: 4 }}
            className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          />
        )}
      </div>

      {/* Подпись точно как в SCIM под кругом */}
      <div className="flex flex-col items-center text-center mt-2 leading-tight">
        <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          {building?.name || data.label || 'Станок'}{machineCountStr}
        </span>
        <span className="text-[11px] text-gray-300 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
          ({item ? item.name : data.itemId})
        </span>
      </div>
    </div>
  );
}
