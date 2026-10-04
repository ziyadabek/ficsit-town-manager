import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../database/assets';
import items from '../../database/items.json';
import { useFactoryStore } from '../../store/useFactoryStore';

export default function OutputNode({ data }) {
  const storeDirection = useFactoryStore(state => state.layoutDirection);
  const layoutDirection = data.layoutDirection || storeDirection || 'LR';
  const isVertical = layoutDirection === 'TB';

  const item = items[data.itemId];
  const targetPos = isVertical ? Position.Top : Position.Left;

  return (
    <div className="relative flex items-center justify-center select-none w-16 h-16 !bg-transparent !p-0 !border-none !shadow-none">
      {/* Невидимый целевой порт для подключения конвейерной ленты */}
      <Handle 
        type="target" 
        position={targetPos} 
        id="in" 
        className="!w-2 !h-2 !opacity-0 !border-none !bg-transparent pointer-events-none" 
      />

      {/* Оригинальная 3D-иконка произведенного предмета без кругов, рамок и подписей */}
      {item?.icon && (
        <img 
          src={getAssetUrl(item.icon)} 
          alt={item.name} 
          title={`${item.name} (${data.rate ? data.rate.toFixed(1) : ''} / мин)`}
          className="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] transition-transform hover:scale-110" 
          onError={e => (e.target.style.display = 'none')}
        />
      )}
    </div>
  );
}
