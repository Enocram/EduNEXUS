// ========== MOTOR DE RECOMENDAÇÃO ==========
const Recommendations = {
  // Recomenda apps baseado em: categorias mais visitadas, últimos apps abertos, favoritos
  async getRecommendations(limit = 4) {
    if (!window.SupabaseClient) return [];

    // Buscar eventos dos últimos 7 dias
    const eventsResult = await SupabaseClient.getUserEvents(50);
    if (!eventsResult.success) return [];

    const events = eventsResult.events;
    if (events.length === 0) return [];

    // 1. Calcular frequência de categorias
    const categoryCount = {};
    events.forEach(e => {
      if (e.category) {
        categoryCount[e.category] = (categoryCount[e.category] || 0) + 1;
      }
    });
    const topCategory = Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b, null);

    // 2. Últimos apps abertos (evitar repetir os mesmos)
    const recentAppIds = events.filter(e => e.event_type === 'open_app').map(e => e.app_id).slice(0, 3);

    // 3. Apps favoritos (já carregados em window.AppData)
    const favoriteIds = (window.AppData?.apps || []).filter(a => a.favorite).map(a => a.id);

    // 4. Montar lista de candidatos: apps da categoria favorita + apps não visitados recentemente
    let candidates = (window.AppData?.apps || []).filter(app => {
      // Exclui apps já favoritados (opcional: pode manter)
      if (favoriteIds.includes(app.id)) return false;
      // Exclui apps visitados nos últimos 3 eventos
      if (recentAppIds.includes(app.id)) return false;
      // Prioriza apps da categoria mais frequente
      if (topCategory && app.category === topCategory) return true;
      return true;
    });

    // Ordenar por: se tem insights (prefere apps com insights), depois por ordem original
    candidates.sort((a, b) => {
      const aHas = a.insights && a.insights.length > 0;
      const bHas = b.insights && b.insights.length > 0;
      if (aHas && !bHas) return -1;
      if (!aHas && bHas) return 1;
      return 0;
    });

    return candidates.slice(0, limit);
  },

  // Obter insight contextual para um app específico
  getInsightForApp(app) {
    if (app.insights && app.insights.length > 0) {
      // Retorna um insight aleatório do app
      const randomIndex = Math.floor(Math.random() * app.insights.length);
      return app.insights[randomIndex];
    }
    // Fallback: mensagem genérica
    return `✨ Explore ${app.name} e descubra novas possibilidades de aprendizagem.`;
  },

  // Obter insight geral baseado no histórico do usuário
  async getContextualInsight() {
    const events = await SupabaseClient.getUserEvents(10);
    if (!events.success || events.events.length === 0) {
      return "💡 Comece a explorar apps e receba recomendações personalizadas.";
    }
    const lastEvent = events.events[0];
    if (lastEvent.event_type === 'open_app') {
      return `🔍 Você visitou ${lastEvent.app_name} recentemente. Que tal explorar conteúdos semelhantes?`;
    }
    return "💡 Continue navegando e descubra novos apps que podem te ajudar.";
  }
};

window.Recommendations = Recommendations;