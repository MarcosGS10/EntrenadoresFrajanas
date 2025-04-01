import React, { useState, useEffect, useRef } from 'react';
import { Square, Circle, Triangle, Type, Download, Trash2, ArrowRight, RotateCcw } from 'lucide-react';
import { Canvas } from './Canvas';
import { ArrowEditor } from './ArrowEditor';
import { ArrowSelector } from './DirectionalArrows';
import { Shape, Arrow, ElementGroup } from '../types';

interface GraphicalEditorProps {
  onSaveImage?: (imageData: string) => void;
}

export function GraphicalEditor({ onSaveImage }: GraphicalEditorProps) {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [selectedElement, setSelectedElement] = useState<Shape | Arrow | null>(null);
  const [selectedType, setSelectedType] = useState<Shape['type']>('rectangle');
  const [selectedArrowType, setSelectedArrowType] = useState<Arrow['type']>('straight');
  const [selectedHeadStyle, setSelectedHeadStyle] = useState<Arrow['headStyle']>('triangle');
  const [color, setColor] = useState('#4CAF50');
  const [text, setText] = useState('');
  const [history, setHistory] = useState<Array<{shapes: Shape[], arrows: Arrow[]}>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [groups, setGroups] = useState<ElementGroup[]>([]);
  const [selectedDirectionalArrow, setSelectedDirectionalArrow] = useState('right');
  const [isBidirectional, setIsBidirectional] = useState(false);
  const [isCurved, setIsCurved] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Capture canvas content whenever shapes or arrows change
  useEffect(() => {
    if (onSaveImage && shapes.length > 0 || arrows.length > 0) {
      // Small delay to ensure canvas is rendered
      const timer = setTimeout(() => {
        captureCanvasImage();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shapes, arrows, onSaveImage]);

  const addToHistory = (shapes: Shape[], arrows: Arrow[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ shapes: [...shapes], arrows: [...arrows] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setShapes([...previousState.shapes]);
      setArrows([...previousState.arrows]);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const addShape = () => {
    const newShape: Shape = {
      id: Date.now().toString(),
      type: selectedType,
      x: 50,
      y: 50,
      width: 100,
      height: 100,
      color,
      text,
      locked: false
    };
    
    // Si es una flecha direccional, añadir propiedades específicas
    if (selectedType === 'directionalArrow') {
      newShape.arrowStyle = isCurved ? 'curved' : 'straight';
      newShape.bidirectional = isBidirectional;
      newShape.lineWidth = 2;
    }
    
    const newShapes = [...shapes, newShape];
    setShapes(newShapes);
    addToHistory(newShapes, arrows);
  };

  const addArrow = () => {
    const newArrow: Arrow = {
      id: Date.now().toString(),
      startX: 100,
      startY: 100,
      endX: 200,
      endY: 100,
      type: selectedArrowType,
      headStyle: selectedHeadStyle,
      color,
      curved: false,
      lineWidth: 2,
      rotation: 0,
      locked: false,
      length: 100,
      width: 2
    };
    const newArrows = [...arrows, newArrow];
    setArrows(newArrows);
    addToHistory(shapes, newArrows);
  };

  const updateShape = (updatedShape: Shape) => {
    const newShapes = shapes.map(shape => 
      shape.id === updatedShape.id ? updatedShape : shape
    );
    setShapes(newShapes);
    addToHistory(newShapes, arrows);
  };

  const updateArrow = (updatedArrow: Arrow) => {
    const newArrows = arrows.map(arrow => 
      arrow.id === updatedArrow.id ? updatedArrow : arrow
    );
    setArrows(newArrows);
    addToHistory(shapes, newArrows);
  };

  const handleGroup = (elementId: string) => {
    const groupId = Date.now().toString();
    const newGroup: ElementGroup = {
      id: groupId,
      elementIds: [elementId],
      name: `Grupo ${groups.length + 1}`
    };
    
    setGroups([...groups, newGroup]);
    
    if ('type' in selectedElement!) {
      const newShapes = shapes.map(shape =>
        shape.id === elementId ? { ...shape, groupId } : shape
      );
      setShapes(newShapes);
      addToHistory(newShapes, arrows);
    } else {
      const newArrows = arrows.map(arrow =>
        arrow.id === elementId ? { ...arrow, groupId } : arrow
      );
      setArrows(newArrows);
      addToHistory(shapes, newArrows);
    }
  };

  const handleUngroup = (elementId: string) => {
    if ('type' in selectedElement!) {
      const newShapes = shapes.map(shape =>
        shape.id === elementId ? { ...shape, groupId: undefined } : shape
      );
      setShapes(newShapes);
      addToHistory(newShapes, arrows);
    } else {
      const newArrows = arrows.map(arrow =>
        arrow.id === elementId ? { ...arrow, groupId: undefined } : arrow
      );
      setArrows(newArrows);
      addToHistory(shapes, newArrows);
    }
    
    // Eliminar grupos vacíos
    setGroups(groups.filter(group => 
      group.elementIds.some(id => 
        shapes.some(s => s.id === id && s.groupId === group.id) ||
        arrows.some(a => a.id === id && a.groupId === group.id)
      )
    ));
  };

  const deleteSelected = () => {
    if (!selectedElement) return;

    if ('type' in selectedElement) {
      const newShapes = shapes.filter(shape => shape.id !== selectedElement.id);
      setShapes(newShapes);
      addToHistory(newShapes, arrows);
    } else {
      const newArrows = arrows.filter(arrow => arrow.id !== selectedElement.id);
      setArrows(newArrows);
      addToHistory(shapes, newArrows);
    }
    setSelectedElement(null);
  };

  const clearCanvas = () => {
    setShapes([]);
    setArrows([]);
    setSelectedElement(null);
    setGroups([]);
    addToHistory([], []);
  };

  const exportCanvas = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'diagram.png';
      link.href = dataUrl;
      link.click();
    }
  };

  const captureCanvasImage = () => {
    if (!canvasRef.current || !onSaveImage) return;
    
    const canvas = canvasRef.current.querySelector('canvas');
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSaveImage(dataUrl);
    }
  };

  const handleArrowTypeSelect = (arrowType: string, bidirectional: boolean, curved: boolean) => {
    setSelectedDirectionalArrow(arrowType);
    setIsBidirectional(bidirectional);
    setIsCurved(curved);
    setSelectedType('directionalArrow');
  };

  return (
    <div className="bg-green-50 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <label className="text-lg font-semibold">Representación Gráfica</label>
        <div className="flex gap-2">
          <button
            onClick={undo}
            className="p-2 bg-gray-100 rounded hover:bg-gray-200"
            disabled={historyIndex <= 0}
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={clearCanvas}
            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          {selectedElement && (
            <button
              onClick={deleteSelected}
              className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex gap-4">
        <div className="space-y-4 w-48">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Figuras</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSelectedType('rectangle')}
                className={`p-2 rounded ${
                  selectedType === 'rectangle' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Square className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedType('circle')}
                className={`p-2 rounded ${
                  selectedType === 'circle' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Circle className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedType('triangle')}
                className={`p-2 rounded ${
                  selectedType === 'triangle' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <Triangle className="w-6 h-6" />
              </button>
              <button
                onClick={() => setSelectedType('polygon')}
                className={`p-2 rounded ${
                  selectedType === 'polygon' ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                <div className="w-6 h-6 flex items-center justify-center">⬡</div>
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Flechas</h3>
            <div className="space-y-2">
              <select
                value={selectedArrowType}
                onChange={(e) => setSelectedArrowType(e.target.value as Arrow['type'])}
                className="w-full p-2 border rounded mb-2"
              >
                <option value="straight">Recta</option>
                <option value="curved">Curva</option>
                <option value="bidirectional">Bidireccional</option>
              </select>
              <select
                value={selectedHeadStyle}
                onChange={(e) => setSelectedHeadStyle(e.target.value as Arrow['headStyle'])}
                className="w-full p-2 border rounded"
              >
                <option value="triangle">Triangular</option>
                <option value="diamond">Rombo</option>
                <option value="circle">Círculo</option>
              </select>
            </div>
          </div>

          <ArrowSelector 
            onSelect={handleArrowTypeSelect}
            selectedType={selectedDirectionalArrow}
            isBidirectional={isBidirectional}
            isCurved={isCurved}
          />

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Color</h3>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full h-10 rounded cursor-pointer"
            />
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h3 className="font-medium mb-2">Texto</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Añadir texto..."
                className="flex-1 p-2 border rounded"
              />
              <button
                onClick={() => setText('')}
                className="p-2 bg-gray-100 rounded hover:bg-gray-200"
              >
                <Type className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={addShape}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Añadir Figura
          </button>

          <button
            onClick={addArrow}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-5 h-5" />
            Añadir Flecha
          </button>

          <button
            onClick={exportCanvas}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>

          {selectedElement && !('type' in selectedElement) && (
            <ArrowEditor
              arrow={selectedElement}
              onUpdate={updateArrow}
              onGroup={handleGroup}
              onUngroup={handleUngroup}
            />
          )}
        </div>

        <div className="flex-1" ref={canvasRef}>
          <Canvas
            shapes={shapes}
            arrows={arrows}
            selectedElement={selectedElement}
            onShapeUpdate={updateShape}
            onArrowUpdate={updateArrow}
            onElementSelect={setSelectedElement}
          />
        </div>
      </div>
    </div>
  );
}