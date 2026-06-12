// ===== PARTÍCULAS SCI-FI NA SPLASH =====
(function() {
  if (window.splashParticlesEnabled) return;
  window.splashParticlesEnabled = true;

  function initSplashParticles() {
    const splash = document.getElementById('splashScreen');
    if (!splash) return;
    const canvas = document.createElement('canvas');
    canvas.id = 'splash-canvas';
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    splash.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let width, height;
    let particles = [];

    function resize() {
      width = splash.clientWidth;
      height = splash.clientHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function createParticles() {
      const count = Math.min(60, Math.floor(width * height / 8000));
      particles = [];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          radius: Math.random() * 2 + 1,
          alpha: Math.random() * 0.5 + 0.2,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.2,
          color: `hsl(${Math.random() * 60 + 180}, 100%, 60%)`
        });
      }
    }

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      for (let p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
      requestAnimationFrame(draw);
    }

    window.addEventListener('resize', () => {
      resize();
      createParticles();
    });
    resize();
    createParticles();
    draw();
  }

  // Aguarda a splash existir
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSplashParticles);
  } else {
    initSplashParticles();
  }
})();

// ===== SKELETON LOADING (exemplo para uso futuro) =====
window.showSkeleton = function(containerId, type = 'card', count = 3) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const skeletonHtml = Array(count).fill(`
    <div class="skeleton-card" style="height: 180px; border-radius: 28px; margin-bottom: 16px;"></div>
  `).join('');
  container.innerHTML = skeletonHtml;
};

window.hideSkeleton = function(containerId, renderFunction) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (renderFunction) renderFunction();
};