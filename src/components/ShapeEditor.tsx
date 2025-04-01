import React from 'react';
import { Lock, Unlock, Group, Ungroup, RotateCcw } from 'lucide-react';
import { Shape } from '../types';
import { DirectionalArrow } from './DirectionalArrows';

interface ShapeEditorProps {
  shape: Shape;
  onUpdate: (shape: Shape) => void;
  onGroup: (shapeId: string) => void;
  onUngroup: (shapeId: string) => void;
}

export function ShapeEditor({ shape, onUpdate, onGroup, onUngroup }: ShapeEditorProps) {
  const handleNumberChange = (field: keyof Shape, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onUpdate({ ...shape, [field]: numValue });
    }
  };

  const handleRotationChange = (value: string) => {
    const rotation = parseFloat(value);
    if (!isNaN(rotation)) {
      // Normalizar la rotación entre 0 y 360 grados
      const normalizedRotation = ((rotation % 360) + 360) % 360;
      onUpdate({ ...shape, rotation: normalizedRotation });
    }
  };

  const toggleLock = () => {
    onUpdate({ ...shape, locked: !shape.locked });
  };

  const handleGroupAction = () => {
    if (shape.groupId) {
      onUngroup(shape.id);
    } else {
      onGroup(shape.id);
    }
  };

  const handleDirectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (shape.type !== 'arrow') return;
    
    const newDirection = e.target.value as Shape['direction'];
    let updatedShape = { ...shape, direction: newDirection };
    
    // Actualizar tipo basado en la dirección
    if (newDirection?.includes('bidirectional')) {
      updatedShape.arrowType = 'bidirectional';
    } else if (newDirection?.includes('curve')) {
      updatedShape.arrowType = 'curved';
      
      // Si no tiene punto de control, añadirlo
      if (!updatedShape.controlPoint) {
        updatedShape.controlPoint = {
          x: updatedShape.width / 2,
          y: updatedShape.height / 2 - 25
        };
      }
    } else {
      updatedShape.arrowType = 'straight';
    }
    
    onUpdate(updatedShape);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Editar {shape.type === 'arrow' ? 'Flecha' : 'Figura'}</h3>
        <div className="flex gap-2">
          <button
            onClick={toggleLock}
            className={`p-2 rounded ${
              shape.locked ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={shape.locked ? 'Desbloquear' : 'Bloquear'}
          >
            {shape.locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
          </button>
          <button
            onClick={handleGroupAction}
            className={`p-2 rounded ${
              shape.groupId ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
            title={shape.groupId ? 'Desagrupar' : 'Agrupar'}
          >
            {shape.groupId ? <Ungroup className="w-4 h-4" /> : <Group className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Posición X</label>
          <input
            type="number"
            value={shape.x}
            onChange={(e) => handleNumberChange('x', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={shape.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Posición Y</label>
          <input
            type="number"
            value={shape.y}
            onChange={(e) => handleNumberChange('y', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={shape.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Ancho</label>
          <input
            type="number"
            value={shape.width}
            onChange={(e) => handleNumberChange('width', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={shape.locked}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Alto</label>
          <input
            type="number"
            value={shape.height}
            onChange={(e) => handleNumberChange('height', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={shape.locked}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rotación (grados)</label>
        <div className="flex gap-2">
          <input
            type="number"
            value={shape.rotation || 0}
            onChange={(e) => handleRotationChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            disabled={shape.locked}
          />
          <button
            onClick={() => handleRotationChange('0')}
            className="mt-1 p-2 rounded bg-gray-100 hover:bg-gray-200"
            disabled={shape.locked}
            title="Restablecer rotación"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {shape.type === 'arrow' && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Dirección</label>
            <div className="flex items-center gap-2 mt-1">
              <DirectionalArrow 
                direction={shape.direction || 'right'} 
                size={20} 
                color={shape.color}
              />
              <select
                value={shape.direction || 'right'}
                onChange={handleDirectionChange}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                disabled={shape.locked}
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
              value={shape.headStyle || 'triangle'}
              onChange={(e) => onUpdate({ ...shape, headStyle: e.target.value as 'triangle' | 'diamond' | 'circle' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={shape.locked}
            >
              <option value="triangle">Triangular</option>
              <option value="diamond">Rombo</option>
              <option value="circle">Círculo</option>
            </select>
          </div>
          
          {shape.arrowType === 'curved' && shape.controlPoint && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Control X</label>
                <input
                  type="number"
                  value={shape.controlPoint.x}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      onUpdate({
                        ...shape,
                        controlPoint: {
                          ...shape.controlPoint,
                          x: value
                        }
                      });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  disabled={shape.locked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Control Y</label>
                <input
                  type="number"
                  value={shape.controlPoint.y}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value)) {
                      onUpdate({
                        ...shape,
                        controlPoint: {
                          ...shape.controlPoint,
                          y: value
                        }
                      });
                    }
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  disabled={shape.locked}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Ancho de línea</label>
            <input
              type="number"
              min="1"
              max="10"
              value={shape.lineWidth || 2}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (!isNaN(value)) {
                  onUpdate({ ...shape, lineWidth: value });
                }
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              disabled={shape.locked}
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Color</label>
        <input
          type="color"
          value={shape.color}
          onChange={(e) => onUpdate({ ...shape, color: e.target.value })}
          className="mt-1 block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          disabled={shape.locked}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Texto</label>
        <input
          type="text"
          value={shape.text || ''}
          onChange={(e) => onUpdate({ ...shape, text: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
          disabled={shape.locked}
          placeholder="Añadir texto..."
        />
      </div>
    </div>
  );
}