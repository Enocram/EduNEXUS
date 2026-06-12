// Gerenciador do IndexedDB
const DB_NAME = 'edunexus_db';
const DB_VERSION = 1;

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Stores: progress, favorites, notes, courses
      if (!db.objectStoreNames.contains('progress')) {
        const progressStore = db.createObjectStore('progress', { keyPath: 'id' });
        progressStore.createIndex('type', 'type', { unique: false });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('courses')) {
        db.createObjectStore('courses', { keyPath: 'id' });
      }
    };
  });
}

// Salvar progresso do curso/aula
async function saveProgress(progress) {
  const db = await openDB();
  const tx = db.transaction('progress', 'readwrite');
  const store = tx.objectStore('progress');
  store.put(progress);
  return tx.complete;
}

// Carregar progresso
async function loadProgress(type, id) {
  const db = await openDB();
  const tx = db.transaction('progress', 'readonly');
  const store = tx.objectStore('progress');
  return new Promise((resolve) => {
    const request = store.get(`${type}_${id}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

// Favoritos
async function addFavorite(appId) {
  const db = await openDB();
  const tx = db.transaction('favorites', 'readwrite');
  const store = tx.objectStore('favorites');
  store.put({ id: appId });
  return tx.complete;
}

async function removeFavorite(appId) {
  const db = await openDB();
  const tx = db.transaction('favorites', 'readwrite');
  const store = tx.objectStore('favorites');
  store.delete(appId);
  return tx.complete;
}

async function getFavorites() {
  const db = await openDB();
  const tx = db.transaction('favorites', 'readonly');
  const store = tx.objectStore('favorites');
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.map(r => r.id));
    request.onerror = () => resolve([]);
  });
}

// Anotações
async function saveNote(lessonId, note) {
  const db = await openDB();
  const tx = db.transaction('notes', 'readwrite');
  const store = tx.objectStore('notes');
  store.put({ id: lessonId, note });
  return tx.complete;
}

async function loadNote(lessonId) {
  const db = await openDB();
  const tx = db.transaction('notes', 'readonly');
  const store = tx.objectStore('notes');
  return new Promise((resolve) => {
    const request = store.get(lessonId);
    request.onsuccess = () => resolve(request.result?.note || '');
    request.onerror = () => resolve('');
  });
}

// Salvar curso offline (para acesso sem internet)
async function saveCourseOffline(course) {
  const db = await openDB();
  const tx = db.transaction('courses', 'readwrite');
  const store = tx.objectStore('courses');
  store.put({ id: course.id, data: course });
  return tx.complete;
}

async function getOfflineCourse(courseId) {
  const db = await openDB();
  const tx = db.transaction('courses', 'readonly');
  const store = tx.objectStore('courses');
  return new Promise((resolve) => {
    const request = store.get(courseId);
    request.onsuccess = () => resolve(request.result?.data);
    request.onerror = () => resolve(null);
  });
}

// Exportar funções para escopo global
window.DB = {
  saveProgress, loadProgress,
  addFavorite, removeFavorite, getFavorites,
  saveNote, loadNote,
  saveCourseOffline, getOfflineCourse
};