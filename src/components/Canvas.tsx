import React, { useRef, useEffect, useState } from 'react';
import { drawShape, drawArrow } from '../utils/drawing';
import { Shape, Arrow } from '../types';
import { drawSoccerField } from './SoccerField';

interface CanvasProps {
  shapes: Shape[];
  arrows?: Arrow[];
  selectedElement: Shape | Arrow | null;
  onShapeUpdate: (shape: Shape) => void;
  onArrowUpdate?: (arrow: Arrow) => void;
  onElementSelect: (element: Shape | Arrow | null) => void;
}

const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const gridSize = 20;
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 0.5;

  // Draw vertical lines
  for (let x = 0; x <= width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y <= height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
};

const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement>) => {
  const canvas = e.currentTarget;
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
};

const getArrowHandleAtPosition = (x: number, y: number, arrow: Arrow) => {
  const handleSize = 8;
  const threshold = handleSize / 2;

  // Check start point handle
  if (
    Math.abs(x - arrow.startX) <= threshold &&
    Math.abs(y - arrow.startY) <= threshold
  ) {
    return 'start';
  }

  // Check end point handle
  if (
    Math.abs(x - arrow.endX) <= threshold &&
    Math.abs(y - arrow.endY) <= threshold
  ) {
    return 'end';
  }

  // Check control point handle for curved arrows
  if (
    arrow.curved &&
    arrow.controlPoint &&
    Math.abs(x - arrow.controlPoint.x) <= threshold &&
    Math.abs(y - arrow.controlPoint.y) <= threshold
  ) {
    return 'control';
  }

  // Check if clicking on the line itself
  const lineThreshold = 5;
  if (arrow.curved && arrow.controlPoint) {
    // For curved arrows, check quadratic curve
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const px = Math.pow(1-t, 2) * arrow.startX + 
                2 * (1-t) * t * arrow.controlPoint.x + 
                Math.pow(t, 2) * arrow.endX;
      const py = Math.pow(1-t, 2) * arrow.startY + 
                2 * (1-t) * t * arrow.controlPoint.y + 
                Math.pow(t, 2) * arrow.endY;
      
      if (Math.abs(x - px) <= lineThreshold && Math.abs(y - py) <= lineThreshold) {
        return 'line';
      }
    }
  } else {
    // For straight arrows, check line segment
    const dx = arrow.endX - arrow.startX;
    const dy = arrow.endY - arrow.startY;
    const length = Math.sqrt(dx * dx + dy * dy);
    
    if (length > 0) {
      const dirX = dx / length;
      const dirY = dy / length;
      
      const pointToStartX = x - arrow.startX;
      const pointToStartY = y - arrow.startY;
      const dot = pointToStartX * dirX + pointToStartY * dirY;
      
      if (dot >= 0 && dot <= length) {
        const closestX = arrow.startX + dot * dirX;
        const closestY = arrow.startY + dot * dirY;
        const distanceSquared = Math.pow(x - closestX, 2) + Math.pow(y - closestY, 2);
        
        if (distanceSquared <= lineThreshold * lineThreshold) {
          return 'line';
        }
      }
    }
  }

  return null;
};

const getResizeHandleAtPosition = (x: number, y: number, shape: Shape) => {
  const handleSize = 8;
  const handles = [
    { x: shape.x, y: shape.y }, // Top-left
    { x: shape.x + shape.width / 2, y: shape.y }, // Top-middle
    { x: shape.x + shape.width, y: shape.y }, // Top-right
    { x: shape.x + shape.width, y: shape.y + shape.height / 2 }, // Middle-right
    { x: shape.x + shape.width, y: shape.y + shape.height }, // Bottom-right
    { x: shape.x + shape.width / 2, y: shape.y + shape.height }, // Bottom-middle
    { x: shape.x, y: shape.y + shape.height }, // Bottom-left
    { x: shape.x, y: shape.y + shape.height / 2 }, // Middle-left
    { x: shape.x + shape.width / 2, y: shape.y - 20 } // Rotation handle
  ];

  for (let i = 0; i < handles.length; i++) {
    const handle = handles[i];
    if (
      x >= handle.x - handleSize / 2 &&
      x <= handle.x + handleSize / 2 &&
      y >= handle.y - handleSize / 2 &&
      y <= handle.y + handleSize / 2
    ) {
      return i;
    }
  }
  return -1;
};

