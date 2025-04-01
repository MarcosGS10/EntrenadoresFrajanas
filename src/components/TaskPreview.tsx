import React, { useEffect, useRef } from 'react';
import { drawSoccerField } from './SoccerField';
import { Tarea } from '../types';

interface TaskPreviewProps {
  tarea: Tarea;
  width?: number;
  height?: number;
}

export function TaskPreview({ tarea, width = 200, height = 120 }: TaskPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar el campo de fútbol como fondo
    drawSoccerField(ctx, canvas.width, canvas.height);

    // Aquí se podrían dibujar elementos específicos de la tarea
    // como jugadores, flechas, etc. basados en los datos de la tarea
    drawTaskSpecificElements(ctx, tarea, canvas.width, canvas.height);

  }, [tarea, width, height]);

  // Función para dibujar elementos específicos de la tarea
  const drawTaskSpecificElements = (
    ctx: CanvasRenderingContext2D, 
    tarea: Tarea, 
    canvasWidth: number, 
    canvasHeight: number
  ) => {
    // Dibujar elementos según el tipo de tarea
    switch (tarea.tipo) {
      case 'rondo':
        drawRondo(ctx, canvasWidth, canvasHeight);
        break;
      case 'rueda_pases':
        drawRuedaPases(ctx, canvasWidth, canvasHeight);
        break;
      case 'espacio_reducido':
        drawEspacioReducido(ctx, canvasWidth, canvasHeight);
        break;
      case 'juego_posicion':
        drawJuegoPosicion(ctx, canvasWidth, canvasHeight);
        break;
      case 'oleadas':
        drawOleadas(ctx, canvasWidth, canvasHeight);
        break;
      case 'partido_condicionado':
        drawPartidoCondicionado(ctx, canvasWidth, canvasHeight);
        break;
      default:
        // Dibujo genérico para otros tipos
        drawGenericTask(ctx, canvasWidth, canvasHeight);
    }

    // Dibujar elementos según el momento del juego
    if (tarea.momento === 'ataque') {
      drawAtaqueIndicators(ctx, canvasWidth, canvasHeight);
    } else if (tarea.momento === 'defensa') {
      drawDefensaIndicators(ctx, canvasWidth, canvasHeight);
    }
  };

  // Funciones para dibujar diferentes tipos de tareas
  const drawRondo = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar un círculo de jugadores con uno o dos en el medio
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 4;

    // Dibujar el círculo exterior de jugadores
    ctx.strokeStyle = '#3b82f6'; // Azul
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Dibujar jugadores en el círculo (puntos)
    const numPlayers = 6;
    for (let i = 0; i < numPlayers; i++) {
      const angle = (i / numPlayers) * Math.PI * 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Dibujar jugador en el centro
    ctx.fillStyle = '#ef4444'; // Rojo
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawRuedaPases = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar jugadores en posiciones para pases en rueda
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3.5;

    // Dibujar jugadores en posiciones
    const positions = [
      { x: centerX - radius, y: centerY - radius }, // Arriba izquierda
      { x: centerX + radius, y: centerY - radius }, // Arriba derecha
      { x: centerX + radius, y: centerY + radius }, // Abajo derecha
      { x: centerX - radius, y: centerY + radius }, // Abajo izquierda
    ];

    // Dibujar líneas de pase
    ctx.strokeStyle = '#22c55e'; // Verde
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    for (let i = 1; i < positions.length; i++) {
      ctx.lineTo(positions[i].x, positions[i].y);
    }
    ctx.lineTo(positions[0].x, positions[0].y);
    ctx.stroke();

    // Dibujar jugadores
    positions.forEach(pos => {
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dibujar flechas de dirección
    drawArrow(ctx, positions[0].x, positions[0].y, positions[1].x, positions[1].y);
    drawArrow(ctx, positions[1].x, positions[1].y, positions[2].x, positions[2].y);
    drawArrow(ctx, positions[2].x, positions[2].y, positions[3].x, positions[3].y);
    drawArrow(ctx, positions[3].x, positions[3].y, positions[0].x, positions[0].y);
  };

  const drawEspacioReducido = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar un área rectangular pequeña con jugadores
    const rectWidth = width * 0.6;
    const rectHeight = height * 0.6;
    const rectX = (width - rectWidth) / 2;
    const rectY = (height - rectHeight) / 2;

    // Dibujar el rectángulo
    ctx.strokeStyle = '#f59e0b'; // Ámbar
    ctx.lineWidth = 2;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

    // Dibujar jugadores del equipo 1
    const team1Positions = [
      { x: rectX + rectWidth * 0.25, y: rectY + rectHeight * 0.25 },
      { x: rectX + rectWidth * 0.25, y: rectY + rectHeight * 0.75 },
      { x: rectX + rectWidth * 0.5, y: rectY + rectHeight * 0.5 },
    ];

    team1Positions.forEach(pos => {
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dibujar jugadores del equipo 2
    const team2Positions = [
      { x: rectX + rectWidth * 0.75, y: rectY + rectHeight * 0.25 },
      { x: rectX + rectWidth * 0.75, y: rectY + rectHeight * 0.75 },
      { x: rectX + rectWidth * 0.5, y: rectY + rectHeight * 0.75 },
    ];

    team2Positions.forEach(pos => {
      ctx.fillStyle = '#ef4444'; // Rojo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawJuegoPosicion = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar un área con zonas y jugadores posicionados
    const rectWidth = width * 0.7;
    const rectHeight = height * 0.7;
    const rectX = (width - rectWidth) / 2;
    const rectY = (height - rectHeight) / 2;

    // Dibujar el rectángulo principal
    ctx.strokeStyle = '#8b5cf6'; // Violeta
    ctx.lineWidth = 2;
    ctx.strokeRect(rectX, rectY, rectWidth, rectHeight);

    // Dividir en zonas
    ctx.beginPath();
    ctx.moveTo(rectX + rectWidth / 3, rectY);
    ctx.lineTo(rectX + rectWidth / 3, rectY + rectHeight);
    ctx.moveTo(rectX + (rectWidth / 3) * 2, rectY);
    ctx.lineTo(rectX + (rectWidth / 3) * 2, rectY + rectHeight);
    ctx.stroke();

    // Dibujar jugadores en diferentes zonas
    // Zona 1
    ctx.fillStyle = '#3b82f6'; // Azul
    ctx.beginPath();
    ctx.arc(rectX + rectWidth / 6, rectY + rectHeight / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rectX + rectWidth / 6, rectY + rectHeight / 4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Zona 2
    ctx.fillStyle = '#3b82f6'; // Azul
    ctx.beginPath();
    ctx.arc(rectX + rectWidth / 2, rectY + rectHeight / 3, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rectX + rectWidth / 2, rectY + (rectHeight / 3) * 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Zona 3
    ctx.fillStyle = '#3b82f6'; // Azul
    ctx.beginPath();
    ctx.arc(rectX + (rectWidth / 6) * 5, rectY + rectHeight / 2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Equipo contrario
    ctx.fillStyle = '#ef4444'; // Rojo
    ctx.beginPath();
    ctx.arc(rectX + rectWidth / 3, rectY + rectHeight / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rectX + (rectWidth / 3) * 2, rectY + rectHeight / 3, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawOleadas = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar líneas de ataque en oleadas
    const startX = width * 0.2;
    const endX = width * 0.8;
    const startY = height * 0.2;
    const endY = height * 0.8;

    // Dibujar línea de meta
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(endX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Dibujar oleadas de ataque
    for (let i = 0; i < 3; i++) {
      const posY = startY + (endY - startY) * (i / 2);
      
      // Jugador atacante
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(startX + (endX - startX) * 0.3, posY, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Flecha de ataque
      drawArrow(ctx, startX + (endX - startX) * 0.3, posY, endX - 10, posY);
    }

    // Dibujar defensor
    ctx.fillStyle = '#ef4444'; // Rojo
    ctx.beginPath();
    ctx.arc(endX - 20, height / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawPartidoCondicionado = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar un mini campo con dos equipos
    const fieldWidth = width * 0.8;
    const fieldHeight = height * 0.8;
    const fieldX = (width - fieldWidth) / 2;
    const fieldY = (height - fieldHeight) / 2;

    // Dibujar el campo
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Línea central
    ctx.beginPath();
    ctx.moveTo(width / 2, fieldY);
    ctx.lineTo(width / 2, fieldY + fieldHeight);
    ctx.stroke();

    // Círculo central
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 10, 0, Math.PI * 2);
    ctx.stroke();

    // Equipo 1 (formación básica)
    const team1Positions = [
      { x: fieldX + fieldWidth * 0.15, y: height / 2 }, // Portero
      { x: fieldX + fieldWidth * 0.3, y: fieldY + fieldHeight * 0.3 }, // Defensa
      { x: fieldX + fieldWidth * 0.3, y: fieldY + fieldHeight * 0.7 }, // Defensa
      { x: fieldX + fieldWidth * 0.45, y: height / 2 }, // Medio
    ];

    team1Positions.forEach(pos => {
      ctx.fillStyle = '#3b82f6'; // Azul
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Equipo 2 (formación básica)
    const team2Positions = [
      { x: fieldX + fieldWidth * 0.85, y: height / 2 }, // Portero
      { x: fieldX + fieldWidth * 0.7, y: fieldY + fieldHeight * 0.3 }, // Defensa
      { x: fieldX + fieldWidth * 0.7, y: fieldY + fieldHeight * 0.7 }, // Defensa
      { x: fieldX + fieldWidth * 0.55, y: height / 2 }, // Medio
    ];

    team2Positions.forEach(pos => {
      ctx.fillStyle = '#ef4444'; // Rojo
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const drawGenericTask = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Dibujar una representación genérica para cualquier tipo de tarea
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Dibujar algunos jugadores dispersos
    const positions = [
      { x: centerX - 30, y: centerY - 20 },
      { x: centerX + 30, y: centerY - 20 },
      { x: centerX, y: centerY },
      { x: centerX - 20, y: centerY + 25 },
      { x: centerX + 20, y: centerY + 25 },
    ];

    positions.forEach((pos, index) => {
      // Alternar colores para simular dos equipos
      ctx.fillStyle = index % 2 === 0 ? '#3b82f6' : '#ef4444';
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Dibujar algunas líneas de movimiento
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(positions[0].x, positions[0].y);
    ctx.lineTo(positions[2].x, positions[2].y);
    ctx.moveTo(positions[1].x, positions[1].y);
    ctx.lineTo(positions[2].x, positions[2].y);
    ctx.stroke();

    drawArrow(ctx, positions[2].x, positions[2].y, positions[3].x, positions[3].y);
    drawArrow(ctx, positions[2].x, positions[2].y, positions[4].x, positions[4].y);
  };

  const drawAtaqueIndicators = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Indicadores visuales para tareas de ataque
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; // Azul semi-transparente
    ctx.fillRect(width * 0.6, 0, width * 0.4, height);
  };

  const drawDefensaIndicators = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Indicadores visuales para tareas de defensa
    ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // Rojo semi-transparente
    ctx.fillRect(0, 0, width * 0.4, height);
  };

  // Función auxiliar para dibujar flechas
  const drawArrow = (
    ctx: CanvasRenderingContext2D, 
    fromX: number, 
    fromY: number, 
    toX: number, 
    toY: number
  ) => {
    const headLength = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Dibujar la línea
    ctx.strokeStyle = '#22c55e'; // Verde
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();
    
    // Dibujar la punta de la flecha
    ctx.fillStyle = '#22c55e'; // Verde
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - Math.PI / 6),
      toY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headLength * Math.cos(angle + Math.PI / 6),
      toY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="border border-gray-300 rounded-md bg-green-900"
    />
  );
}