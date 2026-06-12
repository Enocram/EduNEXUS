// ========== INICIALIZAÇÃO DO SISTEMA DE PERSISTÊNCIA ==========
(async function initDataSystem() {
  try {
    await EduDB.openDatabase();
    await migrateFromLocalStorage();
    await EduStore.init();
    
    if (window.EduPersonality) {
      await EduPersonality.init();
      EduPersonality.showOnboarding();
    }

    EduStore.subscribe((event, data, state) => {
      console.log(`[Store] ${event}`, data);
      if (event === 'favorites' && location.hash === '#apps') {
        renderApps();
      }
      if (event === 'favorites' && location.hash === '#dashboard') {
        // Atualiza a seção de favoritos sem recarregar a página inteira
        const favoriteAppsList = window.AppData.apps.filter(app => app.favorite);
        const favoritesHtml = (favoriteAppsList.length === 0)
          ? '<p class="empty-message">Você ainda não possui apps favoritos.</p>'
          : `<div class="favorite-apps-grid">${favoriteAppsList.map(app => `
            <div class="card mini-card" data-app-id="${app.id}">
              <img src="${app.icon}" alt="${Sanitize.html(app.name)}" class="app-icon-mini" loading="lazy">
              <span>${Sanitize.html(app.name)}</span>
            </div>
          `).join('')}</div>`;
        const favoritesSection = document.querySelector('.favorites-section');
        if (favoritesSection) {
          const gridContainer = favoritesSection.querySelector('.favorite-apps-grid, .empty-message');
          if (gridContainer) gridContainer.outerHTML = favoritesHtml;
          document.querySelectorAll('.mini-card').forEach(card => {
            card.addEventListener('click', () => {
              const id = parseInt(card.dataset.appId);
              Router.navigate('app-detail', { id });
            });
          });
        }
      }
      if (event === 'notes' && location.hash.startsWith('#player')) {
        const activeLesson = document.querySelector('.lesson-item.active');
        if (activeLesson) {
          const lessonId = parseInt(activeLesson.dataset.lessonId);
          if (data.lessonId === lessonId) {
            document.getElementById('lessonNotes').value = data.note;
          }
        }
      }
    });
    
    console.log('Sistema de persistência inicializado');
  } catch (err) {
    console.error('Erro ao inicializar sistema de dados:', err);
  }
})();

// ========== INSTALAÇÃO PWA ==========
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  console.log('beforeinstallprompt capturado');
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) installBtn.style.display = 'flex';
});

async function installApp() {
  if (!deferredPrompt) {
    alert('Este app já está instalado ou não pode ser instalado agora.');
    return;
  }
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  console.log(`Instalação: ${outcome}`);
  deferredPrompt = null;
  const installBtn = document.getElementById('installAppBtn');
  if (installBtn) installBtn.style.display = 'none';
}

// ========== TOAST GLOBAL ==========
function showToast(message, type = 'info') {
  const oldToast = document.querySelector('.toast');
  if (oldToast) oldToast.remove();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerText = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 90px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === 'error' ? '#c00' : type === 'warning' ? '#f90' : '#0a8'};
    color: white;
    padding: 10px 20px;
    border-radius: 40px;
    z-index: 10000;
    font-size: 0.9rem;
    font-weight: 500;
    backdrop-filter: blur(8px);
    box-shadow: 0 0 15px rgba(0,0,0,0.3);
    animation: fadeUp 0.3s ease;
    pointer-events: none;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ========== VARIÁVEL GLOBAL DE FAVORITOS ==========
let favoriteApps = [];

// ========== FAVORITOS (SUPABASE + FALLBACK LOCAL) ==========
async function loadFavorites() {
  if (window.SupabaseClient && await SupabaseClient.isAuthenticated()) {
    const result = await SupabaseClient.getFavorites();
    if (result.success) {
      favoriteApps = result.favorites;
    } else {
      console.warn('Erro ao carregar favoritos do Supabase:', result.error);
      const favs = EduStore.state.favorites.apps || [];
      favoriteApps = favs;
    }
  } else {
    const favs = EduStore.state.favorites.apps || [];
    favoriteApps = favs;
  }
  if (window.AppData && window.AppData.apps) {
    window.AppData.apps.forEach(app => {
      app.favorite = favoriteApps.includes(app.id);
    });
  }
}

async function toggleFavorite(appId) {
  let isNowFavorite;
  if (window.SupabaseClient && await SupabaseClient.isAuthenticated()) {
    const result = await SupabaseClient.toggleFavorite(appId);
    if (result.success) {
      if (favoriteApps.includes(appId)) {
        favoriteApps = favoriteApps.filter(id => id !== appId);
        isNowFavorite = false;
      } else {
        favoriteApps.push(appId);
        isNowFavorite = true;
      }
      await EduStore.toggleFavorite('app', appId);
    } else {
      console.error('Erro ao alternar favorito no Supabase:', result.error);
      const storeResult = await EduStore.toggleFavorite('app', appId);
      isNowFavorite = storeResult;
      favoriteApps = EduStore.state.favorites.apps || [];
    }
  } else {
    isNowFavorite = await EduStore.toggleFavorite('app', appId);
    favoriteApps = EduStore.state.favorites.apps || [];
  }

  if (window.AppData && window.AppData.apps) {
    const app = window.AppData.apps.find(a => a.id === appId);
    if (app) app.favorite = isNowFavorite;
  }

  if (location.hash === '#apps') {
    renderApps();
  } else if (location.hash.startsWith('#app-detail')) {
    const params = new URLSearchParams(location.hash.split('?')[1]);
    const id = parseInt(params.get('id'));
    if (id) renderAppDetail({ id });
  }
}

// ========== DASHBOARD PREMIUM ==========
let userStats = {
  studyTime: 0,
  lastAccessed: {},
  recentApps: [],
  inProgressCourses: []
};

function loadUserStats() {
  const saved = localStorage.getItem('edunexus_stats');
  if (saved) {
    userStats = JSON.parse(saved);
  } else {
    userStats = {
      studyTime: 125,
      lastAccessed: { app: 1, course: 101 },
      recentApps: [1, 2],
      inProgressCourses: [101, 103]
    };
    localStorage.setItem('edunexus_stats', JSON.stringify(userStats));
  }
}

function saveUserStats() {
  localStorage.setItem('edunexus_stats', JSON.stringify(userStats));
}

function updateStudyTime(minutes) {
  userStats.studyTime += minutes;
  saveUserStats();
  renderDashboard();
}

function recordAppAccess(appId) {
  userStats.recentApps = [appId, ...userStats.recentApps.filter(id => id !== appId)].slice(0, 5);
  userStats.lastAccessed.app = appId;
  saveUserStats();
  EduStore.setLastApp(appId);
}

