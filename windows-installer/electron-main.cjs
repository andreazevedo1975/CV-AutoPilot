// windows-installer/electron-main.cjs
// Ponto de entrada Electron para empacotar o CV-AutoPilot como EXE Nativo do Windows

const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 700,
    title: 'CV-AutoPilot Enterprise',
    icon: path.join(__dirname, '../src/assets/images/cv_autopilot_logo_1789832318438.jpg'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    },
    backgroundColor: '#0c0709',
    autoHideMenuBar: false
  });

  // Tenta carregar a versão compilada em dist/ ou o servidor local dev
  const distIndexPath = path.join(__dirname, '../dist/index.html');
  const fs = require('fs');

  if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  // Links externos abrem no navegador do sistema operacional
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
