// ========== GERENCIADOR DE ERROS E FALLBACKS ==========
const ErrorHandler = {
  logLevel: 'info',

  log(level, message, context = {}) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    if (levels[level] < levels[this.logLevel]) return;
    
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent
    };
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](`[${level.toUpperCase()}] ${message}`, context);
    
    const errors = JSON.parse(localStorage.getItem('edunexus_error_log') || '[]');
    errors.unshift(entry);
    if (errors.length > 50) errors.pop();
    localStorage.setItem('edunexus_error_log', JSON.stringify(errors));
  },

  setupGlobalHandlers() {
    window.addEventListener('error', (event) => {
      const errorMsg = event.message || event.error?.message || 'Erro de script';
      this.log('error', `Erro não tratado: ${errorMsg}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
      // Só exibe fallback para erros que não sejam de rede ou recursos externos
      if (!event.filename || !event.filename.includes('chrome-extension')) {
        this.showUserFriendlyFallback(errorMsg);
      }
      return true;
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reasonMsg = event.reason?.message || event.reason || 'Erro em Promise';
      this.log('error', `Promise rejeitada: ${reasonMsg}`, {
        reason: reasonMsg,
        stack: event.reason?.stack
      });
      // Não exibe fallback para rejeições de promises que podem ser esperadas (ex: falha de rede)
      if (reasonMsg && !reasonMsg.includes('Failed to fetch') && !reasonMsg.includes('NetworkError')) {
        this.showUserFriendlyFallback(reasonMsg);
      }
    });
  },

  showUserFriendlyFallback(errorMessage) {
    // Evita múltiplos fallbacks simultâneos
    if (document.querySelector('.error-fallback')) return;
    
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'error-fallback glass-panel';
    fallbackDiv.innerHTML = `
      <div class="error-fallback-icon">⚠️</div>
      <h3>Ops! Algo não funcionou como esperado.</h3>
      <p>Não se preocupe, seus dados estão seguros. Recarregue a página ou <button id="errorReloadBtn">tente novamente</button>.</p>
      <small>Erro: ${Sanitize.html(errorMessage) || 'Erro desconhecido'}</small>
    `;
    document.body.appendChild(fallbackDiv);
    setTimeout(() => fallbackDiv.classList.add('show'), 10);
    document.getElementById('errorReloadBtn')?.addEventListener('click', () => location.reload());
    
    // Remove automaticamente após 8 segundos
    setTimeout(() => {
      if (fallbackDiv && fallbackDiv.parentNode) {
        fallbackDiv.classList.remove('show');
        setTimeout(() => fallbackDiv.remove(), 300);
      }
    }, 8000);
  },

  safeAsync(fn, fallbackValue = null, context = {}) {
    return this.safeSync(() => fn(), fallbackValue, context);
  },

  safeSync(fn, fallbackValue = null, context = {}) {
    try {
      return fn();
    } catch (err) {
      this.log('error', `Erro em sync: ${err.message}`, { ...context, stack: err.stack });
      return fallbackValue;
    }
  },

  sanitizeRouteParams(params) {
    const safe = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === 'id' || key === 'courseId' || key === 'lessonId') {
        safe[key] = Sanitize.id(value);
      } else {
        safe[key] = Sanitize.text(value);
      }
    }
    return safe;
  }
};

window.ErrorHandler = ErrorHandler;