function recordCourseAccess(courseId) {
  if (!userStats.inProgressCourses.includes(courseId)) {
    userStats.inProgressCourses.push(courseId);
    saveUserStats();
  }
  userStats.lastAccessed.course = courseId;
  saveUserStats();
  EduStore.setLastCourse(courseId);
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getSmartMessage() {
  const inProgressCount = userStats.inProgressCourses.length;
  if (inProgressCount === 0) return 'Que tal começar um curso hoje? 🚀';
  if (userStats.studyTime < 30) return 'Você estudou pouco hoje. Continue evoluindo! 💪';
  return 'Excelente ritmo! Continue assim. 🌟';
}

function renderHero() {
  const greeting = getGreeting();
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const message = getSmartMessage();
  return `
    <div class="hero-section stagger-item stagger-delay-1">
      <div class="hero-greeting">${greeting}, Explorador</div>
      <div class="hero-clock">${timeStr}</div>
      <div class="hero-message">${message}</div>
    </div>
  `;
}

function renderWidgets() {
  const coursesActive = userStats.inProgressCourses.length;
  const totalApps = window.AppData.apps.length;
  const recentCount = userStats.recentApps.length;
  const studyHours = Math.floor(userStats.studyTime / 60);
  const studyMins = userStats.studyTime % 60;
  return `
    <div class="widgets-grid stagger-item stagger-delay-2">
      <div class="widget"><div class="widget-value">${coursesActive}</div><div class="widget-label">Cursos em andamento</div></div>
      <div class="widget"><div class="widget-value">${recentCount}</div><div class="widget-label">Apps recentes</div></div>
      <div class="widget"><div class="widget-value">${studyHours}h ${studyMins}m</div><div class="widget-label">Tempo estudado</div></div>
      <div class="widget"><div class="widget-value">${totalApps}</div><div class="widget-label">Apps disponíveis</div></div>
    </div>
  `;
}

function renderCarousel(title, items, type, idPrefix) {
  if (!items.length) return '';
  return `
    <div class="stagger-item stagger-delay-3">
      <h3 style="margin: 24px 0 12px 8px;">${Sanitize.html(title)}</h3>
      <div class="horizontal-scroll" id="${idPrefix}-scroll">
        ${items.map(item => `
          <div class="card" data-${type}-id="${item.id}">
            <i class="${item.icon || (type === 'course' ? 'fas fa-graduation-cap' : 'fas fa-cube')} fa-2x" style="color: var(--neon-cyan);"></i>
            <h3 style="margin: 12px 0 4px;">${Sanitize.html(item.name || item.title)}</h3>
            <p style="font-size: 0.8rem; color: var(--text-secondary);">${Sanitize.html(item.desc || (item.modules + ' módulos'))}</p>
            <button class="btn-neon" data-${type}-action="${item.id}">${type === 'course' ? 'Continuar' : 'Abrir'}</button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderSearchBar() {
  return `
    <div class="search-bar stagger-item stagger-delay-4">
      <i class="fas fa-search"></i>
      <input type="text" id="globalSearch" placeholder="Buscar apps, cursos..." autocomplete="off">
    </div>
    <div id="searchResults" class="search-results"></div>
  `;
}

function setupSearch() {
  const searchInput = document.getElementById('globalSearch');
  const resultsDiv = document.getElementById('searchResults');
  if (!searchInput) return;
  
  const searchItems = [
    ...(window.AppData.apps || []).map(a => ({ ...a, type: 'app', searchText: a.name + ' ' + a.desc })),
    ...(window.AppData.courses || []).map(c => ({ ...c, type: 'course', searchText: c.title + ' ' + (c.description || '') }))
  ];
  
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase().trim();
    if (term.length < 2) {
      resultsDiv.classList.remove('active');
      resultsDiv.innerHTML = '';
      return;
    }
    const filtered = searchItems.filter(item => item.searchText.toLowerCase().includes(term));
    if (filtered.length === 0) {
      resultsDiv.innerHTML = '<div class="glass-panel" style="padding:20px; text-align:center">Nenhum resultado encontrado</div>';
    } else {
      resultsDiv.innerHTML = filtered.map(item => `
        <div class="card" data-${item.type}-id="${item.id}">
          <i class="${item.icon || (item.type === 'course' ? 'fas fa-graduation-cap' : 'fas fa-cube')} fa-2x"></i>
          <h3>${Sanitize.html(item.name || item.title)}</h3>
          <p>${Sanitize.html(item.desc || (item.modules + ' módulos'))}</p>
          <button class="btn-neon" data-${item.type}-action="${item.id}">${item.type === 'course' ? 'Continuar' : 'Abrir'}</button>
        </div>
      `).join('');
    }
    resultsDiv.classList.add('active');
  });
}

function attachDashboardEvents() {
  document.querySelectorAll('[data-app-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const id = parseInt(card.dataset.appId);
      recordAppAccess(id);
      Router.navigate('apps');
    });
  });
  document.querySelectorAll('[data-app-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.appAction);
      recordAppAccess(id);
      Router.navigate('apps');
    });
  });
  document.querySelectorAll('[data-course-id]').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') return;
      const id = parseInt(card.dataset.courseId);
      recordCourseAccess(id);
      Router.navigate('player', { id });
    });
  });
  document.querySelectorAll('[data-course-action]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = parseInt(btn.dataset.courseAction);
      recordCourseAccess(id);
      Router.navigate('player', { id });
    });
  });
}

// Variável para controle do intervalo do relógio
let windowClockInterval = null;

function renderDashboard() {
  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 40px; text-align: center;">
      <p>Carregando seu dashboard...</p>
    </div>
  `;

  (async () => {
    if (!window.SupabaseClient) {
      container.innerHTML = `<div class="glass-panel" style="padding: 40px;"><p>Erro: sistema de autenticação não disponível.</p></div>`;
      return;
    }

    const isAuth = await SupabaseClient.isAuthenticated();
    if (!isAuth) {
      Router.navigate('login');
      return;
    }

    // Carrega favoritos mais recentes
    await loadFavorites();

    let dashboardData = null;
    if (typeof SupabaseClient.getDashboardData === 'function') {
      dashboardData = await SupabaseClient.getDashboardData();
    } else {
      const user = await SupabaseClient.getUser();
      dashboardData = { success: true, user: { id: user.id, email: user.email, full_name: user.user_metadata?.full_name || 'Usuário', created_at: null, last_login: null } };
    }

    if (!dashboardData || !dashboardData.success) {
      console.error('Erro ao carregar dados do dashboard:', dashboardData?.error);
      container.innerHTML = `<div class="glass-panel" style="padding: 40px;"><p>Erro ao carregar seus dados. Tente novamente mais tarde.</p></div>`;
      return;
    }

    const user = dashboardData.user;
    const userName = user.full_name ? user.full_name.split(' ')[0] : 'Usuário';
    const userEmail = user.email;
    const createdAt = user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Não informada';
    const lastLogin = user.last_login ? new Date(user.last_login).toLocaleDateString('pt-BR') : 'Primeiro acesso';

    if (typeof SupabaseClient.updateLastLogin === 'function') {
      await SupabaseClient.updateLastLogin(user.id);
    }

    loadUserStats();
    const coursesActive = userStats.inProgressCourses.length;
    const totalApps = window.AppData.apps.length;
    const recentCount = userStats.recentApps.length;
    const studyHours = Math.floor(userStats.studyTime / 60);
    const studyMins = userStats.studyTime % 60;

    const coursesInProgressHtml = (userStats.inProgressCourses.length === 0)
      ? '<p class="empty-message">Você ainda não iniciou nenhum curso.</p>'
      : '<p>Em breve você verá seus cursos em andamento aqui.</p>';
    
    let favoriteAppsList = [];
    if (window.AppData && window.AppData.apps) {
      favoriteAppsList = window.AppData.apps.filter(app => app.favorite);
    }
    const favoriteAppsHtml = (favoriteAppsList.length === 0)
      ? '<p class="empty-message">Você ainda não possui apps favoritos.</p>'
      : `<div class="favorite-apps-grid">${favoriteAppsList.map(app => `
          <div class="card mini-card" data-app-id="${app.id}">
            <img src="${app.icon}" alt="${Sanitize.html(app.name)}" class="app-icon-mini" loading="lazy">
            <span>${Sanitize.html(app.name)}</span>
          </div>
        `).join('')}</div>`;

    // Buscar recomendações
    let recommendedApps = [];
    if (window.Recommendations) {
      recommendedApps = await Recommendations.getRecommendations(4);
    }
    let recommendedHtml = '';
    if (recommendedApps.length === 0) {
      recommendedHtml = '<p class="empty-message">Navegue por mais apps para receber sugestões.</p>';
    } else {
      recommendedHtml = `<div class="recommended-grid">${recommendedApps.map(app => `
        <div class="card mini-card" data-app-id="${app.id}">
          <img src="${app.icon}" alt="${Sanitize.html(app.name)}" class="app-icon-mini" loading="lazy">
          <span>${Sanitize.html(app.name)}</span>
          <small>${Sanitize.html(app.category)}</small>
        </div>
      `).join('')}</div>`;
    }

    let html = `
      <div id="dashboardContainer">
        <div class="welcome-section glass-panel">
          <div class="welcome-header">
            <h2>Olá, ${Sanitize.html(userName)}! 👋</h2>
            <p>Bem‑vindo de volta ao seu hub de aprendizagem.</p>
          </div>
          <div class="profile-info">
            <div class="info-item"><i class="fas fa-user"></i> <strong>${Sanitize.html(user.full_name || 'Usuário')}</strong></div>
            <div class="info-item"><i class="fas fa-envelope"></i> ${Sanitize.html(userEmail)}</div>
            <div class="info-item"><i class="fas fa-calendar-alt"></i> Cadastro: ${Sanitize.html(createdAt)}</div>
            <div class="info-item"><i class="fas fa-clock"></i> Último acesso: ${Sanitize.html(lastLogin)}</div>
          </div>
        </div>

        <div class="widgets-grid stagger-item stagger-delay-2">
          <div class="widget"><div class="widget-value">${coursesActive}</div><div class="widget-label">Cursos em andamento</div></div>
          <div class="widget"><div class="widget-value">${recentCount}</div><div class="widget-label">Apps recentes</div></div>
          <div class="widget"><div class="widget-value">${studyHours}h ${studyMins}m</div><div class="widget-label">Tempo estudado</div></div>
          <div class="widget"><div class="widget-value">${totalApps}</div><div class="widget-label">Apps disponíveis</div></div>
        </div>

        <div class="learning-section glass-panel">
          <h3><i class="fas fa-play-circle"></i> Continuar Aprendizado</h3>
          ${coursesInProgressHtml}
        </div>

        <div class="favorites-section glass-panel">
          <h3><i class="fas fa-heart"></i> Apps Favoritos</h3>
          ${favoriteAppsHtml}
        </div>
        
        <div class="recommended-section glass-panel">
          <h3><i class="fas fa-lightbulb"></i> Recomendado para Você</h3>
          <div id="recommendedGrid">${recommendedHtml}</div>
        </div>

        <div class="search-bar stagger-item stagger-delay-4">
          <i class="fas fa-search"></i>
          <input type="text" id="globalSearch" placeholder="Buscar apps, cursos..." autocomplete="off">
        </div>
        <div id="searchResults" class="search-results"></div>

        ${renderCarousel('▶️ Continue de onde parou', userStats.inProgressCourses.map(id => window.AppData.courses.find(c => c.id === id)).filter(Boolean), 'course', 'continue')}
        ${renderCarousel('📱 Apps acessados recentemente', userStats.recentApps.map(id => window.AppData.apps.find(a => a.id === id)).filter(Boolean), 'app', 'recent')}
        ${renderCarousel('✨ Recomendados para você', window.AppData.courses.filter(c => !userStats.inProgressCourses.includes(c.id)).slice(0, 5), 'course', 'recommended')}

        <div class="stagger-item stagger-delay-5" style="margin: 32px 0; text-align: center;">
          <button id="exploreAllBtn" class="btn-neon" style="padding: 12px 32px;">Explorar todos os cursos →</button>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Adicionar eventos nos mini cards de favoritos e recomendações
    document.querySelectorAll('.mini-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = parseInt(card.dataset.appId);
        Router.navigate('app-detail', { id });
      });
    });

    let insightsCard = document.getElementById('eduInsightsCard');
    if (!insightsCard) {
      insightsCard = document.createElement('div');
      insightsCard.id = 'eduInsightsCard';
      insightsCard.className = 'edu-insights-card';
      const welcomeSection = container.querySelector('.welcome-section');
      if (welcomeSection) welcomeSection.insertAdjacentElement('afterend', insightsCard);
      else container.insertBefore(insightsCard, container.firstChild);
    }
    if (window.EduInsights) EduInsights.updateInsightsCard('dashboard');

    const staggerItems = container.querySelectorAll('.stagger-item');
    staggerItems.forEach((el, idx) => {
      el.style.animation = 'fadeUp 0.4s forwards';
      el.style.animationDelay = `${0.05 * (idx+1)}s`;
    });

    setupSearch();
    attachDashboardEvents();

    const exploreBtn = document.getElementById('exploreAllBtn');
    if (exploreBtn) exploreBtn.addEventListener('click', () => Router.navigate('courses'));

    // Limpa intervalo anterior se existir
    if (windowClockInterval) {
      clearInterval(windowClockInterval);
      windowClockInterval = null;
    }
    windowClockInterval = setInterval(() => {
      const heroClock = document.querySelector('.hero-clock');
      const heroMessage = document.querySelector('.hero-message');
      if (heroClock && document.querySelector('#dashboardContainer')) {
        const now = new Date();
        heroClock.innerText = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        heroMessage.innerText = getSmartMessage();
      } else {
        clearInterval(windowClockInterval);
        windowClockInterval = null;
      }
    }, 60000);

    const existingFab = document.querySelector('.fab');
    if (existingFab) existingFab.remove();
    const fab = document.createElement('div');
    fab.className = 'fab';
    fab.innerHTML = '<i class="fas fa-plus"></i>';
    fab.addEventListener('click', () => {
      NativeExperience.showBottomSheet(
        'Ações Rápidas',
        `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            <button class="btn-neon" id="fabCourses">Explorar Cursos</button>
            <button class="btn-neon" id="fabApps">App Store</button>
            <button class="btn-neon" id="fabProfile">Meu Perfil</button>
          </div>
        `,
        null
      );
      setTimeout(() => {
        const coursesBtn = document.getElementById('fabCourses');
        const appsBtn = document.getElementById('fabApps');
        const profileBtn = document.getElementById('fabProfile');
        if (coursesBtn) coursesBtn.addEventListener('click', () => Router.navigate('courses'));
        if (appsBtn) appsBtn.addEventListener('click', () => Router.navigate('apps'));
        if (profileBtn) profileBtn.addEventListener('click', () => Router.navigate('profile'));
      }, 50);
    });
    document.body.appendChild(fab);
  })();
}

