import { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, net } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { exec, execSync } from 'child_process'; 

// --- 1. ÇALIŞMA DİZİNİ DÜZELTME ---
try {
    const exeDir = path.dirname(app.getPath('exe'));
    process.chdir(exeDir);
} catch (e) { }

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isDev = !app.isPackaged;

let mainWindow = null;
let splashWindow = null;
let usbInterval = null;
let securityInterval = null; 
let machineId = '';
let lastViewMode = 'LOCKED'; 

const USB_KEY_DRIVE = 'sys_config.dat';
const USB_KEY_CONTENT = 'sistem_anahtari_2025';
const BANNED_APPS = ['taskmgr.exe', 'cmd.exe', 'powershell.exe', 'regedit.exe', 'magnify.exe', 'narrator.exe', 'osk.exe'];

// Tekil Uygulama Kilidi
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.exit(0); }

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-pinch'); 
app.commandLine.appendSwitch('ignore-gpu-blacklist'); 

// --- KRİTİK FONKSİYONLAR ---

// 1. EXPLORER KAPATMA
function killExplorer() {
  if (isDev) return;
  exec('taskkill /F /IM explorer.exe', () => {});
}

// 2. EXPLORER BAŞLATMA (DÜZELTİLDİ: Pencere açılma sorunu fix)
function startExplorer() {
  if (isDev) return;

  // Önce güvenlik bekçisini kesin durdur
  stopSecurityWatchdog();

  // Emin olmak için önce öldür, sonra başlat
  exec('taskkill /F /IM explorer.exe', () => {
      setTimeout(() => {
         console.log("Masaüstü başlatılıyor...");
         // 🔥 KRİTİK DÜZELTME: cwd (Çalışma Dizini) C:\Windows yapıldı.
         // Bu sayede "Dosya Gezgini Penceresi" yerine "Taskbar" gelir.
         const winDir = process.env.windir || 'C:\\Windows';
         const child = exec('explorer.exe', { 
             cwd: winDir, 
             detached: true, 
             stdio: 'ignore' 
         });
         child.unref(); 
      }, 500); // Yarım saniye bekle ki Windows nefes alsın
  });
}

// 3. GÜVENLİK BEKÇİSİ
function startSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
    if (isDev) return; 
    
    securityInterval = setInterval(() => {
        BANNED_APPS.forEach(proc => exec(`taskkill /F /IM ${proc}`, () => {}));
        
        // Explorer geri geldiyse tekrar vur
        exec('tasklist /FI "IMAGENAME eq explorer.exe" /NH', (err, stdout) => {
            if (stdout && stdout.toLowerCase().includes('explorer.exe')) {
                killExplorer();
            }
        });

        // Pencereyi öne zorla
        if (mainWindow && !mainWindow.isDestroyed()) {
             if (!mainWindow.isAlwaysOnTop()) mainWindow.setAlwaysOnTop(true, 'screen-saver');
             mainWindow.moveTop();
             mainWindow.focus();
        }
    }, 1000);
}

function stopSecurityWatchdog() { 
    if (securityInterval) {
        clearInterval(securityInterval);
        securityInterval = null;
    }
}

// 4. ACİL ÇIKIŞ (KILLSWITCH)
function emergencyExit() {
    console.log("💀 ACİL ÇIKIŞ...");
    stopSecurityWatchdog();
    if (usbInterval) clearInterval(usbInterval);
    
    // Explorer'ı güvenli şekilde başlat
    startExplorer();
    
    if (mainWindow) mainWindow.destroy();
    if (splashWindow) splashWindow.destroy();
    
    setTimeout(() => { app.quit(); process.exit(0); }, 1000);
}

// --- IPC HANDLERS ---

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

ipcMain.handle('shutdown-pc', () => exec('shutdown /s /f /t 0'));
ipcMain.on('quit-app', emergencyExit);
ipcMain.handle('open-external', (e, url) => shell.openExternal(url));

