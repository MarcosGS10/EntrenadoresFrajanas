import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkSupabaseConnection } from '../../lib/supabase';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { authState, resetConnection, isAdmin } = useAuth();
  const location = useLocation();
  const [connectionStatus, setConnectionStatus] = useState<{
    checking: boolean;
    connected: boolean;
    error: string | null;
  }>({
    checking: true,
    connected: false,
    error: null
  });

  useEffect(() => {
    const verifyConnection = async () => {
      try {
        const { connected, error } = await checkSupabaseConnection();
        setConnectionStatus({
          checking: false,
          connected,
          error: error || null
        });
      } catch (err: any) {
        setConnectionStatus({
          checking: false,
          connected: false,
          error: err.message || 'Error de conexión'
        });
      }
    };

    verifyConnection();
  }, []);

  // Si está verificando la conexión, mostrar un indicador de carga
  if (connectionStatus.checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando conexión...</p>
        </div>
      </div>
    );
  }

  // Si hay un error de conexión, mostrar mensaje de error
  if (!connectionStatus.connected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-4">
            No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.
          </p>
          {connectionStatus.error && (
            <p className="text-sm text-red-600 mb-4">{connectionStatus.error}</p>
          )}
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
            >
              Reintentar
            </button>
            <button 
              onClick={resetConnection} 
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reiniciar conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si está cargando, mostrar un indicador de carga
  if (authState.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si hay un error de autenticación, mostrar mensaje de error
  if (authState.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de autenticación</h2>
          <p className="text-gray-600 mb-4">
            {authState.error}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Reintentar
            </button>
            <a 
              href="/login" 
              className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              Iniciar sesión
            </a>
            <button 
              onClick={resetConnection} 
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reiniciar conexión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Si no hay usuario autenticado, redirigir al login
  if (!authState.user) {
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si la ruta es solo para administradores y el usuario no es administrador
  if (adminOnly && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Acceso denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos para acceder a esta página. Esta sección está reservada para administradores.
          </p>
          <a 
            href="/" 
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors inline-block"
          >
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  // Si hay usuario autenticado, mostrar el contenido protegido
  return <>{children}</>;
}