// ========== ÁREA DE APPS (APP STORE FUTURISTA) ==========
let currentCategory = 'Todos';
let searchTerm = '';

function renderApps() {
  loadFavorites().then(() => {
    const container = document.getElementById('page-container');
    if (!container) return;

    const categories = window.AppData.categories || ['Todos', 'IA', 'Inclusão', 'Tecnologia Assistiva', 'Educação', 'Ferramentas'];

    let filteredApps = window.AppData.apps.filter(app => {
      if (currentCategory !== 'Todos' && app.category !== currentCategory) return false;
      if (searchTerm && !app.name.toLowerCase().includes(searchTerm) && !app.desc.toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    filteredApps.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));

    const categoriesHtml = categories.map(cat => `
      <button class="category-chip ${currentCategory === cat ? 'active' : ''}" data-category="${Sanitize.html(cat)}">${Sanitize.html(cat)}</button>
    `).join('');

    const appsHtml = filteredApps.map(app => `
      <div class="card" data-app-id="${app.id}" style="position: relative;">
        ${app.badge ? `<div class="app-badge ${Sanitize.html(app.badge.toLowerCase())}">${Sanitize.html(app.badge)}</div>` : ''}
        <i class="${app.icon} fa-2x" style="color: var(--neon-cyan);"></i>
        <h3 style="margin: 12px 0 4px;">${Sanitize.html(app.name)}</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">${Sanitize.html(app.desc.substring(0, 60))}...</p>
        <div class="favorite-icon ${app.favorite ? 'favorited' : ''}" data-fav="${app.id}" aria-label="${app.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
          <i class="fas fa-heart"></i>
        </div>
        <button class="btn-neon" data-app-detail="${app.id}" style="margin-top: 12px;">Ver detalhes</button>
      </div>
    `).join('');

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; margin-bottom: 16px;">
        <h2><i class="fas fa-cube"></i> App Store Educacional</h2>
      </div>
      <div class="search-bar" style="margin: 0 0 16px 0;">
        <i class="fas fa-search"></i>
        <input type="text" id="appSearchInput" placeholder="Buscar apps..." value="${Sanitize.attr(searchTerm)}">
      </div>
      <div class="categories-filter">
        ${categoriesHtml}
      </div>
      <div class="cards-grid" id="appsGrid">
        ${appsHtml || '<div class="glass-panel" style="padding:40px; text-align:center">Nenhum app encontrado.</div>'}
      </div>
    `;
  
    document.querySelectorAll('.category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        renderApps();
      });
    });

    const searchInput = document.getElementById('appSearchInput');
    if (searchInput) {
      const newInput = searchInput.cloneNode(true);
      searchInput.parentNode.replaceChild(newInput, searchInput);
      newInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        updateAppsGrid();
      });
    }

    function updateAppsGrid() {
      const grid = document.getElementById('appsGrid');
      if (!grid) return;
      let filteredApps = window.AppData.apps.filter(app => {
        if (currentCategory !== 'Todos' && app.category !== currentCategory) return false;
        if (searchTerm && !app.name.toLowerCase().includes(searchTerm) && !app.desc.toLowerCase().includes(searchTerm)) return false;
        return true;
      });
      filteredApps.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
      grid.innerHTML = filteredApps.map(app => `
        <div class="card" data-app-id="${app.id}" style="position: relative;">
          ${app.badge ? `<div class="app-badge ${Sanitize.html(app.badge.toLowerCase())}">${Sanitize.html(app.badge)}</div>` : ''}
          <img src="${app.icon}" alt="${Sanitize.html(app.name)}" class="app-icon" loading="lazy" onerror="this.src='https://placehold.co/64?text=Icon'">
          <h3 style="margin: 12px 0 4px;">${Sanitize.html(app.name)}</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary);">${Sanitize.html(app.desc.substring(0, 60))}...</p>
          <div class="favorite-icon ${app.favorite ? 'favorited' : ''}" data-fav="${app.id}" aria-label="${app.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            <i class="fas fa-heart"></i>
          </div>
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="btn-neon btn-small" data-app-open="${app.id}">Acessar</button>
            <button class="btn-neon btn-small" data-app-detail="${app.id}">Detalhes</button>
          </div>
        </div>
      `).join('') || '<div class="glass-panel" style="padding:40px; text-align:center">Nenhum app encontrado.</div>';
      
      document.querySelectorAll('.favorite-icon').forEach(icon => {
        icon.removeEventListener('click', favoriteClickHandler);
        icon.addEventListener('click', favoriteClickHandler);
      });
      document.querySelectorAll('[data-app-detail]').forEach(btn => {
        btn.removeEventListener('click', detailClickHandler);
        btn.addEventListener('click', detailClickHandler);
      });
      document.querySelectorAll('.card').forEach(card => {
        card.removeEventListener('click', cardClickHandler);
        card.addEventListener('click', cardClickHandler);
      });
      document.querySelectorAll('[data-app-open]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const id = parseInt(btn.dataset.appOpen);
          const app = window.AppData.apps.find(a => a.id === id);
          if (app && app.url) {
            window.open(app.url, '_blank');
          } else {
            showToast('URL do aplicativo não disponível', 'warning');
          }
        });
      });
    }

    function favoriteClickHandler(e) {
      e.stopPropagation();
      const id = parseInt(e.currentTarget.dataset.fav);
      toggleFavorite(id);
    }
    function detailClickHandler(e) {
      e.stopPropagation();
      const id = e.currentTarget.dataset.appDetail;
      Router.navigate('app-detail', { id });
    }
    function cardClickHandler(e) {
      if (e.target.closest('.favorite-icon') || e.target.closest('[data-app-detail]')) return;
      const id = parseInt(e.currentTarget.dataset.appId);
      if (id) Router.navigate('app-detail', { id });
    }

    updateAppsGrid();
  });
}

// Variável para controle do handler do teclado no player
let currentPlayerKeyHandler = null;

function renderAppDetail(params) {
  const appId = parseInt(params.id);
  const app = window.AppData.apps.find(a => a.id === appId);
  if (!app) {
    Router.navigate('apps');
    return;
  }

  // Registrar eventos de forma assíncrona sem bloquear a renderização
  (async () => {
    if (window.SupabaseClient && await SupabaseClient.isAuthenticated()) {
      await SupabaseClient.registerEvent('view_details', app.id, app.name, app.category);
    }
  })();

  if (window.EduInsights) {
    EduInsights.recordAppVisit(app.id, app.name, app.category);
    const insightsCard = document.getElementById('eduInsightsCard');
    if (insightsCard) EduInsights.updateInsightsCard('app-detail', app);
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="glass-panel" style="padding: 28px;">
      <button id="backToApps" class="icon-btn" style="margin-bottom: 20px;"><i class="fas fa-arrow-left"></i> Voltar</button>
      <div class="app-detail-header">
        <div class="app-detail-icon"><img src="${app.icon}" alt="${Sanitize.html(app.name)}" class="app-detail-icon-img" loading="lazy"></div>
        <div class="app-detail-info">
          <h2>${Sanitize.html(app.name)} ${app.badge ? `<span class="app-badge ${Sanitize.html(app.badge.toLowerCase())}" style="position: relative; top: -4px;">${Sanitize.html(app.badge)}</span>` : ''}</h2>
          <p>${Sanitize.html(app.desc)}</p>
          <div class="tag-list">
            ${app.tags.map(tag => `<span class="tag">#${Sanitize.html(tag)}</span>`).join('')}
          </div>
        </div>
      </div>
      <div style="display: flex; gap: 12px; margin-bottom: 24px;">
        <button id="detailFavoriteBtn" class="btn-neon" style="background: ${app.favorite ? '#ff3366' : 'none'}" aria-label="${app.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}"><i class="fas fa-heart"></i> ${app.favorite ? 'Favoritado' : 'Favoritar'}</button>
        <button id="openAppBtn" class="btn-neon"><i class="fas fa-external-link-alt"></i> Acessar aplicativo</button>
      </div>
      
      <h3>Screenshots</h3>
      <div class="screenshots-grid" id="screenshotsGrid">
        ${app.screenshots.map(src => `<img src="${src}" class="screenshot" data-src="${src}" alt="Screenshot" loading="lazy">`).join('')}
      </div>
      
      <h3>Descrição completa</h3>
      <p style="margin-bottom: 20px;">${Sanitize.html(app.longDesc)}</p>
      
      <h3>Tecnologias utilizadas</h3>
      <div class="tag-list">
        ${app.technologies.map(tech => `<span class="tag">⚙️ ${Sanitize.html(tech)}</span>`).join('')}
      </div>
      
      <h3>Changelog (v${Sanitize.html(app.version)})</h3>
      <p>${Sanitize.html(app.changelog)}</p>
    </div>
  `;

  document.getElementById('backToApps').addEventListener('click', () => Router.navigate('apps'));
  document.getElementById('detailFavoriteBtn').addEventListener('click', () => {
    toggleFavorite(app.id);
    renderAppDetail({ id: app.id });
  });

  const openAppBtn = document.getElementById('openAppBtn');
  if (openAppBtn && app.url) {
    openAppBtn.addEventListener('click', async () => {
      // Registrar evento de abertura
      if (window.SupabaseClient && await SupabaseClient.isAuthenticated()) {
        await SupabaseClient.registerEvent('open_app', app.id, app.name, app.category);
      }
      window.open(app.url, '_blank');
    });
  } else if (openAppBtn && !app.url) {
    openAppBtn.addEventListener('click', () => {
      showToast('URL do aplicativo não disponível', 'warning');
    });
  }

  // Modal de screenshots com gerenciamento de foco
  const screenshots = document.querySelectorAll('.screenshot');
  screenshots.forEach(img => {
    img.addEventListener('click', () => {
      const previousFocus = document.activeElement;
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `
        <button class="modal-close">&times;</button>
        <img class="modal-content" src="${img.dataset.src}">
      `;
      document.body.appendChild(modal);
      modal.style.display = 'flex';
      const closeBtn = modal.querySelector('.modal-close');
      closeBtn.focus();
      const removeModal = () => {
        modal.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus();
      };
      closeBtn.addEventListener('click', removeModal);
      modal.addEventListener('click', (e) => { if (e.target === modal) removeModal(); });
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          removeModal();
        }
      });
    });
  });
}

// ========== PLAYER PREMIUM COMPLETO ==========
let currentCourse = null;
let currentLesson = null;
let playerInterval = null;
let focusModeActive = false;

const courseMaterials = {
  101: [
    { name: "Slides - IA na Educação", url: "#", type: "pdf" },
    { name: "Exercícios - Módulo 1", url: "#", type: "doc" },
    { name: "Leitura complementar", url: "#", type: "link" }
  ],
  102: [
    { name: "Guia de Tecnologia Assistiva", url: "#", type: "pdf" }
  ]
};

const transcripts = {
  1011: [
    { start: 0, text: "Bem-vindo ao curso de IA na Educação Especial." },
    { start: 10, text: "Neste primeiro módulo, vamos entender o que é Inteligência Artificial." },
    { start: 25, text: "A IA pode ajudar na personalização do aprendizado." }
  ],
  1012: [
    { start: 0, text: "Machine Learning é a base da IA moderna." },
    { start: 15, text: "Algoritmos aprendem com dados para fazer previsões." }
  ]
};

async function saveLessonProgress(courseId, lessonId, watchedSeconds, completed) {
  await EduStore.updateLessonProgress(courseId, lessonId, watchedSeconds, completed);
}

async function loadLessonNote(lessonId) {
  if (window.EduStore && typeof window.EduStore.loadNote === 'function') {
    return await window.EduStore.loadNote(lessonId);
  } else {
    const notes = JSON.parse(localStorage.getItem('course_notes') || '{}');
    return notes[lessonId] || '';
  }
}

async function saveLessonNote(lessonId, note) {
  if (window.EduStore && typeof window.EduStore.saveNote === 'function') {
    await window.EduStore.saveNote(lessonId, note);
  } else {
    const notes = JSON.parse(localStorage.getItem('course_notes') || '{}');
    notes[lessonId] = note;
    localStorage.setItem('course_notes', JSON.stringify(notes));
  }
}

function renderPlayer(params) {
  const courseId = parseInt(params.id);
  const lessonId = params.lessonId ? parseInt(params.lessonId) : null;

  let course = window.AppData.courses.find(c => c.id === courseId);
  if (!course) { Router.navigate('courses'); return; }

  if (!course.modules || !Array.isArray(course.modules) || course.modules.length === 0) {
    const oldModulesCount = typeof course.modules === 'number' ? course.modules : 1;
    course.modules = [];
    for (let i = 0; i < oldModulesCount; i++) {
      const moduleId = i + 1;
      course.modules.push({
        id: moduleId,
        title: `Módulo ${moduleId}`,
        lessons: [{
          id: parseInt(`${courseId}${moduleId}1`),
          title: course.title,
          duration: 300,
          videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
          completed: false,
          watchedSeconds: 0
        }]
      });
    }
  }

  currentCourse = course;

  if (lessonId) {
    for (let m of currentCourse.modules) {
      const found = m.lessons.find(l => l.id === lessonId);
      if (found) { currentLesson = found; break; }
    }
  }
  if (!currentLesson) {
    for (let m of currentCourse.modules) {
      const incomplete = m.lessons.find(l => !l.completed);
      if (incomplete) { currentLesson = incomplete; break; }
    }
    if (!currentLesson) currentLesson = currentCourse.modules[0].lessons[0];
  }

  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="player-premium">
      <div class="player-main">
        <div class="video-container">
          <video id="premiumVideo" src="${currentLesson.videoUrl}" poster="https://via.placeholder.com/1280x720" controls></video>
          <div class="video-info">
            <h2>${Sanitize.html(currentLesson.title)}</h2>
            <p>${Sanitize.html(course.description || '')}</p>
            <div class="video-meta">
              <span><i class="far fa-clock"></i> ${Math.floor(currentLesson.duration / 60)}min</span>
              <span><i class="fas fa-folder"></i> ${Sanitize.html(currentCourse.modules.find(m => m.lessons.includes(currentLesson)).title)}</span>
            </div>
          </div>
        </div>
        <div class="playlist-sidebar">
          <h3>Conteúdo do curso</h3>
          <div class="playlist-modules" id="modulesList"></div>
        </div>
      </div>
      <div class="player-extras">
        <div class="materials-section">
          <h3><i class="fas fa-paperclip"></i> Materiais</h3>
          <div class="materials-grid" id="materialsGrid"></div>
        </div>
        <div class="stats-section">
          <h3><i class="fas fa-chart-simple"></i> Estatísticas</h3>
          <div class="stats-grid" id="statsGrid"></div>
        </div>
        <div class="notes-section">
          <h3><i class="fas fa-pen"></i> Anotações</h3>
          <textarea id="lessonNotes" class="notes-textarea" rows="4" placeholder="Suas anotações..."></textarea>
          <button id="saveNotesBtn" class="btn-neon">Salvar anotações</button>
        </div>
      </div>
    </div>
  `;

  const video = document.getElementById('premiumVideo');
  const modulesContainer = document.getElementById('modulesList');
  const materialsGrid = document.getElementById('materialsGrid');
  const statsGrid = document.getElementById('statsGrid');
  const notesTextarea = document.getElementById('lessonNotes');
  const saveNotesBtn = document.getElementById('saveNotesBtn');

  loadLessonNote(currentLesson.id).then(note => { if (note) notesTextarea.value = note; });

  const materials = courseMaterials[courseId] || [];
  if (materialsGrid) {
    materialsGrid.innerHTML = materials.map(m => `
      <div class="material-card">
        <div class="material-icon"><i class="fas fa-${m.type === 'pdf' ? 'file-pdf' : 'file-alt'}"></i></div>
        <div class="material-info">
          <strong>${Sanitize.html(m.name)}</strong>
          <small>${m.type.toUpperCase()}</small>
        </div>
        <button class="download-material btn-small" data-url="${m.url}">Baixar</button>
      </div>
    `).join('');
    document.querySelectorAll('.download-material').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const url = btn.dataset.url;
        if (url !== '#') {
          const a = document.createElement('a');
          a.href = url;
          a.download = '';
          a.click();
          showToast('Download iniciado', 'success');
        } else {
          showToast('Material disponível em breve', 'info');
        }
      });
    });
  }

  function updateStats() {
    let totalLessons = 0, completedLessons = 0, totalDuration = 0;
    for (let m of currentCourse.modules) {
      for (let l of m.lessons) {
        totalLessons++;
        if (l.completed) completedLessons++;
        totalDuration += l.duration;
      }
    }
    const percent = Math.round((completedLessons / totalLessons) * 100);
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    statsGrid.innerHTML = `
      <div class="stat-card"><div class="stat-value">${Math.floor(video.currentTime / 60)}min</div><div>Minutos assistidos</div></div>
      <div class="stat-card"><div class="stat-value">${completedLessons}/${totalLessons}</div><div>Aulas concluídas</div></div>
      <div class="stat-card"><div class="stat-value">${percent}%</div><div>Progresso</div></div>
      <div class="stat-card"><div class="stat-value">${hours}h ${minutes}m</div><div>Tempo total</div></div>
    `;
  }
  updateStats();

  function renderPlaylist() {
    let html = '';
    currentCourse.modules.forEach((module, idx) => {
      const completedCount = module.lessons.filter(l => l.completed).length;
      const total = module.lessons.length;
      html += `
        <div class="playlist-module">
          <div class="playlist-module-header">
            <span>📘 ${Sanitize.html(module.title)}</span>
            <span>${completedCount}/${total}</span>
          </div>
          <div class="playlist-lessons">
            ${module.lessons.map(lesson => `
              <div class="playlist-lesson ${currentLesson.id === lesson.id ? 'active' : ''}" data-lesson-id="${lesson.id}">
                <div class="lesson-status">
                  ${lesson.completed ? '<i class="fas fa-check-circle"></i>' : (currentLesson.id === lesson.id ? '<i class="fas fa-play-circle"></i>' : '<i class="far fa-circle"></i>')}
                </div>
                <div class="lesson-title">${Sanitize.html(lesson.title)}</div>
                <div class="lesson-duration">${Math.floor(lesson.duration / 60)}min</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });
    modulesContainer.innerHTML = html;
    document.querySelectorAll('.playlist-lesson').forEach(el => {
      el.addEventListener('click', () => {
        const lessonId = parseInt(el.dataset.lessonId);
        loadLesson(lessonId);
      });
    });
  }
  renderPlaylist();

  function loadLesson(lessonId) {
    for (let m of currentCourse.modules) {
      const found = m.lessons.find(l => l.id === lessonId);
      if (found) { currentLesson = found; break; }
    }
    saveLessonProgress(currentCourse.id, currentLesson.id, video.currentTime, currentLesson.completed);
    video.src = currentLesson.videoUrl;
    video.load();
    video.currentTime = currentLesson.watchedSeconds || 0;
    video.play();
    renderPlaylist();
    loadLessonNote(currentLesson.id).then(note => { if (note) notesTextarea.value = note; else notesTextarea.value = ''; });
    const videoInfo = document.querySelector('.video-info h2');
    if (videoInfo) videoInfo.innerText = Sanitize.html(currentLesson.title);
    const videoMeta = document.querySelector('.video-meta span:first-child');
    if (videoMeta) videoMeta.innerHTML = `<i class="far fa-clock"></i> ${Math.floor(currentLesson.duration / 60)}min`;
    history.pushState(null, '', `#player?id=${currentCourse.id}&lessonId=${lessonId}`);
    updateStats();
  }

  function findNextLesson() {
    let found = false;
    for (let m of currentCourse.modules) {
      for (let l of m.lessons) {
        if (found) return l;
        if (l.id === currentLesson.id) found = true;
      }
    }
    return null;
  }

  // Remove qualquer listener anterior
  if (currentPlayerKeyHandler) {
    document.removeEventListener('keydown', currentPlayerKeyHandler);
  }
  const keyHandler = (e) => {
    if (e.target.tagName === 'TEXTAREA') return;
    if (e.code === 'Space') { e.preventDefault(); video.paused ? video.play() : video.pause(); }
  };
  document.addEventListener('keydown', keyHandler);
  currentPlayerKeyHandler = keyHandler;

  let playerInterval = null;
  video.addEventListener('timeupdate', () => {
    if (playerInterval) clearInterval(playerInterval);
    playerInterval = setInterval(() => {
      if (!video.paused && video.duration) {
        saveLessonProgress(currentCourse.id, currentLesson.id, video.currentTime, false);
      }
    }, 5000);
    if (!currentLesson.completed && video.currentTime / video.duration >= 0.9) {
      currentLesson.completed = true;
      saveLessonProgress(currentCourse.id, currentLesson.id, video.currentTime, true);
      renderPlaylist();
      updateStats();
      const next = findNextLesson();
      if (next) {
        setTimeout(() => {
          if (confirm('Aula concluída! Ir para a próxima?')) {
            loadLesson(next.id);
          }
        }, 1000);
      }
    }
    updateStats();
  });

  saveNotesBtn.addEventListener('click', async () => {
    await saveLessonNote(currentLesson.id, notesTextarea.value);
    showToast('Anotações salvas!', 'success');
  });

  window.addEventListener('beforeunload', () => {
    if (video && video.currentTime) {
      saveLessonProgress(currentCourse.id, currentLesson.id, video.currentTime, currentLesson.completed);
    }
    if (currentPlayerKeyHandler) {
      document.removeEventListener('keydown', currentPlayerKeyHandler);
      currentPlayerKeyHandler = null;
    }
    if (playerInterval) clearInterval(playerInterval);
  });

  if (currentLesson.watchedSeconds > 0) video.currentTime = currentLesson.watchedSeconds;
}

