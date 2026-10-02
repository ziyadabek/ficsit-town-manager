import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getItemIcon, getBuildingIcon } from '../../database/assets';
import buildings from '../../database/buildings.json';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function СтанокNode({ data }) {
  const somersloopRecipes = useFactoryStore(state => state.options.somersloopRecipes) || [];
  const toggleSomersloop = useFactoryStore(state => state.toggleSomersloop);

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
        
        <Handle type="target" position={Position.Left} id={`in-${data.itemId}`} className="w-4 h-4 bg-[#f97316]" />
        <Handle type="source" position={Position.Right} id={`out-${data.itemId}`} className="w-4 h-4 bg-[#38bdf8]" />
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
                <img src={transIcon} alt="Transport" className="w-5 h-5 object-contain" onError={(e) => e.target.style.display='none'} />
                {transTitle}
              </div>
              {transSub && <span className="text-[10px] text-gray-400">{transSub}</span>}
              <span className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">← {data.sourceStageName}</span>
            </div>
            
            <div className="flex items-center justify-center gap-2 mt-2 bg-[#0b0d10] p-2 rounded">
              {item && <img src={item.icon} alt={item.name} className="w-8 h-8" />}
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
            <Handle type="source" position={Position.Right} id={`out-${data.itemId}`} className={`w-4 h-4 ${hasDeficit ? 'bg-[#f97316]' : 'bg-[#3b82f6]'}`} />
          </div>
        );
      }

      return (
        <div className="bg-[#14171d] border-2 border-[#3b82f6] rounded-md shadow-[0_0_15px_rgba(59,130,246,0.2)] p-3 min-w-[200px] text-center text-[#e1e1e6] relative z-10">
          <div className="text-xs text-[#3b82f6] mb-1 font-bold flex items-center justify-center gap-1">
            <img src="/icons/Conveyor Supports/TrainStation.png" alt="Train" className="w-4 h-4" />
            Входящий ж/д экспресс
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 bg-[#0b0d10] p-2 rounded">
            {item && <img src={item.icon} alt={item.name} className="w-8 h-8" />}
            <div className="text-right">
              <div className="text-sm font-bold">{item?.name}</div>
              <div className="text-xs text-[#22c55e] font-bold">+{data.rate.toFixed(1)} / min</div>
            </div>
          </div>
          <Handle type="source" position={Position.Right} id={`out-${data.itemId}`} className="w-4 h-4 bg-[#3b82f6]" />
        </div>
      );
    }

    return (
      <div className="bg-[#14171d] border border-[#2a2e39] rounded-md shadow-lg p-2 min-w-[150px] text-center text-[#e1e1e6] relative z-10">
        <div className="text-xs text-gray-400 mb-1">Добыча (Сырье)</div>
        <div className="flex items-center justify-center gap-2">
          {item && <img src={item.icon} alt={item.name} className="w-6 h-6" />}
          <span className="font-bold text-[#f97316]">{data.rate.toFixed(1)} / min</span>
        </div>
        <Handle type="source" position={Position.Right} id={`out-${data.itemId}`} className="w-3 h-3 bg-[#f97316]" />
      </div>
    );
  }

  const building = buildings[data.buildingId];
  const item = items[data.itemId];
  const isГенератор = data.outputs?.some(out => out.itemId === 'power');

  if (isГенератор) {
    const powerOut = data.outputs.find(out => out.itemId === 'power').rate;
    return (
      <div className="bg-[#1a202c] border-2 border-[#facc15] rounded-md shadow-[0_0_20px_rgba(250,204,21,0.3)] min-w-[280px] text-[#e1e1e6] relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-[#facc15]/30 bg-[#facc15]/10 gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {building && <img src={building.icon} alt={building.name} className="w-8 h-8 object-contain shrink-0 drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />}
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
            position={Position.Left} 
            id={`in-${inp.itemId}`} 
            style={{ top: `${(idx + 1) * 100 / (data.inputs.length + 1)}%` }} 
            className="w-4 h-4 bg-[#f97316]" 
          />
        ))}
        {data.outputs && data.outputs.map((out, idx) => (
          out.itemId !== 'power' && (
            <Handle 
              key={`out-${out.itemId}-${idx}`} 
              type="source" 
              position={Position.Right} 
              id={`out-${out.itemId}`} 
              style={{ top: `${(idx + 1) * 100 / (data.outputs.length + 1)}%` }} 
              className={`w-4 h-4 ${out.itemId === 'nuclear_waste' ? 'bg-[#22c55e]' : 'bg-[#3b82f6]'}`} 
            />
          )
        ))}
      </div>
    );
  }

  const supportsSomersloop = building?.somersloopSlots > 0;
  const isAmplified = somersloopRecipes.includes(data.recipeId);

  return (
    <div className={`bg-[#14171d] border rounded-md shadow-lg min-w-[250px] text-[#e1e1e6] relative z-10 transition-colors ${isAmplified ? 'border-[#a855f7] shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-[#2a2e39]'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-2 border-b rounded-t-md ${isAmplified ? 'bg-[#a855f7]/20 border-[#a855f7]/50' : 'bg-[#0b0d10] border-[#2a2e39]'}`}>
        <div className="flex items-center gap-2">
          {building && <img src={building.icon} alt={building.name} className="w-8 h-8 rounded bg-gray-800" />}
          <span className="font-semibold">{building?.name || 'Станок'}</span>
        </div>
        <div className="flex gap-2 items-center">
          {supportsSomersloop && (
            <button 
              onClick={() => toggleSomersloop(data.recipeId)}
              title="Усилитель Somersloop"
              className={`w-5 h-5 flex items-center justify-center rounded transition-all hover:scale-110 ${isAmplified ? 'opacity-100 shadow-[0_0_5px_rgba(168,85,247,1)]' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100'}`}
            >
              <img src="/icons/Tools/somersloop.png" className="w-4 h-4 object-contain" alt="S" />
            </button>
          )}
          {isAmplified && (
            <div className="text-[9px] bg-[#a855f7] text-white px-1.5 py-0.5 rounded font-black shadow-[0_0_5px_rgba(168,85,247,1)] flex items-center">
              x2 AMPLIFIED
            </div>
          )}
          <div className="text-xs bg-[#f97316] text-black px-1 rounded flex items-center">
            {data.clockSpeed}%
          </div>
        </div>
      </div>
      
      {/* Body */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-400">Станков: {data.machines.toFixed(2)}</span>
          <span className={`text-xs ${isAmplified ? 'text-[#ef4444] font-bold drop-shadow-[0_0_2px_rgba(239,68,68,1)]' : 'text-[#a855f7]'}`}>-{data.power.toFixed(1)} MW</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-700 h-2 rounded mb-3 overflow-hidden">
          <div className="bg-[#22c55e] h-full" style={{ width: '100%' }}></div>
        </div>

        {/* Recipe / Output */}
        <div className="flex items-center justify-center gap-2 bg-[#0b0d10] p-2 rounded">
          {item && <img src={item.icon} alt={item.name} className="w-8 h-8" />}
          <div className="text-right">
            <div className="text-sm font-bold">{item?.name}</div>
            <div className={`text-xs ${isAmplified ? 'text-[#a855f7] font-black text-[14px]' : 'text-[#f97316]'}`}>{data.rate.toFixed(1)} / min</div>
          </div>
        </div>

        
      </div>

      {data.inputs && data.inputs.map((inp, idx) => (
        <Handle 
          key={`in-${inp.itemId}-${idx}`} 
          type="target" 
          position={Position.Left} 
          id={`in-${inp.itemId}`} 
          style={{ top: `${(idx + 1) * 100 / (data.inputs.length + 1)}%` }} 
          className="w-3 h-3 bg-[#f97316]" 
        />
      ))}
      
      {data.outputs && data.outputs.map((out, idx) => (
        <Handle 
          key={`out-${out.itemId}-${idx}`} 
          type="source" 
          position={Position.Right} 
          id={`out-${out.itemId}`} 
          style={{ top: `${(idx + 1) * 100 / (data.outputs.length + 1)}%` }} 
          className="w-3 h-3 bg-[#3b82f6]" 
        />
      ))}
      
      {(!data.inputs || data.inputs.length === 0) && (
        <Handle type="target" position={Position.Left} id={`in-generic`} className="w-3 h-3 bg-[#f97316]" />
      )}
      {(!data.outputs || data.outputs.length === 0) && (
        <Handle type="source" position={Position.Right} id={`out-generic`} className="w-3 h-3 bg-[#3b82f6]" />
      )}
    </div>
  );
}
