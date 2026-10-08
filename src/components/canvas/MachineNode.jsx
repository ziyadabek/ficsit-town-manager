import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getItemIcon, getBuildingIcon } from '../../database/assets';
import buildings from '../../database/buildings.json';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';
import { getAssetUrl } from '../../database/assets';


export default function MachineNode({ id, data }) {
  const activePresetId = useFactoryStore(state => state.activePresetId);
  const nodeId = id || data.id || (data.recipeId ? `recipe_${data.recipeId}` : (data.isInput ? (data.isImport ? `import_${data.itemId}` : `mine_${data.itemId}`) : data.label));
  const isBuilt = useFactoryStore(state => 
    Boolean(state.builtNodes[activePresetId || 'free_mode']?.[nodeId])
  );
  const toggleNodeBuilt = useFactoryStore(state => state.toggleNodeBuilt);

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
    const ringColor = '#38bdf8';
    const tooltip = `Замкнутый гидроконтур: возврат ${data.byproduct?.toFixed(1) || 0} м³/мин + подпитка ${data.makeup?.toFixed(1) || 0} м³/мин`;

    return (
      <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
        {/* Круглый SCIM-узел VIP гидроконтура */}
        <div 
          onClick={() => toggleNodeBuilt(nodeId)}
          className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            isBuilt ? 'bg-[#15803d] shadow-[0_0_16px_rgba(34,197,94,0.6)]' : 'bg-[#181a20]'
          }`}
          style={{
            border: `3.5px solid ${isBuilt ? '#22c55e' : ringColor}`,
            boxShadow: isBuilt ? '0 0 16px rgba(34,197,94,0.6)' : '0 0 12px rgba(56,189,248,0.4)'
          }}
          title={isBuilt ? 'VIP Гидроконтур зафиксирован (нажмите для отмены)' : `${tooltip} • Кликните для фиксации постройки`}
        >
          {/* Иконка перекрестка труб или воды */}
          <img 
            src={getAssetUrl('/icons/Conveyor Supports/PipelineJunction.png')} 
            alt="VIP Junction" 
            className="w-12 h-12 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
            onError={e => { e.target.src = getAssetUrl(item?.icon); }}
          />

          {/* Мини-бейдж VIP */}
          <div 
            className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#0b0e14] border border-[#38bdf8] text-[9px] font-black font-mono shadow-md z-10 text-[#38bdf8]"
            title="Приоритетный клапан рециркуляции"
          >
            VIP
          </div>

          {/* Пилл-бейдж расхода воды на нижнем краю круга */}
          <div 
            className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#0b0e14] border border-[#38bdf8] text-[10px] font-black font-mono shadow-lg z-10 whitespace-nowrap text-[#38bdf8]"
          >
            💧 {data.rate?.toFixed(1)}/м
          </div>

          {/* Входные порты (подпитка и возврат) */}
          <Handle 
            type="target" 
            position={targetPos} 
            id={`in-${data.itemId}`} 
            style={isVertical ? { top: 4 } : { left: 4 }}
            className="w-2.5 h-2.5 !bg-[#0ea5e9] !border-none opacity-80" 
            title="Вход воды"
          />
          {/* Выходной порт подачи в цех */}
          <Handle 
            type="source" 
            position={sourcePos} 
            id={`out-${data.itemId}`} 
            style={isVertical ? { bottom: 4 } : { right: 4 }}
            className="w-2.5 h-2.5 !bg-[#38bdf8] !border-none opacity-80" 
            title="Выход воды в производство"
          />
        </div>

        {/* Подпись под кругом */}
        <div className="flex flex-col items-center text-center mt-2 leading-tight w-full px-1">
          <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate w-full">
            VIP Гидроконтур
          </span>
          <span className="text-[10px] text-cyan-400 font-medium truncate w-full mt-0.5">
            Возврат: {data.byproduct?.toFixed(1) || 0} м³
          </span>
        </div>
      </div>
    );
  }

  if (isInput) {
    const item = items[data.itemId];
    
    if (data.isImport || data.isTransit) {
      // ЕДИНЫЙ SCIM-СТАНДАРТ ТРАНСПОРТНЫХ И ТРАНЗИТНЫХ УЗЛОВ ДЛЯ ВСЕХ ЭТАПОВ
      const hasDeficit = Boolean(data.deficit && data.deficit > 0.001);
      const ringColor = hasDeficit ? '#f97316' : '#38bdf8';
      const shadowColor = hasDeficit ? 'rgba(249,115,22,0.4)' : 'rgba(56,189,248,0.4)';

      const tpm = data.transport?.tripsPerMinute || 0;
      let freqStr = "";
      if (tpm >= 1) freqStr = `${tpm.toFixed(1)} рейс/м`;
      else if (tpm >= 0.1) freqStr = `${tpm.toFixed(2)} рейс/м`;
      else if (tpm > 0) freqStr = `1 рейс / ${(1 / tpm).toFixed(0)} мин`;

      const isFluid = item?.type === 'fluid';
      let vehicleIcon = isFluid ? '/icons/Vehicles/fluid_freight_car.png' : '/icons/Vehicles/tractor.png';
      let vehicleName = isFluid ? 'Ж/Д Цистерна' : 'Трактор';
      let vehicleCount = data.transport?.vehicleCount || 1;

      if (data.transport?.type === 'tractor') {
        vehicleIcon = '/icons/Vehicles/tractor.png';
        vehicleName = 'Трактор (25 слотов)';
      } else if (data.transport?.type === 'train_fluid') {
        vehicleIcon = '/icons/Vehicles/fluid_freight_car.png';
        vehicleName = 'Ж/Д Цистерна';
      } else if (data.transport?.type === 'train_nuclear' || data.transport?.type === 'train') {
        vehicleIcon = '/icons/Vehicles/locomotive.png';
        vehicleName = 'Ж/Д Состав';
      }

      const stageSrc = data.sourceStageName 
        ? (data.sourceStageName.replace('ЭТАП ', 'Эт. '))
        : (data.transport?.type ? 'Межцеховой транзит' : 'Входящий логистический маршрут');

      const tooltip = `${vehicleName}: ${vehicleCount} маш. [${freqStr || 'активный маршрут'}] ${data.sourceStageName ? `из «${data.sourceStageName}»` : ''}`;

      return (
        <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
          {/* Круглый SCIM-узел транзита */}
          <div 
            onClick={() => toggleNodeBuilt(nodeId)}
            className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
              isBuilt ? 'bg-[#15803d] shadow-[0_0_16px_rgba(34,197,94,0.6)]' : 'bg-[#181a20]'
            }`}
            style={{
              border: `3.5px solid ${isBuilt ? '#22c55e' : ringColor}`,
              boxShadow: isBuilt ? '0 0 16px rgba(34,197,94,0.6)' : `0 0 10px ${shadowColor}`
            }}
            title={isBuilt ? 'Транзитный маршрут построен (нажмите для отмены)' : `${tooltip} • Кликните для фиксации постройки`}
          >
            {/* 3D Иконка перевозимого ресурса */}
            {item?.icon && (
              <img 
                src={getAssetUrl(item.icon)} 
                alt={item.name} 
                className="w-14 h-14 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" 
                onError={e => (e.target.style.display = 'none')}
              />
            )}

            {/* Мини-бейдж транспорта в правом верхнем углу */}
            <div 
              className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#0b0e14] border flex items-center justify-center shadow-md z-10 p-0.5"
              style={{ borderColor: ringColor }}
              title={tooltip}
            >
              <img src={getAssetUrl(vehicleIcon)} alt="Vehicle" className="w-4 h-4 object-contain" />
            </div>

            {/* Пилл-бейдж количества машин на верхнем краю */}
            <div 
              className="absolute -top-2 left-1 px-1.5 py-0.2 rounded-full bg-[#0b0e14] border text-[8px] font-mono font-bold shadow-md z-10 text-cyan-300"
              style={{ borderColor: ringColor }}
            >
              {vehicleCount} маш.
            </div>

            {/* Пилл-бейдж скорости на нижнем краю круга */}
            <div 
              className="absolute -bottom-2 px-2 py-0.5 rounded-full bg-[#0b0e14] border text-[10px] font-black font-mono shadow-lg z-10 whitespace-nowrap text-[#22c55e]"
              style={{ borderColor: ringColor }}
            >
              +{data.rate.toFixed(1)}/м
            </div>

            {/* Порт конвейерного выхода */}
            <Handle 
              type="source" 
              position={sourcePos} 
              id={`out-${data.itemId}`} 
              style={isVertical ? { bottom: 4 } : { right: 4 }}
              className={`w-2.5 h-2.5 !border-none opacity-80 ${hasDeficit ? '!bg-[#f97316]' : isFluid ? '!bg-[#0ea5e9]' : '!bg-[#38bdf8]'}`} 
            />
          </div>

          {/* Подпись под кругом: название ресурса и этап-источник */}
          <div className="flex flex-col items-center text-center mt-2 leading-tight w-full px-1">
            <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate w-full" title={item?.name || data.itemId}>
              {item?.name || data.itemId}
            </span>
            <span className="text-[10px] text-cyan-400 font-medium truncate w-full mt-0.5" title={data.sourceStageName || 'Логистический транзит'}>
              ← {stageSrc}
            </span>
            {hasDeficit && (
              <span className="text-[9px] text-[#f97316] font-bold mt-0.5">
                ⚠️ Дефицит -{data.deficit.toFixed(1)}
              </span>
            )}
          </div>
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
          onClick={() => toggleNodeBuilt(nodeId)}
          className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] border-[3.5px] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            isBuilt ? 'bg-[#15803d] border-[#22c55e] shadow-[0_0_16px_rgba(34,197,94,0.6)]' : 'bg-[#181a20] border-[#f97316]'
          }`}
          style={{ boxShadow: isBuilt ? '0 0 16px rgba(34,197,94,0.6)' : '0 0 10px rgba(249,115,22,0.4)' }}
          title={isBuilt ? 'Буровая/Экстрактор построен (нажмите для отмены)' : 'Кликните, чтобы зафиксировать постройку буровой/экстрактора'}
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
    const machinesCount = data.machines || 1;
    const isNuclear = data.recipeId?.includes('nuclear') || data.buildingId?.includes('nuclear');
    const ringColor = isNuclear ? '#22c55e' : '#f59e0b';
    const textColor = isNuclear ? 'text-[#4ade80]' : 'text-[#fbbf24]';
    const machineCountStr = ` (${machinesCount.toFixed(machinesCount % 1 !== 0 ? 1 : 0)} шт)`;

    return (
      <div className="flex flex-col items-center justify-center relative select-none w-[150px] py-1">
        {/* Круглый узел генератора в едином масштабе SCIM */}
        <div 
          onClick={() => toggleNodeBuilt(nodeId)}
          className={`w-20 h-20 rounded-full flex items-center justify-center relative shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all cursor-pointer hover:scale-105 active:scale-95 ${
            isBuilt ? 'bg-[#15803d] shadow-[0_0_16px_rgba(34,197,94,0.6)]' : 'bg-[#161a22]'
          }`}
          style={{
            border: `3.5px solid ${isBuilt ? '#22c55e' : ringColor}`,
            boxShadow: isBuilt ? '0 0 16px rgba(34,197,94,0.6)' : `0 0 14px ${ringColor}60`
          }}
          title={isBuilt ? 'Генератор построен (нажмите для отмены)' : 'Кликните, чтобы зафиксировать постройку генератора'}
        >
          {building?.icon && (
            <img 
              src={getAssetUrl(building.icon)} 
              alt={building.name} 
              className="w-14 h-14 object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" 
              onError={e => (e.target.style.display = 'none')}
            />
          )}

          {/* Компактный бейдж молнии в правом верхнем углу */}
          <div 
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#0b0e14] border flex items-center justify-center text-[10px] shadow-md z-10"
            style={{ borderColor: ringColor, color: ringColor }}
            title="Генератор электроэнергии"
          >
            ⚡
          </div>

          {/* Четкий контрастный бейдж количества станков внизу круга */}
          <div 
            className="absolute -bottom-2.5 px-2 py-0.5 rounded-full bg-[#0b0e14] border text-[10px] font-black font-mono shadow-lg z-10 whitespace-nowrap"
            style={{ borderColor: ringColor, color: ringColor }}
          >
            {machinesCount.toFixed(machinesCount % 1 !== 0 ? 1 : 0)} шт.
          </div>

          {/* Input Handles */}
          {data.inputs && data.inputs.map((inp, idx) => {
            const isFluid = inp.itemId === 'water' || inp.itemId === 'fuel' || inp.itemId === 'crude_oil';
            return (
              <Handle 
                key={`in-${inp.itemId}-${idx}`} 
                type="target" 
                position={targetPos} 
                id={`in-${inp.itemId}`} 
                style={getInputHandleStyle(idx, data.inputs.length)} 
                className={`w-2.5 h-2.5 !border-none opacity-90 ${isFluid ? '!bg-[#0ea5e9]' : '!bg-[#f97316]'}`} 
                title={`Вход: ${inp.itemId}`}
              />
            );
          })}
          {(!data.inputs || data.inputs.length === 0) && (
            <Handle 
              type="target" 
              position={targetPos} 
              id="in-generic" 
              style={isVertical ? { top: 4 } : { left: 4 }}
              className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-90" 
            />
          )}

          {/* Output Handles (только побочные продукты, например отходы АЭС) */}
          {data.outputs && data.outputs.map((out, idx) => (
            out.itemId !== 'power' && (
              <Handle 
                key={`out-${out.itemId}-${idx}`} 
                type="source" 
                position={sourcePos} 
                id={`out-${out.itemId}`} 
                style={getOutputHandleStyle(idx, data.outputs.length)} 
                className={`w-2.5 h-2.5 !border-none opacity-90 ${out.itemId === 'nuclear_waste' ? '!bg-[#22c55e]' : '!bg-[#3b82f6]'}`} 
                title={`Выход: ${out.itemId}`}
              />
            )
          ))}
        </div>

        {/* Минималистичная подпись под кругом */}
        <div className="flex flex-col items-center text-center mt-3 leading-tight w-full px-1">
          <span className="text-xs font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate w-full" title={building?.name}>
            {building?.name || 'Генератор'}
          </span>
          <span className={`text-xs font-black font-mono mt-0.5 tracking-tight ${textColor} drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]`}>
            ⚡ +{powerOut >= 1000 ? powerOut.toLocaleString('en-US', { maximumFractionDigits: 1 }) : powerOut.toFixed(1)} MW
          </span>
        </div>
      </div>
    );
  }

  const supportsSomersloop = building?.somersloopSlots > 0;
  const isAmplified = somersloopRecipes.includes(data.recipeId);

  const ringColor = isBuilt ? '#22c55e' : (isAmplified ? '#a855f7' : '#f97316');
  const machineCountStr = data.machines ? ` (${data.machines.toFixed(1)} шт)` : '';

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
        title={isBuilt ? 'Построено (нажмите, чтобы отменить)' : 'Кликните, чтобы зафиксировать постройку станка'}
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
