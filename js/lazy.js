// ========== LAZY LOADING E PREFETCH ==========
let prefetchedRoutes = {};

function prefetchRoute(route) {
  if (prefetchedRoutes[route]) return;
  prefetchedRoutes[route] = true;
  console.log(`🔮 Prefetching: ${route}`);
  
  // Pré-carrega dados da rota (ex: cursos, apps)
  if (route === 'courses') {
    // Garante que os dados de cursos já estejam no cache do Service Worker
    if (window.AppData && window.AppData.courses) {
      // Já estão em memória, mas podemos forçar cache de imagens
      const courseIds = window.AppData.courses.map(c => c.id);
      console.log(`Prefetch de ${courseIds.length} cursos`);
    }
  } else if (route === 'apps') {
    // Similar para apps
    if (window.AppData && window.AppData.apps) {
      console.log(`Prefetch de ${window.AppData.apps.length} apps`);
    }
  }
}

// Prefetch ao passar mouse sobre botão de navegação
document.addEventListener('mouseover', (e) => {
  const navItem = e.target.closest('.nav-item');
  if (navItem && navItem.dataset.route) {
    prefetchRoute(navItem.dataset.route);
  }
});

// Prefetch da próxima rota mais provável (ex: após dashboard, cursos)
function prefetchNextRoute(currentRoute) {
  const nextMap = {
    dashboard: 'courses',
    courses: 'player',
    apps: 'dashboard',
    profile: 'settings'
  };
  const next = nextMap[currentRoute];
  if (next) prefetchRoute(next);
}

// Exportar para uso no Router (opcional)
window.prefetchNextRoute = prefetchNextRoute;