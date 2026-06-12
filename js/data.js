// ========== DADOS ESTÁTICOS FALLBACK ==========
const defaultApps = [
  { 
    id: 1, 
    name: "LabEscrita", 
    icon: "assets/apps/LabEscrita/icon.png",
    desc: "Analise seu texto, detecte fragilidades acadêmicas, e evolua como escritor científico.",
    longDesc: "O foco não é apenas corrigir o texto. É formar o escritor acadêmico. O sistema aprende com seus textos, identifica padrões de fragilidade (falta de problema de pesquisa, excesso de citação, artificialidade, etc.) e oferece microaulas, exemplos e exercícios personalizados. Ideal para estudantes, pesquisadores e profissionais que querem aprimorar suas habilidades de escrita científica. O LabEscrita é seu parceiro de escrita, ajudando a transformar ideias em textos mais claros, coerentes e impactantes.",
    category: "Educação",
    tags: ["Escrita acadêmica", "Tecnologia", "Texto científico"],
    technologies: ["TensorFlow.js", "WebAssembly", "IndexedDB"],
    screenshots: [
      "assets/apps/LabEscrita/screenshot1.png",
      "assets/apps/LabEscrita/screenshot2.png",
      "assets/apps/LabEscrita/screenshot3.png"
    ],
    version: "2.1.0",
    changelog: "Adicionado suporte a leitura de tela e novos desafios.",
    badge: "Novo",
    url: "https://enocram.github.io/LabEscritaIA/",
    favorite: false,
    insights: [
    "✍️ O LabEscrita pode ajudar a transformar ideias em textos mais organizados e estruturados.",
    "🧠 Experimente utilizar diferentes propostas de escrita para ampliar sua criatividade.",
    "📚 A escrita assistida pode apoiar processos de aprendizagem, planejamento e produção acadêmica.",
    "🚀 Pequenos ajustes no texto podem gerar grandes melhorias na clareza da comunicação.",
    "🎯 Utilize o LabEscrita para explorar novas formas de desenvolver conteúdos educacionais.",
    "💡 A prática constante de escrita fortalece argumentação, interpretação e expressão de ideias.",
    "🔍 Revise seus textos com atenção e descubra oportunidades de aprimoramento.",
    "📖 Produções bem estruturadas facilitam a compreensão do leitor.",
    "⚡ O laboratório foi pensado para tornar o processo de escrita mais leve e produtivo.",
    "🌱 Cada nova versão do seu texto é uma oportunidade de evolução."
  ]
  },
  { 
    id: 2, 
    name: "YES - Inglês com a Bíblia", 
    icon: "assets/apps/yes-ingles-coma-a-biblia/icon.png",
    desc: "Aprenda inglês enquanto estuda a Bíblia.",
    longDesc: "Lições práticas, com direções espirituais específicas e reflexões que te aproximam mais de Deus. Você aprenderá para si, e para compartilhar a mensagem de salvação com outras pessoas onde você estiver. Comece agora a sua jornada!",
    category: "Educação",
    tags: ["Leitura", "Espiritualidade", "Idiomas"],
    technologies: ["SpeechSynthesis", "Web Speech API"],
    screenshots: [
      "assets/apps/yes-ingles-coma-a-biblia/screenshot1.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot2.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot3.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot4.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot5.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot6.png",
      "assets/apps/yes-ingles-coma-a-biblia/screenshot7.png"
    ],
    version: "1.3.0",
    changelog: "Melhorias na velocidade de leitura.",
    badge: "Atualizado",
    url: "https://eduplaymsi.github.io/YES_Your-English-School_by_Marcone-Arruda/",
    favorite: false,
    insights: [
  "🇺🇸 Aprender inglês vai muito além da tradução: envolve comunicação e novas possibilidades.",
  "🎧 A exposição frequente ao idioma ajuda no desenvolvimento da escuta e da compreensão.",
  "🗣️ Praticar pequenas conversas diariamente pode acelerar sua evolução.",
  "🌎 O inglês pode ampliar oportunidades acadêmicas, profissionais e culturais.",
  "📚 Cada novo vocabulário aprendido aumenta sua autonomia no idioma.",
  "🚀 O progresso acontece de forma gradual. Consistência vale mais que velocidade.",
  "🎯 Estabelecer metas simples pode tornar o aprendizado mais motivador.",
  "💬 Tente utilizar expressões aprendidas em situações reais do dia a dia.",
  "🧠 Aprender um novo idioma também estimula diferentes habilidades cognitivas.",
  "🌟 A fluência é construída por meio de experiências contínuas de uso da língua."
  ]
  },
  { 
    id: 3, 
    name: "VivaLAÇO", 
    icon: "assets/apps/VivaLAÇO/icon.png",
    desc: "Suporte a pessoas com Alzheimer, focado em rotina, memória, emoção e conexão familiar.",
    longDesc: "Desenvolvido para aproximar pessoas com Alzheimer de suas rotinas e memórias. O VivaLAÇO oferece recursos de lembretes personalizados, estímulos à memória afetiva, e ferramentas de comunicação simplificada para fortalecer os laços familiares. Com uma interface intuitiva e adaptada, o aplicativo busca promover autonomia, conforto e conexão emocional, tanto para os usuários quanto para seus cuidadores e familiares. Ideal para quem deseja oferecer um suporte digital humanizado e eficaz para pessoas com Alzheimer.",
    category: "Saúde",
    tags: ["Comunicação", "Memória", "Alzheimer"],
    technologies: ["Canvas", "LocalStorage"],
    screenshots: [
      "assets/apps/VivaLAÇO/screenshot1.png",
      "assets/apps/VivaLAÇO/screenshot2.png",
      "assets/apps/VivaLAÇO/screenshot3.png"
    ],
    version: "1.0.0",
    changelog: "Lançamento inicial.",
    badge: "Beta",
    url: "https://eduplaymsi.github.io/VivaLaco/",
    favorite: false,
    insights: [
  "🎗️ Informação acessível pode fortalecer redes de apoio e acolhimento.",
  "💙 Compartilhar conhecimento ajuda a ampliar a conscientização sobre diferentes realidades.",
  "🤝 O cuidado começa pela escuta e pela compreensão das necessidades de cada pessoa.",
  "🌱 Pequenas ações podem gerar impactos significativos na qualidade de vida.",
  "📘 Conhecimento confiável contribui para decisões mais seguras e conscientes.",
  "🧩 Cada pessoa possui características, experiências e necessidades únicas.",
  "✨ A inclusão acontece quando diferentes formas de participação são valorizadas.",
  "💡 Recursos digitais podem apoiar famílias, profissionais e comunidades.",
  "🌎 Construir ambientes mais acessíveis beneficia a todos.",
  "❤️ Informação, empatia e acolhimento caminham juntos."
  ]
  },
  { 
    id: 4, 
    name: "Cobrei?", 
    icon: "assets/apps/cobrei/icon.png",
    desc: "Organize cobranças, acompanhe pagamentos e simplifique sua gestão financeira.",
    longDesc: "O Cobrei? foi pensado para quem realmente movimenta o fluxo financeiro regional, para prestadores de serviço, freelancers e MEIs, que reduz inadimplência e trabalho mental de cobrança ao automatizar lembretes, organizar clientes, registrar status de pagamentos e gerar mensagens prontas para follow-up. O Cobrei? é uma solução prática para quem quer manter as finanças em dia sem complicação, focando no que realmente importa: seu trabalho e seus clientes.",
    category: "Finanças",
    tags: ["Gestão financeira", "Finanças", "Empreendedorismo"],
    technologies: ["Three.js", "WebXR"],
    screenshots: [
      "assets/apps/cobrei/screenshot1.png",
      "assets/apps/cobrei/screenshot2.png",
      "assets/apps/cobrei/screenshot3.png"
    ],
    version: "0.9.0",
    changelog: "Compatibilidade com dispositivos móveis.",
    badge: "Experimental",
    url: "https://eduplaymsi.github.io/Cobrei/",
    favorite: false,
    insights: [
  "💰 Organizar cobranças pode ajudar a manter processos financeiros mais saudáveis.",
  "📊 Acompanhar pagamentos em tempo real facilita a tomada de decisões.",
  "⚡ Automatizar tarefas reduz retrabalho e aumenta produtividade.",
  "📈 Uma gestão financeira organizada contribui para o crescimento sustentável.",
  "🤖 Recursos inteligentes podem simplificar rotinas operacionais.",
  "🔔 Lembretes automáticos ajudam a reduzir esquecimentos e atrasos.",
  "📋 Informações centralizadas tornam o acompanhamento mais eficiente.",
  "🎯 Processos claros favorecem uma comunicação mais objetiva com clientes.",
  "🚀 Menos tempo com tarefas repetitivas significa mais foco em atividades estratégicas.",
  "📉 A organização preventiva pode reduzir problemas futuros relacionados à inadimplência."
  ]
  },
  { 
    id: 5, 
    name: "SYNCORE", 
    icon: "assets/apps/syncore/icon.png",
    desc: "Um espaço de trabalho neural onde projetos e conhecimento se conectam.",
    longDesc: "Desenvolvedores e líderes técnicos; Gerentes de produto e times ágeis; Freelancers e empreendedores solo; Entusiastas de IA e pesquisadores.",
    category: "Tecnologia Assistiva",
    tags: ["CRUD", "PWA"],
    technologies: ["JavaScript", "CSS Grid"],
    screenshots: [
      "assets/apps/syncore/screenshot1.png",
      "assets/apps/syncore/screenshot2.png",
      "assets/apps/syncore/screenshot3.png"
    ],
    version: "1.2.0",
    changelog: "Layout para para todos os dispositivos.",
    badge: "Novo",
    url: "https://enocram.github.io/SYNCORE/",
    favorite: false
  }
];

