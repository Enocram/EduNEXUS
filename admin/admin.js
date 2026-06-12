// ========== ADMIN PANEL (PERSISTÊNCIA REAL – CORRIGIDO) ==========
const ADMIN_PASSWORD = 'admin123';
let currentSection = 'dashboard';

let appsData = [];
let coursesData = [];
let categoriesData = [];

// Dados padrão (idênticos aos do data.js)
const defaultApps = [
  { id: 1, name: "AlphaMath IA", icon: "fas fa-square-root-alt", desc: "Matemática adaptativa com IA", longDesc: "AlphaMath IA utiliza algoritmos de machine learning...", category: "IA", badge: "Novo", tags: ["IA","Matemática","Adaptativo"], technologies: ["TensorFlow.js","WebAssembly","IndexedDB"], screenshots: ["https://picsum.photos/id/20/300/200","https://picsum.photos/id/24/300/200"], version: "2.1.0", changelog: "Adicionado suporte a leitura de tela.", installable: true, favorite: false },
  { id: 2, name: "Leitor Inclusivo", icon: "fas fa-book-reader", desc: "Transforma qualquer texto em áudio com voz natural.", longDesc: "Ferramenta assistiva para dislexia e baixa visão.", category: "Tecnologia Assistiva", badge: "Atualizado", tags: ["Leitura","Áudio","Acessibilidade"], technologies: ["SpeechSynthesis","Web Speech API"], screenshots: ["https://picsum.photos/id/12/300/200"], version: "1.3.0", changelog: "Melhorias na velocidade de leitura.", installable: true, favorite: false },
  { id: 3, name: "Mindvoice", icon: "fas fa-microphone-alt", desc: "Comunicação aumentativa com símbolos.", longDesc: "Ideal para autismo e dificuldades de fala.", category: "Inclusão", badge: "Beta", tags: ["Comunicação","PECS","Aumentativa"], technologies: ["Canvas","LocalStorage"], screenshots: ["https://picsum.photos/id/15/300/200","https://picsum.photos/id/26/300/200"], version: "1.0.0", changelog: "Lançamento inicial.", installable: true, favorite: false },
  { id: 4, name: "GeoExplorer AR", icon: "fas fa-globe", desc: "Realidade aumentada para geografia.", longDesc: "Explore o mundo em 3D.", category: "Educação", badge: "Experimental", tags: ["AR","Geografia","3D"], technologies: ["Three.js","WebXR"], screenshots: ["https://picsum.photos/id/29/300/200","https://picsum.photos/id/42/300/200"], version: "0.9.0", changelog: "Compatibilidade com dispositivos móveis.", installable: false, favorite: false },
  { id: 5, name: "Teclado Virtual Acessível", icon: "fas fa-keyboard", desc: "Teclado na tela com previsão de palavras.", longDesc: "Para pessoas com dificuldades motoras.", category: "Tecnologia Assistiva", badge: "Atualizado", tags: ["Teclado","Motor","Varredura"], technologies: ["JavaScript","CSS Grid"], screenshots: ["https://picsum.photos/id/13/300/200"], version: "1.2.0", changelog: "Novo layout para tablets.", installable: true, favorite: false }
];

const defaultCourses = [
  {
    id: 101, title: "IA na Educação Especial", description: "Ferramentas e práticas com IA", modules: [
      { id: 1, title: "Fundamentos de IA", lessons: [{ id: 1011, title: "O que é IA?", duration: 185, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }] }
    ], progress: 35
  },
  {
    id: 102, title: "Tecnologia Assistiva Avançada", description: "Hardware e software adaptativo", modules: [
      { id: 1, title: "Introdução à TA", lessons: [{ id: 2011, title: "O que é Tecnologia Assistiva?", duration: 150, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }] }
    ], progress: 10
  }
];

