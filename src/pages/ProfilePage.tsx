import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Save, Briefcase, Award } from 'lucide-react';

export function ProfilePage() {
  const { authState, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    nombre: authState.user?.nombre || '',
    experiencia: authState.user?.experiencia || '',
    especialidad: authState.user?.especialidad || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-red-700 p-6 pt-20">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center mb-8">Mi Perfil</h1>
        
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                Nombre
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="experiencia" className="block text-sm font-medium text-gray-700">
                  Experiencia
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="experiencia"
                    name="experiencia"
                    value={formData.experiencia}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Menos de 1 año">Menos de 1 año</option>
                    <option value="1-3 años">1-3 años</option>
                    <option value="3-5 años">3-5 años</option>
                    <option value="5-10 años">5-10 años</option>
                    <option value="Más de 10 años">Más de 10 años</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700">
                  Especialidad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Award className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="especialidad"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Fútbol Base">Fútbol Base</option>
                    <option value="Fútbol Amateur">Fútbol Amateur</option>
                    <option value="Fútbol Profesional">Fútbol Profesional</option>
                    <option value="Preparación Física">Preparación Física</option>
                    <option value="Entrenador de Porteros">Entrenador de Porteros</option>
                    <option value="Analista Táctico">Analista Táctico</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={authState.loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5 mr-2" />
                {authState.loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}