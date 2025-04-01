import { Shape, Arrow } from '../types';

export function drawShape(
  ctx: CanvasRenderingContext2D, 
  shape: Shape, 
  isSelected: boolean,
  rotationAngle: number = 0
) {
  ctx.save();
  
  // Apply rotation if needed
  if (shape.rotation !== undefined) {
    const centerX = shape.x + shape.width / 2;
    const centerY = shape.y + shape.height / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(shape.rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);
  }

  ctx.fillStyle = shape.color;
  ctx.strokeStyle = isSelected ? '#2563eb' : '#000';
  ctx.lineWidth = isSelected ? 3 : 2;

  switch (shape.type) {
    case 'rectangle':
      ctx.beginPath();
      ctx.rect(shape.x, shape.y, shape.width, shape.height);
      ctx.fill();
      ctx.stroke();
      break;
    case 'circle':
      ctx.beginPath();
      ctx.ellipse(
        shape.x + shape.width / 2,
        shape.y + shape.height / 2,
        shape.width / 2,
        shape.height / 2,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.stroke();
      break;
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(shape.x + shape.width / 2, shape.y);
      ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
      ctx.lineTo(shape.x, shape.y + shape.height);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'polygon':
      const sides = 6; // Hexagon
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const radius = Math.min(shape.width, shape.height) / 2;
        const x = shape.x + shape.width / 2 + radius * Math.cos(angle);
        const y = shape.y + shape.height / 2 + radius * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;
    case 'directionalArrow':
      drawDirectionalArrow(ctx, shape, isSelected);
      break;
  }

  // Draw text if present
  if (shape.text) {
    ctx.fillStyle = '#000000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      shape.text,
      shape.x + shape.width / 2,
      shape.y + shape.height / 2
    );
  }

  // Draw resize handles if selected and not locked
  if (isSelected && !shape.locked) {
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
    ];

    // Draw rotation handle
    ctx.beginPath();
    ctx.arc(shape.x + shape.width / 2, shape.y - 20, handleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    ctx.stroke();

    // Draw line to rotation handle
    ctx.beginPath();
    ctx.moveTo(shape.x + shape.width / 2, shape.y);
    ctx.lineTo(shape.x + shape.width / 2, shape.y - 20);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2563eb';
    handles.forEach(handle => {
      ctx.beginPath();
      ctx.rect(
        handle.x - handleSize / 2,
        handle.y - handleSize / 2,
        handleSize,
        handleSize
      );
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}

function drawDirectionalArrow(ctx: CanvasRenderingContext2D, shape: Shape, isSelected: boolean) {
  const { x, y, width, height, arrowStyle = 'straight', color } = shape;
  
  ctx.strokeStyle = isSelected ? '#2563eb' : color;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = isSelected ? 3 : 2;
  
  // Calculate arrow points
  const startX = x;
  const startY = y + height / 2;
  const endX = x + width;
  const endY = y + height / 2;
  
  // Draw the arrow line
  ctx.beginPath();
  
  if (arrowStyle === 'curved') {
    // Draw curved arrow
    const controlX = x + width / 2;
    const controlY = y;
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(controlX, controlY, endX, endY);
  } else {
    // Draw straight arrow
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
  }
  
  ctx.stroke();
  
  // Draw arrow head
  const headLength = 15;
  const headAngle = Math.PI / 6; // 30 degrees
  
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(headAngle),
    endY - headLength * Math.sin(headAngle)
  );
  ctx.lineTo(
    endX - headLength * Math.cos(-headAngle),
    endY - headLength * Math.sin(-headAngle)
  );
  ctx.closePath();
  ctx.fill();
  
  // For bidirectional arrows, draw second head
  if (shape.bidirectional) {
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + headLength * Math.cos(headAngle),
      startY + headLength * Math.sin(headAngle)
    );
    ctx.lineTo(
      startX + headLength * Math.cos(-headAngle),
      startY + headLength * Math.sin(-headAngle)
    );
    ctx.closePath();
    ctx.fill();
  }
}

export function drawArrow(ctx: CanvasRenderingContext2D, arrow: Arrow, isSelected: boolean) {
  ctx.save();

  // Apply rotation if needed
  if (arrow.rotation !== 0) {
    const centerX = (arrow.startX + arrow.endX) / 2;
    const centerY = (arrow.startY + arrow.endY) / 2;
    ctx.translate(centerX, centerY);
    ctx.rotate(arrow.rotation * Math.PI / 180);
    ctx.translate(-centerX, -centerY);
  }

  ctx.strokeStyle = isSelected ? '#2563eb' : arrow.color;
  ctx.fillStyle = ctx.strokeStyle;
  ctx.lineWidth = arrow.locked ? arrow.lineWidth : (isSelected ? arrow.lineWidth + 1 : arrow.lineWidth);

  // Draw the arrow line
  ctx.beginPath();
  ctx.moveTo(arrow.startX, arrow.startY);

  if (arrow.curved && arrow.controlPoint) {
    // Curved arrow
    ctx.quadraticCurveTo(
      arrow.controlPoint.x,
      arrow.controlPoint.y,
      arrow.endX,
      arrow.endY
    );
  } else {
    // Straight arrow
    ctx.lineTo(arrow.endX, arrow.endY);
  }
  ctx.stroke();

  // Draw arrow head
  const angle = Math.atan2(arrow.endY - arrow.startY, arrow.endX - arrow.startX);
  const headLength = 15 * (arrow.lineWidth / 2);

  switch (arrow.headStyle) {
    case 'triangle':
      ctx.beginPath();
      ctx.moveTo(arrow.endX, arrow.endY);
      ctx.lineTo(
        arrow.endX - headLength * Math.cos(angle - Math.PI / 6),
        arrow.endY - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        arrow.endX - headLength * Math.cos(angle + Math.PI / 6),
        arrow.endY - headLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
      break;

    case 'diamond':
      ctx.beginPath();
      ctx.moveTo(arrow.endX, arrow.endY);
      ctx.lineTo(
        arrow.endX - headLength * Math.cos(angle - Math.PI / 4),
        arrow.endY - headLength * Math.sin(angle - Math.PI / 4)
      );
      ctx.lineTo(
        arrow.endX - headLength * 1.5 * Math.cos(angle),
        arrow.endY - headLength * 1.5 * Math.sin(angle)
      );
      ctx.lineTo(
        arrow.endX - headLength * Math.cos(angle + Math.PI / 4),
        arrow.endY - headLength * Math.sin(angle + Math.PI / 4)
      );
      ctx.closePath();
      ctx.fill();
      break;

    case 'circle':
      ctx.beginPath();
      ctx.arc(arrow.endX, arrow.endY, headLength / 2, 0, Math.PI * 2);
      ctx.fill();
      break;
  }

  // Draw second arrow head for bidirectional arrows
  if (arrow.type === 'bidirectional') {
    const startAngle = Math.atan2(arrow.startY - arrow.endY, arrow.startX - arrow.endX);
    
    switch (arrow.headStyle) {
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(arrow.startX, arrow.startY);
        ctx.lineTo(
          arrow.startX - headLength * Math.cos(startAngle - Math.PI / 6),
          arrow.startY - headLength * Math.sin(startAngle - Math.PI / 6)
        );
        ctx.lineTo(
          arrow.startX - headLength * Math.cos(startAngle + Math.PI / 6),
          arrow.startY - headLength * Math.sin(startAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(arrow.startX, arrow.startY);
        ctx.lineTo(
          arrow.startX - headLength * Math.cos(startAngle - Math.PI / 4),
          arrow.startY - headLength * Math.sin(startAngle - Math.PI / 4)
        );
        ctx.lineTo(
          arrow.startX - headLength * 1.5 * Math.cos(startAngle),
          arrow.startY - headLength * 1.5 * Math.sin(startAngle)
        );
        ctx.lineTo(
          arrow.startX - headLength * Math.cos(startAngle + Math.PI / 4),
          arrow.startY - headLength * Math.sin(startAngle + Math.PI / 4)
        );
        ctx.closePath();
        ctx.fill();
        break;

      case 'circle':
        ctx.beginPath();
        ctx.arc(arrow.startX, arrow.startY, headLength / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }
  }

  // Draw control points and handles if selected and not locked
  if (isSelected && !arrow.locked) {
    const handleSize = 8;
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#2563eb';

    // Start point handle
    ctx.beginPath();
    ctx.arc(arrow.startX, arrow.startY, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // End point handle
    ctx.beginPath();
    ctx.arc(arrow.endX, arrow.endY, handleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Control point handle for curved arrows
    if (arrow.curved && arrow.controlPoint) {
      ctx.beginPath();
      ctx.arc(arrow.controlPoint.x, arrow.controlPoint.y, handleSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Draw lines to control point
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(arrow.startX, arrow.startY);
      ctx.lineTo(arrow.controlPoint.x, arrow.controlPoint.y);
      ctx.lineTo(arrow.endX, arrow.endY);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Draw rotation indicator
    const centerX = (arrow.startX + arrow.endX) / 2;
    const centerY = (arrow.startY + arrow.endY) / 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY - 20, handleSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#2563eb';
    ctx.fill();
    ctx.stroke();

    // Line to rotation handle
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX, centerY - 20);
    ctx.stroke();
  }

  ctx.restore();
}