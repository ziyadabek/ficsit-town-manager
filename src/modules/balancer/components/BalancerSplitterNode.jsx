import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { getAssetUrl } from '../../../database/assets';

export default function BalancerSplitterNode({ data }) {
  const iconPath = '/icons/Conveyor Supports/ConveyorSplitter.png';

  return (
    <div className="flex flex-col items-center justify-center relative select-none w-20 py-1">
      <div className="w-16 h-16 relative flex items-center justify-center transition-transform hover:scale-105">
        {/* Входной порт слева */}
        <Handle 
          type="target" 
          position={Position.Left} 
          id="in" 
          style={{ left: 2, top: '50%' }}
          className="w-2.5 h-2.5 !bg-[#f97316] !border-none opacity-80" 
        />

        {/* 3D кубик сплиттера */}
        <img 
          src={getAssetUrl(iconPath)} 
          alt="Splitter" 
          className="w-14 h-14 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)]" 
        />

        {/* 3 выхода справа */}
        <Handle 
          type="source" 
          position={Position.Right} 
          id="out" 
          style={{ top: '25%', right: 2 }}
          className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          title="Верхний выход"
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="out-1" 
          style={{ top: '50%', right: 2 }}
          className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          title="Средний выход"
        />
        <Handle 
          type="source" 
          position={Position.Right} 
          id="out-2" 
          style={{ top: '75%', right: 2 }}
          className="w-2.5 h-2.5 !bg-[#3b82f6] !border-none opacity-80" 
          title="Нижний выход"
        />
      </div>
    </div>
  );
}
