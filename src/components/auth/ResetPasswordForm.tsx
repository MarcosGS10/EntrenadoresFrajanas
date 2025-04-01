import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { z } from 'zod';
import { Trophy, Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// Esquema de validación
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número')
    .regex(/[^a-zA-Z0-9]/, 'La contraseña debe contener al menos un carácter especial'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export function ResetPasswordForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [hash, setHash] = useState('');
  const [validLink, setValidLink] = useState(false);

  useEffect(() => {
    // Obtener el hash de la URL
    const url = new URL(window.location.href);
    const hashParam = url.hash.substring(1);
    const params = new URLSearchParams(hashParam);
    const type = params.get('type');
    
    if (type !== 'recovery') {
      setError('Enlace de recuperación inválido o expirado');
      setValidLink(false);
      return;
    }
    
    setHash(hashParam);
    setValidLink(true);
    
    // Verificar si el token es válido
    const verifyToken = async () => {
      try {
        const { error } = await supabase.auth.getUser();
        if (error) {
          setError('El enlace de recuperación ha expirado. Por favor, solicita uno nuevo.');
          setValidLink(false);
        }
      } catch (err) {
        setError('Error al verificar el enlace de recuperación');
        setValidLink(false);
      }
    };
    
    verifyToken();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validLink) {
      setError('El enlace de recuperación no es válido o ha expirado');
      return;
    }
    
    try {
      // Validar formulario
      const validatedData = resetPasswordSchema.parse(formData);
      
      setLoading(true);
      
      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: validatedData.password
      });
      
      if (updateError) throw updateError;
      
      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Redireccionar después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error: any) {
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
        // Error de Supabase
        setError(error.message || 'Ocurrió un error al restablecer la contraseña');
      }
    } finally {
      setLoading(false);
    }
  };

  // Verificar requisitos de contraseña
  const passwordHasMinLength = formData.password.length >= 8;
  const passwordHasNumber = /[0-9]/.test(formData.password);
  const passwordHasSpecialChar = /[^a-zA-Z0-9]/.test(formData.password);

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">¡Contraseña actualizada!</h2>
          <p className="text-gray-600 mb-6">Tu contraseña ha sido restablecida correctamente.</p>
          <p className="text-sm text-gray-500">Serás redirigido a la página de inicio de sesión en unos segundos...</p>
        </div>
      </div>
    );
  }

  if (!validLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-6">
        <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Enlace inválido</h2>
          <p className="text-gray-600 mb-6">{error || 'El enlace de recuperación no es válido o ha expirado.'}</p>
          <button
            onClick={() => navigate('/forgot-password')}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Solicitar nuevo enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Trophy className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mt-4 text-gray-800">Restablecer Contraseña</h1>
          <p className="text-gray-600 mt-2">Crea una nueva contraseña para tu cuenta</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
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
                disabled={loading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-green-500 focus:border-green-500`}
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
                disabled={loading}
                className={`block w-full pl-10 pr-10 py-2 border ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm focus:ring-green-500 focus:border-green-500`}
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

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}