// ========== MIGRAÇÃO DE DADOS DO LOCALSTORAGE PARA INDEXEDDB ==========
async function migrateFromLocalStorage() {
  console.log('Verificando dados antigos no localStorage...');
  
  // Favoritos antigos
  const oldFavorites = localStorage.getItem('edunexus_favorites');
  if (oldFavorites) {
    try {
      const favorites = JSON.parse(oldFavorites);
      for (const id of favorites) {
        await EduDB.addFavorite('app', id);
      }
      console.log(`Migrados ${favorites.length} favoritos`);
      localStorage.removeItem('edunexus_favorites');
    } catch(e) {}
  }
  
  // Progresso antigo dos cursos
  const courseIds = [101, 102, 103, 104];
  for (const courseId of courseIds) {
    const progressKey = `course_${courseId}_progress`;
    const oldProgress = localStorage.getItem(progressKey);
    if (oldProgress) {
      try {
        const progress = JSON.parse(oldProgress);
        await EduDB.saveProgress({
          id: `course_${courseId}`,
          type: 'course',
          itemId: courseId,
          data: progress
        });
        console.log(`Migrado progresso do curso ${courseId}`);
        localStorage.removeItem(progressKey);
      } catch(e) {}
    }
  }
  
  // Anotações antigas
  const oldNotes = localStorage.getItem('course_notes');
  if (oldNotes) {
    try {
      const notes = JSON.parse(oldNotes);
      for (const [lessonId, note] of Object.entries(notes)) {
        await EduDB.saveNote(parseInt(lessonId), note);
      }
      console.log(`Migradas ${Object.keys(notes).length} anotações`);
      localStorage.removeItem('course_notes');
    } catch(e) {}
  }
  
  // Preferências antigas
  const prefKeys = ['theme', 'highContrast', 'daltonism', 'lowVision', 'fontSize', 'lineSpacing'];
  for (const key of prefKeys) {
    const value = localStorage.getItem(key);
    if (value !== null) {
      await EduDB.savePreference(key, value === 'true' ? true : value);
      console.log(`Migrada preferência ${key}: ${value}`);
      localStorage.removeItem(key);
    }
  }
  
  console.log('Migração concluída!');
}

// Executar migração ao iniciar
if (window.EduDB) {
  migrateFromLocalStorage().catch(console.error);
}