const isPointInShape = (x: number, y: number, shape: Shape) => {
  // Para flechas direccionales, usamos un área más amplia para facilitar la selección
  if (shape.type === 'directionalArrow') {
    // Expandir el área de selección
    const expandedX = shape.x - 10;
    const expandedY = shape.y - 10;
    const expandedWidth = shape.width + 20;
    const expandedHeight = shape.height + 20;
    
    return (
      x >= expandedX &&
      x <= expandedX + expandedWidth &&
      y >= expandedY &&
      y <= expandedY + expandedHeight
    );
  }
  
  // Para otras formas, verificar si el punto está dentro de la forma
  return (
    x >= shape.x &&
    x <= shape.x + shape.width &&
    y >= shape.y &&
    y <= shape.y + shape.height
  );
};

const getElementAtPosition = (x: number, y: number, shapes: Shape[], arrows: Arrow[] = []) => {
  // Primero comprobamos las formas
  for (const shape of shapes) {
    if (isPointInShape(x, y, shape)) {
      return shape;
    }
  }

  // Luego comprobamos las flechas
  for (const arrow of arrows) {
    const handle = getArrowHandleAtPosition(x, y, arrow);
    if (handle) {
      return arrow;
    }
  }

  return null;
};

export function Canvas({
  shapes,
  arrows = [],
  selectedElement,
  onShapeUpdate,
  onArrowUpdate,
  onElementSelect,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<number | null>(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isMovingControlPoint, setIsMovingControlPoint] = useState(false);
  const [arrowHandle, setArrowHandle] = useState<'start' | 'end' | 'control' | 'line' | null>(null);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Dibujar el campo de fútbol como fondo
      drawSoccerField(ctx, canvas.width, canvas.height);

      // Dibujar flechas
      arrows.forEach(arrow => {
        drawArrow(ctx, arrow, arrow === selectedElement);
      });

      // Dibujar formas
      shapes.forEach(shape => {
        drawShape(ctx, shape, shape === selectedElement, rotationAngle);
      });

      setAnimationFrameId(requestAnimationFrame(animate));
    };

    animate();

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [shapes, arrows, selectedElement, rotationAngle]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePosition(e);
    setLastMousePos({ x, y });
    setDragStart({ x, y });

    if (selectedElement) {
      if ('type' in selectedElement) {
        const handleIndex = getResizeHandleAtPosition(x, y, selectedElement);
        
        if (handleIndex === 8) {
          setIsRotating(true);
          return;
        }
        
        if (handleIndex !== -1) {
          setResizing(true);
          setResizeHandle(handleIndex);
          return;
        }
      } else if (onArrowUpdate) {
        const handle = getArrowHandleAtPosition(x, y, selectedElement);
        if (handle) {
          setArrowHandle(handle);
          setDragOffset({
            x: handle === 'start' ? x - selectedElement.startX : 
               handle === 'end' ? x - selectedElement.endX :
               handle === 'control' && selectedElement.controlPoint ? 
               x - selectedElement.controlPoint.x : 0,
            y: handle === 'start' ? y - selectedElement.startY :
               handle === 'end' ? y - selectedElement.endY :
               handle === 'control' && selectedElement.controlPoint ?
               y - selectedElement.controlPoint.y : 0
          });
          return;
        }
      }
    }

    const element = getElementAtPosition(x, y, shapes, arrows);
    if (element) {
      onElementSelect(element);
      setIsDragging(true);
      if ('type' in element) {
        setDragOffset({ x: x - element.x, y: y - element.y });
      } else if (onArrowUpdate) {
        setDragOffset({ 
          x: x - element.startX,
          y: y - element.startY
        });
      }
    } else {
      onElementSelect(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const { x, y } = getMousePosition(e);
    const dx = x - lastMousePos.x;
    const dy = y - lastMousePos.y;

    if (selectedElement) {
      if ('type' in selectedElement && !isDragging && !resizing && !isRotating) {
        const handleIndex = getResizeHandleAtPosition(x, y, selectedElement);
        if (handleIndex !== -1) {
          const cursors = ['nw-resize', 'n-resize', 'ne-resize', 'e-resize', 'se-resize', 's-resize', 'sw-resize', 'w-resize', 'grab'];
          canvas.style.cursor = cursors[handleIndex];
        } else if (isPointInShape(x, y, selectedElement)) {
          canvas.style.cursor = 'move';
        } else {
          canvas.style.cursor = 'default';
        }
      } else if (!('type' in selectedElement) && onArrowUpdate) {
        const handle = getArrowHandleAtPosition(x, y, selectedElement);
        canvas.style.cursor = handle ? 
          (handle === 'line' ? 'move' : 'pointer') : 
          'default';
      }
    }

    if (!selectedElement) {
      setLastMousePos({ x, y });
      return;
    }

    if (isRotating && 'type' in selectedElement) {
      const centerX = selectedElement.x + selectedElement.width / 2;
      const centerY = selectedElement.y + selectedElement.height / 2;
      const angle = Math.atan2(y - centerY, x - centerX);
      const newRotation = angle * (180 / Math.PI);
      
      onShapeUpdate({
        ...selectedElement,
        rotation: newRotation
      });
    } else if (resizing && 'type' in selectedElement) {
      const newShape = { ...selectedElement };
      
      switch (resizeHandle) {
        case 0: // Top-left
          newShape.width += newShape.x - x;
          newShape.height += newShape.y - y;
          newShape.x = x;
          newShape.y = y;
          break;
        case 1: // Top-middle
          newShape.height += newShape.y - y;
          newShape.y = y;
          break;
        case 2: // Top-right
          newShape.width = x - newShape.x;
          newShape.height += newShape.y - y;
          newShape.y = y;
          break;
        case 3: // Middle-right
          newShape.width = x - newShape.x;
          break;
        case 4: // Bottom-right
          newShape.width = x - newShape.x;
          newShape.height = y - newShape.y;
          break;
        case 5: // Bottom-middle
          newShape.height = y - newShape.y;
          break;
        case 6: // Bottom-left
          newShape.width += newShape.x - x;
          newShape.height = y - newShape.y;
          newShape.x = x;
          break;
        case 7: // Middle-left
          newShape.width += newShape.x - x;
          newShape.x = x;
          break;
      }
      
      if (newShape.width > 10 && newShape.height > 10) {
        onShapeUpdate(newShape);
      }
    } else if (isDragging) {
      if ('type' in selectedElement) {
        const newX = x - dragOffset.x;
        const newY = y - dragOffset.y;
        
        onShapeUpdate({
          ...selectedElement,
          x: Math.max(0, Math.min(canvas.width - selectedElement.width, newX)),
          y: Math.max(0, Math.min(canvas.height - selectedElement.height, newY))
        });
      } else if (onArrowUpdate) {
        const updatedArrow = { ...selectedElement };
        
        if (arrowHandle === 'line') {
          // Smooth animation for arrow movement
          const targetStartX = Math.max(0, Math.min(canvas.width, selectedElement.startX + dx));
          const targetStartY = Math.max(0, Math.min(canvas.height, selectedElement.startY + dy));
          const targetEndX = Math.max(0, Math.min(canvas.width, selectedElement.endX + dx));
          const targetEndY = Math.max(0, Math.min(canvas.height, selectedElement.endY + dy));
          
          updatedArrow.startX = targetStartX;
          updatedArrow.startY = targetStartY;
          updatedArrow.endX = targetEndX;
          updatedArrow.endY = targetEndY;
          
          if (updatedArrow.controlPoint) {
            updatedArrow.controlPoint = {
              x: Math.max(0, Math.min(canvas.width, selectedElement.controlPoint!.x + dx)),
              y: Math.max(0, Math.min(canvas.height, selectedElement.controlPoint!.y + dy))
            };
          }
        } else {
          switch (arrowHandle) {
            case 'start':
              updatedArrow.startX = Math.max(0, Math.min(canvas.width, x));
              updatedArrow.startY = Math.max(0, Math.min(canvas.height, y));
              break;
            case 'end':
              updatedArrow.endX = Math.max(0, Math.min(canvas.width, x));
              updatedArrow.endY = Math.max(0, Math.min(canvas.height, y));
              break;
            case 'control':
              if (updatedArrow.controlPoint) {
                updatedArrow.controlPoint = {
                  x: Math.max(0, Math.min(canvas.width, x)),
                  y: Math.max(0, Math.min(canvas.height, y))
                };
              }
              break;
          }
        }
        
        onArrowUpdate(updatedArrow);
      }
    }

    setLastMousePos({ x, y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setResizing(false);
    setIsRotating(false);
    setResizeHandle(null);
    setIsMovingControlPoint(false);
    setArrowHandle(null);
    
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={500}
      className="border border-gray-300 rounded-lg bg-white transition-all duration-200 ease-in-out"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}