// ========== EDUINSIGHTS – MOTOR DE DESCOBERTA INTELIGENTE ==========
const EduInsights = {
  // Histórico de navegação (últimos apps, favoritos, categorias, acessibilidade)
  userData: {
    lastApps: [],           // [{ id, name, timestamp }]
    favoriteApps: [],
    categoryVisits: {},     // { categoria: count }
    acessibilityUsed: false,
    lastAccessibilityChange: null,
    totalVisits: 0
  },

  // Biblioteca de mensagens genéricas
  libraries: {
    general: [
      "💡 Explore os aplicativos disponíveis e descubra novas possibilidades para ensino e aprendizagem.",
      "💡 Cada aplicativo do EduNEXUS foi desenvolvido para resolver necessidades específicas da educação contemporânea.",
      "💡 Você pode favoritar aplicativos para encontrá-los mais rapidamente depois.",
      "💡 O EduNEXUS foi projetado para funcionar em computadores, tablets e smartphones.",
      "💡 Explore diferentes categorias de aplicativos para ampliar suas possibilidades pedagógicas."
    ],
    accessibility: [
      "♿ Experimente os modos de acessibilidade disponíveis nas configurações.",
      "♿ O leitor de tela integrado pode ajudar na navegação e no consumo de conteúdo.",
      "♿ O modo alto contraste melhora a legibilidade para diversos perfis de usuários.",
      "♿ O tamanho da fonte pode ser ajustado conforme sua necessidade.",
      "♿ Os aplicativos do catálogo podem possuir recursos próprios de acessibilidade."
    ],
    edTech: [
      "🚀 Tecnologias digitais podem ampliar a participação dos estudantes nas atividades escolares.",
      "🚀 Recursos digitais bem utilizados favorecem personalização da aprendizagem.",
      "🚀 Ferramentas acessíveis beneficiam todos os estudantes, não apenas aqueles com deficiência.",
      "🚀 A tecnologia assistiva pode remover barreiras e ampliar oportunidades educacionais."
    ],
    specialEducation: [
      "📘 A inclusão acontece quando barreiras são removidas e oportunidades são ampliadas.",
      "📘 Recursos acessíveis favorecem a participação e a autonomia dos estudantes.",
      "📘 Estratégias inclusivas beneficiam toda a comunidade escolar.",
      "📘 Pequenas adaptações podem gerar grandes impactos na aprendizagem."
    ],
    assistiveTech: [
      "🦾 Tecnologia assistiva não é apenas equipamento; também envolve estratégias e recursos digitais.",
      "🦾 Ferramentas acessíveis podem ampliar comunicação, autonomia e participação.",
      "🦾 Muitos aplicativos educacionais podem funcionar como recursos de tecnologia assistiva."
    ],
    discovery: [
      "🔎 Você já visitou outros aplicativos do catálogo hoje?",
      "🔎 Cada aplicativo possui funcionalidades diferentes para contextos distintos.",
      "🔎 Explore novos aplicativos para descobrir recursos que podem complementar sua prática."
    ],
    favorites: [
      "⭐ Favoritar aplicativos ajuda a criar sua própria coleção personalizada.",
      "⭐ Seus aplicativos favoritos ficam mais fáceis de encontrar.",
      "⭐ Você ainda não favoritou nenhum app. Comece agora!"
    ],
    contact: [
      "📬 Tem alguma dúvida? Entre em contato diretamente pela Central.",
      "📬 Sugestões ajudam a melhorar continuamente a plataforma.",
      "📬 Compartilhe suas ideias para futuras funcionalidades."
    ],
    customAppRequest: [
      "🛠️ Precisa de um aplicativo educacional personalizado para sua instituição?",
      "🛠️ Deseja transformar uma ideia em um aplicativo funcional?",
      "🛠️ O EduNEXUS também pode apoiar o desenvolvimento de soluções digitais sob medida.",
      "🛠️ Tem um desafio educacional específico? Entre em contato para discutir uma solução personalizada.",
      "🛠️ Sua escola, projeto ou instituição pode ter um aplicativo desenvolvido conforme suas necessidades."
    ],
    suggestions: [
      "💬 Sua sugestão pode inspirar novos aplicativos.",
      "💬 Compartilhe ideias para futuras melhorias.",
      "💬 O EduNEXUS evolui continuamente com a colaboração dos usuários."
    ]
  },

  // Inicialização
  init() {
    this.loadUserData();
    this.setupEventListeners();
    console.log('EduInsights inicializado');
  },

  loadUserData() {
    const saved = localStorage.getItem('edunexus_insights');
    if (saved) {
      try { this.userData = JSON.parse(saved); } catch(e) {}
    }
  },

  saveUserData() {
    localStorage.setItem('edunexus_insights', JSON.stringify(this.userData));
  },

  recordAppVisit(appId, appName, category) {
    const now = Date.now();
    const existing = this.userData.lastApps.find(a => a.id === appId);
    if (existing) existing.timestamp = now;
    else {
      this.userData.lastApps.unshift({ id: appId, name: appName, timestamp: now });
      if (this.userData.lastApps.length > 5) this.userData.lastApps.pop();
    }
    if (category) {
      this.userData.categoryVisits[category] = (this.userData.categoryVisits[category] || 0) + 1;
    }
    this.userData.totalVisits++;
    this.saveUserData();
  },

  recordFavorite(appId, isFavorite) {
    if (isFavorite) {
      if (!this.userData.favoriteApps.includes(appId)) this.userData.favoriteApps.push(appId);
    } else {
      this.userData.favoriteApps = this.userData.favoriteApps.filter(id => id !== appId);
    }
    this.saveUserData();
  },

  recordAccessibilityUse() {
    if (!this.userData.acessibilityUsed) {
      this.userData.acessibilityUsed = true;
      this.userData.lastAccessibilityChange = Date.now();
      this.saveUserData();
    }
  },

  getRandomItem(arr) {
    if (!arr.length) return "💡 Explore o EduNEXUS e descubra novas possibilidades.";
    return arr[Math.floor(Math.random() * arr.length)];
  },

  getContextualInsight(route, currentData = null) {
    if (route === 'dashboard') {
      if (this.userData.lastApps.length > 0) {
        const last = this.userData.lastApps[0];
        const app = window.AppData.apps.find(a => a.id === last.id);
        if (app && app.insights && app.insights.length) {
          return this.getRandomItem(app.insights);
        }
        return this.getRandomItem(this.libraries.discovery);
      }
      return this.getRandomItem(this.libraries.general);
    }
    if (route === 'apps') {
      if (this.userData.favoriteApps.length === 0) return this.getRandomItem(this.libraries.favorites);
      return this.getRandomItem(this.libraries.discovery);
    }
    if (route === 'app-detail' && currentData && currentData.insights?.length) {
      return this.getRandomItem(currentData.insights);
    }
    if (route === 'courses') return "📚 Explore os cursos disponíveis e amplie seus conhecimentos.";
    if (route === 'player') return "🎬 Mantenha o foco! Anote ideias e revise os materiais.";
    if (route === 'settings') {
      if (!this.userData.acessibilityUsed) return "♿ Ative alto contraste, fonte dislexia e comandos de voz aqui mesmo!";
      return "⚙️ Configure o EduNEXUS do seu jeito – tudo salvo automaticamente.";
    }
    if (route === 'contact') {
      if (Math.random() < 0.5) return this.getRandomItem(this.libraries.customAppRequest);
      return this.getRandomItem(this.libraries.suggestions);
    }
    if (route === 'profile') {
      if (this.userData.favoriteApps.length === 0) return "⭐ Favoritar apps ajuda a construir sua coleção personalizada.";
      return "👤 Acompanhe seu progresso e descubra novos conteúdos.";
    }
    return this.getRandomItem(this.libraries.general);
  },

  getRecommendationInsight() {
    if (this.userData.lastApps.length > 0) {
      const last = this.userData.lastApps[0];
      return `↩️ Você visitou recentemente "${last.name}". Deseja acessá-lo novamente? <button class="insight-action" data-app-id="${last.id}">Abrir</button>`;
    }
    return this.getRandomItem(this.libraries.discovery);
  },

  updateInsightsCard(route, contextData = null) {
    let insightText = this.getContextualInsight(route, contextData);
    if (route === 'dashboard' && this.userData.lastApps.length > 0 && Math.random() < 0.6) {
      insightText = this.getRecommendationInsight();
    }
    const card = document.getElementById('eduInsightsCard');
    if (!card) return;
    card.innerHTML = `
      <div class="insights-icon">💡</div>
      <div class="insights-content">${insightText}</div>
      <button class="insights-refresh" aria-label="Novo insight"><i class="fas fa-sync-alt"></i></button>
    `;
    const refreshBtn = card.querySelector('.insights-refresh');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newInsight = this.getContextualInsight(route, contextData);
        card.querySelector('.insights-content').innerHTML = newInsight;
        const actionBtn = card.querySelector('.insight-action');
        if (actionBtn) actionBtn.addEventListener('click', (e2) => {
          const appId = actionBtn.dataset.appId;
          if (window.Router) Router.navigate('app-detail', { id: appId });
        });
      });
    }
    const actionBtn = card.querySelector('.insight-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', (e) => {
        const appId = actionBtn.dataset.appId;
        if (window.Router) Router.navigate('app-detail', { id: appId });
      });
    }
  },

  setupEventListeners() {
    const observer = new MutationObserver(() => {
      const a11yClasses = ['high-contrast-dark', 'high-contrast-light', 'dyslexic-font', 'reduce-animations', 'large-cursor', 'reading-guide', 'low-distraction'];
      const anyActive = a11yClasses.some(cls => document.body.classList.contains(cls));
      if (anyActive && !this.userData.acessibilityUsed) this.recordAccessibilityUse();
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
};

window.EduInsights = EduInsights;