const defaultCategories = ["Todos", "IA", "Inclusão", "Tecnologia Assistiva", "Educação", "Ferramentas"];

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginBtn').addEventListener('click', doLogin);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.querySelectorAll('[data-section]').forEach(btn => {
    btn.addEventListener('click', () => switchSection(btn.dataset.section));
  });
  loadDataFromDB();
});

async function getAllFromStore(storeName) {
  const db = await EduDB.openDatabase();
  if (!db.objectStoreNames.contains(storeName)) return [];
  const tx = db.transaction(storeName, 'readonly');
  const store = tx.objectStore(storeName);
  return new Promise((resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
}

async function saveToStore(storeName, data) {
  const db = await EduDB.openDatabase();
  if (!db.objectStoreNames.contains(storeName)) {
    console.warn(`Store ${storeName} não existe. Salvando em localStorage.`);
    localStorage.setItem(storeName, JSON.stringify(data));
    return;
  }
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  return new Promise((resolve, reject) => {
    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      let completed = 0;
      if (!data || data.length === 0) {
        tx.commit();
        resolve();
        return;
      }
      for (const item of data) {
        // Se for categoria (string), transforma em objeto com id
        const itemToStore = (storeName === 'admin_categories' && typeof item === 'string') ? { id: item, name: item } : item;
        const putRequest = store.put(itemToStore);
        putRequest.onsuccess = () => {
          completed++;
          if (completed === data.length) {
            tx.commit();
            resolve();
          }
        };
        putRequest.onerror = (e) => reject(e);
      }
    };
    clearRequest.onerror = (e) => reject(e);
  });
}

async function loadDataFromDB() {
  try {
    await EduDB.openDatabase();
    appsData = await getAllFromStore('admin_apps');
    coursesData = await getAllFromStore('admin_courses');
    let catsRaw = await getAllFromStore('admin_categories');
    
    // Converter categorias de objeto para string se necessário
    if (catsRaw.length && typeof catsRaw[0] === 'object') {
      categoriesData = catsRaw.map(c => c.name || c.id);
    } else {
      categoriesData = catsRaw;
    }
    
    // Fallback com dados completos
    if (!appsData.length) {
      appsData = [...defaultApps];
      await saveToStore('admin_apps', appsData);
    }
    if (!coursesData.length) {
      coursesData = [...defaultCourses];
      await saveToStore('admin_courses', coursesData);
    }
    if (!categoriesData.length) {
      categoriesData = [...defaultCategories];
      await saveToStore('admin_categories', categoriesData);
    }
  } catch(e) {
    console.error('Erro ao carregar dados do admin:', e);
    appsData = [...defaultApps];
    coursesData = [...defaultCourses];
    categoriesData = [...defaultCategories];
  }
}

function doLogin() {
  const pwd = document.getElementById('adminPassword').value;
  if (pwd === ADMIN_PASSWORD) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    switchSection('dashboard');
  } else {
    alert('Senha incorreta');
  }
}

function logout() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminDashboard').style.display = 'none';
  document.getElementById('adminPassword').value = '';
}

function switchSection(section) {
  currentSection = section;
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });
  renderSection(section);
}

function renderSection(section) {
  const container = document.getElementById('adminContent');
  if (section === 'dashboard') renderDashboard(container);
  else if (section === 'apps') renderAppsManager(container);
  else if (section === 'courses') renderCoursesManager(container);
  else if (section === 'categories') renderCategoriesManager(container);
}

function renderDashboard(container) {
  const totalApps = appsData.length;
  const totalCourses = coursesData.length;
  const totalLessons = coursesData.reduce((sum, c) => {
    if (c.modules && Array.isArray(c.modules)) {
      return sum + c.modules.reduce((s, m) => s + (m.lessons?.length || 0), 0);
    }
    return sum;
  }, 0);
  container.innerHTML = `
    <div class="admin-card">
      <h2><i class="fas fa-chart-simple"></i> Visão Geral</h2>
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-value">${totalApps}</div><div>Apps</div></div>
        <div class="stat-card"><div class="stat-value">${totalCourses}</div><div>Cursos</div></div>
        <div class="stat-card"><div class="stat-value">${totalLessons}</div><div>Aulas</div></div>
        <div class="stat-card"><div class="stat-value">${categoriesData.length}</div><div>Categorias</div></div>
      </div>
      <p>Gerencie apps, cursos e categorias usando os menus acima.</p>
    </div>
  `;
}

