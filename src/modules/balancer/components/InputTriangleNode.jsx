import React from 'react';
import { Handle, Position } from '@xyflow/react';

export default function InputTriangleNode({ data }) {
  const color = data?.color || '#ef4444'; // Red default
  const label = data?.label || 'Input';

  return (
    <div className="flex flex-col items-center justify-center select-none relative w-16">
      {/* Треугольник источника в стиле референса */}
      <div 
        className="w-12 h-12 flex items-center justify-center relative transition-transform hover:scale-110 drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
      >
        <svg viewBox="0 0 100 100" className="w-10 h-10 overflow-visible">
          {/* Треугольник вверх ▲ */}
          <polygon 
            points="50,15 90,85 10,85" 
            fill={color}
            filter={`drop-shadow(0 0 6px ${color}80)`}
          />
        </svg>

        {/* Выходной порт справа от треугольника */}
        <Handle
          type="source"
          position={Position.Right}
          id="out"
          style={{ right: 2, top: '50%', backgroundColor: color }}
          className="!w-2.5 !h-2.5 !border-none"
        />
      </div>
    </div>
  );
}
