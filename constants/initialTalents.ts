import { CandidateProfile, LocalJob } from '../types';

export const INITIAL_CANDIDATES_360: CandidateProfile[] = [
  {
    id: 'cand-init-01',
    name: 'Lucas Mendonça Arantes',
    headline: 'Engenheiro de Software Frontend Sênior | React, Next.js & TypeScript',
    location: {
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Engenheiro de software com mais de 7 anos de experiência focado na construção de arquiteturas web resilientes e de alta performance. Liderou a refatoração do core checkout de fintech líder em SP, reduzindo o LCP em 42% e alavancando a taxa de conversão em 18%. Amplo domínio de micro-frontends, design systems e testes automatizados.',
    skills: ['React 19', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest & RTL', 'Design Systems', 'CI/CD'],
    experienceHighlights: [
      'Tech Lead Frontend na Vanguarda Pagamentos (2022 - Atual): Conduziu equipe de 6 engenheiros na migração de legado SPA para Next.js com SSR/ISR.',
      'Engenheiro Frontend Sênior no Banco Neon (2019 - 2022): Otimizou web vitals do portal de investimentos, reduzindo churn de transações móveis em 24%.'
    ],
    education: 'Bacharelado em Engenharia de Computação - USP (Poli-USP)',
    contactInfo: {
      email: 'lucas.arantes.dev@gmail.com',
      phone: '(11) 98744-1290',
      linkedin: 'https://linkedin.com/in/lucas-arantes-frontend',
      portfolio: 'https://lucasarantes.tech'
    },
    sourceUrls: [
      { title: 'Perfil Profissional no LinkedIn', uri: 'https://linkedin.com/in/lucas-arantes-frontend' },
      { title: 'Portfólio & GitHub Técnico', uri: 'https://github.com/lucas-arantes' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 98,
    portalSource: 'LinkedIn',
    requiresAuth: false,
    authenticatedDirectUrl: 'https://linkedin.com/in/lucas-arantes-frontend',
    fullCvText: `## Lucas Mendonça Arantes ##
Engenheiro de Software Frontend Sênior | React, Next.js & TypeScript
São Paulo - SP (Pinheiros) | lucas.arantes.dev@gmail.com | (11) 98744-1290

### Resumo Executivo ###
Engenheiro Frontend com 7+ anos de trajetória sólida no ecossistema JavaScript/TypeScript, especializado no ecossistema React, Next.js e escalabilidade de interfaces ricas. Histórico comprovado de impacto quantificável em grandes plataformas de tecnologia financeira e e-commerce de alto tráfego.

### Competências Técnicas ###
- Frontend Core: React, Next.js, TypeScript, JavaScript Moderno (ES6+), HTML5 Semântico, CSS3 / PostCSS
- UI & Styling: Tailwind CSS, Radix UI, Styled Components, Motion, Figma Tokens
- Gestão de Estado & Dados: React Query (TanStack), Zustand, Redux Toolkit, GraphQL (Apollo), REST APIs
- Qualidade & Performance: Jest, Testing Library, Playwright, Core Web Vitals, Bundle Optimization
- DevOps & Cloud: Git, GitHub Actions, Docker, Vercel, AWS S3/CloudFront

### Experiência Profissional ###
**Tech Lead Frontend | Vanguarda Pagamentos (Fintech)** (2022 - Presente)
- Arquitetei a nova esteira de checkout unificado em Next.js e TypeScript, atendendo a mais de 4,2 milhões de requisições mensais com disponibilidade de 99,98%.
- Reduzi o Largest Contentful Paint (LCP) de 3.8s para 1.4s através de code-splitting e streaming SSR.
- Estabeleci o Design System corporativo em monorepo Turborepo, diminuindo o tempo de entrega de novas features pelas squads em 35%.

**Engenheiro Frontend Sênior | Banco Neon** (2019 - 2022)
- Desenvolvi dashboards de investimentos e custódia com gráficos interativos e streaming WebSocket em tempo real.
- Aumentou a cobertura de testes automatizados de 41% para 89%, zerando bugs regressivos em produção por 4 trimestres consecutivos.

### Formação Acadêmica ###
- Bacharelado em Engenharia de Computação - Universidade de São Paulo (Poli-USP, 2014 - 2019)
- Certificação AWS Certified Cloud Practitioner`
  },
  {
    id: 'cand-init-02',
    name: 'Mariana Duarte Vasconcelos',
    headline: 'Desenvolvedora React & Node.js Pleno | Full Stack & Sourcing Catho VIP',
    location: {
      neighborhood: 'Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Desenvolvedora Full Stack com 4 anos de experiência prática desenvolvendo aplicações escaláveis com React, TypeScript, Node.js e PostgreSQL. Foco em arquitetura limpa, segurança de APIs e experiência do usuário com interface responsiva.',
    skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'Prisma ORM', 'Zustand', 'Sass'],
    experienceHighlights: [
      'Desenvolvedora React Pleno na Stefanini IT (2021 - Atual): Atuação direta em squad ágil internacional, criando portais B2B corporativos.',
      'Desenvolvedora Frontend Júnior na Totvs (2020 - 2021): Desenvolvimento de módulos de ERP web com React e Redux.'
    ],
    education: 'Tecnólogo em Análise e Desenvolvimento de Sistemas - FATEC-SP',
    contactInfo: {
      email: 'mariana.vasconcelos.ti@outlook.com',
      phone: '(11) 97652-3310',
      linkedin: 'https://linkedin.com/in/mariana-vasconcelos-dev',
      portfolio: 'https://marianavasconcelos.dev'
    },
    sourceUrls: [
      { title: 'Currículo Verificado Catho VIP', uri: 'https://www.catho.com.br/curriculos/buscar?q=React&cidade=Sao+Paulo' },
      { title: 'Perfil LinkedIn Profissional', uri: 'https://linkedin.com/in/mariana-vasconcelos-dev' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 94,
    portalSource: 'Catho',
    requiresAuth: true,
    authenticatedDirectUrl: 'https://www.catho.com.br/curriculos/buscar?q=React&cidade=Sao+Paulo',
    fullCvText: `## Mariana Duarte Vasconcelos ##
Desenvolvedora React & Node.js Pleno | Full Stack
São Paulo - SP (Vila Mariana) | mariana.vasconcelos.ti@outlook.com | (11) 97652-3310

### Resumo Executivo ###
Profissional analítica com sólida atuação no desenvolvimento de sistemas web end-to-end. Capacidade comprovada de entrega de projetos com código limpo, documentação rigorosa e alinhamento com metodologias ágeis (Scrum/Kanban).

### Competências Principais ###
- Frontend: React, TypeScript, JavaScript, Context API, Zustand, Tailwind CSS, Material UI
- Backend: Node.js, Express, Fastify, NestJS, Prisma, TypeORM
- Banco de Dados: PostgreSQL, MySQL, Redis, MongoDB
- Ferramentas: Docker, Git, Postman, Jest, Swagger

### Experiência Profissional ###
**Desenvolvedora React Pleno | Stefanini IT Solutions** (2021 - Atual)
- Desenvolveu módulos de autoatendimento e telemetria para cliente multinacional de telecomunicações.
- Integrou fluxos de autenticação OAuth2 e JWT com microsserviços em Node.js e RabbitMQ.
- Reduziu a carga de suporte técnico ao cliente em 28% devido à simplificação dos fluxos de interface.

**Desenvolvedora Frontend Júnior | TOTVS** (2020 - 2021)
- Codificou mais de 40 componentes reutilizáveis para o sistema de gestão hospitalar.
- Conduziu testes unitários com Jest e RTL elevando a robustez dos formulários de triagem médica.

### Formação Acadêmica ###
- Tecnólogo em Análise e Desenvolvimento de Sistemas - FATEC-SP (2018 - 2021)`
  },
  {
    id: 'cand-init-03',
    name: 'Guilherme Siqueira Rocha',
    headline: 'Especialista Frontend & Tech Lead | Arquitetura de Design Systems & Microfrontends',
    location: {
      neighborhood: 'Itaim Bibi',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Arquiteto Frontend com 10 anos de experiência em ecossistemas de larga escala. Liderou a consolidação de Design System multiplataforma em empresa de mobilidade urbana com 12 squads simultâneas. Expert em performance WebGL, SSR e governança de código.',
    skills: ['React', 'Next.js', 'Design Systems', 'Microfrontends', 'Webpack 5 / Vite', 'Performance Web', 'Storybook', 'Kubernetes'],
    experienceHighlights: [
      'Staff Frontend Engineer na Loggi (2021 - Atual): Governança da plataforma web e arquiteto do Design System corporativo.',
      'Senior Frontend Engineer na 99 / DiDi (2017 - 2021): Engenharia dos portais de motoristas e frotas corporativas.'
    ],
    education: 'Bacharelado em Ciência da Computação - UNICAMP | MBA em Arquitetura de Software - FIAP',
    contactInfo: {
      email: 'guilherme.siqueira.arch@gmail.com',
      phone: '(11) 98123-9080',
      linkedin: 'https://linkedin.com/in/guilherme-siqueira-tech',
      portfolio: 'https://guilhermesiqueira.io'
    },
    sourceUrls: [
      { title: 'Perfil GitHub & Repositórios', uri: 'https://github.com/guilherme-rocha-arch' },
      { title: 'Palestra Frontend SP no YouTube', uri: 'https://youtube.com' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 96,
    portalSource: 'Web 360°',
    requiresAuth: false,
    authenticatedDirectUrl: 'https://linkedin.com/in/guilherme-siqueira-tech',
    fullCvText: `## Guilherme Siqueira Rocha ##
Especialista Frontend & Tech Lead | Arquitetura de Design Systems & Microfrontends
São Paulo - SP (Itaim Bibi) | guilherme.siqueira.arch@gmail.com | (11) 98123-9080

### Resumo Executivo ###
Arquiteto de Software Frontend focado em eficiência de engenharia, governança técnica e experiência do usuário em larga escala. Mentor de mais de 30 engenheiros de software e palestrante ativo em conferências de tecnologia.

### Realizações de Destaque ###
- Concepção e implantação do Design System corporativo adotado por 12 squads independentes.
- Arquitetura de Microfrontends com Module Federation (Webpack 5), possibilitando deploys autônomos e desacoplamento de entregas.
- Otimização algorítmica de renderização de mapas vetoriais em tempo real no browser.`
  },
  {
    id: 'cand-init-04',
    name: 'Camila Fernandes Silveira',
    headline: 'Desenvolvedora Frontend React Júnior/Pleno | Empregos.com.br VIP',
    location: {
      neighborhood: 'Santo Amaro',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Desenvolvedora Frontend com 2 anos e meio de atuação prática construindo interfaces limpas, semânticas e acessíveis (WCAG 2.1). Conhecimento prático em React, Redux Toolkit, Tailwind CSS e consumo de APIs REST.',
    skills: ['React', 'JavaScript', 'HTML5 & CSS3', 'Tailwind CSS', 'Redux Toolkit', 'Acessibilidade WCAG', 'Git'],
    experienceHighlights: [
      'Desenvolvedora Frontend na WebJump (2022 - Atual): Implementação de interfaces de e-commerce e temas modernos.',
      'Estagiária de Desenvolvimento Web na Agência Wunderman (2021 - 2022): Landing pages responsivas de alta conversão.'
    ],
    education: 'Graduação em Sistemas de Informação - Universidade Anhembi Morumbi',
    contactInfo: {
      email: 'camila.fernandes.front@gmail.com',
      phone: '(11) 99432-8821',
      linkedin: 'https://linkedin.com/in/camila-fernandes-dev',
      portfolio: 'https://camilafernandes.dev.br'
    },
    sourceUrls: [
      { title: 'Currículo Salvo Empregos.com.br', uri: 'https://www.empregos.com.br/curriculos/React/Sao+Paulo-SP' },
      { title: 'LinkedIn Profissional', uri: 'https://linkedin.com/in/camila-fernandes-dev' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 91,
    portalSource: 'Empregos.com.br',
    requiresAuth: true,
    authenticatedDirectUrl: 'https://www.empregos.com.br/curriculos/React/Sao+Paulo-SP',
    fullCvText: `## Camila Fernandes Silveira ##
Desenvolvedora Frontend React Júnior/Pleno
São Paulo - SP (Santo Amaro) | camila.fernandes.front@gmail.com | (11) 99432-8821

### Resumo Profissional ###
Desenvolvedora dedicada, orientada a detalhes e apaixonada por UI/UX acessível. Comprometida com o aperfeiçoamento contínuo e boas práticas de código limpo.`
  },
  {
    id: 'cand-init-05',
    name: 'Rafael Bittencourt Carvalho',
    headline: 'Engenheiro de Software Frontend Sênior | React Native & React Web',
    location: {
      neighborhood: 'Moema',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Engenheiro Frontend sênior com 6 anos de experiência em aplicações multiplataforma (Web e Mobile com React e React Native). Especialista em animações com Reanimated e Framer Motion, GraphQL e offline-first architectures.',
    skills: ['React', 'React Native', 'TypeScript', 'GraphQL', 'Framer Motion', 'Zustand', 'Firebase', 'AWS'],
    experienceHighlights: [
      'Engenheiro Frontend Sênior na QuintoAndar (2021 - Atual): Squad de locação residencial, melhorando taxa de agendamento de visitas em 31%.',
      'Desenvolvedor Mobile & Web na iFood (2018 - 2021): Features de checkout e pagamentos no app de entregadores.'
    ],
    education: 'Bacharelado em Engenharia de Software - PUC-SP',
    contactInfo: {
      email: 'rafael.bittencourt.dev@gmail.com',
      phone: '(11) 98855-4412',
      linkedin: 'https://linkedin.com/in/rafael-bittencourt-tech',
      portfolio: 'https://rafael-bittencourt.vercel.app'
    },
    sourceUrls: [
      { title: 'Perfil Gupy Banco de Talentos', uri: 'https://portal.gupy.io' },
      { title: 'GitHub & Projetos Open Source', uri: 'https://github.com/rafa-bittencourt' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 95,
    portalSource: 'Gupy',
    requiresAuth: false,
    authenticatedDirectUrl: 'https://linkedin.com/in/rafael-bittencourt-tech',
    fullCvText: `## Rafael Bittencourt Carvalho ##
Engenheiro de Software Frontend Sênior | React Native & React Web
São Paulo - SP (Moema) | rafael.bittencourt.dev@gmail.com | (11) 98855-4412

### Resumo Executivo ###
Engenheiro multidisciplinar com ampla experiência no ecossistema mobile e web. Especialista em performance gráfica, offline-first e integração com APIs complexas.`
  },
  {
    id: 'cand-init-06',
    name: 'Beatriz Almeida Prado',
    headline: 'Desenvolvedora Frontend Pleno | React, TypeScript & Testes E2E (Cypress)',
    location: {
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    summary: 'Desenvolvedora Frontend com foco em escalabilidade, testes automatizados e design system. Experiência de 4 anos no setor de saúde suplementar e telemedicina, garantindo compliance de dados sensíveis e acessibilidade.',
    skills: ['React', 'TypeScript', 'Next.js', 'Cypress', 'Jest', 'Chakra UI', 'GitFlow', 'Agile'],
    experienceHighlights: [
      'Desenvolvedora Frontend Pleno na Dasa Saúde (2022 - Atual): Criação da plataforma de laudos médicos online com visualização instantânea.',
      'Desenvolvedora Web na SulAmérica (2020 - 2022): Portal de teleconsulta para mais de 1 milhão de segurados.'
    ],
    education: 'Bacharelado em Ciência da Computação - Universidade Presbiteriana Mackenzie',
    contactInfo: {
      email: 'beatriz.prado.tech@gmail.com',
      phone: '(11) 97120-7744',
      linkedin: 'https://linkedin.com/in/beatriz-prado-frontend',
      portfolio: 'https://beatrizprado.io'
    },
    sourceUrls: [
      { title: 'Perfil Profissional no InfoJobs', uri: 'https://www.infojobs.com.br' },
      { title: 'LinkedIn Pessoal', uri: 'https://linkedin.com/in/beatriz-prado-frontend' }
    ],
    status: 'Novo',
    addedAt: new Date().toISOString(),
    matchScore: 93,
    portalSource: 'InfoJobs',
    requiresAuth: false,
    authenticatedDirectUrl: 'https://linkedin.com/in/beatriz-prado-frontend',
    fullCvText: `## Beatriz Almeida Prado ##
Desenvolvedora Frontend Pleno | React, TypeScript & Testes E2E
São Paulo - SP (Bela Vista) | beatriz.prado.tech@gmail.com | (11) 97120-7744

### Resumo Profissional ###
Desenvolvedora de software com vivência em projetos críticos de saúde digital. Rigor analítico com testes de integração e foco total na estabilidade do usuário final.`
  }
];

export const INITIAL_JOBS_360: LocalJob[] = [
  {
    id: 'job-init-01',
    title: 'Desenvolvedor Frontend Sênior (React / Next.js)',
    company: 'Nubank Brasil',
    location: {
      neighborhood: 'Pinheiros',
      city: 'São Paulo',
      state: 'SP',
    },
    workModel: 'Híbrido',
    salaryOrRange: 'R$ 14.000 - R$ 18.500 CLT + Benefícios',
    description: 'Buscamos Engenheiro(a) de Software Frontend Sênior para compor a tribo de Core Experience e cartões. Você será responsável por liderar decisões arquiteturais, manter altos padrões de código e otimizar a experiência de milhões de clientes diariamente.',
    requirements: [
      'Sólida experiência com React, TypeScript e Next.js em produção',
      'Domínio de testes automatizados unitários e de integração (Jest, Testing Library)',
      'Experiência prévia em arquitetura de microsserviços ou microfrontends',
      'Conhecimento de boas práticas de segurança e performance Web Vitals'
    ],
    sourceUrls: [
      { title: 'Vaga Oficial no LinkedIn Nubank', uri: 'https://linkedin.com/company/nubank' },
      { title: 'Página de Carreiras Nubank', uri: 'https://nubank.com.br/carreiras' }
    ],
    applyUrlOrContact: 'https://nubank.com.br/carreiras',
    portalSource: 'LinkedIn',
    requiresAuth: false,
  },
  {
    id: 'job-init-02',
    title: 'Especialista React / Tech Lead Frontend',
    company: 'Mercado Livre (Mercado Pago)',
    location: {
      neighborhood: 'Osasco / Região Oeste',
      city: 'São Paulo',
      state: 'SP',
    },
    workModel: 'Híbrido',
    salaryOrRange: 'R$ 17.000 - R$ 22.000 + Bônus Semestral',
    description: 'Oportunidade para atuar como referência técnica na engenharia de pagamentos e checkout do maior ecossistema de e-commerce da América Latina. Foco em escalabilidade, observabilidade e governança de Design System.',
    requirements: [
      'Mais de 7 anos de experiência com desenvolvimento frontend e liderança técnica',
      'Domínio avançado de React, TypeScript, GraphQL, Webpack/Vite e monorepos (Turborepo)',
      'Experiência com alta concorrência e plataformas de missão crítica',
      'Habilidade em mentoria e desenvolvimento de times de alta performance'
    ],
    sourceUrls: [
      { title: 'Anúncio Direto Catho VIP', uri: 'https://www.catho.com.br' }
    ],
    applyUrlOrContact: 'https://mercadolivre.com.br/carreiras',
    portalSource: 'Catho',
    requiresAuth: true,
  },
  {
    id: 'job-init-03',
    title: 'Desenvolvedor Frontend Pleno (React & Tailwind CSS)',
    company: 'Totvs Lab',
    location: {
      neighborhood: 'Santana',
      city: 'São Paulo',
      state: 'SP',
    },
    workModel: 'Home Office',
    salaryOrRange: 'R$ 8.500 - R$ 11.000 CLT',
    description: 'Integrar a equipe de inovação da TOTVS construindo interfaces modernas e responsivas para o portfólio de produtos SaaS da companhia.',
    requirements: [
      'Experiência consolidada com React 18+, TypeScript e Tailwind CSS',
      'Conhecimento prático em gerenciamento de estado (Zustand ou Redux Toolkit)',
      'Familiaridade com integração de APIs REST e Swagger'
    ],
    sourceUrls: [
      { title: 'Vaga Gupy TOTVS Tech', uri: 'https://portal.gupy.io' }
    ],
    applyUrlOrContact: 'https://totvs.gupy.io',
    portalSource: 'Gupy',
    requiresAuth: false,
  },
  {
    id: 'job-init-04',
    title: 'Desenvolvedor Frontend React / Mobile React Native',
    company: 'Itaú Unibanco',
    location: {
      neighborhood: 'Jabaquara',
      city: 'São Paulo',
      state: 'SP',
    },
    workModel: 'Híbrido',
    salaryOrRange: 'R$ 11.500 - R$ 15.000 CLT + PLR Bancária',
    description: 'Atuação na esteira de canais digitais do Itaú. Desenvolvimento de jornadas omnicanal focadas em usabilidade e segurança para correntistas pessoa física.',
    requirements: [
      'Vivência no desenvolvimento de aplicações com React e React Native',
      'Conhecimento em CI/CD, esteiras automatizadas e arquitetura orientada a eventos',
      'Postura colaborativa e foco na entrega de valor para o cliente'
    ],
    sourceUrls: [
      { title: 'Anúncio Vagas.com Corporativo', uri: 'https://www.vagas.com.br' }
    ],
    applyUrlOrContact: 'https://www.vagas.com.br',
    portalSource: 'Vagas.com',
    requiresAuth: false,
  }
];
