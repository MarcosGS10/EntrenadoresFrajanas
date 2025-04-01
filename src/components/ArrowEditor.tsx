import React from 'react';
import { Lock, Unlock, Group, Ungroup, RotateCcw } from 'lucide-react';
import { Arrow } from '../types';
import { DirectionalArrow } from './DirectionalArrows';

interface ArrowEditorProps {
  arrow: Arrow;
  onUpdate: (arrow: Arrow) => void;
  onGroup: (arrowId: string) => void;
  onUngroup: (arrowId: string) => void;
}

export function ArrowEditor({ arrow, onUpdate, onGroup, onUngroup }: ArrowEditorProps) {
  const handleNumberChange = (field: keyof Arrow, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({ ...arrow, [field]: numValue });
    }
  };

  const handleRotationChange = (value: string) => {
    const rotation = parseFloat(value);
    if (!isNaN(rotation)) {
      // Normalizar la rotación entre 0 y 360 grados
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      onUpdate({ ...arrow, rotation: normalizedRotation });
    }
  };

  const toggleLock = () => {
    onUpdate({ ...arrow, locked: !arrow.locked });
  };

  const handleGroupAction = () => {
    if (arrow.groupId) {
      onUngroup(arrow.id);
    } else {
      onGroup(arrow.id);
    }
  };

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDirection = e.target.value as Arrow['direction'];
    let updatedArrow = { ...arrow, direction: newDirection };
    
    // Actualizar tipo basado en la dirección
    if (newDirection?.includes('bidirectional')) {
      updatedArrow.type = 'bidirectional';
    } else if (newDirection?.includes('curve')) {
      updatedArrow.type = 'curved';
      updatedArrow.curved = true;
      
      // Si no tiene punto de control, añadirlo
      if (!updatedArrow.controlPoint) {
        updatedArrow.controlPoint = {
          x: (updatedArrow.startX + updatedArrow.endX) / 2,
          y: (updatedArrow.startY + updatedArrow.endY) / 2 - 25
        };
      }
    } else {
      updatedArrow.type = 'straight';
      updatedArrow.curved = false;
    }
    
    onUpdate(updatedArrow);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Editar Flecha</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleLock}
            className={`p-2 rounded ${
              arrow.locked ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={arrow.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {arrow.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={handleGroupAction}
            className={`p-2 rounded ${
              arrow.groupId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={arrow.groupId ? 'Desagrupar' : 'Agrupar'}
          >
            {arrow.groupId ? <Ungroup className="w-4 h-4" /> : <Group className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Inicio X</label>
          <input
            type="number"
            value={arrow.startX}
            onChange={(e) => handleNumberChange('startX', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Inicio Y</label>
          <input
            type="number"
            value={arrow.startY}
            onChange={(e) => handleNumberChange('startY', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fin X</label>
          <input
            type="number"
            value={arrow.endX}
            onChange={(e) => handleNumberChange('endX', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Fin Y</label>
          <input
            type="number"
            value={arrow.endY}
            onChange={(e) => handleNumberChange('endY', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Longitud</label>
          <input
            type="number"
            value={arrow.length}
            onChange={(e) => handleNumberChange('length', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ancho de línea</label>
          <input
            type="number"
            min="1"
            max="10"
            value={arrow.lineWidth}
            onChange={(e) => handleNumberChange('lineWidth', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rotación (grados)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={arrow.rotation}
              onChange={(e) => handleRotationChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={arrow.locked}
            />
            <button
              onClick={() => handleRotationChange('0')}
              className="mt-1 p-2 rounded bg-gray-100 hover:bg-gray-200"
              disabled={arrow.locked}
              title="Restablecer rotación"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <div className="flex items-center gap-2 mt-1">
            <DirectionalArrow 
              direction={arrow.direction || 'right'} 
              size={20} 
              color={arrow.color}
            />
            <select
              value={arrow.direction || 'right'}
              onChange={handleDirectionChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={arrow.locked}
            >
              <option value="right">Derecha</option>
              <option value="left">Izquierda</option>
              <option value="up">Arriba</option>
              <option value="down">Abajo</option>
              <option value="up-right">Arriba-Derecha</option>
              <option value="up-left">Arriba-Izquierda</option>
              <option value="down-right">Abajo-Derecha</option>
              <option value="down-left">Abajo-Izquierda</option>
              <option value="curve-right-up">Curva Derecha-Arriba</option>
              <option value="curve-right-down">Curva Derecha-Abajo</option>
              <option value="curve-left-up">Curva Izquierda-Arriba</option>
              <option value="curve-left-down">Curva Izquierda-Abajo</option>
              <option value="bidirectional-horizontal">Bidireccional Horizontal</option>
              <option value="bidirectional-vertical">Bidireccional Vertical</option>
              <option value="bidirectional-all">Bidireccional Todas Direcciones</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Estilo de punta</label>
          <select
            value={arrow.headStyle}
            onChange={(e) => onUpdate({ ...arrow, headStyle: e.target.value as Arrow['headStyle'] })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          >
            <option value="triangle">Triangular</option>
            <option value="diamond">Rombo</option>
            <option value="circle">Círculo</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Color</label>
          <input
            type="color"
            value={arrow.color}
            onChange={(e) => onUpdate({ ...arrow, color: e.target.value })}
            className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={arrow.locked}
          />
        </div>
      </div>
    </div>
  );
}