// ========== APPS ==========
function renderAppsManager(container) {
  container.innerHTML = `
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2><i class="fas fa-cube"></i> Gerenciar Apps</h2>
        <button id="newAppBtn" class="btn-neon"><i class="fas fa-plus"></i> Novo App</button>
      </div>
      <table class="admin-table">
        <thead><tr><th>Nome</th><th>Categoria</th><th>Ações</th></tr></thead>
        <tbody id="appsTableBody"></tbody>
      </table>
    </div>
  `;
  renderAppsTable();
  document.getElementById('newAppBtn').addEventListener('click', () => openAppModal());
}

function renderAppsTable() {
  const tbody = document.getElementById('appsTableBody');
  tbody.innerHTML = appsData.map(app => `
    <tr>
      <td>${app.name}</td>
      <td>${app.category}</td>
      <td>
        <button class="btn-icon" data-action="edit" data-id="${app.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" data-action="delete" data-id="${app.id}"><i class="fas fa-trash"></i></button>
      </td>
    </tr>
  `).join('');
  document.querySelectorAll('[data-action="edit"]').forEach(btn => btn.addEventListener('click', () => openAppModal(parseInt(btn.dataset.id))));
  document.querySelectorAll('[data-action="delete"]').forEach(btn => btn.addEventListener('click', () => deleteApp(parseInt(btn.dataset.id))));
}