// Cursos padrão agora no formato esperado pelo player (com módulos e aulas)
const defaultCourses = [
  {
    id: 101,
    title: "IA na Educação Especial",
    description: "Ferramentas e práticas com IA para inclusão",
    modules: [
      {
        id: 1,
        title: "Fundamentos de IA",
        lessons: [
          { id: 1011, title: "O que é IA?", duration: 185, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 },
          { id: 1012, title: "Machine Learning básico", duration: 220, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      },
      {
        id: 2,
        title: "Aplicações na Educação Especial",
        lessons: [
          { id: 1021, title: "IA para autismo", duration: 240, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 },
          { id: 1022, title: "Ferramentas assistivas", duration: 195, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      }
    ],
    progress: 35
  },
  {
    id: 102,
    title: "Tecnologia Assistiva Avançada",
    description: "Hardware e software adaptativo",
    modules: [
      {
        id: 1,
        title: "Introdução à TA",
        lessons: [
          { id: 2011, title: "O que é Tecnologia Assistiva?", duration: 150, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      },
      {
        id: 2,
        title: "Hardware Adaptativo",
        lessons: [
          { id: 2021, title: "Teclados e mouses especiais", duration: 180, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      }
    ],
    progress: 10
  },
  {
    id: 103,
    title: "Design Inclusivo e Acessibilidade",
    description: "Criação de produtos para todos",
    modules: [
      {
        id: 1,
        title: "Princípios do Design Universal",
        lessons: [
          { id: 3011, title: "O que é Design Inclusivo?", duration: 160, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      }
    ],
    progress: 20
  },
  {
    id: 104,
    title: "Neurociência e Aprendizagem",
    description: "Como o cérebro aprende",
    modules: [
      {
        id: 1,
        title: "Fundamentos da Neurociência",
        lessons: [
          { id: 4011, title: "Introdução ao cérebro", duration: 200, videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", completed: false, watchedSeconds: 0 }
        ]
      }
    ],
    progress: 0
  }
];

const defaultCategories = ["Todos", "IA", "Inclusão", "Tecnologia Assistiva", "Educação", "Ferramentas"];

// ========== INICIALIZAÇÃO DO AppData ==========
window.AppData = {
  apps: [],
  categories: [...defaultCategories],
  courses: [],
  userProgress: { favorites: [], completedCourses: [] }
};

// Função auxiliar para ler todas as entradas de uma store no IndexedDB
async function getAllFromStore(storeName) {
  if (!window.EduDB) return [];
  try {
    const db = await window.EduDB.openDatabase();
    if (!db.objectStoreNames.contains(storeName)) return [];
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (e) {
    console.warn(`Erro ao ler store ${storeName}:`, e);
    return [];
  }
}

// Carregar dados dinâmicos (do admin) ou usar fallback
(async function loadDynamicData() {
  try {
    if (window.EduDB) {
      await window.EduDB.openDatabase();
      
      // Apps
      const savedApps = await getAllFromStore('admin_apps');
      if (savedApps && savedApps.length > 0) {
        window.AppData.apps = savedApps;
      } else {
        window.AppData.apps = [...defaultApps];
      }
      
      // Cursos
      const savedCourses = await getAllFromStore('admin_courses');
      if (savedCourses && savedCourses.length > 0) {
        window.AppData.courses = savedCourses;
      } else {
        window.AppData.courses = [...defaultCourses];
      }
      
      // Categorias
      const savedCats = await getAllFromStore('admin_categories');
      if (savedCats && savedCats.length > 0) {
        if (!savedCats.includes('Todos')) savedCats.unshift('Todos');
        window.AppData.categories = savedCats;
      } else {
        window.AppData.categories = [...defaultCategories];
      }
    } else {
      // Fallback se EduDB não existir
      window.AppData.apps = [...defaultApps];
      window.AppData.courses = [...defaultCourses];
      window.AppData.categories = [...defaultCategories];
    }
    console.log('Dados carregados dinamicamente:', window.AppData);
  } catch(e) {
    console.warn('Erro ao carregar dados dinâmicos, usando fallback estático', e);
    window.AppData.apps = [...defaultApps];
    window.AppData.courses = [...defaultCourses];
    window.AppData.categories = [...defaultCategories];
  }
})();