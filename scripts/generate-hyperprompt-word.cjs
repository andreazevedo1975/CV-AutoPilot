// scripts/generate-hyperprompt-word.js
// Gera o arquivo Microsoft Word (.docx) contendo o Hiperprompt Completo, Arquitetura e Código de Todas as Funcionalidades

const fs = require('fs');
const path = require('path');
const { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
  AlignmentType,
  ShadingType
} = require('docx');

const rootDir = path.resolve(__dirname, '..');

// Helper para ler arquivos com segurança
function readFileContent(relPath) {
  const fullPath = path.join(rootDir, relPath);
  if (fs.existsSync(fullPath)) {
    return fs.readFileSync(fullPath, 'utf8');
  }
  return `// Arquivo ${relPath} não encontrado no caminho indicado.`;
}

// Arquivos chave da aplicação
const fileList = [
  { path: 'types.ts', title: '1. Modelos de Dados, Tipos & Contratos Globais (types.ts)' },
  { path: 'ThemeContext.ts', title: '2. Design Tokens, Paleta Burgundy & Contexto de Tema (ThemeContext.ts)' },
  { path: 'App.tsx', title: '3. Orquestrador SPA Central & Roteamento Dinâmico (App.tsx)' },
  { path: 'services/realSearch360Service.ts', title: '4. Motor de Varredura 360° em Fontes Reais (services/realSearch360Service.ts)' },
  { path: 'components/CVAutoPilot360.tsx', title: '5. Piloto Automático 360°: CopiVaga, VagaAutomática, Loopcv, JobCopilot (components/CVAutoPilot360.tsx)' },
  { path: 'components/CVAutoDispatcher.tsx', title: '6. Disparador de Currículo Multicanal: Radar, E-mail & Form (components/CVAutoDispatcher.tsx)' },
  { path: 'components/CVManager.tsx', title: '7. Gerenciador de Currículos Executivo C-Level (components/CVManager.tsx)' },
  { path: 'components/JobTailoredCVBuilder.tsx', title: '8. Construtor de Currículo Sob Medida para Vagas (components/JobTailoredCVBuilder.tsx)' },
  { path: 'components/JobMatchAnalyzer.tsx', title: '9. Analista de Compatibilidade ATS & Job Description (components/JobMatchAnalyzer.tsx)' },
  { path: 'components/PersonalSWOTAnalysis.tsx', title: '10. Diagnóstico Estratégico SWOT Pessoal com IA (components/PersonalSWOTAnalysis.tsx)' },
  { path: 'components/SalaryBenchmarking.tsx', title: '11. Benchmarking Salarial Nacional e Percentis (components/SalaryBenchmarking.tsx)' },
  { path: 'components/JobFormAutofill.tsx', title: '12. Auto-Preenchimento Inteligente de Vagas Gupy & Workday (components/JobFormAutofill.tsx)' },
  { path: 'components/ContactExtractor.tsx', title: '13. Extrator 360° de Contatos e Dossiê com OCR (components/ContactExtractor.tsx)' },
  { path: 'components/CreativeStudio.tsx', title: '14. Simulador STAR de Entrevista por Voz (components/CreativeStudio.tsx)' },
  { path: 'components/LeadFinder.tsx', title: '15. Radar 360° de Talentos e Currículos Regionais (components/LeadFinder.tsx)' },
  { path: 'components/SystemManualFAQ.tsx', title: '16. Manual Didático do Sistema & FAQ Interativo (components/SystemManualFAQ.tsx)' },
  { path: 'windows-installer/Instalar-CV-Autopilot.bat', title: '17. Script Instalador Windows Batch (Instalar-CV-Autopilot.bat)' },
  { path: 'windows-installer/Iniciar-CV-Autopilot.bat', title: '18. Script Inicializador Local (Iniciar-CV-Autopilot.bat)' },
  { path: 'windows-installer/Instalar-CV-Autopilot.ps1', title: '19. Instalador Windows PowerShell (Instalar-CV-Autopilot.ps1)' },
  { path: 'windows-installer/electron-main.cjs', title: '20. Ponto de Entrada Electron para EXE Nativo (electron-main.cjs)' }
];

