// ========== EXPERIÊNCIA NATIVA PREMIUM ==========
const NativeExperience = {
  // Estado
  touchStartY: 0,
  isRefreshing: false,
  refreshIndicator: null,
  
  // Inicialização
  init() {
    this.setupMetaViewport();
    this.setupScrollBehavior();
    this.setupPullToRefresh();
    this.setupTouchGestures();
    this.setupSafeAreas();
    this.injectRefreshStyles();
    console.log('NativeExperience ativado');
  },
  
  // Meta viewport para comportamento nativo
  setupMetaViewport() {
    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.name = 'viewport';
      document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes';
  },
  
  // Scroll suave e momentum premium
  setupScrollBehavior() {
    document.documentElement.style.scrollBehavior = 'smooth';
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.style.webkitOverflowScrolling = 'touch';
      mainContent.style.overflowY = 'auto';
      mainContent.style.scrollBehavior = 'smooth';
    }
  },
  
  // Injetar estilos do pull-to-refresh
  injectRefreshStyles() {
    if (document.getElementById('pull-to-refresh-styles')) return;
    const styles = document.createElement('style');
    styles.id = 'pull-to-refresh-styles';
    styles.textContent = `
      .pull-to-refresh {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-glass);
        backdrop-filter: blur(12px);
        transform: translateY(-100%);
        transition: transform 0.2s ease;
        z-index: 1000;
        color: var(--neon-cyan);
        font-size: 0.85rem;
        gap: 8px;
      }
      .pull-to-refresh.active {
        transform: translateY(0);
      }
      .pull-to-refresh .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(0,224,255,0.3);
        border-top-color: var(--neon-cyan);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(styles);
  },
  
  // Pull-to-refresh customizado
  setupPullToRefresh() {
    // Criar indicador visual
    const indicator = document.createElement('div');
    indicator.className = 'pull-to-refresh';
    indicator.innerHTML = '<div class="spinner"></div><span>Atualizar...</span>';
    document.body.appendChild(indicator);
    this.refreshIndicator = indicator;
    
    let startY = 0;
    let isDragging = false;
    
    document.addEventListener('touchstart', (e) => {
      if (window.scrollY <= 5 && !this.isRefreshing) {
        startY = e.touches[0].clientY;
        isDragging = true;
      }
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      if (!isDragging || this.isRefreshing) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      if (diff > 0 && window.scrollY <= 5) {
        const progress = Math.min(diff / 80, 1);
        this.refreshIndicator.style.transform = `translateY(${Math.min(progress * 60, 60) - 100}%)`;
        if (diff > 80 && !this.isRefreshing) {
          this.triggerRefresh();
          isDragging = false;
        }
      }
    }, { passive: true });
    
    document.addEventListener('touchend', () => {
      isDragging = false;
      if (!this.isRefreshing) {
        this.refreshIndicator.style.transform = 'translateY(-100%)';
      }
    });
  },
  
  // Executar refresh (recarrega a página atual)
  async triggerRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.refreshIndicator.classList.add('active');
    this.refreshIndicator.style.transform = 'translateY(0)';
    
    // Simular atualização – recarrega o conteúdo da rota atual
    const currentRoute = window.location.hash.slice(1) || 'dashboard';
    if (window.Router && window.Router.navigate) {
      window.Router.navigate(currentRoute);
    } else {
      location.reload();
    }
    
    setTimeout(() => {
      this.refreshIndicator.classList.remove('active');
      this.refreshIndicator.style.transform = 'translateY(-100%)';
      this.isRefreshing = false;
    }, 1000);
  },
  
  // Gestos de toque (swipe left/right para navegação)
  setupTouchGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    
    document.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    });
    
    document.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diffX = touchEndX - touchStartX;
      const diffY = e.changedTouches[0].screenY - touchStartY;
      // Swipe horizontal (ignorar se vertical > 30px)
      if (Math.abs(diffY) < 30 && Math.abs(diffX) > 50) {
        if (diffX > 0 && window.Router) {
          // Swipe para direita: voltar (se houver histórico)
          window.history.back();
        } else if (diffX < 0 && window.Router) {
          // Swipe para esquerda: avançar
          window.history.forward();
        }
      }
    });
  },
  
  // Safe-area support
  setupSafeAreas() {
    const style = document.createElement('style');
    style.textContent = `
      body {
        padding-top: env(safe-area-inset-top);
        padding-bottom: env(safe-area-inset-bottom);
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
      .glass-header {
        margin-top: max(16px, env(safe-area-inset-top));
      }
      .bottom-nav {
        margin-bottom: max(16px, env(safe-area-inset-bottom));
      }
    `;
    document.head.appendChild(style);
  },
  
  // Haptics (preparado para futura API)
  hapticLight() {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }
  },
  
  hapticMedium() {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(20);
    }
  },
  
  hapticHeavy() {
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate([30, 50, 30]);
    }
  },
  
  // Bottom-sheet modal (genérico)
  showBottomSheet(title, contentHtml, onClose = null) {
    const existing = document.querySelector('.bottom-sheet');
    if (existing) existing.remove();
    
    const sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.innerHTML = `
      <div class="bottom-sheet-overlay"></div>
      <div class="bottom-sheet-container">
        <div class="bottom-sheet-handle"></div>
        <div class="bottom-sheet-header">
          <h3>${title}</h3>
          <button class="bottom-sheet-close">&times;</button>
        </div>
        <div class="bottom-sheet-content">${contentHtml}</div>
      </div>
    `;
    document.body.appendChild(sheet);
    
    const overlay = sheet.querySelector('.bottom-sheet-overlay');
    const closeBtn = sheet.querySelector('.bottom-sheet-close');
    const container = sheet.querySelector('.bottom-sheet-container');
    
    const close = () => {
      sheet.classList.add('hiding');
      setTimeout(() => {
        sheet.remove();
        if (onClose) onClose();
      }, 300);
    };
    
    overlay.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    
    // Fechar ao arrastar para baixo
    let startY = 0;
    container.addEventListener('touchstart', (e) => {
      startY = e.touches[0].clientY;
    });
    container.addEventListener('touchmove', (e) => {
      const diff = e.touches[0].clientY - startY;
      if (diff > 50 && container.scrollTop === 0) {
        close();
      }
    });
    
    setTimeout(() => sheet.classList.add('show'), 10);
    return sheet;
  }
};

window.NativeExperience = NativeExperience;