// ========== OUTRAS TELAS ==========
function renderCourses() {
  loadUserStats();
  const container = document.getElementById('page-container');
  if (!container) return;

  let allCategories = ['Todos'];
  if (window.AppData && window.AppData.courses) {
    const cats = new Set();
    window.AppData.courses.forEach(course => {
      if (course.category) cats.add(course.category);
    });
    allCategories.push(...cats);
  } else {
    allCategories = ['Todos', 'IA', 'Educação Especial', 'Tecnologia Assistiva', 'Inclusão', 'Acessibilidade', 'Ferramentas Digitais', 'Inovação Educacional'];
  }

  let currentCategory = 'Todos';
  let searchTerm = '';

  function renderCoursesGrid() {
    let filteredCourses = window.AppData.courses.filter(course => {
      if (currentCategory !== 'Todos' && course.category !== currentCategory) return false;
      if (searchTerm && !course.title.toLowerCase().includes(searchTerm) && !(course.description || '').toLowerCase().includes(searchTerm)) return false;
      return true;
    });

    const grid = document.getElementById('coursesGrid');
    if (!grid) return;
    if (filteredCourses.length === 0) {
      grid.innerHTML = '<div class="glass-panel" style="padding:40px; text-align:center">Nenhum curso encontrado.</div>';
      return;
    }
    grid.innerHTML = filteredCourses.map(course => {
      let progressPercent = 0;
      if (course.modules && Array.isArray(course.modules)) {
        let totalLessons = 0, completedLessons = 0;
        course.modules.forEach(m => {
          m.lessons.forEach(l => {
            totalLessons++;
            if (l.completed) completedLessons++;
          });
        });
        progressPercent = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
      } else {
        progressPercent = course.progress || 0;
      }
      let thumbnail = course.thumbnail || `https://picsum.photos/id/${(course.id % 100) + 10}/300/180`;
      return `
        <div class="course-card" data-course-id="${course.id}">
          <div class="course-thumbnail">
            <img src="${thumbnail}" alt="${Sanitize.html(course.title)}" loading="lazy">
            <div class="course-duration">${Sanitize.html(course.duration || '2h 30min')}</div>
          </div>
          <div class="course-info">
            <h3>${Sanitize.html(course.title)}</h3>
            <p>${Sanitize.html(course.description || 'Curso completo sobre o tema.')}</p>
            <div class="course-meta">
              <span class="course-category">${Sanitize.html(course.category || 'Educação')}</span>
              <progress value="${progressPercent}" max="100"></progress>
              <span class="course-progress">${progressPercent}%</span>
            </div>
            <button class="btn-neon" data-course="${course.id}">Continuar</button>
          </div>
        </div>
      `;
    }).join('');
    document.querySelectorAll('[data-course]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-course');
        Router.navigate('player', { id });
      });
    });
  }

  function renderFilters() {
    const filtersDiv = document.getElementById('coursesFilters');
    if (!filtersDiv) return;
    const categoriesHtml = allCategories.map(cat => `
      <button class="category-chip ${currentCategory === cat ? 'active' : ''}" data-category="${Sanitize.html(cat)}">${Sanitize.html(cat)}</button>
    `).join('');
    filtersDiv.innerHTML = `
      <div class="search-bar" style="margin-bottom: 20px;">
        <i class="fas fa-search"></i>
        <input type="text" id="coursesSearchInput" placeholder="Buscar cursos..." value="${Sanitize.attr(searchTerm)}">
      </div>
      <div class="categories-filter">
        ${categoriesHtml}
      </div>
    `;
    document.querySelectorAll('#coursesFilters .category-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        currentCategory = btn.dataset.category;
        renderFilters();
        renderCoursesGrid();
      });
    });
    const searchInput = document.getElementById('coursesSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderFilters();
        renderCoursesGrid();
      });
    }
  }

  container.innerHTML = `
    <div id="coursesContainer">
      <h2><i class="fas fa-graduation-cap"></i> Catálogo de Cursos</h2>
      <div id="coursesFilters"></div>
      <div class="courses-grid" id="coursesGrid"></div>
    </div>
  `;
  renderFilters();
  renderCoursesGrid();
}

