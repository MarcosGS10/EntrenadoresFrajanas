import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Trophy, Mail, Lock, User, Briefcase, Award, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// Esquema de validación
const registerSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  email: z.string().email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
  experiencia: z.string().optional(),
  especialidad: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export function RegisterForm() {
  const { signUp, authState } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    experiencia: '',
    especialidad: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Verificar si el usuario ya está autenticado
  useEffect(() => {
    if (authState.user && !authState.loading) {
      navigate('/');
    }
  }, [authState.user, authState.loading, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Limpiar error del campo cuando el usuario comienza a escribir
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Limpiar error general
    if (registerError) {
      setRegisterError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Limpiar errores previos
    setErrors({});
    setRegisterError(null);
    
    try {
      // Validar formulario
      const validatedData = registerSchema.parse(formData);
      
      // Registrar usuario
      await signUp(
        validatedData.email,
        validatedData.password,
        validatedData.nombre,
        validatedData.experiencia,
        validatedData.especialidad
      );
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Redireccionar después de 3 segundos
      setTimeout(() => {
        navigate('/');
      }, 3000);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Errores de validación del formulario
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        // Error de registro
        const errorMessage = error instanceof Error ? error.message : 'Error al registrar usuario';
        setRegisterError(errorMessage);
      }
    }
  };

  // Verificar requisitos de contraseña
  const passwordHasMinLength = formData.password.length >= 8;
  const passwordHasNumber = /[0-9]/.test(formData.password);
  const passwordHasSpecialChar = /[^a-zA-Z0-9]/.test(formData.password);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Registro exitoso!</h2>
          <p className="text-gray-600 mb-6">Tu cuenta ha sido creada correctamente.</p>
          <p className="text-sm text-gray-500">Serás redirigido automáticamente en unos segundos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-red-700 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Trophy className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mt-4 text-gray-800">Crear Cuenta</h1>
          <p className="text-gray-600 mt-2">Regístrate para comenzar a crear tus entrenamientos</p>
        </div>

        {(authState.error || registerError) && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{authState.error || registerError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre Completo
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                value={formData.nombre}
                onChange={handleChange}
                disabled={authState.loading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.nombre ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="Juan Pérez"
              />
            </div>
            {errors.nombre && (
              <p className="mt-1 text-sm text-red-600">{errors.nombre}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                disabled={authState.loading}
                className={`block w-full pl-10 pr-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="tu@email.com"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                disabled={authState.loading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* Requisitos de contraseña */}
            <div className="mt-2 space-y-1">
              <p className="text-xs text-gray-500">La contraseña debe cumplir con:</p>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${passwordHasMinLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs text-gray-600">Al menos 8 caracteres</p>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${passwordHasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs text-gray-600">Al menos un número</p>
              </div>
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${passwordHasSpecialChar ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <p className="text-xs text-gray-600">Al menos un carácter especial</p>
              </div>
            </div>
            
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={authState.loading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-red-500 focus:border-red-500`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="experiencia" className="block text-sm font-medium text-gray-700 mb-1">
                Experiencia (opcional)
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
                  disabled={authState.loading}
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
              <label htmlFor="especialidad" className="block text-sm font-medium text-gray-700 mb-1">
                Especialidad (opcional)
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
                  disabled={authState.loading}
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
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authState.loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            ¿Ya tienes una cuenta?{' '}
            <Link to="/login" className="font-medium text-red-600 hover:text-red-500">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}