ipcMain.on('start-update', (event, downloadUrl) => {
  const tempPath = app.getPath('temp');
  const installerPath = path.join(tempPath, 'UpdateInstaller.exe');
  const file = fs.createWriteStream(installerPath);
  const request = net.request(downloadUrl);
  request.on('response', (response) => {
    response.on('data', (chunk) => file.write(chunk));
    response.on('end', () => { file.end(); shell.openPath(installerPath); setTimeout(() => app.exit(0), 1000); });
  });
  request.end();
});

// 🔥 GÖRÜNÜM VE KİLİT YÖNETİMİ (Burayı Düzelttik)
ipcMain.on('set-view-mode', (event, mode) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  if (mode === 'LOCKED') {
    // KİLİTLEME MODU
    if (!isDev) { 
        killExplorer(); 
        startSecurityWatchdog(); 
    }
    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    mainWindow.setIgnoreMouseEvents(false); 
    mainWindow.setFullScreen(true); 
    mainWindow.setKiosk(true); 
    mainWindow.setAlwaysOnTop(true, 'screen-saver'); 
    mainWindow.focus();
    lastViewMode = 'LOCKED'; 

  } else {
    // KİLİT AÇMA MODU
    if (lastViewMode === 'LOCKED') {
        // Önce güvenliği durdur, SONRA Explorer'ı aç
        if (!isDev) { 
            stopSecurityWatchdog(); 
            startExplorer(); 
        }
        mainWindow.setKiosk(false); 
        mainWindow.setFullScreen(false); 
    }

    mainWindow.setBounds({ x: 0, y: 0, width, height });
    mainWindow.setResizable(false); 
    
    // Mini modda tıklama izni ver
    if (mode === 'MINI') {
        mainWindow.setAlwaysOnTop(true, 'floating');
        mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
        mainWindow.setAlwaysOnTop(true, 'status-window');
        mainWindow.setIgnoreMouseEvents(false);
    }
    lastViewMode = mode; 
  }
});

ipcMain.on('set-ignore-mouse', (event, ignore) => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

// --- USB TARAYICI ---
function startUsbScanner() {
  if (usbInterval) clearInterval(usbInterval);
  usbInterval = setInterval(() => {
    const drives = 'DEFGH'.split('');
    let foundUsbData = null;
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
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('usb-status', { status: foundUsbData ? 'INSERTED' : 'REMOVED', data: foundUsbData });
    }
  }, 1000);
}

// --- PENCERE OLUŞTURMA ---
function createWindow() {
  machineId = 'DEV_ID'; 
  try { machineId = ipcMain.emit('get-machine-id'); } catch(e){}
  
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Kısayollar: Ready olduktan sonra tanımlamak daha güvenli
  globalShortcut.register('Ctrl+Shift+Q', emergencyExit);
  globalShortcut.register('Ctrl+Shift+F12', emergencyExit);

  splashWindow = new BrowserWindow({ 
    width: 400, height: 300, transparent: true, frame: false, alwaysOnTop: true, center: true, 
    type: 'screen-saver', webPreferences: { nodeIntegration: false }
  });
  splashWindow.loadFile(path.join(__dirname, '../splash.html')).catch(()=>{});

  mainWindow = new BrowserWindow({
    width, height, x: 0, y: 0, frame: false, show: false, transparent: true, backgroundColor: '#00000000', 
    alwaysOnTop: true, skipTaskbar: true, kiosk: true, fullscreen: true,
    webPreferences: { 
        nodeIntegration: false, contextIsolation: true, 
        preload: path.join(__dirname, 'preload.cjs'), devTools: isDev 
    }
  });

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  if (!isDev) { killExplorer(); startSecurityWatchdog(); }
  startUsbScanner();

  mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
          if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); }
      }, 2000); 
  });
}

app.whenReady().then(() => {
    // Windows Admin Kontrolü (Opsiyonel)
    if (process.platform === 'win32') {
        try { execSync('net session'); } catch (e) {}
    }
    createWindow();
});
app.on('will-quit', emergencyExit);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.exit(0); });