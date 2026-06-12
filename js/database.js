// ========== GERENCIADOR DE BANCO DE DADOS INDEXEDDB (VERSÃO ESTÁVEL) ==========
(function() {
  const EDU_DB_NAME = 'edunexus_db_main';
  const EDU_DB_VERSION = 3; // versão atualizada para incluir stores admin

  let dbInstance = null;

  function openDatabase() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      
      const request = indexedDB.open(EDU_DB_NAME, EDU_DB_VERSION);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        dbInstance = request.result;
        resolve(dbInstance);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        
        // Stores principais
        if (!db.objectStoreNames.contains('progress')) {
          const store = db.createObjectStore('progress', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains('favorites')) {
          const store = db.createObjectStore('favorites', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
        }
        if (!db.objectStoreNames.contains('notes')) {
          const store = db.createObjectStore('notes', { keyPath: 'id' });
          store.createIndex('lessonId', 'lessonId', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        if (!db.objectStoreNames.contains('history')) {
          const store = db.createObjectStore('history', { keyPath: 'timestamp', autoIncrement: true });
          store.createIndex('type', 'type', { unique: false });
          store.createIndex('itemId', 'itemId', { unique: false });
        }
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('session')) {
          db.createObjectStore('session', { keyPath: 'key' });
        }
        
        // Stores administrativas (para admin panel)
        if (!db.objectStoreNames.contains('admin_apps')) {
          db.createObjectStore('admin_apps', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('admin_courses')) {
          db.createObjectStore('admin_courses', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('admin_categories')) {
          db.createObjectStore('admin_categories', { keyPath: 'id' });
        }
        
        if (oldVersion < 3) {
          console.log('Banco de dados atualizado para versão 3 (stores admin criadas).');
        }
      };
    });
  }

  // ========== PROGRESSO DOS CURSOS ==========
  async function saveProgress(progress) {
    const db = await openDatabase();
    const tx = db.transaction('progress', 'readwrite');
    const store = tx.objectStore('progress');
    progress.updatedAt = Date.now();
    store.put(progress);
    return tx.complete;
  }

  async function loadProgress(type, itemId) {
    const db = await openDatabase();
    const tx = db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    return new Promise((resolve) => {
      const request = store.get(`${type}_${itemId}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function loadAllProgress(type) {
    const db = await openDatabase();
    const tx = db.transaction('progress', 'readonly');
    const store = tx.objectStore('progress');
    const index = store.index('type');
    return new Promise((resolve) => {
      const request = index.getAll(type);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // ========== FAVORITOS ==========
  async function addFavorite(type, id, data = {}) {
    const db = await openDatabase();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    store.put({ id: `${type}_${id}`, type, itemId: id, data, createdAt: Date.now() });
    return tx.complete;
  }

  async function removeFavorite(type, id) {
    const db = await openDatabase();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    store.delete(`${type}_${id}`);
    return tx.complete;
  }

  async function getFavorites(type = null) {
    const db = await openDatabase();
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    return new Promise((resolve) => {
      if (type) {
        const index = store.index('type');
        const request = index.getAll(type);
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => resolve([]);
      }
    });
  }

  // ========== ANOTAÇÕES ==========
  async function saveNote(lessonId, note) {
    const db = await openDatabase();
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    store.put({ id: `note_${lessonId}`, lessonId, note, updatedAt: Date.now() });
    return tx.complete;
  }

  async function loadNote(lessonId) {
    const db = await openDatabase();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    return new Promise((resolve) => {
      const request = store.get(`note_${lessonId}`);
      request.onsuccess = () => resolve(request.result?.note || '');
      request.onerror = () => resolve('');
    });
  }

  async function getAllNotes() {
    const db = await openDatabase();
    const tx = db.transaction('notes', 'readonly');
    const store = tx.objectStore('notes');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  // ========== HISTÓRICO ==========
  async function addToHistory(type, itemId, title, url) {
    const db = await openDatabase();
    const tx = db.transaction('history', 'readwrite');
    const store = tx.objectStore('history');
    store.add({ type, itemId, title, url, timestamp: Date.now() });
    return tx.complete;
  }

  async function getHistory(limit = 50) {
    const db = await openDatabase();
    const tx = db.transaction('history', 'readonly');
    const store = tx.objectStore('history');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const history = request.result || [];
        history.sort((a, b) => b.timestamp - a.timestamp);
        resolve(history.slice(0, limit));
      };
      request.onerror = () => resolve([]);
    });
  }

  // ========== PREFERÊNCIAS ==========
  async function savePreference(key, value) {
    const db = await openDatabase();
    const tx = db.transaction('preferences', 'readwrite');
    const store = tx.objectStore('preferences');
    store.put({ key, value, updatedAt: Date.now() });
    return tx.complete;
  }

  async function loadPreference(key, defaultValue = null) {
    const db = await openDatabase();
    const tx = db.transaction('preferences', 'readonly');
    const store = tx.objectStore('preferences');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? defaultValue);
      request.onerror = () => resolve(defaultValue);
    });
  }

  async function loadAllPreferences() {
    const db = await openDatabase();
    const tx = db.transaction('preferences', 'readonly');
    const store = tx.objectStore('preferences');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const prefs = {};
        (request.result || []).forEach(p => { prefs[p.key] = p.value; });
        resolve(prefs);
      };
      request.onerror = () => resolve({});
    });
  }

  // ========== SESSÃO ==========
  async function saveSession(key, value) {
    const db = await openDatabase();
    const tx = db.transaction('session', 'readwrite');
    const store = tx.objectStore('session');
    store.put({ key, value, updatedAt: Date.now() });
    return tx.complete;
  }

  async function loadSession(key) {
    const db = await openDatabase();
    const tx = db.transaction('session', 'readonly');
    const store = tx.objectStore('session');
    return new Promise((resolve) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => resolve(null);
    });
  }

  // Exportar API global
  window.EduDB = {
    openDatabase,
    saveProgress, loadProgress, loadAllProgress,
    addFavorite, removeFavorite, getFavorites,
    saveNote, loadNote, getAllNotes,
    addToHistory, getHistory,
    savePreference, loadPreference, loadAllPreferences,
    saveSession, loadSession
  };
})();