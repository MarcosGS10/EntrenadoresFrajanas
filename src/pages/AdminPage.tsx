import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, UserRole } from '../types';
import { getAllUsers, getAllEntrenamientos, supabase } from '../lib/supabase';
import { Shield, Users, ClipboardList, AlertCircle, CheckCircle2, Search, RotateCw, UserCog, Trash2, Eye, Edit } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { TaskPreview } from '../components/TaskPreview';

export function AdminPage() {
  const { authState, updateUserRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [entrenamientos, setEntrenamientos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'entrenamientos'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('entrenador');
  const [viewEntrenamiento, setViewEntrenamiento] = useState<string | null>(null);
  const [selectedEntrenamiento, setSelectedEntrenamiento] = useState<any>(null);
  const [loadingEntrenamiento, setLoadingEntrenamiento] = useState(false);
  const [detailedInfo, setDetailedInfo] = useState<any>(null);

  // Verificar si el usuario es administrador
  if (!authState.user?.role === 'admin') {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar usuarios
      const usersResult = await getAllUsers();
      if (!usersResult.success) {
        throw new Error(usersResult.error || 'Error al cargar usuarios');
      }
      setUsers(usersResult.data || []);
      
      // Cargar entrenamientos
      const entrenamientosResult = await getAllEntrenamientos();
      if (!entrenamientosResult.success) {
        throw new Error(entrenamientosResult.error || 'Error al cargar entrenamientos');
      }
      setEntrenamientos(entrenamientosResult.data || []);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      
      await updateUserRole(userId, selectedRole);
      
      // Actualizar la lista de usuarios
      const updatedUsers = users.map(user => 
        user.id === userId ? { ...user, role: selectedRole } : user
      );
      setUsers(updatedUsers);
      
      setSuccess(`Rol actualizado correctamente a: ${selectedRole}`);
      setEditingUser(null);
      
      // Ocultar mensaje después de 3 segundos
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al actualizar rol:', err);
      setError(err.message || 'Error al actualizar rol');
    } finally {
      setLoading(false);
    }
  };

  const viewEntrenamientoDetails = async (entrenamientoId: string) => {
    try {
      setLoadingEntrenamiento(true);
      setError(null);

      // Obtener el entrenamiento con sus tareas
      const { data: entrenamiento, error: entrenamientoError } = await supabase
        .from('entrenamientos')
        .select(`
          *,
          users:userid (nombre, email),
          tareas (*)
        `)
        .eq('id', entrenamientoId)
        .single();

      if (entrenamientoError) throw entrenamientoError;

      setSelectedEntrenamiento(entrenamiento);
      setViewEntrenamiento(entrenamientoId);
    } catch (err: any) {
      console.error('Error al cargar entrenamiento:', err);
      setError(err.message || 'Error al cargar el entrenamiento');
    } finally {
      setLoadingEntrenamiento(false);
    }
  };

  const eliminarEntrenamiento = async (entrenamientoId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este entrenamiento?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('entrenamientos')
        .delete()
        .eq('id', entrenamientoId);

      if (error) throw error;

      setEntrenamientos(prev => prev.filter(e => e.id !== entrenamientoId));
      setSuccess('Entrenamiento eliminado correctamente');

      // Si estábamos viendo este entrenamiento, cerrar la vista
      if (viewEntrenamiento === entrenamientoId) {
        setViewEntrenamiento(null);
        setSelectedEntrenamiento(null);
      }

      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error al eliminar entrenamiento:', err);
      setError(err.message || 'Error al eliminar el entrenamiento');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    if (!user.nombre || !user.email) return false;
    return (
      user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Filtrar entrenamientos
  const filteredEntrenamientos = entrenamientos.filter(entrenamiento => {
    if (!entrenamiento.nombre) return false;
    
    const nombreMatch = entrenamiento.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const userNombreMatch = entrenamiento.users?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const userEmailMatch = entrenamiento.users?.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    return nombreMatch || userNombreMatch || userEmailMatch;
  });

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-10 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-blue-600 p-6">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <Shield className="w-6 h-6 mr-2" />
              Panel de Administración
            </h1>
            <p className="text-blue-100 mt-1">
              Gestiona usuarios y entrenamientos del sistema
            </p>
          </div>
          
          <div className="p-6">
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
            
            <div className="flex justify-between items-center mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    activeTab === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Usuarios
                </button>
                <button
                  onClick={() => setActiveTab('entrenamientos')}
                  className={`px-4 py-2 rounded-md flex items-center ${
                    activeTab === 'entrenamientos'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ClipboardList className="w-5 h-5 mr-2" />
                  Entrenamientos
                </button>
              </div>
              
              <div className="flex items-center">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={loadData}
                  className="ml-2 p-2 bg-gray-100 rounded-md hover:bg-gray-200"
                  title="Actualizar datos"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : activeTab === 'users' ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rol
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha de registro
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                              {user.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.nombre}</div>
                              {user.especialidad && (
                                <div className="text-xs text-gray-500">{user.especialidad}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingUser === user.id ? (
                            <select
                              value={selectedRole}
                              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="admin">Administrador</option>
                              <option value="entrenador">Entrenador</option>
                            </select>
                          ) : (
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                            }`}>
                              {user.role === 'admin' ? 'Administrador' : 'Entrenador'}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {editingUser === user.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleRoleChange(user.id)}
                                className="text-blue-600 hover:text-blue-900"
                                disabled={loading}
                              >
                                Guardar
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingUser(user.id);
                                setSelectedRole(user.role);
                              }}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <UserCog className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron usuarios
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entrenador
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Jugadores
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEntrenamientos.map((entrenamiento) => (
                      <tr key={entrenamiento.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{entrenamiento.nombre}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold">
                              {entrenamiento.users?.nombre?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="ml-3">
                              <div className="text-sm text-gray-900">{entrenamiento.users?.nombre || 'Usuario desconocido'}</div>
                              <div className="text-xs text-gray-500">{entrenamiento.users?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(entrenamiento.fecha).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {entrenamiento.numJugadores}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => viewEntrenamientoDetails(entrenamiento.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver entrenamiento"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => eliminarEntrenamiento(entrenamiento.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar entrenamiento"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {filteredEntrenamientos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron entrenamientos
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal para ver el entrenamiento completo */}
      {viewEntrenamiento && selectedEntrenamiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-semibold">{selectedEntrenamiento.nombre}</h3>
              <button
                onClick={() => {
                  setViewEntrenamiento(null);
                  setSelectedEntrenamiento(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Fecha</h4>
                <p>{new Date(selectedEntrenamiento.fecha).toLocaleDateString()}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Jugadores</h4>
                <p>{selectedEntrenamiento.numJugadores}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Entrenador</h4>
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold mr-2">
                    {selectedEntrenamiento.users?.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm">{selectedEntrenamiento.users?.nombre || 'Usuario desconocido'}</p>
                    <p className="text-xs text-gray-500">{selectedEntrenamiento.users?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-xl font-semibold">Tareas</h4>
              {selectedEntrenamiento.tareas?.map((tarea: any) => (
                <div key={tarea.id} className="bg-white border rounded-lg shadow-sm p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h5 className="font-semibold text-lg text-blue-800">{tarea.tipo}</h5>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {tarea.momento}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {tarea.fase}
                        </span>
                        <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">
                          {tarea.duracion} minutos
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                          {tarea.espacio}
                        </span>
                      </div>
                    </div>
                    {tarea.imagenCanvas && (
                      <img 
                        src={tarea.imagenCanvas} 
                        alt="Representación gráfica" 
                        className="w-32 h-auto border border-gray-200 rounded-md"
                      />
                    )}
                  </div>

                  <p className="text-gray-700 mb-4">{tarea.descripcion}</p>

                  {(tarea.consignasIndividuales?.length > 0 || tarea.consignasColectivas?.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                      {tarea.consignasIndividuales?.length > 0 && (
                        <div>
                          <h6 className="font-medium text-sm text-gray-700 mb-2">Consignas individuales:</h6>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {tarea.consignasIndividuales.map((consigna: string, index: number) => (
                              <li key={index}>{consigna}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {tarea.consignasColectivas?.length > 0 && (
                        <div>
                          <h6 className="font-medium text-sm text-gray-700 mb-2">Consignas colectivas:</h6>
                          <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            {tarea.consignasColectivas.map((consigna: string, index: number) => (
                              <li key={index}>{consigna}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}