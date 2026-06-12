let actionQueue = [];

function queueAction(action) {
  actionQueue.push(action);
  localStorage.setItem('offline_queue', JSON.stringify(actionQueue));
  showToast('Ação salva offline. Será sincronizada quando a conexão voltar.', 'info');
}

async function processQueue() {
  if (!navigator.onLine) return;
  const queue = JSON.parse(localStorage.getItem('offline_queue') || '[]');
  if (queue.length === 0) return;
  
  for (const action of queue) {
    try {
      if (action.type === 'favorite') {
        if (window.SupabaseClient && await SupabaseClient.isAuthenticated()) {
          if (action.add) await SupabaseClient.addFavorite(action.id);
          else await SupabaseClient.removeFavorite(action.id);
        } else {
          if (action.add) await DB.addFavorite(action.id);
          else await DB.removeFavorite(action.id);
        }
      } else if (action.type === 'progress') {
        await DB.saveProgress(action.data);
      } else if (action.type === 'note') {
        await DB.saveNote(action.lessonId, action.note);
      }
    } catch (e) { console.error('Erro ao sincronizar:', e); }
  }
  localStorage.setItem('offline_queue', '[]');
  showToast('Sincronização concluída!', 'success');
}

window.addEventListener('online', () => {
  showToast('Conexão restabelecida!', 'success');
  processQueue();
});
window.addEventListener('offline', () => {
  showToast('Você está offline. Algumas ações serão salvas.', 'warning');
});

if (navigator.onLine) processQueue();