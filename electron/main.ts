import { app, BrowserWindow, ipcMain, net } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const Store = require('electron-store');

const store = new Store();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Ignore certificate errors
app.commandLine.appendSwitch('ignore-certificate-errors');

if (process.platform === 'win32') {
  app.setAppUserModelId(app.getName());
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST;

// IPC Handlers
ipcMain.handle('get-playlists', () => {
  return store.get('playlists', []);
});

ipcMain.handle('save-playlists', (_event, playlists) => {
  store.set('playlists', playlists);
});

ipcMain.handle('get-web-sites', () => {
  return store.get('webSites', []);
});

ipcMain.handle('save-web-sites', (_event, sites) => {
  store.set('webSites', sites);
});

ipcMain.handle('get-last-state', () => {
  return {
    lastPlaylistId: store.get('lastPlaylistId'),
    lastChannelId: store.get('lastChannelId'),
    lastWebSiteId: store.get('lastWebSiteId'),
    lastActiveTab: store.get('lastActiveTab', 'iptv'),
  };
});

ipcMain.handle('save-last-state', (_event, state) => {
  if (state.lastPlaylistId !== undefined)
    store.set('lastPlaylistId', state.lastPlaylistId);
  if (state.lastChannelId !== undefined)
    store.set('lastChannelId', state.lastChannelId);
  if (state.lastWebSiteId !== undefined)
    store.set('lastWebSiteId', state.lastWebSiteId);
  if (state.lastActiveTab !== undefined)
    store.set('lastActiveTab', state.lastActiveTab);
});

ipcMain.handle('fetch-url', async (_event, url) => {
  return new Promise((resolve, reject) => {
    let requestUrl = url;
    try {
      requestUrl = new URL(url).toString();
    } catch (e) {
      // invalid url, let net.request handle it or fail
    }
    const request = net.request(requestUrl);
    request.on('response', (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk.toString();
      });
      response.on('end', () => {
        resolve(data);
      });
      response.on('error', (error: Error) => {
        reject(error);
      });
    });
    request.on('error', (error: Error) => {
      reject(error);
    });
    request.end();
  });
});

let win: BrowserWindow | null;

function getIconPath() {
  const iconList = ['icon.ico', 'icon.png', 'icon.svg'];
  for (const icon of iconList) {
    const iconPath = path.join(process.env.VITE_PUBLIC, icon);
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
  }
  return path.join(process.env.VITE_PUBLIC, 'icon.svg');
}

function createWindow() {
  win = new BrowserWindow({
    icon: getIconPath(),
    frame: false, // Frameless window
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
      webSecurity: false, // Disable web security to allow CORS
    },
  });

  // Handle Esc key to exit fullscreen
  const handleEscKey = (_event: Electron.Event, input: Electron.Input) => {
    if (input.key === 'Escape' && input.type === 'keyDown') {
      if (win?.isFullScreen()) {
        win.setFullScreen(false);
      }
    }
  };

  win.webContents.on('before-input-event', handleEscKey);

  win.webContents.on('did-attach-webview', (_event, webContents) => {
    webContents.on('before-input-event', handleEscKey);
  });

  // Window controls
  ipcMain.on('minimize-window', () => {
    win?.minimize();
  });

  ipcMain.on('maximize-window', () => {
    const isFullScreen = win?.isFullScreen();
    win?.setFullScreen(!isFullScreen);
  });

  ipcMain.on('exit-fullscreen', () => {
    if (win?.isFullScreen()) {
      win?.setFullScreen(false);
    }
  });

  ipcMain.on('close-window', () => {
    win?.close();
  });

  ipcMain.on('toggle-dev-tools', () => {
    if (win?.webContents.isDevToolsOpened()) {
      win?.webContents.closeDevTools();
    } else {
      win?.webContents.openDevTools();
    }
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString());
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

// Handle certificate errors
app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
  event.preventDefault()
  callback(true)
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)