function renderContact() {
  const container = document.getElementById('page-container');
  if (!container) return;
  container.innerHTML = `
    <div class="glass-panel">
      <h2>Central de Contato</h2>
      <div style="display:flex; gap:20px; flex-wrap:wrap; margin-bottom:20px">
        <a href="https://wa.me/5584988164322" target="_blank" class="btn-neon"><i class="fab fa-whatsapp"></i> WhatsApp</a>
        <a href="mailto:marcone.eduplay@gmail.com" class="btn-neon"><i class="fas fa-envelope"></i> Email</a>
        <a href="https://www.instagram.com/marconearruda.autor/" target="_blank" class="btn-neon"><i class="fab fa-instagram"></i> Instagram</a>
        <a href="https://t.me/marsimisa" target="_blank" class="btn-neon"><i class="fab fa-telegram"></i> Telegram</a>
        <a href="https://www.youtube.com/@marconearruda-autor" target="_blank" class="btn-neon"><i class="fab fa-youtube"></i> YouTube</a>
      </div>
    </div>
    <div class="glass-panel" style="margin-top:24px">
      <h3>Caixa de Sugestões</h3>
      <form id="suggestionForm" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="search-bar" style="margin:0; padding: 4px 12px;">
          <i class="fas fa-user"></i>
          <input type="text" id="sugName" name="sugName" placeholder="Nome" class="input-futurist" style="background:transparent; border:none; padding: 8px;">
        </div>
        <div class="search-bar" style="margin:0; padding: 4px 12px;">
          <i class="fas fa-envelope"></i>
          <input type="email" id="sugEmail" name="sugEmail" placeholder="Email" class="input-futurist" style="background:transparent; border:none; padding: 8px;">
        </div>
        <div class="search-bar" style="margin:0; padding: 4px 12px;">
          <i class="fas fa-comment"></i>
          <textarea id="sugMsg" name="sugMsg" placeholder="Sua sugestão..." rows="3" style="background:transparent; border:none; width:100%; color: inherit; resize: vertical;"></textarea>
        </div>
        <button type="submit" class="btn-neon" style="align-self: flex-start;">Enviar sugestão</button>
        <div id="sugFeedback"></div>
      </form>
    </div>
  `;

  const form = document.getElementById('suggestionForm');
  const feedbackDiv = document.getElementById('sugFeedback');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('sugName').value.trim();
    const email = document.getElementById('sugEmail').value.trim();
    const message = document.getElementById('sugMsg').value.trim();

    if (name.length < 3) {
      feedbackDiv.innerHTML = '<span style="color:#ff8888">❌ Nome deve ter pelo menos 3 caracteres.</span>';
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      feedbackDiv.innerHTML = '<span style="color:#ff8888">❌ Digite um e‑mail válido.</span>';
      return;
    }
    if (message.length < 5) {
      feedbackDiv.innerHTML = '<span style="color:#ff8888">❌ A mensagem deve ter pelo menos 5 caracteres.</span>';
      return;
    }

    const subject = `Sugestão de ${encodeURIComponent(name)}`;
    const body = `${encodeURIComponent(message)}%0A%0ARemetente: ${encodeURIComponent(email)}`;
    window.location.href = `mailto:marcone.eduplay@gmail.com?subject=${subject}&body=${body}`;

    feedbackDiv.innerHTML = '<span style="color:cyan">✨ Sugestão encaminhada! Obrigado.</span>';
    form.reset();
    setTimeout(() => {
      if (feedbackDiv.innerHTML.includes('Sugestão encaminhada')) {
        feedbackDiv.innerHTML = '';
      }
    }, 4000);
  });
}

