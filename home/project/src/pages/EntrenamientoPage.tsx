import React, { useState, useEffect } from 'react';
import { Plus, Minus, Save, Trophy, Users, ClipboardList, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { GraphicalEditor } from '../components/GraphicalEditor';
import { useAuth } from '../context/AuthContext';
import { Tarea } from '../types';
import { supabase } from '../lib/supabase';

export function EntrenamientoPage() {
  const { authState } = useAuth();
  const [numJugadores, setNumJugadores] = useState(10);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [tipoTarea, setTipoTarea] = useState('rondo');
  const [momento, setMomento] = useState('ataque');
  const [fase, setFase] = useState('iniciacion');
  const [espacio, setEspacio] = useState('');
  const [consignasIndividuales, setConsignasIndividuales] = useState<string[]>([]);
  const [consignasColectivas, setConsignasColectivas] = useState<string[]>([]);
  const [duracion, setDuracion] = useState(15);
  const [descripcion, setDescripcion] = useState('');
  const [categoriaIndividualAbierta, setCategoriaIndividualAbierta] = useState<string | null>(null);
  const [categoriaColectivaAbierta, setCategoriaColectivaAbierta] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [entrenamientoId, setEntrenamientoId] = useState<string | null>(null);
  const [nombreEntrenamiento, setNombreEntrenamiento] = useState('Nuevo entrenamiento');
  const [fechaEntrenamiento, setFechaEntrenamiento] = useState(new Date().toISOString().split('T')[0]);

  // Cargar tareas existentes al iniciar
  useEffect(() => {
    if (authState.user) {
      cargarTareas();
    }
  }, [authState.user]);

  const cargarTareas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Primero verificamos si hay un entrenamiento activo
      const { data: entrenamientos, error: errorEntrenamientos } = await supabase
        .from('entrenamientos')
        .select('*')
        .eq('userid', authState.user?.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (errorEntrenamientos) throw errorEntrenamientos;

      let entrenamiento;
      
      if (entrenamientos && entrenamientos.length > 0) {
        // Usar el entrenamiento más reciente
        entrenamiento = entrenamientos[0];
        setEntrenamientoId(entrenamiento.id);
        setNombreEntrenamiento(entrenamiento.nombre);
        setFechaEntrenamiento(entrenamiento.fecha);
        
        // Verificar si existe la propiedad numJugadores o numjugadores
        if ('numJugadores' in entrenamiento) {
          setNumJugadores(entrenamiento.numJugadores);
        } else if ('numjugadores' in entrenamiento) {
          setNumJugadores(entrenamiento.numjugadores);
        }
      } else {
        // Crear un nuevo entrenamiento
        const { data: nuevoEntrenamiento, error: errorCreacion } = await supabase
          .from('entrenamientos')
          .insert({
            nombre: nombreEntrenamiento,
            fecha: fechaEntrenamiento,
            "numJugadores": numJugadores,
            userid: authState.user?.id
          })
          .select()
          .single();

        if (errorCreacion) throw errorCreacion;
        
        entrenamiento = nuevoEntrenamiento;
        setEntrenamientoId(entrenamiento.id);
      }

      // Ahora cargamos las tareas de este entrenamiento
      const { data: tareasData, error: errorTareas } = await supabase
        .from('tareas')
        .select('*')
        .eq('entrenamientoId', entrenamiento.id)
        .order('created_at', { ascending: true });

      if (errorTareas) throw errorTareas;

      setTareas(tareasData || []);
    } catch (err: any) {
      console.error('Error al cargar tareas:', err);
      setError(`Error al cargar tareas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const tiposTareas = [
    { valor: 'rondo', nombre: 'Rondo' },
    { valor: 'rueda_pases', nombre: 'Rueda de Pases' },
    { valor: 'espacio_reducido', nombre: 'Espacio Reducido' },
    { valor: 'juego_posicion', nombre: 'Juego de Posición' },
    { valor: 'oleadas', nombre: 'Oleadas' },
    { valor: 'partido_condicionado', nombre: 'Partido Condicionado' }
  ];

  const momentos = [
    { valor: 'ataque', nombre: 'Ataque' },
    { valor: 'defensa', nombre: 'Defensa' },
    { valor: 'transicion_ofensiva', nombre: 'Transición Ofensiva' },
    { valor: 'transicion_defensiva', nombre: 'Transición Defensiva' },
    { valor: 'abp', nombre: 'ABP' }
  ];

  const fases = [
    { valor: 'iniciacion', nombre: 'Fase Iniciación' },
    { valor: 'creacion', nombre: 'Fase Creación' },
    { valor: 'finalizacion', nombre: 'Fase Finalización' }
  ];

  const consignasTacticasIndividuales = {
    'Atacante con balón': [
      'Conducir para fijar y liberar a un compañero',
      'Conducir para dividir',
      'Conducir para fijar y superar al par con una pared',
      'Pase lateral para abrir la defensa',
      'Pase diagonal o vertical para superar líneas y relaciones con alejados',
      'Pase hacia atrás para buscar 2ª o 3ª altura de remate',
      'Pase largo para superar líneas o cambiar orientación del juego',
      'Finalización desde dentro del área',
      'Finalización desde fuera del área'
    ],
    'Atacante sin balón': [
      'Fijar en amplitud dinámica o estática',
      'Fijar en profundidad dinámica o estática',
      'Ocupar espacio libre dejado por un compañero',
      'Ocupar intervalo entre dos líneas de manera vertical',
      'Ocupar intervalo entre dos líneas de manera horizontal',
      'Separarse del marcador',
      'Moverse delante y detrás del marcador'
    ],
    'Defensa del atacante con balón': [
      'Orientación defensiva en 1 vs 1, carril central',
      'Orientación defensiva en 1 vs 1, carril lateral',
      'Entrar para bloquear un centro o un tiro',
      'Temporizar para preparar una entrada',
      'Temporizar para eliminar superioridad numérica',
      'Temporizar para favorecer el repliegue colectivo'
    ],
    'Defensa del atacante sin balón': [
      'Orientación defensiva, balón en carril lateral',
      'Orientación defensiva, balón en carril central',
      'Orientación defensiva, balón en carril centrolateral',
      'Vigilar, facilitar interceptación',
      'Marcar, eliminar espacio y tiempo',
      'Marcar, facilitar la interceptación'
    ]
  };

  const consignasTacticasColectivas = {
    'Ataque': [
      'Movilidad',
      'Amplitud',
      'Profundidad',
      'Circulación rápida y precisa',
      'Equilibrio'
    ],
    'Defensa': [
      'Orientación defensiva',
      'Densidad',
      'Marcaje zonal',
      'Intensidad defensiva alta'
    ],
    'Transición ofensiva': [
      'Cambio de actitud',
      'Asumir riesgos para progresar rápido',
      'Jugar con seguridad para conservar el balón'
    ],
    'Transición defensiva': [
      'Cambio de actitud',
      'Ajuste posicional',
      'Presión en zona de perdida'
    ]
  };

  const toggleConsignaIndividual = (consigna: string) => {
    setConsignasIndividuales(prev => 
      prev.includes(consigna)
        ? prev.filter(c => c !== consigna)
        : [...prev, consigna]
    );
  };

  const toggleConsignaColectiva = (consigna: string) => {
    setConsignasColectivas(prev => 
      prev.includes(consigna)
        ? prev.filter(c => c !== consigna)
        : [...prev, consigna]
    );
  };

  const toggleCategoriaIndividual = (categoria: string) => {
    setCategoriaIndividualAbierta(categoriaIndividualAbierta === categoria ? null : categoria);
  };

  const toggleCategoriaColectiva = (categoria: string) => {
    setCategoriaColectivaAbierta(categoriaColectivaAbierta === categoria ? null : categoria);
  };

  const actualizarEntrenamiento = async () => {
    if (!entrenamientoId || !authState.user) return;
    
    try {
      const { error } = await supabase
        .from('entrenamientos')
        .update({
          nombre: nombreEntrenamiento,
          fecha: fechaEntrenamiento,
          "numJugadores": numJugadores
        })
        .eq('id', entrenamientoId)
        .eq('userid', authState.user.id);
      
      if (error) throw error;
      
      setSuccess('Información actualizada correctamente');
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al actualizar entrenamiento:', err);
      setError(`Error al actualizar entrenamiento: ${err.message}`);
    }
  };

  const agregarTarea = async () => {
    if (!authState.user) {
      setError('Debes iniciar sesión para agregar tareas');
      return;
    }

    if (!entrenamientoId) {
      setError('No se ha podido crear un entrenamiento');
      return;
    }

    if (!espacio) {
      setError('Por favor, especifica el espacio necesario para la tarea');
      return;
    }

    if (!descripcion) {
      setError('Por favor, añade una descripción para la tarea');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Actualizar entrenamiento primero
      await actualizarEntrenamiento();

      // Crear nueva tarea en la base de datos
      const nuevaTarea = {
        "entrenamientoId": entrenamientoId,
        tipo: tipoTarea,
        momento,
        fase,
        espacio,
        consignasIndividuales,
        consignasColectivas,
        duracion,
        descripcion,
        userid: authState.user.id
      };

      const { data, error } = await supabase
        .from('tareas')
        .insert(nuevaTarea)
        .select()
        .single();

      if (error) throw error;

      // Actualizar estado local
      setTareas(prev => [...prev, data]);
      setSuccess('Tarea agregada correctamente');

      // Limpiar formulario
      setDescripcion('');
      setEspacio('');
      setConsignasIndividuales([]);
      setConsignasColectivas([]);
      setCategoriaIndividualAbierta(null);
      setCategoriaColectivaAbierta(null);

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al agregar tarea:', err);
      setError(`Error al agregar tarea: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const eliminarTarea = async (id: string) => {
    if (!authState.user) return;

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('tareas')
        .delete()
        .eq('id', id)
        .eq('userid', authState.user.id);

      if (error) throw error;

      // Actualizar estado local
      setTareas(tareas.filter(tarea => tarea.id !== id));
      setSuccess('Tarea eliminada correctamente');

      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al eliminar tarea:', err);
      setError(`Error al eliminar tarea: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-700 p-6 pt-20">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-3xl font-bold text-center mb-8 text-green-800 flex items-center justify-center gap-2">
          <Trophy className="w-8 h-8" />
          Planificador de Entrenamientos
        </h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700">
            <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{success}</p>
          </div>
        )}

        <div className="mb-8 bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Información del Entrenamiento</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre del Entrenamiento</label>
              <input
                type="text"
                value={nombreEntrenamiento}
                onChange={(e) => setNombreEntrenamiento(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="Ej: Entrenamiento semanal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha</label>
              <input
                type="date"
                value={fechaEntrenamiento}
                onChange={(e) => setFechaEntrenamiento(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número de Jugadores</label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setNumJugadores(Math.max(1, numJugadores - 1))}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                  type="button"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="text-2xl font-bold text-green-800">{numJugadores}</span>
                <button
                  onClick={() => setNumJugadores(numJugadores + 1)}
                  className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition-colors"
                  type="button"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={actualizarEntrenamiento}
            className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            Guardar Información
          </button>
        </div>

        <div className="mb-8 bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <ClipboardList className="w-5 h-5" />
            Nueva Tarea
          </h2>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de Tarea</label>
                <select
                  value={tipoTarea}
                  onChange={(e) => setTipoTarea(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {tiposTareas.map(tipo => (
                    <option key={tipo.valor} value={tipo.valor}>{tipo.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Momento del Juego</label>
                <select
                  value={momento}
                  onChange={(e) => setMomento(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {momentos.map(m => (
                    <option key={m.valor} value={m.valor}>{m.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Fase del Juego</label>
                <select
                  value={fase}
                  onChange={(e) => setFase(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  {fases.map(f => (
                    <option key={f.valor} value={f.valor}>{f.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Espacio Necesario</label>
                <input
                  type="text"
                  value={espacio}
                  onChange={(e) => setEspacio(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  placeholder="Ej: Medio campo, 20x30m, Cuadrado 15x15m"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Duración (minutos)</label>
                <input
                  type="number"
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                  className="w-full p-2 border rounded-md"
                  min="1"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Consignas Tácticas Individuales</label>
                <div className="space-y-2">
                  {Object.entries(consignasTacticasIndividuales).map(([categoria, consignas]) => (
                    <div key={categoria} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategoriaIndividual(categoria)}
                        className="w-full p-3 bg-white hover:bg-gray-50 flex justify-between items-center text-left font-medium text-green-800"
                        type="button"
                      >
                        <span>{categoria}</span>
                        {categoriaIndividualAbierta === categoria ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {categoriaIndividualAbierta === categoria && (
                        <div className="p-3 bg-gray-50 border-t">
                          {consignas.map((consigna) => (
                            <div
                              key={consigna}
                              onClick={() => toggleConsignaIndividual(consigna)}
                              className={`p-2 cursor-pointer rounded hover:bg-gray-100 ${
                                consignasIndividuales.includes(consigna)
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }`}
                            >
                              {consigna}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {consignasIndividuales.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-sm text-green-800 mb-2">Consignas individuales seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {consignasIndividuales.map((consigna) => (
                        <span
                          key={consigna}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {consigna}
                          <button
                            onClick={() => toggleConsignaIndividual(consigna)}
                            className="hover:text-red-500"
                            type="button"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Consignas Tácticas Colectivas</label>
                <div className="space-y-2">
                  {Object.entries(consignasTacticasColectivas).map(([categoria, consignas]) => (
                    <div key={categoria} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCategoriaColectiva(categoria)}
                        className="w-full p-3 bg-white hover:bg-gray-50 flex justify-between items-center text-left font-medium text-green-800"
                        type="button"
                      >
                        <span>{categoria}</span>
                        {categoriaColectivaAbierta === categoria ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      {categoriaColectivaAbierta === categoria && (
                        <div className="p-3 bg-gray-50 border-t">
                          {consignas.map((consigna) => (
                            <div
                              key={consigna}
                              onClick={() => toggleConsignaColectiva(consigna)}
                              className={`p-2 cursor-pointer rounded hover:bg-gray-100 ${
                                consignasColectivas.includes(consigna)
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }`}
                            >
                              {consigna}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {consignasColectivas.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <p className="font-medium text-sm text-green-800 mb-2">Consignas colectivas seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {consignasColectivas.map((consigna) => (
                        <span
                          key={consigna}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                        >
                          {consigna}
                          <button
                            onClick={() => toggleConsignaColectiva(consigna)}
                            className="hover:text-red-500"
                            type="button"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <label className="block text-lg font-semibold mb-2">Descripción y Reglas de provocación</label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className="w-full p-3 border rounded-md"
                  rows={5}
                  placeholder="Ejemplo: Los jugadores se organizan en un cuadrado 15x15m. Regla de provocación: El equipo en posesión debe realizar mínimo 3 pases antes de buscar el cambio de orientación..."
                />
              </div>
              
              <GraphicalEditor />
            </div>
            <button
              onClick={agregarTarea}
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
              disabled={loading}
              type="button"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Agregando...' : 'Agregar Tarea'}
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Tareas Agregadas</h2>
          {loading && tareas.length === 0 ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando tareas...</p>
            </div>
          ) : tareas.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No hay tareas agregadas. Crea tu primera tarea usando el formulario de arriba.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tareas.map((tarea) => (
                <div key={tarea.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg text-green-800">
                        {tiposTareas.find(t => t.valor === tarea.tipo)?.nombre || tarea.tipo}
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {momentos.find(m => m.valor === tarea.momento)?.nombre || tarea.momento}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {fases.find(f => f.valor === tarea.fase)?.nombre || tarea.fase}
                        </span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                          {tarea.duracion} minutos
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {tarea.espacio}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => eliminarTarea(tarea.id)}
                      className="text-red-500 hover:text-red-700"
                      type="button"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <p className="mt-3 text-gray-700">{tarea.descripcion}</p>
                  
                  {(tarea.consignasIndividuales?.length > 0 || tarea.consignasColectivas?.length > 0) && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tarea.consignasIndividuales?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">Consignas individuales:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {tarea.consignasIndividuales.map((consigna, index) => (
                                <li key={index}>{consigna}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {tarea.consignasColectivas?.length > 0 && (
                          <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-1">Consignas colectivas:</h4>
                            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                              {tarea.consignasColectivas.map((consigna, index) => (
                                <li key={index}>{consigna}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}