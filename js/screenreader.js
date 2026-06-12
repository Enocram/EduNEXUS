(function() {
  if (window.ScreenReader) return;
  window.ScreenReader = {
    isActive: false,
    utterance: null,
    speed: 1,
    init() {
      this.fab = document.getElementById('screenReaderFab');
      this.panel = document.getElementById('srPanel');
      if(!this.fab) return;
      this.playBtn = document.getElementById('srPlayBtn');
      this.pauseBtn = document.getElementById('srPauseBtn');
      this.resumeBtn = document.getElementById('srResumeBtn');
      this.speedSlider = document.getElementById('srSpeed');
      this.closeBtn = document.getElementById('closeSrPanel');
      this.fab.addEventListener('click', () => this.togglePanel());
      if(this.playBtn) this.playBtn.addEventListener('click', () => this.readPage());
      if(this.pauseBtn) this.pauseBtn.addEventListener('click', () => window.speechSynthesis?.cancel());
      if(this.resumeBtn) this.resumeBtn.addEventListener('click', () => this.resume());
      if(this.speedSlider) this.speedSlider.addEventListener('input', (e) => { this.speed = parseFloat(e.target.value); });
      if(this.closeBtn) this.closeBtn.addEventListener('click', () => { if(this.panel) this.panel.style.display = 'none'; });
    },
    togglePanel() { if(this.panel) this.panel.style.display = this.panel.style.display === 'none' ? 'block' : 'none'; },
    readPage() {
      window.speechSynthesis?.cancel();
      const text = document.body.innerText;
      if(!text) return;
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.rate = this.speed;
      window.speechSynthesis.speak(this.utterance);
    },
    resume() { if(this.utterance) window.speechSynthesis.speak(this.utterance); }
  };
})();