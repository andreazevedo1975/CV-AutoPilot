# Guia de Instalação e Execução Local no Windows - CV-AutoPilot Enterprise

Este pacote contém todas as ferramentas para instalar e executar o **CV-AutoPilot Enterprise** diretamente em qualquer computador com Windows 10, Windows 11 ou Windows Server (64-bit).

---

## 🚀 Método 1: Instalação Automática em 1 Clique (Recomendado)

1. Baixe ou descompacte esta pasta em qualquer local do seu PC (ex: `C:\CV-AutoPilot` ou em sua pasta de Documentos).
2. Dê um **duplo clique no arquivo**:
   👉 `Instalar-CV-Autopilot.bat`
3. O instalador executará automaticamente:
   - Verificação e instalação do **Node.js LTS** (caso não esteja instalado).
   - Instalação de todas as bibliotecas e inteligências artificiais.
   - Criação do **Atalho na Área de Trabalho (Desktop)**: `CV-AutoPilot.lnk`.
   - Criação do **Atalho no Menu Iniciar do Windows**.
   - Abertura imediata da aplicação no seu navegador ou janela de aplicativo nativo.

---

## ⚡ Método 2: Instalação via PowerShell

Se você preferir executar via PowerShell:
1. Abra o PowerShell na pasta do projeto.
2. Execute o comando:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\Instalar-CV-Autopilot.ps1
   ```

---

## 🖥️ Como Abrir o Aplicativo após Instalado

Após a instalação, você terá três opções práticas para iniciar o sistema a qualquer hora:
1. **Atalho na Área de Trabalho**: Duplo clique em `CV-AutoPilot`.
2. **`Iniciar-CV-Autopilot.bat`**: Inicia o servidor local com o terminal de log visível.
3. **`Iniciar-Silencioso.vbs`**: Inicia a aplicação silenciosamente em segundo plano e abre direto em uma janela de aplicativo limpa do Microsoft Edge ou Google Chrome (sem barras de navegação, exatamente como um programa nativo `.exe`).

---

## 🛑 Como Encerrar o Servidor Local
Para fechar todos os processos locais em execução:
- Dê um duplo clique no arquivo: `Parar-CV-Autopilot.bat`.

---

## 📦 Método 3: Gerar Arquivo .EXE Standalone (Electron / Portável)
Se você deseja gerar um único arquivo executável `.exe` para rodar a partir de um pendrive:
1. Dê um duplo clique no script:
   👉 `build-native-exe.bat`
2. O executável será compilado e salvo na pasta `dist-exe/`.

---

## 🔑 Configuração de Inteligência Artificial Gemini (Opcional)
A ferramenta pode operar com a chave de API fornecida pelo ambiente ou você pode inserir sua própria chave no arquivo `.env`:
```env
GEMINI_API_KEY=AIzaSy...sua_chave_aqui
```
Obtenha sua chave gratuita em: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

---

## 💻 Requisitos de Sistema
- **Sistema Operacional**: Windows 10 ou Windows 11 (64-bit)
- **Memória RAM**: 4 GB (recomendado 8 GB)
- **Espaço em Disco**: ~350 MB
- **Navegador**: Microsoft Edge, Google Chrome, Brave, Firefox ou Opera
