// Dimensiones estándar de un campo de fútbol (en proporción)
export const FIELD_WIDTH = 800;
export const FIELD_HEIGHT = 500;

// Proporciones oficiales
const PENALTY_AREA_WIDTH = 132; // 16.5m en proporción
const PENALTY_AREA_HEIGHT = 220; // 40.3m en proporción
const GOAL_AREA_WIDTH = 44; // 5.5m en proporción
const GOAL_AREA_HEIGHT = 110; // 18.3m en proporción
const CENTER_CIRCLE_RADIUS = 50; // 9.15m en proporción
const CORNER_RADIUS = 10;
const PENALTY_SPOT_DISTANCE = 88; // 11m en proporción
const PENALTY_ARC_RADIUS = 50; // Radio del arco del área de penalti

// Colores
const GRASS_COLOR = '#2e8b57'; // Verde oscuro para el césped
const LINE_COLOR = '#ffffff'; // Blanco para las líneas
const PATTERN_COLOR = '#267349'; // Verde más oscuro para el patrón

export function drawSoccerField(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Ajustar las dimensiones para mantener la proporción
  const fieldWidth = width;
  const fieldHeight = height;
  
  // Dibujar el césped base
  ctx.fillStyle = GRASS_COLOR;
  ctx.fillRect(0, 0, fieldWidth, fieldHeight);
  
  // Dibujar el patrón de corte del césped
  drawGrassPattern(ctx, fieldWidth, fieldHeight);
  
  // Configurar el estilo para las líneas
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  
  // Dibujar el borde del campo
  ctx.strokeRect(10, 10, fieldWidth - 20, fieldHeight - 20);
  
  // Dibujar la línea central
  ctx.beginPath();
  ctx.moveTo(fieldWidth / 2, 10);
  ctx.lineTo(fieldWidth / 2, fieldHeight - 10);
  ctx.stroke();
  
  // Dibujar el círculo central
  ctx.beginPath();
  ctx.arc(fieldWidth / 2, fieldHeight / 2, CENTER_CIRCLE_RADIUS, 0, Math.PI * 2);
  ctx.stroke();
  
  // Dibujar el punto central
  ctx.beginPath();
  ctx.arc(fieldWidth / 2, fieldHeight / 2, 3, 0, Math.PI * 2);
  ctx.fillStyle = LINE_COLOR;
  ctx.fill();
  
  // Dibujar las áreas de penalti (izquierda)
  drawPenaltyArea(ctx, 10, fieldHeight / 2, false, fieldHeight);
  
  // Dibujar las áreas de penalti (derecha)
  drawPenaltyArea(ctx, fieldWidth - 10, fieldHeight / 2, true, fieldHeight);
  
  // Dibujar las esquinas
  drawCorners(ctx, fieldWidth, fieldHeight);
}

function drawGrassPattern(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Dibujar franjas alternadas
  const stripeWidth = 30;
  ctx.fillStyle = PATTERN_COLOR;
  
  for (let x = 0; x < width; x += stripeWidth * 2) {
    ctx.fillRect(x, 0, stripeWidth, height);
  }
}

function drawPenaltyArea(ctx: CanvasRenderingContext2D, xPos: number, yPos: number, isRight: boolean, fieldHeight: number) {
  const direction = isRight ? -1 : 1;
  
  // Área grande de penalti
  ctx.beginPath();
  ctx.moveTo(xPos, yPos - PENALTY_AREA_HEIGHT / 2);
  ctx.lineTo(xPos + direction * PENALTY_AREA_WIDTH, yPos - PENALTY_AREA_HEIGHT / 2);
  ctx.lineTo(xPos + direction * PENALTY_AREA_WIDTH, yPos + PENALTY_AREA_HEIGHT / 2);
  ctx.lineTo(xPos, yPos + PENALTY_AREA_HEIGHT / 2);
  ctx.stroke();
  
  // Área pequeña (área de meta)
  ctx.beginPath();
  ctx.moveTo(xPos, yPos - GOAL_AREA_HEIGHT / 2);
  ctx.lineTo(xPos + direction * GOAL_AREA_WIDTH, yPos - GOAL_AREA_HEIGHT / 2);
  ctx.lineTo(xPos + direction * GOAL_AREA_WIDTH, yPos + GOAL_AREA_HEIGHT / 2);
  ctx.lineTo(xPos, yPos + GOAL_AREA_HEIGHT / 2);
  ctx.stroke();
  
  // Punto de penalti
  ctx.beginPath();
  ctx.arc(xPos + direction * PENALTY_SPOT_DISTANCE, yPos, 3, 0, Math.PI * 2);
  ctx.fillStyle = LINE_COLOR;
  ctx.fill();
  
  // Arco del área de penalti
  ctx.beginPath();
  const startAngle = isRight ? -0.3 : Math.PI - 0.3;
  const endAngle = isRight ? 0.3 : Math.PI + 0.3;
  ctx.arc(
    xPos + direction * PENALTY_SPOT_DISTANCE, 
    yPos, 
    PENALTY_ARC_RADIUS, 
    startAngle, 
    endAngle
  );
  ctx.stroke();
}

function drawCorners(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Esquina superior izquierda
  ctx.beginPath();
  ctx.arc(10, 10, CORNER_RADIUS, 0, Math.PI / 2);
  ctx.stroke();
  
  // Esquina superior derecha
  ctx.beginPath();
  ctx.arc(width - 10, 10, CORNER_RADIUS, Math.PI / 2, Math.PI);
  ctx.stroke();
  
  // Esquina inferior izquierda
  ctx.beginPath();
  ctx.arc(10, height - 10, CORNER_RADIUS, 3 * Math.PI / 2, 2 * Math.PI);
  ctx.stroke();
  
  // Esquina inferior derecha
  ctx.beginPath();
  ctx.arc(width - 10, height - 10, CORNER_RADIUS, Math.PI, 3 * Math.PI / 2);
  ctx.stroke();
}