async function generateDocx() {
  console.log('Iniciando compilação do Hiperprompt em Word (.docx)...');

  const children = [];

  // CAPA / HEADER EXECUTIVO
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'CV-AUTOPILOT ENTERPRISE',
          bold: true,
          size: 44,
          color: '881337', // Burgundy
          font: 'Calibri'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'HIPERPROMPT MESTRE & ESPECIFICAÇÃO TÉCNICA INTEGRAL',
          bold: true,
          size: 28,
          color: '1F2937',
          font: 'Calibri'
        })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [
        new TextRun({
          text: 'Documento Consolidado de Arquitetura, Regras de Negócio e Código-Fonte de Todas as Funcionalidades',
          italics: true,
          size: 22,
          color: '4B5563',
          font: 'Calibri'
        })
      ]
    })
  );

  // METADADOS EM TABELA
  const metaRows = [
    ['Plataforma:', 'CV-AutoPilot Enterprise (Web SPA + Desktop Offline)'],
    ['Versão do Sistema:', '2.5.0 LTS Enterprise'],
    ['Data de Emissão:', new Date().toLocaleDateString('pt-BR')],
    ['Tecnologias Core:', 'React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, docx, jspdf, Workbox PWA'],
    ['Módulos Cobertos:', '16 Módulos Principais + Suíte Windows Standalone (.bat / .ps1 / .exe)'],
    ['Benchmarks Integrados:', 'CopiVaga, VagaAutomática, Loopcv e JobCopilot'],
    ['Base Corporativa:', '60+ Empresas Reais no Brasil com Canais de Talent Acquisition Auditados'],
    ['Diretriz de Segurança:', 'Zero API Externa Obrigatória, Processamento 100% Client-Side Local']
  ].map(([label, val]) => 
    new TableRow({
      children: [
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          shading: { type: ShadingType.CLEAR, fill: 'F3F4F6' },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, font: 'Calibri' })] })]
        }),
        new TableCell({
          width: { size: 70, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: val, size: 20, font: 'Calibri' })] })]
        })
      ]
    })
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: metaRows
    }),
    new Paragraph({ spacing: { after: 400 }, children: [] })
  );

  // SEÇÃO: O HIPERPROMPT MESTRE
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'HIPERPROMPT MESTRE DE REPRODUÇÃO & ENGENHARIA',
          bold: true,
          size: 32,
          color: '881337',
          font: 'Calibri'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: 'Instrução para Modelos de Linguagem Avançados e Engenheiros de Software:',
          bold: true,
          size: 22,
          font: 'Calibri'
        })
      ]
    }),
    new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({
          text: 'Você é o Arquiteto Principal e Engenheiro de Software Líder do projeto CV-AutoPilot Enterprise. Sua missão é projetar, implementar e manter uma plataforma executiva de ponta a ponta voltada à aceleração de carreira, otimização de currículos para motores ATS (Applicant Tracking Systems como Taleo, Workday, Greenhouse, Lever e Gupy), e disparo autônomo multicanal de candidaturas. O sistema opera com rigor técnico C-Level, paleta de cores corporativa Burgundy Royal (#881337), navegação fluida em abas, suporte offline com Service Worker e instalador de um clique para Windows.',
          size: 20,
          font: 'Calibri'
        })
      ]
    })
  );

  // SEÇÃO: MATRIZ DE FUNCIONALIDADES
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 300, after: 150 },
      children: [
        new TextRun({
          text: 'Matriz Comparativa das Tecnologias de Disparo Integradas',
          bold: true,
          size: 26,
          color: '111827',
          font: 'Calibri'
        })
      ]
    })
  );

  const benchmarkTableRows = [
    new TableRow({
      children: [
        'Plataforma', 'Como Funciona', 'Principais Alvos', 'Recursos de Destaque'
      ].map(header => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: '881337' },
        children: [new Paragraph({ children: [new TextRun({ text: header, bold: true, color: 'FFFFFF', size: 19, font: 'Calibri' })] })]
      }))
    }),
    new TableRow({
      children: [
        'CopiVaga',
        'Piloto automático que realiza de 20 a 50 candidaturas por dia.',
        'LinkedIn, Gupy, Catho e Indeed',
        'Otimização de palavras-chave para passar pelos filtros de RH (ATS 95%+).'
      ].map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, font: 'Calibri' })] })] }))
    }),
    new TableRow({
      children: [
        'VagaAutomática',
        'Aplica automaticamente em centenas de vagas semanais usando IA.',
        'LinkedIn, Gupy e Indeed',
        'Foco em grandes empresas (Tier 1/Unicórnios) e velocidade de aplicação massiva.'
      ].map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, font: 'Calibri' })] })] }))
    }),
    new TableRow({
      children: [
        'Loopcv',
        'Plataforma global que dispara e-mails para empresas ou preenche formulários.',
        'LinkedIn, Indeed e +30 painéis',
        'Extensão de aplicação inteligente, rastreador de respostas e alertas de follow-up.'
      ].map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, font: 'Calibri' })] })] }))
    }),
    new TableRow({
      children: [
        'JobCopilot',
        'Envia até 50 pedidos personalizados por dia em portais de carreira.',
        '+500.000 páginas oficiais de carreira',
        'Descobre e-mails diretos de gestores de contratação (Hiring Managers).'
      ].map(cell => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: cell, size: 19, font: 'Calibri' })] })] }))
    })
  ];

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: benchmarkTableRows
    }),
    new Paragraph({ spacing: { after: 400 }, children: [] })
  );

  // SEÇÃO: CÓDIGO-FONTE INTEGRAL DE TODOS OS ARQUIVOS
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
      children: [
        new TextRun({
          text: 'CÓDIGO-FONTE INTEGRAL DE TODAS AS FUNCIONALIDADES',
          bold: true,
          size: 32,
          color: '881337',
          font: 'Calibri'
        })
      ]
    })
  );

  for (const item of fileList) {
    console.log(`Processando: ${item.path}...`);
    const content = readFileContent(item.path);

    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
        children: [
          new TextRun({
            text: item.title,
            bold: true,
            size: 24,
            color: '1E3A8A', // Deep Blue
            font: 'Calibri'
          })
        ]
      }),
      new Paragraph({
        spacing: { after: 150 },
        children: [
          new TextRun({
            text: `Caminho do Arquivo: /${item.path} • Total de Linhas: ${content.split('\n').length}`,
            italics: true,
            size: 18,
            color: '6B7280',
            font: 'Calibri'
          })
        ]
      })
    );

    // Dividir conteúdo em blocos de até 80 linhas para não sobrecarregar parágrafos individuais
    const lines = content.split('\n');
    const chunkSize = 75;
    for (let i = 0; i < lines.length; i += chunkSize) {
      const slice = lines.slice(i, i + chunkSize).join('\n');
      children.push(
        new Paragraph({
          spacing: { after: 100 },
          shading: { type: ShadingType.CLEAR, fill: 'F9FAFB' },
          children: [
            new TextRun({
              text: slice,
              size: 16,
              font: 'Consolas',
              color: '111827'
            })
          ]
        })
      );
    }

    children.push(new Paragraph({ spacing: { after: 200 }, children: [] }));
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);
  const outDir = path.join(rootDir, 'public');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const outPath = path.join(outDir, 'Hiperprompt-CV-AutoPilot-Enterprise.docx');
  fs.writeFileSync(outPath, buffer);
  console.log(`Arquivo Word gerado com sucesso: ${outPath} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

generateDocx().catch(err => {
  console.error('Falha ao gerar arquivo Word:', err);
  process.exit(1);
});
