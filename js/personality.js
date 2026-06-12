// ========== PERSONALIDADE DIGITAL EDUNEXUS ==========
const EduPersonality = {
  // Frases contextuais
  phrases: {
    greetings: [
      "Pronto para explorar novos horizontes? 🌌",
      "O conhecimento espera por você. 🧠",
      "Que a curiosidade guie seu caminho. 🚀",
      "Bem-vindo ao ecossistema do futuro. ✨",
      "Hoje é um ótimo dia para aprender algo incrível. 💡"
    ],
    emptyStates: {
      apps: "Nenhum app encontrado. Explore nossa coleção! 📱",
      courses: "Ainda nenhum curso? Comece sua jornada agora! 🎓",
      favorites: "Seus apps favoritos aparecerão aqui. ❤️",
      notes: "Suas anotações aparecerão aqui. Anote ideias! 📝",
      search: "Nada encontrado. Tente outra palavra-chave. 🔍"
    },
    achievements: {
      firstCourse: { title: "🌱 Primeiro Passo", desc: "Iniciou seu primeiro curso" },
      firstApp: { title: "📱 Explorador Digital", desc: "Abriu seu primeiro app" },
      note: { title: "✍️ Escritor", desc: "Criou sua primeira anotação" },
      favorite: { title: "💖 Favoritou", desc: "Adicionou um app aos favoritos" },
      completeLesson: { title: "🏆 Aprendiz", desc: "Concluiu sua primeira aula" },
      offline: { title: "⚡ Resiliente", desc: "Usou o app offline" },
      studyTime: { title: "⏱️ Dedicado", desc: "Estudou por mais de 1 hora" }
    },
    progressFeedback: [
      "Você está progredindo! Continue assim. 📈",
      "Mais um passo rumo ao conhecimento. 🧭",
      "Cada aula é uma conquista. 🎯",
      "Seu esforço está te levando longe. 💪"
    ],
    offlineMessages: [
      "Modo offline ativado. Seus dados estão seguros. 📡",
      "Sem internet? Sem problemas! Continue estudando. 🌍",
      "Modo sobrevivência ativado. O conhecimento não para. 🛰️"
    ]
  },

  // Conquistas desbloqueadas (salvas no localStorage/IndexedDB)
  unlockedAchievements: [],

  // Inicialização
  async init() {
    await this.loadAchievements();
    this.setupEventListeners();
    this.showRandomGreeting();
    console.log('EduPersonality ativado');
  },

  async loadAchievements() {
    try {
      const saved = localStorage.getItem('edunexus_achievements');
      if (saved) this.unlockedAchievements = JSON.parse(saved);
      else this.unlockedAchievements = [];
    } catch(e) { this.unlockedAchievements = []; }
  },

  saveAchievements() {
    localStorage.setItem('edunexus_achievements', JSON.stringify(this.unlockedAchievements));
  },

  // Desbloquear conquista
  async unlockAchievement(key, force = false) {
    if (this.unlockedAchievements.includes(key)) return false;
    const ach = this.phrases.achievements[key];
    if (!ach) return false;
    this.unlockedAchievements.push(key);
    this.saveAchievements();
    this.showAchievementToast(ach.title, ach.desc);
    return true;
  },

  // Exibir notificação de conquista
  showAchievementToast(title, desc) {
    const toast = document.createElement('div');
    toast.className = 'achievement-toast';
    toast.innerHTML = `
      <div class="achievement-icon">🏆</div>
      <div class="achievement-text">
        <strong>${title}</strong><br>
        <small>${desc}</small>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 500);
    }, 4000);
  },

  // Mostrar saudação aleatória no header
  showRandomGreeting() {
    const greetingEl = document.querySelector('.hero-greeting');
    if (greetingEl && !greetingEl.dataset.customized) {
      const randomGreeting = this.phrases.greetings[Math.floor(Math.random() * this.phrases.greetings.length)];
      // Adiciona a saudação personalizada após o "Bom dia"
      const originalText = greetingEl.innerText;
      greetingEl.innerHTML = `${originalText}<span style="font-size: 0.8rem; display: block; color: var(--neon-cyan);">${randomGreeting}</span>`;
      greetingEl.dataset.customized = 'true';
    }
  },

  // Estado vazio elegante
  renderEmptyState(containerId, type, customMessage = null) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const message = customMessage || this.phrases.emptyStates[type] || "Nada por aqui ainda.";
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <p>${message}</p>
        <button class="btn-neon empty-action" data-action="${type}">Explorar agora</button>
      </div>
    `;
    const actionBtn = container.querySelector('.empty-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', () => {
        if (type === 'apps') Router.navigate('apps');
        else if (type === 'courses') Router.navigate('courses');
        else if (type === 'favorites') Router.navigate('apps');
      });
    }
  },

  // Feedback de progresso
  showProgressFeedback(percent) {
    if (percent > 0 && percent < 30) {
      this.showFloatingMessage("🌱 Começando bem! Continue assim.");
    } else if (percent >= 30 && percent < 70) {
      this.showFloatingMessage("📈 Você está no caminho certo!");
    } else if (percent >= 70 && percent < 100) {
      this.showFloatingMessage("🎯 Quase lá! Mais um esforço.");
    } else if (percent >= 100) {
      this.unlockAchievement('completeLesson');
      this.showFloatingMessage("🏆 Aula concluída! Conquista desbloqueada.");
    }
  },

  // Mensagem flutuante temporária
  showFloatingMessage(message, type = 'info') {
    const msg = document.createElement('div');
    msg.className = `floating-message ${type}`;
    msg.innerText = message;
    document.body.appendChild(msg);
    setTimeout(() => msg.classList.add('show'), 10);
    setTimeout(() => {
      msg.classList.remove('show');
      setTimeout(() => msg.remove(), 500);
    }, 3000);
  },

  // Configurar listeners para conquistas automáticas
  setupEventListeners() {
    // Conquista primeiro app
    const originalRecordAppAccess = window.recordAppAccess;
    if (originalRecordAppAccess) {
      window.recordAppAccess = function(appId) {
        originalRecordAppAccess(appId);
        EduPersonality.unlockAchievement('firstApp');
      };
    }
    // Conquista primeira anotação
    const originalSaveNote = window.saveLessonNote;
    if (originalSaveNote) {
      window.saveLessonNote = async function(lessonId, note) {
        if (originalSaveNote) await originalSaveNote(lessonId, note);
        EduPersonality.unlockAchievement('note');
      };
    }
    // Conquista favorito
    const originalToggleFavorite = window.toggleFavorite;
    if (originalToggleFavorite) {
      window.toggleFavorite = async function(appId) {
        const wasFavorite = window.AppData?.apps.find(a => a.id === appId)?.favorite;
        await originalToggleFavorite(appId);
        if (!wasFavorite) EduPersonality.unlockAchievement('favorite');
      };
    }
    // Conquista tempo de estudo (detectar a cada 1 hora)
    let studyInterval = setInterval(() => {
      const stats = JSON.parse(localStorage.getItem('edunexus_stats') || '{}');
      if (stats.studyTime >= 60) {
        EduPersonality.unlockAchievement('studyTime');
        clearInterval(studyInterval);
      }
    }, 60000);
  },

  // Onboarding cinematográfico (primeira visita)
  async showOnboarding() {
    const hasSeen = localStorage.getItem('edunexus_onboarding');
    if (hasSeen) return;
    localStorage.setItem('edunexus_onboarding', 'true');
    
    const steps = [
      { title: "Bem-vindo ao Futuro da Educação", text: "EduNexus é um ecossistema de aprendizado com IA e acessibilidade.", icon: "🚀" },
      { title: "Apps e Cursos", text: "Explore nossa app store educacional e cursos imersivos.", icon: "📱" },
      { title: "Acessibilidade Inteligente", text: "Ative alto contraste, leitor de tela e muito mais nas configurações.", icon: "♿" },
      { title: "Persistência Offline", text: "Seu progresso é salvo automaticamente, mesmo sem internet.", icon: "💾" }
    ];
    
    let step = 0;
    const overlay = document.createElement('div');
    overlay.className = 'onboarding-overlay';
    overlay.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-icon">${steps[0].icon}</div>
        <h3>${steps[0].title}</h3>
        <p>${steps[0].text}</p>
        <div class="onboarding-dots"></div>
        <div class="onboarding-buttons">
          <button class="btn-neon onboarding-skip">Pular</button>
          <button class="btn-neon onboarding-next">Próximo</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    
    const updateStep = () => {
      const iconDiv = overlay.querySelector('.onboarding-icon');
      const title = overlay.querySelector('h3');
      const text = overlay.querySelector('p');
      iconDiv.innerText = steps[step].icon;
      title.innerText = steps[step].title;
      text.innerText = steps[step].text;
      const dotsContainer = overlay.querySelector('.onboarding-dots');
      dotsContainer.innerHTML = steps.map((_, i) => `<span class="dot ${i === step ? 'active' : ''}"></span>`).join('');
    };
    
    overlay.querySelector('.onboarding-next').addEventListener('click', () => {
      if (step < steps.length - 1) { step++; updateStep(); }
      else overlay.remove();
    });
    overlay.querySelector('.onboarding-skip').addEventListener('click', () => overlay.remove());
    updateStep();
  }
};

// Expor globalmente
window.EduPersonality = EduPersonality;