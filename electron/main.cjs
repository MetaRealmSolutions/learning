const { app, BrowserWindow, net, protocol, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { autoUpdater } = require('electron-updater');

// The Expo web export uses absolute asset paths (/_expo/...), which break under file://.
// Serve it through a custom, privileged scheme instead.
const SCHEME = 'app';
const HOST = 'learning';
const DIST_DIR = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

function registerAppProtocol() {
  protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    if (url.hostname !== HOST) {
      return new Response('Not found', { status: 404 });
    }

    const requested = path.normalize(path.join(DIST_DIR, decodeURIComponent(url.pathname)));
    const insideDist = requested === DIST_DIR || requested.startsWith(DIST_DIR + path.sep);
    if (!insideDist) {
      return new Response('Forbidden', { status: 403 });
    }

    const isFile = fs.existsSync(requested) && fs.statSync(requested).isFile();
    // Single-page export: unknown routes fall back to index.html.
    const target = isFile ? requested : path.join(DIST_DIR, 'index.html');
    return net.fetch(pathToFileURL(target).toString());
  });
}

// Exact match on scheme and host (including any port). Malformed URLs are rejected.
// Node reports "null" as the origin of custom schemes, so the parts are compared instead.
function isAppUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === `${SCHEME}:` && parsed.host === HOST;
  } catch {
    return false;
  }
}

let mainWindow = null;

// Updates come from GitHub Releases (see "build.publish" in package.json). No tokens are
// embedded: the release feed must be readable without credentials. Only packaged builds
// check for updates; a downloaded update is installed when the app quits.
function setupAutoUpdates() {
  if (!app.isPackaged) {
    console.log('[updater] skipped: development run');
    return;
  }

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => console.log('[updater] checking for update'));
  autoUpdater.on('update-available', (info) =>
    console.log(`[updater] update available: ${info.version}`),
  );
  autoUpdater.on('update-not-available', () => console.log('[updater] no update available'));
  autoUpdater.on('download-progress', (progress) => {
    console.log(`[updater] downloading: ${Math.round(progress.percent)}%`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setProgressBar(progress.percent / 100);
    }
  });
  autoUpdater.on('update-downloaded', (info) => {
    console.log(`[updater] ${info.version} downloaded; it will be installed when the app quits`);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
  });
  autoUpdater.on('error', (error) => {
    console.error('[updater] error:', error == null ? 'unknown' : error.message);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setProgressBar(-1);
  });

  autoUpdater.checkForUpdates().catch((error) => {
    console.error('[updater] check failed:', error.message);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 360,
    minHeight: 480,
    show: false,
    backgroundColor: '#FFFFFF',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  mainWindow = win;
  win.on('closed', () => {
    mainWindow = null;
  });
  win.once('ready-to-show', () => win.show());

  // Keep the window on the app origin; send external links to the system browser.
  const appOrigin = `${SCHEME}://${HOST}`;
  win.webContents.on('will-navigate', (event, url) => {
    if (!isAppUrl(url)) {
      event.preventDefault();
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  win.loadURL(`${appOrigin}/index.html`);
}

app.whenReady().then(() => {
  registerAppProtocol();
  createWindow();
  setupAutoUpdates();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
