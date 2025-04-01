import React from 'react';
import { ArrowRight, ArrowUpRight, ArrowDown, ArrowUp, CornerRightDown, CornerRightUp } from 'lucide-react';

interface DirectionalArrowProps {
  direction: 'right' | 'up' | 'down' | 'upRight' | 'downRight' | 'curveUp' | 'curveDown';
  color?: string;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export function DirectionalArrow({ 
  direction, 
  color = 'currentColor', 
  size = 24, 
  onClick,
  className = ''
}: DirectionalArrowProps) {
  const getArrow = () => {
    switch (direction) {
      case 'right':
        return <ArrowRight size={size} color={color} />;
      case 'up':
        return <ArrowUp size={size} color={color} />;
      case 'down':
        return <ArrowDown size={size} color={color} />;
      case 'upRight':
        return <ArrowUpRight size={size} color={color} />;
      case 'downRight':
        return <ArrowDown size={size} color={color} />;
      case 'curveUp':
        return <CornerRightUp size={size} color={color} />;
      case 'curveDown':
        return <CornerRightDown size={size} color={color} />;
      default:
        return <ArrowRight size={size} color={color} />;
    }
  };

  return (
    <div 
      className={`cursor-pointer ${className}`} 
      onClick={onClick}
    >
      {getArrow()}
    </div>
  );
}

interface ArrowSelectorProps {
  onSelect: (arrowType: string, isBidirectional: boolean, isCurved: boolean) => void;
  selectedType: string;
  isBidirectional: boolean;
  isCurved: boolean;
}

export function ArrowSelector({ 
  onSelect, 
  selectedType, 
  isBidirectional, 
  isCurved 
}: ArrowSelectorProps) {
  const arrowTypes = [
    { id: 'right', label: 'Derecha', icon: 'right' },
    { id: 'up', label: 'Arriba', icon: 'up' },
    { id: 'down', label: 'Abajo', icon: 'down' },
    { id: 'upRight', label: 'Diagonal arriba', icon: 'upRight' },
    { id: 'downRight', label: 'Diagonal abajo', icon: 'downRight' },
    { id: 'curveUp', label: 'Curva arriba', icon: 'curveUp' },
    { id: 'curveDown', label: 'Curva abajo', icon: 'curveDown' },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm">
      <h3 className="font-medium mb-2">Tipo de Flecha</h3>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {arrowTypes.map((arrow) => (
          <div
            key={arrow.id}
            className={`p-2 flex flex-col items-center justify-center rounded cursor-pointer ${
              selectedType === arrow.id ? 'bg-green-100 text-green-800' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            onClick={() => onSelect(arrow.id, isBidirectional, arrow.id.includes('curve'))}
            title={arrow.label}
          >
            <DirectionalArrow direction={arrow.icon as any} />
            <span className="text-xs mt-1">{arrow.label}</span>
          </div>
        ))}
      </div>
      
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id="bidirectional"
          checked={isBidirectional}
          onChange={(e) => onSelect(selectedType, e.target.checked, isCurved)}
          className="mr-2"
        />
        <label htmlFor="bidirectional" className="text-sm">Bidireccional</label>
      </div>
    </div>
  );
}