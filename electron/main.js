import { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, execSync } from 'child_process'; 

// --- DİZİN VE MOD AYARLARI ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged; 

// --- YASAKLI UYGULAMALAR ---
const BROWSERS = ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'brave.exe'];
const SYSTEM_APPS = [
    'taskmgr.exe', 'cmd.exe', 'powershell.exe', 'regedit.exe', 
    'magnify.exe', 'narrator.exe', 'osk.exe', 'SystemSettings.exe', 
    'ApplicationFrameHost.exe', 'Control.exe', 'unins000.exe', 
    'Setup.exe', 'msiexec.exe'
];
const ALL_BANNED = [...BROWSERS, ...SYSTEM_APPS];

// --- WINDOWS YÖNETİMİ ---
function aggressiveKill() {
    if (isDev) return; 
    exec('powershell -c (New-Object -ComObject WScript.Shell).SendKeys(String.fromCharCode(173))', () => {}); 
    ALL_BANNED.forEach(b => exec(`taskkill /F /IM ${b}`, () => {}));
    exec('taskkill /F /IM explorer.exe', () => {});
}

// Explorer Başlatma Kilidi
let isExplorerStarting = false;
function startExplorer() {
  if (isDev) return;
  if (isExplorerStarting) return;
  isExplorerStarting = true;
  stopSecurityWatchdog();

  setTimeout(() => {
      exec('tasklist /FI "IMAGENAME eq explorer.exe" /NH', (err, stdout) => {
          if (stdout && stdout.toLowerCase().includes('explorer.exe')) {
              isExplorerStarting = false;
              return;
          }
          const winDir = process.env.windir || 'C:\\Windows';
          const child = exec('explorer.exe', { cwd: winDir, detached: true, stdio: 'ignore' });
          child.unref(); 
          setTimeout(() => { isExplorerStarting = false; }, 2000);
      });
  }, 1500);
}

// --- GÜVENLİK BEKÇİSİ ---
let securityInterval = null;
function startSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
    if (isDev) return; 
    securityInterval = setInterval(() => {
        ALL_BANNED.forEach(proc => exec(`taskkill /F /IM ${proc}`, () => {}));
        if (lastViewMode === 'LOCKED') {
            exec('tasklist /FI "IMAGENAME eq explorer.exe" /NH', (err, stdout) => {
                if (stdout && stdout.toLowerCase().includes('explorer.exe')) killExplorer();
            });
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
             if (!mainWindow.isAlwaysOnTop()) mainWindow.setAlwaysOnTop(true, 'screen-saver');
             mainWindow.moveTop(); 
             mainWindow.focus();
        }
    }, 1000);
}
function stopSecurityWatchdog() { if (securityInterval) { clearInterval(securityInterval); securityInterval = null; } }
function killExplorer() { if (isDev) return; exec('taskkill /F /IM explorer.exe', () => {}); }

// --- UYGULAMA YAŞAM DÖNGÜSÜ ---
let mainWindow = null;
let splashWindow = null;
let usbInterval = null;
let lastViewMode = 'LOCKED'; 

const USB_KEY_DRIVE = 'sys_config.dat';
const USB_KEY_CONTENT = 'sistem_anahtari_2025';

if (!app.requestSingleInstanceLock()) { app.exit(0); }

// Otomatik Başlatma
if (!isDev) {
    app.setLoginItemSettings({ openAtLogin: true, path: app.getPath('exe') });
}

if (!isDev && process.platform === 'win32') { aggressiveKill(); }

// 🔥🔥🔥 DÜZELTİLMİŞ USB TARAYICI (SPAM ENGELLEYİCİ) 🔥🔥🔥
// Sadece durum DEĞİŞTİĞİNDE sinyal gönderir.
let lastEmittedStatus = 'REMOVED'; // Başlangıç durumu

