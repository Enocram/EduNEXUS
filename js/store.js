// ========== ESTADO GLOBAL CENTRALIZADO ==========
const EduStore = {
  // Estado
  state: {
    user: { id: 'local_user', name: 'Explorador' },
    progress: {},
    favorites: { apps: [], courses: [] },
    notes: {},
    preferences: {},
    session: { lastCourse: null, lastLesson: null, lastApp: null },
    history: []
  },
  
  // Listeners
  listeners: [],
  
  // Inicialização
  async init() {
    await this.loadAllData();
    this.setupAutoSave();
    console.log('EduStore inicializado');
  },
  
  // Carregar todos os dados do IndexedDB
  async loadAllData() {
    try {
      // Preferências
      const prefs = await EduDB.loadAllPreferences();
      this.state.preferences = prefs;
      
      // Sessão
      const lastCourse = await EduDB.loadSession('lastCourse');
      const lastLesson = await EduDB.loadSession('lastLesson');
      const lastApp = await EduDB.loadSession('lastApp');
      this.state.session = { lastCourse, lastLesson, lastApp };
      
      // Favoritos
      const favApps = await EduDB.getFavorites('app');
      const favCourses = await EduDB.getFavorites('course');
      this.state.favorites = {
        apps: favApps.map(f => f.itemId),
        courses: favCourses.map(f => f.itemId)
      };
      
      // Anotações
      const allNotes = await EduDB.getAllNotes();
      allNotes.forEach(note => {
        this.state.notes[note.lessonId] = note.note;
      });
      
      // Progresso dos cursos
      const allProgress = await EduDB.loadAllProgress('course');
      allProgress.forEach(p => {
        this.state.progress[p.itemId] = p.data;
      });
      
      // Histórico
      this.state.history = await EduDB.getHistory(20);
      
      // Aplicar preferências ao DOM
      this.applyPreferences();
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    }
  },
  
  // Salvar preferência específica
  async setPreference(key, value) {
    this.state.preferences[key] = value;
    await EduDB.savePreference(key, value);
    this.applyPreferences();
    this.notifyListeners('preferences', { key, value });
  },
  
  // Aplicar preferências ao DOM (tema, acessibilidade, etc.)
  applyPreferences() {
    const prefs = this.state.preferences;
    
    // Tema
    if (prefs.theme) {
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.classList.add(prefs.theme === 'light' ? 'light-theme' : 'dark-theme');
    }
    
    // Alto contraste
    if (prefs.highContrast) document.body.classList.add('high-contrast');
    else document.body.classList.remove('high-contrast');
    
    // Daltonismo
    if (prefs.daltonism) document.body.classList.add('daltonism');
    else document.body.classList.remove('daltonism');
    
    // Fonte grande
    if (prefs.largeFont) document.body.classList.add('large-font');
    else document.body.classList.remove('large-font');
    
    // Espaçamento
    if (prefs.spacingLarge) document.body.classList.add('spacing-lg');
    else document.body.classList.remove('spacing-lg');
  },
  
  // Favoritos
  async toggleFavorite(type, id) {
    const isFav = this.state.favorites[type + 's'].includes(id);
    if (isFav) {
      this.state.favorites[type + 's'] = this.state.favorites[type + 's'].filter(i => i !== id);
      await EduDB.removeFavorite(type, id);
    } else {
      this.state.favorites[type + 's'].push(id);
      await EduDB.addFavorite(type, id);
    }
    this.notifyListeners('favorites', { type, id, isFav: !isFav });
    return !isFav;
  },
  
  // Progresso de aula
  async updateLessonProgress(courseId, lessonId, watchedSeconds, completed = false) {
    const key = `${courseId}_${lessonId}`;
    const current = this.state.progress[key] || { watchedSeconds: 0, completed: false };
    current.watchedSeconds = watchedSeconds;
    if (completed) current.completed = true;
    this.state.progress[key] = current;
    
    await EduDB.saveProgress({
      id: `course_${courseId}`,
      type: 'course',
      itemId: courseId,
      data: this.state.progress
    });
    
    this.notifyListeners('progress', { courseId, lessonId, watchedSeconds, completed });
  },
  
  // Anotações
  async saveNote(lessonId, note) {
    this.state.notes[lessonId] = note;
    await EduDB.saveNote(lessonId, note);
    this.notifyListeners('notes', { lessonId, note });
  },
  
  // Histórico
  async addToHistory(type, itemId, title, url) {
    await EduDB.addToHistory(type, itemId, title, url);
    this.state.history = await EduDB.getHistory(20);
    this.notifyListeners('history', { type, itemId, title });
  },
  
  // Sessão
  async setLastCourse(courseId, lessonId = null) {
    this.state.session.lastCourse = courseId;
    this.state.session.lastLesson = lessonId;
    await EduDB.saveSession('lastCourse', courseId);
    if (lessonId) await EduDB.saveSession('lastLesson', lessonId);
  },
  
  async setLastApp(appId) {
    this.state.session.lastApp = appId;
    await EduDB.saveSession('lastApp', appId);
  },
  
  // Inscrever para mudanças de estado
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  },
  
  notifyListeners(event, data) {
    this.listeners.forEach(cb => cb(event, data, this.state));
  },
  
  // Auto-save periódico (a cada 30 segundos)
  setupAutoSave() {
    setInterval(() => {
      // Salvar progresso pendente (já é salvo individualmente)
      console.log('Auto-save check');
    }, 30000);
  },
  
  // Obter estado (readonly)
  getState() {
    return { ...this.state };
  }
};

// Exportar para uso global
window.EduStore = EduStore;