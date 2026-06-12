// ========== SUPABASE CLIENT – AUTENTICAÇÃO ==========
(function() {
  if (window.SupabaseClient) return;

  // As variáveis devem ser definidas globalmente antes deste script
  const SUPABASE_URL = window.SUPABASE_URL || 'https://seu-projeto.supabase.co';
  const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'sua-chave-anon-publica';

  if (typeof supabase === 'undefined') {
    console.error('❌ Supabase SDK não carregado. Verifique o script da CDN.');
    return;
  }

  const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  window.SupabaseClient = {
    client: supabaseClient,
    isInitialized: true,

// ========== PROGRESSO DE CURSOS ==========
async saveProgress(courseId, lessonId, watchedSeconds, completed) {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const userId = session.user.id;
  const { data, error } = await this.client
    .from('user_progress')
    .upsert({
      user_id: userId,
      course_id: courseId,
      lesson_id: lessonId,
      watched_seconds: watchedSeconds,
      completed: completed,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, course_id, lesson_id' });
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async loadProgress(courseId, lessonId) {
  const session = await this.getSession();
  if (!session) return null;
  const userId = session.user.id;
  const { data, error } = await this.client
    .from('user_progress')
    .select('watched_seconds, completed')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .eq('lesson_id', lessonId)
    .maybeSingle();
  if (error) return null;
  return data;
},
    
// ========== EVENTOS DE NAVEGAÇÃO ==========
async registerEvent(eventType, appId, appName, category) {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const { error } = await this.client
    .from('user_events')
    .insert({
      user_id: session.user.id,
      event_type: eventType,
      app_id: appId,
      app_name: appName,
      category: category
    });
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async getUserEvents(limit = 30) {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const { data, error } = await this.client
    .from('user_events')
    .select('*')
    .eq('user_id', session.user.id)
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (error) return { success: false, error: error.message };
  return { success: true, events: data };
},

// Limpar eventos antigos (opcional)
async clearOldEvents(daysOld = 30) {
  const session = await this.getSession();
  if (!session) return;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  await this.client
    .from('user_events')
    .delete()
    .eq('user_id', session.user.id)
    .lt('timestamp', cutoff.toISOString());
},

// ========== CRUD DE CURSOS ==========
async getCourses() {
  const { data, error } = await this.client
    .from('courses')
    .select('*')
    .order('id');
  if (error) return { success: false, error: error.message };
  return { success: true, data };
},

async createCourse(courseData) {
  const { data, error } = await this.client
    .from('courses')
    .insert([courseData])
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async updateCourse(id, courseData) {
  const { data, error } = await this.client
    .from('courses')
    .update(courseData)
    .eq('id', id)
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async deleteCourse(id) {
  const { error } = await this.client
    .from('courses')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
},

// ========== MÓDULOS ==========
async getModules(courseId) {
  const { data, error } = await this.client
    .from('modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
},

async createModule(moduleData) {
  const { data, error } = await this.client
    .from('modules')
    .insert([moduleData])
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async updateModule(id, moduleData) {
  const { data, error } = await this.client
    .from('modules')
    .update(moduleData)
    .eq('id', id)
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async deleteModule(id) {
  const { error } = await this.client
    .from('modules')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async reorderModules(modules) {
  // modules é um array de objetos com { id, order }
  const promises = modules.map(mod => 
    this.client.from('modules').update({ order: mod.order }).eq('id', mod.id)
  );
  await Promise.all(promises);
  return { success: true };
},

// ========== AULAS ==========
async getLessons(moduleId) {
  const { data, error } = await this.client
    .from('lessons')
    .select('*')
    .eq('module_id', moduleId)
    .order('order', { ascending: true });
  if (error) return { success: false, error: error.message };
  return { success: true, data };
},

async createLesson(lessonData) {
  const { data, error } = await this.client
    .from('lessons')
    .insert([lessonData])
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async updateLesson(id, lessonData) {
  const { data, error } = await this.client
    .from('lessons')
    .update(lessonData)
    .eq('id', id)
    .select();
  if (error) return { success: false, error: error.message };
  return { success: true, data: data[0] };
},

async deleteLesson(id) {
  const { error } = await this.client
    .from('lessons')
    .delete()
    .eq('id', id);
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async reorderLessons(lessons) {
  const promises = lessons.map(lesson => 
    this.client.from('lessons').update({ order: lesson.order }).eq('id', lesson.id)
  );
  await Promise.all(promises);
  return { success: true };
},

// ========== FAVORITOS ==========
async getFavorites() {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const userId = session.user.id;

  const { data, error } = await this.client
    .from('favorites')
    .select('app_id')
    .eq('user_id', userId);
  if (error) return { success: false, error: error.message };
  return { success: true, favorites: data.map(f => f.app_id) };
},

async addFavorite(appId) {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const userId = session.user.id;

  const { error } = await this.client
    .from('favorites')
    .insert({ user_id: userId, app_id: appId });
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async removeFavorite(appId) {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };
  const userId = session.user.id;

  const { error } = await this.client
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('app_id', appId);
  if (error) return { success: false, error: error.message };
  return { success: true };
},

async toggleFavorite(appId) {
  // Primeiro verifica se já é favorito
  const favs = await this.getFavorites();
  if (!favs.success) return { success: false, error: favs.error };
  const isFav = favs.favorites.includes(appId);
  if (isFav) {
    return await this.removeFavorite(appId);
  } else {
    return await this.addFavorite(appId);
  }
},

async signUp(email, password) {
  try {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: { data: { full_name: '' } } // opcional
    });
    if (error) throw error;
    return { success: true, user: data.user };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return { success: false, error: error.message };
  }
},

async createProfile(userId, fullName) {
  try {
    const { error } = await this.client
      .from('profiles')
      .insert({ id: userId, full_name: fullName, created_at: new Date().toISOString() });
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    return { success: false, error: error.message };
  }
},

async getProfile(userId) {
  try {
    const { data, error } = await this.client
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return { success: true, full_name: data?.full_name || '' };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return { success: false, error: error.message };
  }
},

// Atualizar o último acesso do usuário (deve ser chamado após o login)
async updateLastLogin(userId) {
  try {
    const { error } = await this.client
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar último acesso:', error);
    return { success: false, error: error.message };
  }
},

// Buscar dados completos do perfil para o dashboard
async getDashboardData() {
  const session = await this.getSession();
  if (!session) return { success: false, error: 'Não autenticado' };

  const user = session.user;
  const userId = user.id;

  // Busca dados adicionais na tabela profiles
  const { data: profile, error: profileError } = await this.client
    .from('profiles')
    .select('full_name, created_at, last_login')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error('Erro ao buscar perfil:', profileError);
    return { success: false, error: profileError.message };
  }

  return {
    success: true,
    user: {
      id: userId,
      email: user.email,
      full_name: profile.full_name || 'Usuário',
      created_at: profile.created_at,
      last_login: profile.last_login
    }
  };
},

    // Login com email/senha
    async signIn(email, password) {
      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        return { success: true, user: data.user };
      } catch (error) {
        console.error('Erro no login:', error);
        return { success: false, error: error.message };
      }
    },

    // Login com Google (redireciona e volta)
    async signInWithGoogle() {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) {
        console.error('Erro no login com Google:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    },

    // Logout
    async signOut() {
      const { error } = await supabaseClient.auth.signOut();
      if (error) {
        console.error('Erro no logout:', error);
        return { success: false, error: error.message };
      }
      return { success: true };
    },

    // Obter sessão atual
    async getSession() {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (error) {
        console.error('Erro ao obter sessão:', error);
        return null;
      }
      return session;
    },

    // Verificar se está autenticado
    async isAuthenticated() {
      const session = await this.getSession();
      return !!session;
    },

    // Obter dados do usuário atual
    async getUser() {
      const { data: { user }, error } = await supabaseClient.auth.getUser();
      if (error) return null;
      return user;
    },

    // Observar mudanças de autenticação (login/logout)
    onAuthStateChange(callback) {
      return supabaseClient.auth.onAuthStateChange((event, session) => {
        callback(event, session);
      });
    }
  };

  console.log('✅ SupabaseClient inicializado');
})();