function startUsbScanner() {
  if (usbInterval) clearInterval(usbInterval);
  usbInterval = setInterval(() => {
    const drives = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let foundUsbData = null;
    
    // Taramayı yap
    for (const drive of drives) {
      try {
        const p = `${drive}:\\${USB_KEY_DRIVE}`;
        if (fs.existsSync(p)) {
          const fileContent = fs.readFileSync(p, 'utf-8');
          if (fileContent.includes(USB_KEY_CONTENT)) {
             try { foundUsbData = JSON.parse(fileContent); } 
             catch { foundUsbData = { teacher_name: 'Misafir', app_key: USB_KEY_CONTENT }; }
             break;
          }
        }
      } catch (e) {}
    }

    const currentStatus = foundUsbData ? 'INSERTED' : 'REMOVED';

    // 🔥 KRİTİK NOKTA: Sadece durum değiştiyse haber ver!
    // Eğer USB zaten takılıysa ve hala takılıysa, React'e hiçbir şey söyleme.
    // Böylece React "Aaa USB var" diyip kilidi tekrar açmaz.
    if (currentStatus !== lastEmittedStatus) {
        console.log(`USB Durumu Değişti: ${lastEmittedStatus} -> ${currentStatus}`);
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('usb-status', { status: currentStatus, data: foundUsbData });
        }
        lastEmittedStatus = currentStatus;
    }
    
  }, 1000);
}

// --- IPC İŞLEMLERİ ---
ipcMain.handle('get-machine-id', () => {
    const userDataPath = app.getPath('userData');
    const idFilePath = path.join(userDataPath, 'device_id.json');
    try {
        if (fs.existsSync(idFilePath)) return JSON.parse(fs.readFileSync(idFilePath, 'utf-8')).id;
        const newId = crypto.randomUUID();
        fs.writeFileSync(idFilePath, JSON.stringify({ id: newId }));
        return newId;
    } catch { return 'FALLBACK_' + Date.now(); }
});

ipcMain.handle('shutdown-pc', () => {
    exec('shutdown /p /f');
});

ipcMain.on('quit-app', () => {
    stopSecurityWatchdog();
    if (mainWindow) mainWindow.destroy();
    startExplorer();
    setTimeout(() => { app.quit(); process.exit(0); }, 1000);
});

// Güncelleme
ipcMain.on('start-update', (event, downloadUrl) => {
  const tempPath = app.getPath('temp');
  const installerPath = path.join(tempPath, 'TeachNlock_Update.exe');
  try { if (fs.existsSync(installerPath)) fs.unlinkSync(installerPath); } catch(e) {}
  const file = fs.createWriteStream(installerPath);
  const request = net.request(downloadUrl);
  request.on('response', (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      shell.openPath(installerPath);
      setTimeout(() => { app.quit(); process.exit(0); }, 1000);
    });
  });
  request.end();
});

ipcMain.handle('open-external', (e, url) => shell.openExternal(url));

ipcMain.on('set-view-mode', (event, mode) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  if (mode === 'LOCKED') {
    lastViewMode = 'LOCKED'; 
    if (!isDev) { killExplorer(); startSecurityWatchdog(); }
    
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    mainWindow.setIgnoreMouseEvents(false); 
    mainWindow.setFullScreen(true); 
    mainWindow.setKiosk(true); 
    mainWindow.setAlwaysOnTop(true, 'screen-saver'); 
    mainWindow.focus();
  } else {
    lastViewMode = mode; 
    if (!isDev) { startExplorer(); } 
    
    mainWindow.setKiosk(false); 
    mainWindow.setFullScreen(false); 
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    
    if (mode === 'MINI') { 
        mainWindow.setAlwaysOnTop(true, 'floating'); 
        mainWindow.setIgnoreMouseEvents(true, { forward: true }); 
    }
    else { 
        mainWindow.setAlwaysOnTop(true, 'status-window'); 
        mainWindow.setIgnoreMouseEvents(false); 
    }
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
  }
});

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  globalShortcut.register('Ctrl+Shift+Q', () => app.quit());

  splashWindow = new BrowserWindow({ 
      width: 400, height: 300, transparent: true, frame: false, 
      alwaysOnTop: true, center: true, type: 'screen-saver'
  });
  splashWindow.loadFile(path.join(__dirname, '../splash.html')).catch(() => {});

  mainWindow = new BrowserWindow({
    width, height, x: 0, y: 0, frame: false, show: false, 
    transparent: true, backgroundColor: '#00000000', 
    alwaysOnTop: true, skipTaskbar: true, kiosk: true, fullscreen: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs'), devTools: isDev }
  });

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) event.preventDefault();
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) event.preventDefault();
    if (input.key === 'F11') event.preventDefault();
  });

  if (!isDev) { killExplorer(); startSecurityWatchdog(); }
  
  // SCANNER BAŞLAT
  startUsbScanner();

  mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
          if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); }
      }, 2500); 
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.exit(0));