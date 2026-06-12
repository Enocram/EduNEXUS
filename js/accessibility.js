// ========== SISTEMA AVANÇADO DE ACESSIBILIDADE ==========
(function() {
  if (window.AccessibilityManager) return;
  
  class AccessibilityManager {
    constructor() {
      this.settings = this.loadSettings();
      this.isReading = false;
      this.currentReadingElement = null;
      this.speechSynth = window.speechSynthesis;
      this.focusTrapped = false;
      this.init();
    }
    
    loadSettings() {
      const saved = localStorage.getItem('edunexus_accessibility');
      const defaults = {
        highContrast: false,
        dyslexicFont: false,
        reduceAnimations: false,
        largeCursor: false,
        readingGuide: false,
        lowDistraction: false,
        voiceCommands: false,
        soundFeedback: false,
        fontSize: 100,
        lineHeight: 1.5,
        letterSpacing: 0
      };
      return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    }
    
    saveSettings() {
      localStorage.setItem('edunexus_accessibility', JSON.stringify(this.settings));
      this.applySettings();
    }
    
    applySettings() {
      // Alto contraste (WCAG AAA)
      if (this.settings.highContrast) {
        document.body.classList.add('wcag-high-contrast');
      } else {
        document.body.classList.remove('wcag-high-contrast');
      }
      
      // Fonte dislexia-friendly (OpenDyslexic)
      if (this.settings.dyslexicFont) {
        document.body.classList.add('dyslexic-font');
        if (!document.getElementById('dyslexic-font-link')) {
          const link = document.createElement('link');
          link.id = 'dyslexic-font-link';
          link.href = 'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/opendyslexic.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }
      } else {
        document.body.classList.remove('dyslexic-font');
      }
      
      // Redução de animações (para TDAH e vestibular)
      if (this.settings.reduceAnimations) {
        document.body.classList.add('reduce-animations');
      } else {
        document.body.classList.remove('reduce-animations');
      }
      
      // Cursor ampliado
      if (this.settings.largeCursor) {
        document.body.classList.add('large-cursor');
      } else {
        document.body.classList.remove('large-cursor');
      }
      
      // Guia de leitura horizontal
      if (this.settings.readingGuide) {
        this.showReadingGuide();
      } else {
        this.hideReadingGuide();
      }
      
      // Modo baixa distração
      if (this.settings.lowDistraction) {
        document.body.classList.add('low-distraction');
      } else {
        document.body.classList.remove('low-distraction');
      }
      
      // Ajustes tipográficos
      document.documentElement.style.fontSize = `${this.settings.fontSize}%`;
      document.body.style.lineHeight = this.settings.lineHeight;
      document.body.style.letterSpacing = `${this.settings.letterSpacing}px`;
    }
    
    // ========== LEITOR DE TELA INTELIGENTE ==========
    readText(text, options = {}) {
      if (this.speechSynth.speaking) {
        this.speechSynth.cancel();
      }
      if (!text) return;
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate || 1;
      utterance.pitch = options.pitch || 1;
      utterance.volume = options.volume || 1;
      
      if (options.lang) utterance.lang = options.lang;
      
      utterance.onstart = () => {
        this.isReading = true;
        this.showReadingFeedback(text);
      };
      utterance.onend = () => {
        this.isReading = false;
        this.hideReadingFeedback();
      };
      utterance.onerror = () => {
        this.isReading = false;
        this.hideReadingFeedback();
      };
      
      this.speechSynth.speak(utterance);
      return utterance;
    }
    
    readPage() {
      // Extrai apenas texto relevante (ignora elementos decorativos)
      const mainContent = document.querySelector('main, [role="main"], #page-container');
      if (!mainContent) return;
      
      const clone = mainContent.cloneNode(true);
      // Remove elementos decorativos
      clone.querySelectorAll('.skeleton-card, .splash-scanner, [aria-hidden="true"], .icon-btn, .favorite-icon').forEach(el => el.remove());
      
      const text = clone.innerText;
      this.readText(text);
    }
    
    readElement(element) {
      if (!element) return;
      let text = '';
      if (element.hasAttribute('aria-label')) {
        text = element.getAttribute('aria-label');
      } else {
        text = element.innerText || element.textContent;
      }
      text = text.trim();
      if (text) {
        this.readText(text);
        this.highlightElement(element);
      }
    }
    
    readSection(sectionId) {
      const section = document.getElementById(sectionId);
      if (section) this.readElement(section);
    }
    
    highlightElement(element) {
      if (this.currentReadingElement) {
        this.currentReadingElement.classList.remove('reading-highlight');
      }
      this.currentReadingElement = element;
      element.classList.add('reading-highlight');
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        if (this.currentReadingElement === element) {
          element.classList.remove('reading-highlight');
        }
      }, 2000);
    }
    
    showReadingFeedback(text) {
      let feedback = document.getElementById('reading-feedback');
      if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'reading-feedback';
        feedback.className = 'reading-feedback';
        document.body.appendChild(feedback);
      }
      feedback.innerText = `🔊 Lendo: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
      feedback.style.display = 'block';
    }
    
    hideReadingFeedback() {
      const feedback = document.getElementById('reading-feedback');
      if (feedback) feedback.style.display = 'none';
    }
    
    // ========== GUIA DE LEITURA ==========
    showReadingGuide() {
      let guide = document.getElementById('reading-guide');
      if (!guide) {
        guide = document.createElement('div');
        guide.id = 'reading-guide';
        guide.className = 'reading-guide';
        document.body.appendChild(guide);
      }
      guide.style.display = 'block';
      
      // Segue o mouse
      document.addEventListener('mousemove', this.guideMoveHandler);
    }
    
    guideMoveHandler = (e) => {
      const guide = document.getElementById('reading-guide');
      if (guide && guide.style.display !== 'none') {
        guide.style.top = `${e.clientY - 40}px`;
        guide.style.left = `${e.clientX - 100}px`;
      }
    };
    
    hideReadingGuide() {
      const guide = document.getElementById('reading-guide');
      if (guide) guide.style.display = 'none';
      document.removeEventListener('mousemove', this.guideMoveHandler);
    }
    
    // ========== COMANDOS DE VOZ ==========
    initVoiceCommands() {
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        console.log('Reconhecimento de voz não suportado');
        return;
      }
      
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'pt-BR';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      
      this.recognition.onresult = (event) => {
        const command = event.results[0][0].transcript.toLowerCase();
        this.processVoiceCommand(command);
      };
      
      this.recognition.onerror = (event) => {
        console.log('Erro no reconhecimento:', event.error);
        this.speakFeedback('Não entendi. Tente novamente.');
      };
      
      // Botão para ativar
      const voiceBtn = document.createElement('button');
      voiceBtn.id = 'voice-command-btn';
      voiceBtn.className = 'sr-fab voice-command-btn';
      voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
      voiceBtn.setAttribute('aria-label', 'Comandos de voz');
      voiceBtn.style.bottom = '160px';
      voiceBtn.style.background = 'var(--neon-purple)';
      document.body.appendChild(voiceBtn);
      
      voiceBtn.addEventListener('click', () => {
        this.startVoiceCommand();
      });
    }
    
    startVoiceCommand() {
      if (this.recognition) {
        this.speakFeedback('Ouvindo...');
        this.recognition.start();
      }
    }
    
    processVoiceCommand(command) {
      console.log('Comando:', command);
      this.speakFeedback(`Comando: ${command}`);
      
      if (command.includes('página inicial') || command.includes('dashboard')) {
        Router.navigate('dashboard');
      } else if (command.includes('cursos')) {
        Router.navigate('courses');
      } else if (command.includes('apps')) {
        Router.navigate('apps');
      } else if (command.includes('perfil')) {
        Router.navigate('profile');
      } else if (command.includes('configurações') || command.includes('acessibilidade')) {
        Router.navigate('settings');
      } else if (command.includes('ler página')) {
        this.readPage();
      } else if (command.includes('parar')) {
        this.speechSynth.cancel();
      } else if (command.includes('alto contraste')) {
        this.settings.highContrast = !this.settings.highContrast;
        this.saveSettings();
        this.speakFeedback(`Alto contraste ${this.settings.highContrast ? 'ativado' : 'desativado'}`);
      } else if (command.includes('fonte dislexia')) {
        this.settings.dyslexicFont = !this.settings.dyslexicFont;
        this.saveSettings();
        this.speakFeedback(`Fonte para dislexia ${this.settings.dyslexicFont ? 'ativada' : 'desativada'}`);
      } else if (command.includes('aumentar fonte')) {
        this.settings.fontSize = Math.min(this.settings.fontSize + 10, 200);
        this.saveSettings();
        this.speakFeedback(`Fonte aumentada para ${this.settings.fontSize}%`);
      } else if (command.includes('diminuir fonte')) {
        this.settings.fontSize = Math.max(this.settings.fontSize - 10, 70);
        this.saveSettings();
        this.speakFeedback(`Fonte reduzida para ${this.settings.fontSize}%`);
      } else if (command.includes('modo foco') || command.includes('baixa distração')) {
        this.settings.lowDistraction = !this.settings.lowDistraction;
        this.saveSettings();
        this.speakFeedback(`Modo baixa distração ${this.settings.lowDistraction ? 'ativado' : 'desativado'}`);
      } else {
        this.speakFeedback('Comando não reconhecido. Tente: página inicial, cursos, apps, ler página, parar, alto contraste.');
      }
    }
    
    speakFeedback(message) {
      if (this.settings.soundFeedback) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1;
        this.speechSynth.speak(utterance);
      }
    }
    
    // ========== FOCUS MANAGER ==========
    setupFocusManager() {
      // Trap focus em modais
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const focusable = document.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
          const firstFocusable = focusable[0];
          const lastFocusable = focusable[focusable.length - 1];
          
          if (e.shiftKey && document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
        
        // Atalho para leitor de tela (Alt + R)
        if (e.altKey && e.key === 'r') {
          e.preventDefault();
          this.readPage();
        }
        // Atalho para comandos de voz (Alt + V)
        if (e.altKey && e.key === 'v') {
          e.preventDefault();
          this.startVoiceCommand();
        }
        // Atalho para menu de acessibilidade (Alt + A)
        if (e.altKey && e.key === 'a') {
          e.preventDefault();
          Router.navigate('settings');
        }
      });
    }
    
    // ========== INICIALIZAÇÃO ==========
    init() {
      this.applySettings();
      this.setupFocusManager();
      
      // Adicionar botão flutuante de leitura inteligente
      // this.addSmartReadButton();   <-- Pode ser ativado futuramente para leitura seletiva -->
      
      // Inicializar comandos de voz se ativado
      if (this.settings.voiceCommands) {
        this.initVoiceCommands();
      }
      
      // Observer para novos conteúdos (focar no primeiro elemento)
      const observer = new MutationObserver(() => {
        if (document.activeElement === document.body) {
          const firstFocusable = document.querySelector('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) firstFocusable.focus();
        }
      });
      observer.observe(document.getElementById('page-container'), { childList: true, subtree: true });
      
      console.log('Sistema de acessibilidade inicializado');
    }
    
    addSmartReadButton() {
      const readBtn = document.createElement('button');
      readBtn.id = 'smart-read-btn';
      readBtn.className = 'sr-fab smart-read-btn';
      readBtn.innerHTML = '<i class="fas fa-book-open"></i>';
      readBtn.setAttribute('aria-label', 'Ler página inteira');
      readBtn.style.bottom = '230px';
      readBtn.style.background = 'var(--neon-blue)';
      readBtn.addEventListener('click', () => this.readPage());
      document.body.appendChild(readBtn);
      
      // Leitura seletiva ao passar mouse (se ativado)
      let hoverTimeout;
      document.addEventListener('mouseover', (e) => {
        if (this.settings.voiceCommands) { // ou uma flag específica
          const target = e.target.closest('.card, .btn-neon, .nav-item, h2, h3, p');
          if (target) {
            clearTimeout(hoverTimeout);
            hoverTimeout = setTimeout(() => {
              this.readElement(target);
            }, 1000);
          }
        }
      });
    }
  }
  
  // Inicializa quando o DOM estiver pronto
  window.addEventListener('DOMContentLoaded', () => {
    window.AccessibilityManager = new AccessibilityManager();
  });
})();