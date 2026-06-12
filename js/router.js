(function() {
  if (window.Router) return;
  window.Router = {
    routes: {},

    registerRoutes() {
      if (typeof renderDashboard !== 'undefined') this.routes.dashboard = renderDashboard;
      if (typeof renderApps !== 'undefined') this.routes.apps = renderApps;
      if (typeof renderCourses !== 'undefined') this.routes.courses = renderCourses;
      if (typeof renderContact !== 'undefined') this.routes.contact = renderContact;
      if (typeof renderProfile !== 'undefined') this.routes.profile = renderProfile;
      if (typeof renderSettings !== 'undefined') this.routes.settings = renderSettings;
      if (typeof renderPlayer !== 'undefined') this.routes.player = renderPlayer;
      if (typeof renderAppDetail !== 'undefined') this.routes['app-detail'] = renderAppDetail;
      if (typeof renderLogin !== 'undefined') this.routes.login = renderLogin;
      if (typeof renderSignup !== 'undefined') this.routes.signup = renderSignup;
      if (!this.routes.dashboard) this.routes.dashboard = () => document.getElementById('page-container').innerHTML = '<div class="glass-panel"><h2>Dashboard</h2><p>Carregando...</p></div>';
    },

    protectedRoutes: ['profile', 'settings'],

    isAuthenticated() {
      return localStorage.getItem('edunexus_auth') === 'true';
    },

    sanitizeParams(params) {
      return window.ErrorHandler ? window.ErrorHandler.sanitizeRouteParams(params) : params;
    },

    navigate(route, params = {}) {
      const container = document.getElementById('page-container');
      if (container) {
        container.style.opacity = '0';
        container.style.transform = 'translateY(12px)';
        container.style.filter = 'blur(2px)';
      }
      setTimeout(() => {
        history.pushState(null, '', `#${route}`);
        if (this.routes[route]) this.routes[route](params);
        else this.routes.dashboard();
        document.querySelectorAll('.nav-item').forEach(btn => {
          const isActive = btn.dataset.route === route;
          btn.classList.toggle('active', isActive);
          if (isActive) {
            btn.setAttribute('aria-current', 'page');
          } else {
            btn.removeAttribute('aria-current');
          }
        });
        if (window.prefetchNextRoute) window.prefetchNextRoute(route);
        if (container) {
          container.style.transition = 'all 0.3s ease';
          container.style.opacity = '1';
          container.style.transform = 'translateY(0)';
          container.style.filter = 'blur(0)';
        }
      }, 150);
    },

    init() {
      this.registerRoutes();
      window.addEventListener('popstate', () => this.handleHash());
      this.handleHash();
    },

    handleHash() {
      let hash = location.hash.slice(1);
      let params = {};
      if (hash.includes('?')) {
        const [route, query] = hash.split('?');
        hash = route;
        const urlParams = new URLSearchParams(query);
        for (let [key, value] of urlParams.entries()) {
          params[key] = value;
        }
      }
      if (this.routes[hash]) this.routes[hash](params);
      else this.routes.dashboard();
    }
  };
})();