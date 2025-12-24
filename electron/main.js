import { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, execSync, spawn } from 'child_process'; 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = !app.isPackaged;

// 🔥 TRUVA ATI: BAŞLANGIÇTA YÖNETİCİ ZORLAMA
if (!isDev && process.platform === 'win32') {
    try {
        // Admin testi yapıyoruz
        execSync('net session', { stdio: 'ignore' });
    } catch (e) {
        // Admin değiliz!
        const appPath = app.getPath('exe');
        
        // Eğer zaten yükseltme parametresiyle açılmadıysa
        if (!process.argv.includes('--elevated')) {
            console.log("Yönetici izni yok. Yeniden başlatılıyor...");
            
            // PowerShell ile kendini 'RunAs' (Yönetici) modunda yeniden başlat
            // Tırnak işaretleri dosya yolundaki boşlukları korur
            spawn('powershell.exe', [
                "Start-Process",
                "-FilePath", `"${appPath}"`, 
                "-ArgumentList", '"--elevated --hidden"', 
                "-Verb", "RunAs",
                "-WindowStyle", "Hidden"
            ], { 
                detached: true, 
                stdio: 'ignore' 
            });
            
            // Yetkisiz uygulamayı hemen kapat
            app.exit(0); 
        }
    }
}

let mainWindow = null;
let splashWindow = null;
let usbInterval = null;
let securityInterval = null; 
let machineId = '';
let isExplorerKilled = false; 
let lastViewMode = 'LOCKED'; 

const USB_KEY_DRIVE = 'sys_config.dat';
const USB_KEY_CONTENT = 'sistem_anahtari_2025';
const STEALTH_NAME = "WindowsSecurityHealthService"; 

const BANNED_APPS = [
    'taskmgr.exe', 'cmd.exe', 'powershell.exe', 'regedit.exe', 
    'magnify.exe', 'narrator.exe', 'osk.exe'
];

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-pinch'); 
app.commandLine.appendSwitch('overscroll-history-navigation', '0');
app.commandLine.appendSwitch('ignore-gpu-blacklist'); 
app.commandLine.appendSwitch('enable-gpu-rasterization'); 
app.commandLine.appendSwitch('enable-zero-copy');

if (!app.requestSingleInstanceLock()) { app.exit(0); }

// --- GİZLİ BAŞLANGIÇ KISAYOLU ---
function ensureStealthStartup() {
  if (isDev) return; 
  const exePath = process.execPath;
  const startupFolder = path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const shortcutPath = path.join(startupFolder, `${STEALTH_NAME}.lnk`);

  // Kısayol yoksa oluştur
  if (!fs.existsSync(shortcutPath)) {
      const psScript = `
        $WshShell = New-Object -comObject WScript.Shell;
        $Shortcut = $WshShell.CreateShortcut('${shortcutPath}');
        $Shortcut.TargetPath = '${exePath}';
        $Shortcut.Arguments = '--hidden';
        $Shortcut.WindowStyle = 7; 
        $Shortcut.Description = 'Windows System Integrity';
        $Shortcut.Save();
      `;
      exec(`powershell -Command "${psScript}"`, (err) => {
        if (!err) { 
            // Kısayolu gizli ve sistem dosyası yap
            exec(`attrib +s +h "${shortcutPath}"`); 
        }
      });
  }
}

function getOrGenerateMachineId() {
  const userDataPath = app.getPath('userData');
  const idFilePath = path.join(userDataPath, 'device_id.json');
  try {
    if (fs.existsSync(idFilePath)) {
      return JSON.parse(fs.readFileSync(idFilePath, 'utf-8')).id;
    } else {
      const newId = crypto.randomUUID();
      fs.writeFileSync(idFilePath, JSON.stringify({ id: newId }));
      return newId;
    }
  } catch { return 'FALLBACK_ID_' + Date.now(); }
}

function killExplorer() {
  if (isExplorerKilled) return;
  exec('taskkill /F /IM explorer.exe', (err) => { if (!err) isExplorerKilled = true; });
}

function startExplorer() {
  try {
    const stdout = execSync('tasklist /FI "IMAGENAME eq explorer.exe" /NH').toString();
    if (stdout.toLowerCase().includes('explorer.exe')) {
        isExplorerKilled = false;
        return; 
    }
  } catch (e) {}

  isExplorerKilled = false;
  const child = exec('explorer.exe', { detached: true, stdio: 'ignore' });
  child.unref(); 
}

function startSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
    if (isDev) return; 

    securityInterval = setInterval(() => {
        BANNED_APPS.forEach(proc => { exec(`taskkill /F /IM ${proc}`, (err) => {}); });
        killExplorer();
        
        if (mainWindow && !mainWindow.isFocused()) {
            try {
                mainWindow.setAlwaysOnTop(true, 'screen-saver');
                mainWindow.focus();
                mainWindow.moveTop();
            } catch(e) {}
        }
    }, 500);
}

function stopSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
}

function setupShortcuts() {
    globalShortcut.unregisterAll(); 
    
    // KILLSWITCH
    const forceQuit = () => {
        app.isQuitting = true;
        try { stopSecurityWatchdog(); } catch(e) {}
        if (usbInterval) clearInterval(usbInterval);
        try { startExplorer(); } catch(e) {}
        try {
            if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
            if (splashWindow && !splashWindow.isDestroyed()) splashWindow.destroy();
        } catch(e) {}
        
        setTimeout(() => {
            app.exit(0);      
            process.exit(0);  
        }, 1000);
    };

    globalShortcut.register('Ctrl+Shift+Q', forceQuit);
    globalShortcut.register('Ctrl+Shift+F12', forceQuit);
}

ipcMain.handle('shutdown-pc', () => { exec('shutdown /s /f /t 0'); });

ipcMain.on('start-update', (event, downloadUrl) => {
  const tempPath = app.getPath('temp');
  const installerPath = path.join(tempPath, 'UpdateInstaller.exe');
  const file = fs.createWriteStream(installerPath);
  const request = net.request(downloadUrl);
  request.on('response', (response) => {
    response.on('data', (chunk) => file.write(chunk));
    response.on('end', () => {
      file.end();
      shell.openPath(installerPath);
      setTimeout(() => app.exit(0), 1000); 
    });
  });
  request.end();
});

function createWindow() {
  machineId = getOrGenerateMachineId();
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  setupShortcuts(); 

  const windowOptions = {
    width, height, x: 0, y: 0, 
    frame: false, 
    show: false,
    transparent: true, 
    backgroundColor: '#00000000', 
    alwaysOnTop: true, skipTaskbar: true, kiosk: true, fullscreen: true,
    resizable: false, movable: false, minimizable: false, closable: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.cjs'), devTools: isDev }
  };

  splashWindow = new BrowserWindow({
    width: 400, height: 300, transparent: true, frame: false, alwaysOnTop: true, center: true, resizable: false,
    webPreferences: { nodeIntegration: false }
  });
  splashWindow.loadFile(path.join(__dirname, '../splash.html'));

  mainWindow = new BrowserWindow(windowOptions);
  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  // --- GÜVENLİK BAŞLATMA ---
  try {
      if (!isDev) {
          // Admin kontrolü
          execSync('net session', { stdio: 'ignore' });
          // Hata vermediyse adminiz demektir
          ensureStealthStartup();
          killExplorer(); 
          startSecurityWatchdog();
      }
  } catch(e) {}

  startUsbScanner();
  setupShortcuts();

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) { shell.openExternal(url); return { action: 'deny' }; }
    return { action: 'allow' };
  });

  mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.show();
              mainWindow.focus();
          }
          if (splashWindow && !splashWindow.isDestroyed()) {
              splashWindow.close();
          }
      }, 2000); 
  });
  
  mainWindow.on('close', (e) => { 
      if (!app.isQuitting) { e.preventDefault(); mainWindow.focus(); } 
  });
}

ipcMain.on('set-view-mode', (event, mode) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  if (mode === 'LOCKED') {
    if (!isDev) { killExplorer(); startSecurityWatchdog(); }
    
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    mainWindow.setIgnoreMouseEvents(false); 
    mainWindow.setFullScreen(true); 
    mainWindow.setKiosk(true); 
    mainWindow.setAlwaysOnTop(true, 'screen-saver'); 
    mainWindow.focus();
    lastViewMode = 'LOCKED'; 

  } else {
    if (lastViewMode === 'LOCKED') {
        if (!isDev) { startExplorer(); stopSecurityWatchdog(); }
        mainWindow.setKiosk(false); 
        mainWindow.setFullScreen(false); 
    }
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    mainWindow.setIgnoreMouseEvents(true, { forward: true }); 
    mainWindow.setAlwaysOnTop(true, 'status-window'); 
    lastViewMode = mode; 
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

ipcMain.handle('get-machine-id', () => machineId);
ipcMain.on('quit-app', () => { app.isQuitting = true; startExplorer(); app.exit(0); });
ipcMain.handle('open-external', (e, url) => shell.openExternal(url));

function startUsbScanner() {
  if (usbInterval) clearInterval(usbInterval);
  usbInterval = setInterval(() => {
    const drives = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let found = false;
    for (const drive of drives) {
      try {
        const p = `${drive}:\\${USB_KEY_DRIVE}`;
        if (fs.existsSync(p) && fs.readFileSync(p, 'utf-8').includes(USB_KEY_CONTENT)) { found = true; break; }
      } catch {}
    }
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('usb-status', found ? 'INSERTED' : 'REMOVED');
  }, 1500);
}

app.whenReady().then(createWindow);
app.on('will-quit', () => { globalShortcut.unregisterAll(); if (usbInterval) clearInterval(usbInterval); stopSecurityWatchdog(); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.exit(0); });