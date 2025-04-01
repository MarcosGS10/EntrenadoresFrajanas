import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, getCurrentUser, resetSupabaseConnection } from '../lib/supabase';
import { User, AuthState } from '../types';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  authState: AuthState;
  signUp: (email: string, password: string, nombre: string, experiencia?: string, especialidad?: string) => Promise<void>;
  signIn: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  resetConnection: () => Promise<void>;
  isAdmin: () => boolean;
  updateUserRole: (userId: string, role: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });
  const [activityTimeout, setActivityTimeout] = useState<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();

  // Función para reiniciar el temporizador de inactividad
  const resetActivityTimer = () => {
    if (activityTimeout) {
      clearTimeout(activityTimeout);
    }
    
    // Cerrar sesión después de 30 minutos de inactividad
    const newTimeout = setTimeout(() => {
      signOut();
    }, 30 * 60 * 1000); // 30 minutos
    
    setActivityTimeout(newTimeout);
  };

  // Escuchar eventos de actividad del usuario
  useEffect(() => {
    const handleUserActivity = () => {
      resetActivityTimer();
    };
    
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('click', handleUserActivity);
    
    // Iniciar el temporizador cuando hay una sesión activa
    if (authState.session) {
      resetActivityTimer();
    }
    
    return () => {
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('click', handleUserActivity);
      
      if (activityTimeout) {
        clearTimeout(activityTimeout);
      }
    };
  }, [authState.session]);

  // Verificar sesión al cargar
  useEffect(() => {
    const getInitialSession = async () => {
      try {
        setAuthState(prev => ({ ...prev, loading: true, error: null }));
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }
        
        if (session) {
          try {
            const user = await getCurrentUser();
            if (!user) {
              throw new Error('No se pudo obtener la información del usuario');
            }
            
            setAuthState({
              user,
              session,
              loading: false,
              error: null,
            });
          } catch (userError: any) {
            console.error('Error al obtener datos del usuario:', userError);
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: userError.message || 'Error al cargar los datos del usuario',
            });
          }
        } else {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      } catch (error: any) {
        console.error('Error al obtener la sesión inicial:', error);
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: error.message || 'Error al cargar la sesión',
        });
      }
    };

    getInitialSession();

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        try {
          const user = await getCurrentUser();
          if (!user) {
            throw new Error('No se pudo obtener la información del usuario');
          }
          
          setAuthState({
            user,
            session,
            loading: false,
            error: null,
          });
          navigate('/');
        } catch (error: any) {
          console.error('Error al obtener datos del usuario después de auth change:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: error.message || 'Error al cargar los datos del usuario',
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setAuthState({
          user: null,
          session: null,
          loading: false,
          error: null,
        });
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Registro de usuario
  const signUp = async (
    email: string, 
    password: string, 
    nombre: string, 
    experiencia?: string, 
    especialidad?: string
  ) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Registrar usuario en Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nombre,
            experiencia,
            especialidad,
            role: 'entrenador' // Asignar rol de entrenador por defecto
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        try {
          // Crear perfil de usuario en la tabla users
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              email,
              nombre,
              experiencia: experiencia || null,
              especialidad: especialidad || null,
              role: 'entrenador', // Asignar rol de entrenador por defecto
              "createdAt": new Date().toISOString()
            });
          
          if (profileError) throw profileError;
          
          // Obtener el usuario recién creado
          const user = await getCurrentUser();
          
          if (!user) {
            throw new Error('No se pudo obtener la información del usuario después del registro');
          }
          
          setAuthState({
            user,
            session: authData.session,
            loading: false,
            error: null,
          });

          // Redirigir al usuario a la página principal después del registro
          navigate('/', { replace: true });
          
        } catch (profileError: any) {
          console.error('Error al crear perfil de usuario:', profileError);
          throw profileError;
        }
      }
    } catch (error: any) {
      console.error('Error al registrar usuario:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al registrar usuario',
      }));
      throw error;
    }
  };

  // Inicio de sesión
  const signIn = async (email: string, password: string, rememberMe: boolean) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Si rememberMe es true, establecer expiración más larga
      if (rememberMe && data.session) {
        await supabase.auth.updateUser({
          data: { remember_me: true }
        });
      }
      
      const user = await getCurrentUser();
      
      if (!user) {
        throw new Error('No se pudo obtener la información del usuario');
      }
      
      setAuthState({
        user,
        session: data.session,
        loading: false,
        error: null,
      });
      
      // Iniciar temporizador de inactividad
      resetActivityTimer();
      
      // Redirigir al usuario a la página principal
      navigate('/', { replace: true });
      
    } catch (error: any) {
      console.error('Error al iniciar sesión:', error);
      
      // Mensajes de error más amigables
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Tu email no ha sido confirmado. Por favor, revisa tu bandeja de entrada.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Demasiados intentos fallidos. Inténtalo más tarde.';
      }
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));
      
      throw new Error(errorMessage);
    }
  };

  // Cierre de sesión
  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      // Limpiar temporizador de inactividad
      if (activityTimeout) {
        clearTimeout(activityTimeout);
        setActivityTimeout(null);
      }
      
      // Limpiar localStorage y sessionStorage
      localStorage.clear();
      sessionStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpiar el estado de autenticación
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      
      // Redirigir al login
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al cerrar sesión',
      }));
      
      // Intentar forzar el cierre de sesión en caso de error
      try {
        await resetConnection();
      } catch (resetError) {
        console.error('Error al forzar cierre de sesión:', resetError);
      }
    }
  };

  // Recuperación de contraseña
  const resetPassword = async (email: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setAuthState(prev => ({ ...prev, loading: false }));
    } catch (error: any) {
      console.error('Error al enviar correo de recuperación:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al enviar correo de recuperación',
      }));
    }
  };

  // Actualizar perfil de usuario
  const updateProfile = async (data: Partial<User>) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!authState.user) throw new Error('No hay usuario autenticado');
      
      const { error } = await supabase
        .from('users')
        .update(data)
        .eq('id', authState.user.id);
      
      if (error) throw error;
      
      // Actualizar el estado con los nuevos datos
      const updatedUser = await getCurrentUser();
      
      if (!updatedUser) {
        throw new Error('No se pudo obtener la información actualizada del usuario');
      }
      
      setAuthState(prev => ({
        ...prev,
        user: updatedUser,
        loading: false,
        error: null,
      }));
    } catch (error: any) {
      console.error('Error al actualizar perfil:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al actualizar perfil',
      }));
    }
  };

  // Actualizar rol de usuario (solo para administradores)
  const updateUserRole = async (userId: string, role: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      if (!authState.user) throw new Error('No hay usuario autenticado');
      
      // Verificar si el usuario actual es administrador
      if (authState.user.role !== 'admin') {
        throw new Error('No tienes permisos para cambiar roles de usuarios');
      }
      
      const { error } = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
      
      if (error) throw error;
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: null,
      }));
      
      return;
    } catch (error: any) {
      console.error('Error al actualizar rol de usuario:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al actualizar rol de usuario',
      }));
      throw error;
    }
  };

  // Verificar si el usuario actual es administrador
  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  // Reiniciar conexión con Supabase
  const resetConnection = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const { success, error } = await resetSupabaseConnection();
      
      if (!success && error) {
        throw new Error(error);
      }
      
      // No necesitamos actualizar el estado aquí porque la página se recargará
    } catch (error: any) {
      console.error('Error al reiniciar la conexión:', error);
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Error al reiniciar la conexión',
      }));
    }
  };

  const value = {
    authState,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
    resetConnection,
    isAdmin,
    updateUserRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};