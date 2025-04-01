import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Header } from './components/layout/Header';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ForgotPasswordForm } from './components/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './components/auth/ResetPasswordForm';
import { EntrenamientoPage } from './pages/EntrenamientoPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { supabase } from './lib/supabase';

function App() {
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Verificar la conexión con Supabase al cargar la aplicación
  useEffect(() => {
    const checkSupabaseConnection = async () => {
      try {
        // Intentar una operación simple para verificar la conexión
        const { error } = await supabase.from('users').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error('Error al conectar con Supabase:', error);
          setConnectionError(error.message);
          setIsSupabaseConnected(false);
        } else {
          setIsSupabaseConnected(true);
          setConnectionError(null);
        }
      } catch (err) {
        console.error('Error al verificar la conexión con Supabase:', err);
        setConnectionError('Error de conexión con la base de datos');
        setIsSupabaseConnected(false);
      }
    };

    checkSupabaseConnection();
  }, []);

  // Mostrar pantalla de carga mientras se verifica la conexión
  if (isSupabaseConnected === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Conectando con el servidor...</p>
        </div>
      </div>
    );
  }

  // Mostrar error de conexión
  if (isSupabaseConnected === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
        <div className="bg-white p-8 rounded-xl shadow-xl text-center max-w-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-4">
            No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.
          </p>
          <p className="text-sm text-red-600 mb-4">{connectionError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/forgot-password" element={<ForgotPasswordForm />} />
          <Route path="/reset-password" element={<ResetPasswordForm />} />
          
          {/* Rutas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <div>
                <Header />
                <EntrenamientoPage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/entrenamientos" element={
            <ProtectedRoute>
              <div>
                <Header />
                <EntrenamientoPage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/nuevo" element={
            <ProtectedRoute>
              <div>
                <Header />
                <EntrenamientoPage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/perfil" element={
            <ProtectedRoute>
              <div>
                <Header />
                <ProfilePage />
              </div>
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <div>
                <Header />
                <AdminPage />
              </div>
            </ProtectedRoute>
          } />
          
          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;