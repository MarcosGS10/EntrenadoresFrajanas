import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar que las variables de entorno estén definidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Variables de entorno de Supabase no definidas');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? 'Definida' : 'No definida');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Definida' : 'No definida');
}

// Crear cliente de Supabase con opciones de persistencia
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'supabase.auth.token'
  }
});

// Función para obtener el usuario actual
export const getCurrentUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error al obtener la sesión:', sessionError);
      return null;
    }
    
    if (!session) {
      console.log('No hay sesión activa');
      return null;
    }
    
    // Intentar obtener el usuario con la columna createdAt (camelCase)
    let { data: user, error } = await supabase
      .from('users')
      .select('id, email, nombre, experiencia, especialidad, "createdAt", role')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error al obtener el usuario:', error);
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    return null;
  }
};

// Función para verificar si el token de sesión ha expirado
export const isSessionExpired = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return true;
    
    // Verificar si la sesión ha expirado
    const expiresAt = new Date(session.expires_at * 1000);
    const now = new Date();
    
    return now > expiresAt;
  } catch (error) {
    console.error('Error en isSessionExpired:', error);
    return true;
  }
};

// Función para verificar la conexión con Supabase
export const checkSupabaseConnection = async () => {
  try {
    // Primero verificamos que podamos conectarnos a Supabase
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return { connected: false, error: `Error de autenticación: ${authError.message}` };
    }
    
    // Verificar que podamos hacer una operación simple
    const { error: pingError } = await supabase.rpc('ping');
    
    if (pingError) {
      return { connected: false, error: `Error de conexión: ${pingError.message}` };
    }
    
    return { connected: true, error: null };
  } catch (error: any) {
    return { connected: false, error: `Error inesperado: ${error.message}` };
  }
};

// Función para reiniciar la conexión con Supabase
export const resetSupabaseConnection = async () => {
  try {
    // Cerrar sesión actual
    await supabase.auth.signOut({ scope: 'local' });
    
    // Limpiar caché local
    localStorage.clear();
    sessionStorage.clear();
    
    // Limpiar cookies relacionadas con la autenticación
    document.cookie.split(';').forEach(cookie => {
      const [name] = cookie.trim().split('=');
      if (name.includes('supabase') || name.includes('sb-')) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    });
    
    // Recargar la página
    window.location.reload();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Función para obtener todos los usuarios (solo para administradores)
export const getAllUsers = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No hay sesión activa', data: null };
    }

    // Verificar si el usuario actual es admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para ver esta información', data: null };
    }

    // Obtener todos los usuarios
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error al obtener usuarios:', error);
      return { success: false, error: error.message, data: null };
    }
    
    return { success: true, error: null, data };
  } catch (error: any) {
    console.error('Error inesperado al obtener usuarios:', error);
    return { success: false, error: error.message, data: null };
  }
};

// Función para obtener todos los entrenamientos (solo para administradores)
export const getAllEntrenamientos = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'No hay sesión activa', data: null };
    }

    // Verificar si el usuario actual es admin
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userError || currentUser?.role !== 'admin') {
      return { success: false, error: 'No tienes permisos para ver esta información', data: null };
    }

    const { data, error } = await supabase
      .from('entrenamientos')
      .select(`
        *,
        users:userid (nombre, email)
      `)
      .eq('completado', true)
      .order('createdAt', { ascending: false });
    
    if (error) {
      console.error('Error al obtener entrenamientos:', error);
      return { success: false, error: error.message, data: null };
    }
    
    return { success: true, error: null, data };
  } catch (error: any) {
    console.error('Error inesperado al obtener entrenamientos:', error);
    return { success: false, error: error.message, data: null };
  }
};