function renderProfile() {
  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-panel" style="padding: 24px; text-align: center;">
      <p>Carregando perfil...</p>
    </div>
  `;

  (async () => {
    if (!window.SupabaseClient) {
      container.innerHTML = `<div class="glass-panel" style="padding: 24px;"><p>Erro: sistema de autenticação não disponível.</p></div>`;
      return;
    }

    const isAuth = await SupabaseClient.isAuthenticated();
    if (!isAuth) {
      Router.navigate('login');
      return;
    }

    const user = await SupabaseClient.getUser();
    const userEmail = user?.email || 'E-mail não disponível';

    let userName = 'Usuário';
    if (user?.id && typeof SupabaseClient.getProfile === 'function') {
      const profileResult = await SupabaseClient.getProfile(user.id);
      if (profileResult.success && profileResult.full_name) {
        userName = profileResult.full_name;
      }
    }

    const mockProgress = '3 cursos iniciados, 1 concluído';
    const mockDownloads = '2 materiais';

    let favoriteAppsList = [];
    if (window.AppData && window.AppData.apps) {
      favoriteAppsList = window.AppData.apps.filter(app => app.favorite);
    }
    const favoritesText = favoriteAppsList.map(app => app.name).join(', ') || 'Nenhum app favorito ainda';

    container.innerHTML = `
      <div class="glass-panel" style="padding: 24px;">
        <h2>Perfil do Explorador</h2>
        <p><i class="fas fa-user"></i> <strong>${Sanitize.html(userName)}</strong></p>
        <p><i class="fas fa-envelope"></i> ${Sanitize.html(userEmail)}</p>
        <p><i class="fas fa-chart-line"></i> Progresso: ${mockProgress}</p>
        <p><i class="fas fa-heart"></i> Apps favoritos: ${Sanitize.html(favoritesText)}</p>
        <p><i class="fas fa-download"></i> Downloads: ${mockDownloads}</p>
        <div style="margin-top: 24px; display: flex; gap: 16px; flex-wrap: wrap;">
          <button id="openSettingsA11y" class="btn-neon">Configurações de Acessibilidade</button>
          <button id="openAdminPanel" class="btn-neon"><i class="fas fa-crown"></i> Área Administrativa</button>
          <button id="profileLogoutBtn" class="btn-neon"><i class="fas fa-sign-out-alt"></i> Sair da conta</button>
        </div>
      </div>
    `;

    document.getElementById('openSettingsA11y')?.addEventListener('click', () => Router.navigate('settings'));
    document.getElementById('openAdminPanel')?.addEventListener('click', () => {
      window.location.href = '/admin/index.html';
    });

    const profileLogoutBtn = document.getElementById('profileLogoutBtn');
    if (profileLogoutBtn) {
      profileLogoutBtn.addEventListener('click', async () => {
        const result = await SupabaseClient.signOut();
        if (result.success) {
          showToast('🔓 Você saiu da conta', 'info');
          const loginHeaderBtn = document.getElementById('loginBtn');
          const logoutHeaderBtn = document.getElementById('logoutBtn');
          if (loginHeaderBtn) loginHeaderBtn.style.display = 'inline-flex';
          if (logoutHeaderBtn) logoutHeaderBtn.style.display = 'none';
          Router.navigate('login');
        } else {
          showToast('Erro ao sair da conta', 'error');
        }
      });
    }
  })();
}

function renderSettings() {
  const container = document.getElementById('page-container');
  if(!container) return;
  const a11y = window.AccessibilityManager?.settings || {};
  container.innerHTML = `
    <div class="glass-panel">
      <div id="settingsContainer" class="glass-panel" style="padding: 24px;">
      <h2>Configurações & Acessibilidade</h2>

      <h3>Visuais</h3>
      <div><label><input type="checkbox" id="highContrastToggle" ${a11y.highContrast ? 'checked' : ''}> Alto Contraste (WCAG AAA)</label></div>
      <div><label><input type="checkbox" id="dyslexicFontToggle" ${a11y.dyslexicFont ? 'checked' : ''}> Fonte para Dislexia</label></div>
      <div><label><input type="checkbox" id="reduceAnimationsToggle" ${a11y.reduceAnimations ? 'checked' : ''}> Reduzir Animações</label></div>
      <div><label><input type="checkbox" id="largeCursorToggle" ${a11y.largeCursor ? 'checked' : ''}> Cursor Ampliado</label></div>
      <div><label><input type="checkbox" id="readingGuideToggle" ${a11y.readingGuide ? 'checked' : ''}> Guia de Leitura Horizontal</label></div>
      <div><label><input type="checkbox" id="lowDistractionToggle" ${a11y.lowDistraction ? 'checked' : ''}> Modo Baixa Distração</label></div>
      
      <h3>Leitura e Voz</h3>
      <div><label><input type="checkbox" id="voiceCommandsToggle" ${a11y.voiceCommands ? 'checked' : ''}> Comandos de Voz (Beta)</label></div>
      <div><label><input type="checkbox" id="soundFeedbackToggle" ${a11y.soundFeedback ? 'checked' : ''}> Feedback Sonoro</label></div>
      
      <h3>Tipografia</h3>
      <div>Tamanho da fonte: <input type="range" id="fontSizeSlider" min="70" max="200" step="5" value="${a11y.fontSize || 100}"> <span id="fontSizeValue">${a11y.fontSize || 100}%</span></div>
      <div>Altura da linha: <input type="range" id="lineHeightSlider" min="1" max="2" step="0.1" value="${a11y.lineHeight || 1.5}"> <span id="lineHeightValue">${a11y.lineHeight || 1.5}</span></div>
      <div>Espaçamento entre letras: <input type="range" id="letterSpacingSlider" min="0" max="3" step="0.5" value="${a11y.letterSpacing || 0}"> <span id="letterSpacingValue">${a11y.letterSpacing || 0}px</span></div>
      
      <div style="margin: 20px 0;">
        <button id="resetAccessibility" class="btn-neon">Resetar Preferências</button>
        <button id="readPageBtn" class="btn-neon"><i class="fas fa-play"></i> Ler esta página</button>
        <button id="stopReadingBtn" class="btn-neon"><i class="fas fa-stop"></i> Parar leitura</button>
      </div>
      
      <p style="font-size: 0.8rem; margin-top: 20px;">Atalhos: Alt+R (ler página) | Alt+V (comandos de voz) | Alt+A (acessibilidade)</p>
    </div>
  `;
  
  const high = document.getElementById('highContrastToggle');
  if(high) high.addEventListener('change', e => { 
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.highContrast = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const dyslexic = document.getElementById('dyslexicFontToggle');
  if(dyslexic) dyslexic.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.dyslexicFont = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const reduceAnim = document.getElementById('reduceAnimationsToggle');
  if(reduceAnim) reduceAnim.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.reduceAnimations = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const largeCursor = document.getElementById('largeCursorToggle');
  if(largeCursor) largeCursor.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.largeCursor = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const readingGuide = document.getElementById('readingGuideToggle');
  if(readingGuide) readingGuide.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.readingGuide = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const lowDistraction = document.getElementById('lowDistractionToggle');
  if(lowDistraction) lowDistraction.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.lowDistraction = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const voiceCommands = document.getElementById('voiceCommandsToggle');
  if(voiceCommands) voiceCommands.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.voiceCommands = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(e.target.checked && !window.AccessibilityManager.recognition) {
        window.AccessibilityManager.initVoiceCommands();
      }
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const soundFeedback = document.getElementById('soundFeedbackToggle');
  if(soundFeedback) soundFeedback.addEventListener('change', e => {
    if(window.AccessibilityManager) {
      window.AccessibilityManager.settings.soundFeedback = e.target.checked;
      window.AccessibilityManager.saveSettings();
      if(window.EduInsights) EduInsights.recordAccessibilityUse();
    }
  });
  
  const fontSizeSlider = document.getElementById('fontSizeSlider');
  const fontSizeValue = document.getElementById('fontSizeValue');
  if(fontSizeSlider) {
    fontSizeSlider.addEventListener('input', e => {
      const val = e.target.value;
      fontSizeValue.innerText = val + '%';
      if(window.AccessibilityManager) {
        window.AccessibilityManager.settings.fontSize = parseInt(val);
        window.AccessibilityManager.saveSettings();
      }
    });
  }
  const lineHeightSlider = document.getElementById('lineHeightSlider');
  const lineHeightValue = document.getElementById('lineHeightValue');
  if(lineHeightSlider) {
    lineHeightSlider.addEventListener('input', e => {
      const val = e.target.value;
      lineHeightValue.innerText = val;
      if(window.AccessibilityManager) {
        window.AccessibilityManager.settings.lineHeight = parseFloat(val);
        window.AccessibilityManager.saveSettings();
      }
    });
  }
  const letterSpacingSlider = document.getElementById('letterSpacingSlider');
  const letterSpacingValue = document.getElementById('letterSpacingValue');
  if(letterSpacingSlider) {
    letterSpacingSlider.addEventListener('input', e => {
      const val = e.target.value;
      letterSpacingValue.innerText = val + 'px';
      if(window.AccessibilityManager) {
        window.AccessibilityManager.settings.letterSpacing = parseFloat(val);
        window.AccessibilityManager.saveSettings();
      }
    });
  }
  const readPageBtn = document.getElementById('readPageBtn');
  if(readPageBtn) readPageBtn.addEventListener('click', () => {
    if(window.AccessibilityManager) window.AccessibilityManager.readPage();
  });
  const stopReadingBtn = document.getElementById('stopReadingBtn');
  if(stopReadingBtn) stopReadingBtn.addEventListener('click', () => {
    if(window.speechSynthesis) window.speechSynthesis.cancel();
    if(window.AccessibilityManager) window.AccessibilityManager.hideReadingFeedback();
  });
  const resetBtn = document.getElementById('resetAccessibility');
  if(resetBtn) resetBtn.addEventListener('click', () => {
    localStorage.removeItem('edunexus_accessibility');
    location.reload();
  });
}

function renderLogin() {
  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card glass-panel">
        <div class="login-header">
          <i class="fas fa-graduation-cap"></i>
          <h2>EduNEXUS</h2>
          <p>Acesse sua conta</p>
        </div>
        <form id="loginForm">
          <div class="input-group">
            <i class="fas fa-envelope"></i>
            <input type="email" id="loginEmail" placeholder="E-mail" autocomplete="email" required>
          </div>
          <div class="input-group">
            <i class="fas fa-lock"></i>
            <input type="password" id="loginPassword" placeholder="Senha" autocomplete="current-password" required>
          </div>
          <button type="submit" class="btn-neon login-btn">Entrar</button>
        </form>
        <div class="login-links">
          <a href="#" id="createAccountLink">Criar conta</a>
          <a href="#" id="forgotPasswordLink">Esqueci minha senha</a>
        </div>
        <div id="loginMessage" class="login-message"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('loginForm');
  const messageDiv = document.getElementById('loginMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    if (!email || !password) {
      messageDiv.innerHTML = '<span class="error">Preencha e-mail e senha.</span>';
      return;
    }

    messageDiv.innerHTML = '<span class="loading">Autenticando...</span>';

    const result = await window.SupabaseClient.signIn(email, password);
    if (result.success) {
      messageDiv.innerHTML = '<span class="success">Login realizado! Redirecionando...</span>';
      setTimeout(() => {
        Router.navigate('dashboard');
      }, 1500);
    } else {
      messageDiv.innerHTML = `<span class="error">Erro: ${result.error}</span>`;
    }
  });

  document.getElementById('createAccountLink').addEventListener('click', (e) => {
    e.preventDefault();
    Router.navigate('signup');
  });

  document.getElementById('forgotPasswordLink').addEventListener('click', (e) => {
    e.preventDefault();
    alert('Funcionalidade de recuperação de senha será implementada em breve.');
  });
}

// ========== TELA DE CADASTRO ==========
function renderSignup() {
  const container = document.getElementById('page-container');
  if (!container) return;

  container.innerHTML = `
    <div class="login-container">
      <div class="login-card glass-panel">
        <div class="login-header">
          <i class="fas fa-user-plus"></i>
          <h2>Criar conta</h2>
          <p>Cadastre-se no EduNEXUS</p>
        </div>
        <form id="signupForm">
          <div class="input-group">
            <i class="fas fa-user"></i>
            <input type="text" id="signupName" placeholder="Nome completo" autocomplete="name" required>
          </div>
          <div class="input-group">
            <i class="fas fa-envelope"></i>
            <input type="email" id="signupEmail" placeholder="E-mail" autocomplete="email" required>
          </div>
          <div class="input-group">
            <i class="fas fa-lock"></i>
            <input type="password" id="signupPassword" placeholder="Senha (mínimo 6 caracteres)" autocomplete="new-password" required>
          </div>
          <button type="submit" class="btn-neon login-btn">Cadastrar</button>
        </form>
        <div class="login-links">
          <a href="#" id="loginLink">Já tem conta? Faça login</a>
        </div>
        <div id="signupMessage" class="login-message"></div>
      </div>
    </div>
  `;

  const form = document.getElementById('signupForm');
  const messageDiv = document.getElementById('signupMessage');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;

    if (!name || !email || !password) {
      messageDiv.innerHTML = '<span class="error">Preencha todos os campos.</span>';
      return;
    }
    if (password.length < 6) {
      messageDiv.innerHTML = '<span class="error">A senha deve ter pelo menos 6 caracteres.</span>';
      return;
    }

    messageDiv.innerHTML = '<span class="loading">Criando conta...</span>';

    try {
      const signUpResult = await window.SupabaseClient.signUp(email, password);
      if (!signUpResult.success) {
        messageDiv.innerHTML = `<span class="error">Erro: ${signUpResult.error}</span>`;
        return;
      }

      const userId = signUpResult.user.id;
      await new Promise(resolve => setTimeout(resolve, 500));

      if (typeof SupabaseClient.createProfile === 'function') {
        const profileResult = await SupabaseClient.createProfile(userId, name);
        if (!profileResult.success) {
          console.warn('Erro ao criar perfil:', profileResult.error);
          messageDiv.innerHTML = '<span class="error">Conta criada, mas houve problema ao salvar o perfil. Contate o suporte.</span>';
          return;
        }
      }

      messageDiv.innerHTML = '<span class="success">Conta criada com sucesso! Redirecionando para login...</span>';
      setTimeout(() => {
        Router.navigate('login');
      }, 2000);
    } catch (err) {
      console.error(err);
      messageDiv.innerHTML = '<span class="error">Erro inesperado. Tente novamente.</span>';
    }
  });

  document.getElementById('loginLink').addEventListener('click', (e) => {
    e.preventDefault();
    Router.navigate('login');
  });
}

// ========== INICIALIZAÇÃO ==========
if (!window.appInitialized) {
  window.appInitialized = true;
  window.addEventListener('DOMContentLoaded', () => {
    if (window.AccessibilityManager) {
      window.AccessibilityManager.init();
    }
    console.log('DOMContentLoaded - iniciando EduNEXUS');
    try {
      if (window.Settings && window.Settings.init) window.Settings.init();
      if (window.ScreenReader && window.ScreenReader.init) window.ScreenReader.init();
      if (window.ErrorHandler) {
        ErrorHandler.setupGlobalHandlers();
        ErrorHandler.log('info', 'EduNexus iniciado com hardening ativo');
      }
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
          console.log('SW registrado com sucesso');
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            console.log('Nova versão do SW encontrada');
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showToast('🔄 Nova versão disponível! Atualize a página.', 'info');
                setTimeout(() => {
                  if (confirm('Nova versão disponível. Recarregar agora?')) {
                    window.location.reload();
                  }
                }, 1000);
              }
            });
          });
        }).catch(err => console.error('SW falhou:', err));
      }
      
      window.addEventListener('online', () => {
        showToast('✅ Conexão restabelecida', 'success');
        if (window.processQueue) window.processQueue();
      });
      window.addEventListener('offline', () => {
        showToast('⚠️ Modo offline ativado. Algumas ações serão salvas.', 'warning');
      });
      
      if (window.Router && window.Router.init) window.Router.init();
      
      if (window.EduInsights) {
        window.EduInsights.init();
      }

      // ========== INTEGRAÇÃO SUPABASE (AUTENTICAÇÃO) ==========
      if (window.SupabaseClient) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');

        async function updateAuthUI() {
          const isAuth = await SupabaseClient.isAuthenticated();
          console.log('Estado de autenticação:', isAuth);
          if (loginBtn) loginBtn.style.display = isAuth ? 'none' : 'inline-flex';
          if (logoutBtn) logoutBtn.style.display = isAuth ? 'inline-flex' : 'none';
        }

        if (loginBtn) {
          loginBtn.addEventListener('click', async () => {
            const email = prompt('Digite seu e-mail:');
            const password = prompt('Digite sua senha:');
            if (email && password) {
              const result = await SupabaseClient.signIn(email, password);
              if (result.success) {
                showToast(`✅ Bem‑vindo, ${result.user.email}!`, 'success');
                updateAuthUI();
              } else {
                showToast(`❌ Erro: ${result.error}`, 'error');
              }
            }
          });
        }

        if (logoutBtn) {
          logoutBtn.addEventListener('click', async () => {
            const result = await SupabaseClient.signOut();
            if (result.success) {
              showToast('🔓 Logout realizado', 'info');
              updateAuthUI();
            }
          });
        }

        SupabaseClient.onAuthStateChange((event, session) => {
          console.log('Auth event:', event, session);
          if (event === 'SIGNED_IN') {
            showToast(`✅ Logado como ${session.user.email}`, 'success');
            updateAuthUI();
          } else if (event === 'SIGNED_OUT') {
            showToast('🔓 Você saiu da conta', 'info');
            updateAuthUI();
          }
        });

        updateAuthUI();
      }

      if (window.NativeExperience) {
        window.NativeExperience.init();
      }

      document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
          const route = btn.getAttribute('data-route');
          if(route && window.Router) window.Router.navigate(route);
        });
        // ARIA para indicar página ativa
        const isActive = btn.dataset.route === location.hash.slice(1);
        if (isActive) {
          btn.setAttribute('aria-current', 'page');
        } else {
          btn.removeAttribute('aria-current');
        }
      });
      const quickBtn = document.getElementById('quickAccessBtn');
      if(quickBtn) quickBtn.addEventListener('click', () => { if(window.Router) window.Router.navigate('settings'); });
      const userBtn = document.getElementById('userMenuBtn');
      if(userBtn) userBtn.addEventListener('click', () => { if(window.Router) window.Router.navigate('profile'); });
      
      const adminBtn = document.getElementById('adminPanelBtn');
      if (adminBtn) {
        adminBtn.addEventListener('click', () => {
          window.location.href = '/admin/index.html';
        });
      }

      const splash = document.getElementById('splashScreen');
      const app = document.getElementById('app');
      if (splash && app) {
        setTimeout(() => {
          splash.style.transition = 'opacity 1s ease';
          splash.style.opacity = '0';
          setTimeout(() => {
            splash.style.display = 'none';
            app.style.display = 'block';
          }, 1000);
        }, 3500);
      }
    } catch(err) {
      console.error('Erro na inicialização:', err);
      const splash = document.getElementById('splashScreen');
      const app = document.getElementById('app');
      if(splash) splash.style.display = 'none';
      if(app) app.style.display = 'block';
    }
  });
}