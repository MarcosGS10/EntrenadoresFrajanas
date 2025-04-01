export interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'polygon' | 'directionalArrow';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  text?: string;
  rotation?: number;
  locked?: boolean;
  groupId?: string;
  arrowStyle?: 'straight' | 'curved';
  bidirectional?: boolean;
  lineWidth?: number;
  startPoint?: { x: number, y: number };
  endPoint?: { x: number, y: number };
  controlPoint?: { x: number, y: number };
  headStyle?: 'triangle' | 'diamond' | 'circle';
  direction?: string;
  arrowType?: string;
}

export interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  type: 'straight' | 'curved' | 'bidirectional';
  headStyle: 'triangle' | 'diamond' | 'circle';
  color: string;
  curved?: boolean;
  controlPoint?: { x: number; y: number };
  lineWidth: number;
  rotation: number;
  locked: boolean;
  groupId?: string;
  length: number;
  width: number;
  direction?: string;
}

export interface ElementGroup {
  id: string;
  elementIds: string[];
  name: string;
}

export interface Tarea {
  id: string;
  tipo: string;
  momento: string;
  fase: string;
  espacio: string;
  consignasIndividuales: string[];
  consignasColectivas: string[];
  duracion: number;
  descripcion: string;
  userId?: string;
  createdAt?: string;
  entrenamientoId?: string;
}

export interface Entrenamiento {
  id: string;
  nombre: string;
  fecha: string;
  numJugadores: number;
  tareas: Tarea[];
  userId: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'entrenador';

export interface User {
  id: string;
  email: string;
  nombre: string;
  experiencia?: string;
  especialidad?: string;
  createdAt: string;
  role: UserRole;
}

export interface AuthState {
  user: User | null;
  session: any | null;
  loading: boolean;
  error: string | null;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}