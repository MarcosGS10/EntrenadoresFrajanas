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
      
      // Verificar si el error es porque el usuario no existe en la tabla users
      if (error.code === 'PGRST116') {
        console.log('Usuario autenticado pero no existe en la tabla users, intentando crearlo');
        
        try {
          // Verificar primero si el usuario ya existe (para evitar duplicados)
          const { count, error: countError } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .eq('id', session.user.id);
            
          if (countError) {
            console.error('Error al verificar si el usuario existe:', countError);
            return null;
          }
          
          // Si el usuario no existe, crearlo
          if (count === 0) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email,
                nombre: session.user.user_metadata?.nombre || session.user.email?.split('@')[0] || 'Usuario',
                experiencia: session.user.user_metadata?.experiencia || null,
                especialidad: session.user.user_metadata?.especialidad || null,
                "createdAt": new Date().toISOString(),
                role: 'entrenador' // Asignar rol de entrenador por defecto
              });
            
            if (insertError) {
              console.error('Error al crear usuario en la tabla users:', insertError);
              
              // Si el error es de clave duplicada, intentar obtener el usuario existente
              if (insertError.code === '23505') {
                console.log('El usuario ya existe, intentando obtenerlo nuevamente');
              } else {
                return null;
              }
            }
          }
          
          // Intentar obtener el usuario nuevamente
          const { data: newUser, error: newError } = await supabase
            .from('users')
            .select('id, email, nombre, experiencia, especialidad, "createdAt", role')
            .eq('id', session.user.id)
            .single();
          
          if (newError) {
            console.error('Error al obtener el usuario después de crearlo:', newError);
            return null;
          }
          
          return newUser;
        } catch (createError) {
          console.error('Error inesperado al crear usuario:', createError);
          return null;
        }
      }
      
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
    const { error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      return { connected: false, error: `Error de autenticación: ${authError.message}` };
    }
    
    // Luego verificamos que podamos acceder a la tabla users
    const { error: dbError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    
    if (dbError) {
      // Si el error es de permisos, es posible que el usuario no esté autenticado
      if (dbError.code === 'PGRST301') {
        return { connected: true, error: null }; // Consideramos que la conexión es exitosa
      }
      return { connected: false, error: `Error de base de datos: ${dbError.message}` };
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
    localStorage.removeItem('supabase.auth.token');
    sessionStorage.removeItem('supabase.auth.token');
    
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

// Función para refrescar el token de autenticación
export const refreshAuthToken = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Error al refrescar el token:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, session: data.session };
  } catch (error: any) {
    console.error('Error inesperado al refrescar el token:', error);
    return { success: false, error: error.message };
  }
};

// Función para obtener todos los usuarios (solo para administradores)
export const getAllUsers = async () => {
  try {
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
    const { data, error } = await supabase
      .from('entrenamientos')
      .select(`
        *,
        users:userid (nombre, email)
      `)
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