function openAppModal(appId = null) {
  const app = appId ? appsData.find(a => a.id === appId) : null;
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${app ? 'Editar App' : 'Novo App'}</h3>
      <div class="form-group"><label>Nome</label><input id="appName" value="${app?.name || ''}"></div>
      <div class="form-group"><label>Descrição curta</label><textarea id="appDesc">${app?.desc || ''}</textarea></div>
      <div class="form-group"><label>Descrição longa</label><textarea id="appLongDesc">${app?.longDesc || ''}</textarea></div>
      <div class="form-group"><label>Categoria</label><select id="appCategory">${categoriesData.map(c => `<option ${app?.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="form-group"><label>Badge</label><select id="appBadge"><option value="">Nenhum</option><option ${app?.badge === 'Novo' ? 'selected' : ''}>Novo</option><option ${app?.badge === 'Beta' ? 'selected' : ''}>Beta</option><option ${app?.badge === 'Atualizado' ? 'selected' : ''}>Atualizado</option></select></div>
      <div class="form-group"><label>Ícone (classe FA)</label><input id="appIcon" value="${app?.icon || 'fas fa-cube'}"></div>
      <div class="form-group"><label>Versão</label><input id="appVersion" value="${app?.version || '1.0.0'}"></div>
      <div class="form-group"><label>Changelog</label><textarea id="appChangelog">${app?.changelog || ''}</textarea></div>
      <div class="form-group"><label>Tags (separadas por vírgula)</label><input id="appTags" value="${app?.tags?.join(', ') || ''}"></div>
      <div class="form-group"><label>Tecnologias</label><input id="appTech" value="${app?.technologies?.join(', ') || ''}"></div>
      <div class="form-group"><label>Screenshots (URLs separadas por vírgula)</label><input id="appScreenshots" value="${app?.screenshots?.join(', ') || ''}"></div>
      <div class="form-group"><label>URL do aplicativo</label><input id="appUrl" value="${app?.url || ''}"></div>
      <div class="form-actions">
        <button class="btn-neon" id="saveAppBtn">Salvar</button>
        <button class="btn-neon" id="cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('cancelModalBtn').addEventListener('click', () => modal.remove());
  document.getElementById('saveAppBtn').addEventListener('click', async () => {
    const newApp = {
      id: app?.id || Date.now(),
      name: document.getElementById('appName').value,
      desc: document.getElementById('appDesc').value,
      longDesc: document.getElementById('appLongDesc').value || document.getElementById('appDesc').value,
      icon: document.getElementById('appIcon').value,
      category: document.getElementById('appCategory').value,
      badge: document.getElementById('appBadge').value || null,
      version: document.getElementById('appVersion').value,
      changelog: document.getElementById('appChangelog').value || 'Versão inicial',
      tags: document.getElementById('appTags').value.split(',').map(s => s.trim()).filter(Boolean),
      technologies: document.getElementById('appTech').value.split(',').map(s => s.trim()).filter(Boolean),
      screenshots: document.getElementById('appScreenshots').value.split(',').map(s => s.trim()).filter(Boolean),
      url: document.getElementById('appUrl').value,
      installable: true,
      favorite: false
    };
    if (app) {
      const index = appsData.findIndex(a => a.id === app.id);
      appsData[index] = newApp;
    } else {
      appsData.push(newApp);
    }
    await saveToStore('admin_apps', appsData);
    renderAppsTable();
    modal.remove();
  });
}

async function deleteApp(id) {
  if (confirm('Remover este app?')) {
    appsData = appsData.filter(a => a.id !== id);
    await saveToStore('admin_apps', appsData);
    renderAppsTable();
  }
}

// ========== CURSOS ==========
// ========== GERENCIAMENTO DE CURSOS (SUPABASE) ==========
let currentCourseId = null; // usado para edição de módulos/aulas

function renderCoursesManager(container) {
  container.innerHTML = `
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2><i class="fas fa-graduation-cap"></i> Gerenciar Cursos</h2>
        <button id="newCourseBtn" class="btn-neon"><i class="fas fa-plus"></i> Novo Curso</button>
      </div>
      <div id="coursesList"></div>
    </div>
  `;
  loadCoursesList();
  document.getElementById('newCourseBtn').addEventListener('click', () => openCourseModal());
}

async function loadCoursesList() {
  const container = document.getElementById('coursesList');
  if (!container) return;
  container.innerHTML = '<p>Carregando cursos...</p>';

  const result = await SupabaseClient.getCourses();
  if (!result.success) {
    container.innerHTML = `<p class="error">Erro ao carregar cursos: ${result.error}</p>`;
    return;
  }

  const courses = result.data;
  if (courses.length === 0) {
    container.innerHTML = '<p>Nenhum curso cadastrado. Clique em "Novo Curso" para criar.</p>';
    return;
  }

  container.innerHTML = courses.map(course => `
    <div class="admin-card course-item" style="margin-bottom: 16px;" data-course-id="${course.id}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h3>${escapeHtml(course.title)}</h3>
        <div>
          <button class="btn-icon edit-course" data-id="${course.id}"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete-course" data-id="${course.id}"><i class="fas fa-trash"></i></button>
        </div>
      </div>
      <p>${escapeHtml(course.description || '')}</p>
      <div class="modules-container" id="modules-${course.id}">
        <p class="loading-modules">Carregando módulos...</p>
      </div>
      <button class="btn-neon add-module" data-course-id="${course.id}" style="margin-top: 12px;">+ Adicionar Módulo</button>
    </div>
  `).join('');

  // Carregar módulos para cada curso
  for (const course of courses) {
    await loadModulesList(course.id);
  }

  // Eventos
  document.querySelectorAll('.edit-course').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      openCourseModal(id);
    });
  });
  document.querySelectorAll('.delete-course').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (confirm('Remover este curso? Todos os módulos e aulas serão excluídos.')) {
        await SupabaseClient.deleteCourse(id);
        loadCoursesList();
      }
    });
  });
  document.querySelectorAll('.add-module').forEach(btn => {
    btn.addEventListener('click', () => {
      const courseId = parseInt(btn.dataset.courseId);
      addModule(courseId);
    });
  });
}

async function loadModulesList(courseId) {
  const container = document.getElementById(`modules-${courseId}`);
  if (!container) return;
  container.innerHTML = '<p class="loading-modules">Carregando módulos...</p>';

  const result = await SupabaseClient.getModules(courseId);
  if (!result.success) {
    container.innerHTML = `<p class="error">Erro: ${result.error}</p>`;
    return;
  }

  const modules = result.data;
  if (modules.length === 0) {
    container.innerHTML = '<p class="empty-modules">Nenhum módulo ainda. Clique em "Adicionar Módulo".</p>';
    return;
  }

  container.innerHTML = modules.map((mod, idx) => `
    <div class="module-item" data-module-id="${mod.id}" data-order="${mod.order}">
      <div class="module-header" style="display: flex; justify-content: space-between; align-items: center;">
        <strong>📘 ${escapeHtml(mod.title)}</strong>
        <div>
          <button class="btn-icon edit-module" data-module-id="${mod.id}" data-title="${escapeHtml(mod.title)}"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete-module" data-module-id="${mod.id}"><i class="fas fa-trash"></i></button>
          <button class="btn-icon move-up" data-module-id="${mod.id}" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-icon move-down" data-module-id="${mod.id}" ${idx === modules.length-1 ? 'disabled' : ''}>↓</button>
        </div>
      </div>
      <div class="lessons-container" id="lessons-${mod.id}">
        <p class="loading-lessons">Carregando aulas...</p>
      </div>
      <button class="btn-neon add-lesson" data-module-id="${mod.id}" style="margin-top: 8px;">+ Adicionar Aula</button>
    </div>
  `).join('');

  // Carregar aulas para cada módulo
  for (const mod of modules) {
    await loadLessonsList(mod.id);
  }

  // Eventos de módulo
  document.querySelectorAll('.edit-module').forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleId = parseInt(btn.dataset.moduleId);
      const currentTitle = btn.dataset.title;
      editModule(courseId, moduleId, currentTitle);
    });
  });
  document.querySelectorAll('.delete-module').forEach(btn => {
    btn.addEventListener('click', async () => {
      const moduleId = parseInt(btn.dataset.moduleId);
      if (confirm('Remover este módulo? Todas as aulas serão excluídas.')) {
        await SupabaseClient.deleteModule(moduleId);
        loadModulesList(courseId);
      }
    });
  });
  document.querySelectorAll('.add-lesson').forEach(btn => {
    btn.addEventListener('click', () => {
      const moduleId = parseInt(btn.dataset.moduleId);
      addLesson(courseId, moduleId);
    });
  });

  // Reordenar módulos (seta para cima/baixo)
  const moduleItems = container.querySelectorAll('.module-item');
  moduleItems.forEach((item, idx) => {
    const upBtn = item.querySelector('.move-up');
    const downBtn = item.querySelector('.move-down');
    if (upBtn && !upBtn.disabled) {
      upBtn.addEventListener('click', async () => {
        const moduleId = parseInt(upBtn.dataset.moduleId);
        const currentOrder = idx;
        const newOrder = idx - 1;
        // atualizar ordem no banco
        const allModules = [...modules];
        const currentMod = allModules[currentOrder];
        const targetMod = allModules[newOrder];
        await SupabaseClient.updateModule(currentMod.id, { order: newOrder });
        await SupabaseClient.updateModule(targetMod.id, { order: currentOrder });
        loadModulesList(courseId);
      });
    }
    if (downBtn && !downBtn.disabled) {
      downBtn.addEventListener('click', async () => {
        const moduleId = parseInt(downBtn.dataset.moduleId);
        const currentOrder = idx;
        const newOrder = idx + 1;
        const allModules = [...modules];
        const currentMod = allModules[currentOrder];
        const targetMod = allModules[newOrder];
        await SupabaseClient.updateModule(currentMod.id, { order: newOrder });
        await SupabaseClient.updateModule(targetMod.id, { order: currentOrder });
        loadModulesList(courseId);
      });
    }
  });
}

async function loadLessonsList(moduleId) {
  const container = document.getElementById(`lessons-${moduleId}`);
  if (!container) return;
  container.innerHTML = '<p class="loading-lessons">Carregando aulas...</p>';

  const result = await SupabaseClient.getLessons(moduleId);
  if (!result.success) {
    container.innerHTML = `<p class="error">Erro: ${result.error}</p>`;
    return;
  }

  const lessons = result.data;
  if (lessons.length === 0) {
    container.innerHTML = '<p class="empty-lessons">Nenhuma aula ainda. Clique em "Adicionar Aula".</p>';
    return;
  }

  container.innerHTML = lessons.map((lesson, idx) => `
    <div class="lesson-item" data-lesson-id="${lesson.id}" data-order="${lesson.order}">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span>🎬 ${escapeHtml(lesson.title)} (${Math.floor(lesson.duration / 60)}min)</span>
        <div>
          <button class="btn-icon edit-lesson" data-lesson-id="${lesson.id}" data-title="${escapeHtml(lesson.title)}" data-duration="${lesson.duration}" data-video-url="${lesson.video_url || ''}"><i class="fas fa-edit"></i></button>
          <button class="btn-icon delete-lesson" data-lesson-id="${lesson.id}"><i class="fas fa-trash"></i></button>
          <button class="btn-icon move-up-lesson" data-lesson-id="${lesson.id}" ${idx === 0 ? 'disabled' : ''}>↑</button>
          <button class="btn-icon move-down-lesson" data-lesson-id="${lesson.id}" ${idx === lessons.length-1 ? 'disabled' : ''}>↓</button>
        </div>
      </div>
    </div>
  `).join('');

  // Eventos de aula
  document.querySelectorAll('.edit-lesson').forEach(btn => {
    btn.addEventListener('click', () => {
      const lessonId = parseInt(btn.dataset.lessonId);
      const title = btn.dataset.title;
      const duration = parseInt(btn.dataset.duration);
      const videoUrl = btn.dataset.videoUrl;
      editLesson(moduleId, lessonId, title, duration, videoUrl);
    });
  });
  document.querySelectorAll('.delete-lesson').forEach(btn => {
    btn.addEventListener('click', async () => {
      const lessonId = parseInt(btn.dataset.lessonId);
      if (confirm('Remover esta aula?')) {
        await SupabaseClient.deleteLesson(lessonId);
        loadLessonsList(moduleId);
      }
    });
  });

  // Reordenar aulas (setas)
  const lessonItems = container.querySelectorAll('.lesson-item');
  lessonItems.forEach((item, idx) => {
    const upBtn = item.querySelector('.move-up-lesson');
    const downBtn = item.querySelector('.move-down-lesson');
    if (upBtn && !upBtn.disabled) {
      upBtn.addEventListener('click', async () => {
        const lessonId = parseInt(upBtn.dataset.lessonId);
        const currentOrder = idx;
        const newOrder = idx - 1;
        const allLessons = [...lessons];
        const currentLesson = allLessons[currentOrder];
        const targetLesson = allLessons[newOrder];
        await SupabaseClient.updateLesson(currentLesson.id, { order: newOrder });
        await SupabaseClient.updateLesson(targetLesson.id, { order: currentOrder });
        loadLessonsList(moduleId);
      });
    }
    if (downBtn && !downBtn.disabled) {
      downBtn.addEventListener('click', async () => {
        const lessonId = parseInt(downBtn.dataset.lessonId);
        const currentOrder = idx;
        const newOrder = idx + 1;
        const allLessons = [...lessons];
        const currentLesson = allLessons[currentOrder];
        const targetLesson = allLessons[newOrder];
        await SupabaseClient.updateLesson(currentLesson.id, { order: newOrder });
        await SupabaseClient.updateLesson(targetLesson.id, { order: currentOrder });
        loadLessonsList(moduleId);
      });
    }
  });
}

// ========== MODAL DE CURSO ==========
function openCourseModal(courseId = null) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>${courseId ? 'Editar Curso' : 'Novo Curso'}</h3>
      <div class="form-group"><label>Título</label><input id="courseTitle" value=""></div>
      <div class="form-group"><label>Descrição</label><textarea id="courseDesc"></textarea></div>
      <div class="form-group"><label>Categoria</label><input id="courseCategory" placeholder="Ex: IA, Educação"></div>
      <div class="form-group"><label>Thumbnail URL</label><input id="courseThumbnail" placeholder="https://..."></div>
      <div class="form-actions">
        <button id="saveCourseBtn" class="btn-neon">Salvar</button>
        <button class="btn-neon cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  if (courseId) {
    // Buscar dados do curso para edição
    (async () => {
      const result = await SupabaseClient.getCourses();
      const course = result.data.find(c => c.id === courseId);
      if (course) {
        modal.querySelector('#courseTitle').value = course.title;
        modal.querySelector('#courseDesc').value = course.description || '';
        modal.querySelector('#courseCategory').value = course.category || '';
        modal.querySelector('#courseThumbnail').value = course.thumbnail || '';
      }
    })();
  }

  modal.querySelector('.cancelModalBtn').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveCourseBtn').addEventListener('click', async () => {
    const title = modal.querySelector('#courseTitle').value.trim();
    const description = modal.querySelector('#courseDesc').value.trim();
    const category = modal.querySelector('#courseCategory').value.trim();
    const thumbnail = modal.querySelector('#courseThumbnail').value.trim();

    if (!title) {
      alert('O título é obrigatório.');
      return;
    }

    const courseData = { title, description, category, thumbnail };
    if (courseId) {
      await SupabaseClient.updateCourse(courseId, courseData);
    } else {
      await SupabaseClient.createCourse(courseData);
    }
    modal.remove();
    loadCoursesList();
  });
}

// ========== MODAL DE MÓDULO ==========
function addModule(courseId) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Novo Módulo</h3>
      <div class="form-group"><label>Nome do Módulo</label><input id="moduleTitle"></div>
      <div class="form-actions">
        <button id="saveModuleBtn" class="btn-neon">Criar</button>
        <button class="btn-neon cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancelModalBtn').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveModuleBtn').addEventListener('click', async () => {
    const title = modal.querySelector('#moduleTitle').value.trim();
    if (!title) {
      alert('Nome do módulo é obrigatório.');
      return;
    }
    // Obter o maior order atual + 1
    const modulesResult = await SupabaseClient.getModules(courseId);
    const order = modulesResult.success ? modulesResult.data.length : 0;
    await SupabaseClient.createModule({ course_id: courseId, title, order });
    modal.remove();
    loadModulesList(courseId);
  });
}

function editModule(courseId, moduleId, currentTitle) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar Módulo</h3>
      <div class="form-group"><label>Nome</label><input id="moduleTitle" value="${escapeHtml(currentTitle)}"></div>
      <div class="form-actions">
        <button id="saveModuleBtn" class="btn-neon">Salvar</button>
        <button class="btn-neon cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancelModalBtn').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveModuleBtn').addEventListener('click', async () => {
    const title = modal.querySelector('#moduleTitle').value.trim();
    if (!title) return;
    await SupabaseClient.updateModule(moduleId, { title });
    modal.remove();
    loadModulesList(courseId);
  });
}

// ========== MODAL DE AULA ==========
function addLesson(courseId, moduleId) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Nova Aula</h3>
      <div class="form-group"><label>Título</label><input id="lessonTitle"></div>
      <div class="form-group"><label>Duração (segundos)</label><input id="lessonDuration" value="300" type="number"></div>
      <div class="form-group"><label>URL do Vídeo</label><input id="lessonUrl" value="https://www.w3schools.com/html/mov_bbb.mp4"></div>
      <div class="form-actions">
        <button id="saveLessonBtn" class="btn-neon">Criar</button>
        <button class="btn-neon cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancelModalBtn').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveLessonBtn').addEventListener('click', async () => {
    const title = modal.querySelector('#lessonTitle').value.trim();
    const duration = parseInt(modal.querySelector('#lessonDuration').value);
    const videoUrl = modal.querySelector('#lessonUrl').value.trim();
    if (!title) {
      alert('Título da aula é obrigatório.');
      return;
    }
    // Obter maior order
    const lessonsResult = await SupabaseClient.getLessons(moduleId);
    const order = lessonsResult.success ? lessonsResult.data.length : 0;
    await SupabaseClient.createLesson({ module_id: moduleId, title, duration, video_url: videoUrl, order });
    modal.remove();
    loadLessonsList(moduleId);
  });
}

function editLesson(moduleId, lessonId, currentTitle, currentDuration, currentVideoUrl) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h3>Editar Aula</h3>
      <div class="form-group"><label>Título</label><input id="lessonTitle" value="${escapeHtml(currentTitle)}"></div>
      <div class="form-group"><label>Duração (segundos)</label><input id="lessonDuration" value="${currentDuration}" type="number"></div>
      <div class="form-group"><label>URL do Vídeo</label><input id="lessonUrl" value="${escapeHtml(currentVideoUrl)}"></div>
      <div class="form-actions">
        <button id="saveLessonBtn" class="btn-neon">Salvar</button>
        <button class="btn-neon cancelModalBtn">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.querySelector('.cancelModalBtn').addEventListener('click', () => modal.remove());
  modal.querySelector('#saveLessonBtn').addEventListener('click', async () => {
    const title = modal.querySelector('#lessonTitle').value.trim();
    const duration = parseInt(modal.querySelector('#lessonDuration').value);
    const videoUrl = modal.querySelector('#lessonUrl').value.trim();
    await SupabaseClient.updateLesson(lessonId, { title, duration, video_url: videoUrl });
    modal.remove();
    loadLessonsList(moduleId);
  });
}

// Função auxiliar para escapar HTML (evitar XSS)
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ========== CATEGORIAS ==========
function renderCategoriesManager(container) {
  container.innerHTML = `
    <div class="admin-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <h2><i class="fas fa-tags"></i> Gerenciar Categorias</h2>
        <button id="newCategoryBtn" class="btn-neon"><i class="fas fa-plus"></i> Nova Categoria</button>
      </div>
      <div id="categoriesList"></div>
    </div>
  `;
  renderCategoriesList();
  document.getElementById('newCategoryBtn').addEventListener('click', () => addCategory());
}

function renderCategoriesList() {
  const container = document.getElementById('categoriesList');
  container.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Categoria</th><th>Ações</th></tr></thead>
      <tbody>
        ${categoriesData.filter(c => c !== 'Todos').map(cat => `
          <tr>
            <td>${cat}</td>
            <td><button class="btn-icon" data-cat="${cat}" data-action="deleteCat"><i class="fas fa-trash"></i></button></td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
  document.querySelectorAll('[data-action="deleteCat"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const cat = btn.dataset.cat;
      if (confirm(`Remover categoria "${cat}"?`)) {
        categoriesData = categoriesData.filter(c => c !== cat);
        await saveToStore('admin_categories', categoriesData);
        renderCategoriesManager(document.getElementById('adminContent'));
      }
    });
  });
}

function addCategory() {
  const name = prompt('Nome da nova categoria:');
  if (name && !categoriesData.includes(name)) {
    categoriesData.push(name);
    saveToStore('admin_categories', categoriesData);
    renderCategoriesManager(document.getElementById('adminContent'));
  }
}