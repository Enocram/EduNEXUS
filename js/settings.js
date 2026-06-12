(function() {
  if (window.Settings) return;
  window.Settings = {
    init() {
      this.loadTheme();
      this.loadAccessibility();
      this.bindEvents();
    },
    loadTheme() {
      const saved = localStorage.getItem('theme') || 'dark';
      document.body.classList.remove('dark-theme', 'light-theme');
      document.body.classList.add(saved === 'light' ? 'light-theme' : 'dark-theme');
    },
    loadAccessibility() {
      if(localStorage.getItem('highContrast') === 'true') document.body.classList.add('high-contrast');
      if(localStorage.getItem('daltonism') === 'true') document.body.classList.add('daltonism');
      if(localStorage.getItem('lowVision') === 'true') document.body.classList.add('low-vision');
      const fontSize = localStorage.getItem('fontSize');
      if(fontSize === 'large') document.body.classList.add('large-font');
      if(localStorage.getItem('lineSpacing') === 'large') document.body.classList.add('spacing-lg');
    },
    bindEvents() {
      const themeBtn = document.getElementById('themeToggleHeader');
      if(themeBtn) {
        themeBtn.addEventListener('click', () => {
          const isDark = document.body.classList.contains('dark-theme');
          document.body.classList.remove('dark-theme', 'light-theme');
          document.body.classList.add(isDark ? 'light-theme' : 'dark-theme');
          localStorage.setItem('theme', isDark ? 'light' : 'dark');
        });
      }
    }
  };
})();