import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function OutputDiamondNode({ data }) {
  const color = data?.color || '#60a5fa'; // Light blue
  const label = data?.label || 'Output';

  return (
    <div className="flex flex-col items-center justify-center select-none relative w-16">
      {/* Ромбовидный узел приемника в стиле референса */}
      <div 
        className="w-12 h-12 flex items-center justify-center relative transition-transform hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
      >
        {/* Входной порт слева от ромба */}
        <Handle
          type="target"
          position={Position.Left}
          id="in"
          style={{ left: 2, top: '50%', backgroundColor: color }}
          className="!w-2.5 !h-2.5 !border-none"
        />

        <svg viewBox="0 0 100 100" className="w-9 h-9 overflow-visible">
          {/* Ромб ◆ */}
          <polygon 
            points="50,10 90,50 50,90 10,50" 
            fill={color}
            filter={`drop-shadow(0 0 6px ${color}80)`}
          />
        </svg>
      </div>
    </div>
  );
}
