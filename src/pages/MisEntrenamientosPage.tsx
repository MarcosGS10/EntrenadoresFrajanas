import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Trophy, Search, RotateCw, FileCheck, List, CalendarDays, ChevronLeft, ChevronRight, 
  AlertCircle, Loader2, CalendarIcon, Clock, CheckCircle2, Eye, Edit, Trash2, Plus, Minus, 
  Users, ChevronDown, ChevronUp, SortAsc, SortDesc } from 'lucide-react';
import { TaskPreview } from '../components/TaskPreview';

type ViewMode = 'list' | 'calendar';
type SortField = 'nombre' | 'fecha' | 'duracion' | 'created_at';
type SortOrder = 'asc' | 'desc';

export function MisEntrenamientosPage() {
  const { authState } = useAuth();
  const [entrenamientos, setEntrenamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [expandedEntrenamiento, setExpandedEntrenamiento] = useState<string | null>(null);
  const [tareasPorEntrenamiento, setTareasPorEntrenamiento] = useState<Record<string, any[]>>({});
  const [loadingTareas, setLoadingTareas] = useState<Record<string, boolean>>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (authState.user) {
      cargarEntrenamientos();
    }
  }, [authState.user]);

  const cargarEntrenamientos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: entrenamientosData, error: entrenamientosError } = await supabase
        .from('entrenamientos')
        .select('*, tareas(*)')
        .eq('userid', authState.user?.id)
        .eq('completado', true) // Only get completed/saved trainings
        .order('created_at', { ascending: false });

      if (entrenamientosError) throw entrenamientosError;

      // Process trainings to calculate total duration
      const entrenamientosProcesados = entrenamientosData.map(entrenamiento => ({
        ...entrenamiento,
        duracionTotal: entrenamiento.tareas?.reduce((total: number, tarea: any) => total + (tarea.duracion || 0), 0) || 0
      }));

      setEntrenamientos(entrenamientosProcesados);
    } catch (err: any) {
      console.error('Error al cargar entrenamientos:', err);
      setError(err.message || 'Error al cargar los entrenamientos');
    } finally {
      setLoading(false);
    }
  };

  const cargarTareasDeEntrenamiento = async (entrenamientoId: string) => {
    if (expandedEntrenamiento === entrenamientoId) {
      setExpandedEntrenamiento(null);
      return;
    }

    try {
      setLoadingTareas(prev => ({ ...prev, [entrenamientoId]: true }));
      setError(null);

      const { data: tareasData, error: tareasError } = await supabase
        .from('tareas')
        .select('*')
        .eq('entrenamientoId', entrenamientoId)
        .order('created_at', { ascending: true });

      if (tareasError) throw tareasError;

      setTareasPorEntrenamiento(prev => ({
        ...prev,
        [entrenamientoId]: tareasData || []
      }));
      setExpandedEntrenamiento(entrenamientoId);
    } catch (err: any) {
      console.error('Error al cargar tareas:', err);
      setError(err.message || 'Error al cargar las tareas');
    } finally {
      setLoadingTareas(prev => ({ ...prev, [entrenamientoId]: false }));
    }
  };

  const eliminarEntrenamiento = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este entrenamiento?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('entrenamientos')
        .delete()
        .eq('id', id)
        .eq('userid', authState.user?.id);

      if (error) throw error;

      setEntrenamientos(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar entrenamiento:', err);
      setError(err.message || 'Error al eliminar el entrenamiento');
    } finally {
      setLoading(false);
    }
  };

  // Filter trainings
  const filteredEntrenamientos = entrenamientos.filter(entrenamiento => {
    const searchLower = searchTerm.toLowerCase();
    return (
      entrenamiento.nombre.toLowerCase().includes(searchLower) ||
      new Date(entrenamiento.fecha).toLocaleDateString().includes(searchLower)
    );
  });

  const sortEntrenamientos = (entrenamientosToSort: any[]) => {
    return [...entrenamientosToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'nombre':
          comparison = a.nombre.localeCompare(b.nombre);
          break;
        case 'fecha':
          comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime();
          break;
        case 'duracion':
          comparison = a.duracionTotal - b.duracionTotal;
          break;
        default:
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const sortedEntrenamientos = sortEntrenamientos(filteredEntrenamientos);

  const renderEntrenamientoCard = (entrenamiento: any) => (
    <div key={entrenamiento.id} className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-red-800">
            {entrenamiento.nombre}
          </h3>
          <p className="text-gray-500 text-sm">
            {new Date(entrenamiento.fecha).toLocaleDateString()}
          </p>
          <p className="text-gray-500 text-sm">
            Duración total: {entrenamiento.duracionTotal} minutos
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/entrenamiento/${entrenamiento.id}`}
            className="text-blue-600 hover:text-blue-900"
            title="Editar entrenamiento"
          >
            <Edit className="w-5 h-5" />
          </Link>
          <button
            onClick={() => eliminarEntrenamiento(entrenamiento.id)}
            className="text-red-600 hover:text-red-900"
            title="Eliminar entrenamiento"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderCalendar = () => {
    const daysInMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0
    ).getDate();
    
    const firstDayOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1
    ).getDay();

    const weeks = [];
    let days = [];
    let day = 1;

    // Create calendar grid
    for (let i = 0; i < 42; i++) {
      if (i < firstDayOfMonth || day > daysInMonth) {
        days.push(null);
      } else {
        const currentDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const hasTraining = entrenamientos.some(e => {
          const trainingDate = new Date(e.fecha);
          return trainingDate.getDate() === day &&
                 trainingDate.getMonth() === currentMonth.getMonth() &&
                 trainingDate.getFullYear() === currentMonth.getFullYear();
        });
        
        days.push({
          day,
          hasTraining,
          date: currentDate
        });
        day++;
      }

      if (days.length === 7) {
        weeks.push(days);
        days = [];
      }
    }

    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="text-lg font-semibold">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h3>
          <button
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((dayData, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`
                    aspect-square flex items-center justify-center relative
                    ${dayData ? 'hover:bg-gray-50 cursor-pointer' : ''}
                    ${dayData?.hasTraining ? 'bg-red-50' : ''}
                    ${dayData?.date?.toDateString() === selectedDate?.toDateString() ? 'bg-red-100' : ''}
                  `}
                  onClick={() => dayData && setSelectedDate(dayData.date)}
                >
                  {dayData && (
                    <>
                      <span className="text-sm">{dayData.day}</span>
                      {dayData.hasTraining && (
                        <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 p-6 pt-20">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-red-800 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8" />
          Mis Entrenamientos
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar entrenamientos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 flex items-center gap-1 ${
                  viewMode === 'list' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-2 flex items-center gap-1 ${
                  viewMode === 'calendar' 
                    ? 'bg-red-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden sm:inline">Calendario</span>
              </button>
            </div>
            
            <button
              onClick={cargarEntrenamientos}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RotateCw className="w-5 h-5" />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
            
            <Link
              to="/nuevo"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            <span className="ml-3 text-gray-600">Cargando entrenamientos...</span>
          </div>
        ) : filteredEntrenamientos.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg">
            <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No hay entrenamientos guardados</h3>
            <p className="text-gray-600 mb-6">
              No se encontraron entrenamientos guardados. Crea y guarda un entrenamiento para verlo aquí.
            </p>
            <Link
              to="/nuevo"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 inline-flex items-center gap-2"
            >
              <FileCheck className="w-5 h-5" />
              <span>Crear Entrenamiento</span>
            </Link>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="space-y-6">
            {renderCalendar()}
            
            {selectedDate && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                  Entrenamientos para {selectedDate.toLocaleDateString()}
                </h3>
                <div className="space-y-4">
                  {sortedEntrenamientos
                    .filter(e => new Date(e.fecha).toDateString() === selectedDate.toDateString())
                    .map(renderEntrenamientoCard)}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {sortedEntrenamientos.map(renderEntrenamientoCard)}
          </div>
        )}
      </div>
    </div>
  );
}