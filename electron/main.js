// 🔥 COMMONJS VERSİYONU (Windows 7 ve Eski Electron Dostu) 🔥
const { app, BrowserWindow, ipcMain, screen, globalShortcut, shell, net } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

// --- DİZİN VE MOD AYARLARI ---
// CommonJS'de __dirname hazırdır, takla atmaya gerek yok.
const isDev = !app.isPackaged; 

// --- SABİTLER ---
const USER_DATA_PATH = app.getPath('userData');
const FLAG_PATH = path.join(USER_DATA_PATH, 'safe_exit.flag'); 
const GUARD_SCRIPT_PATH = path.join(USER_DATA_PATH, 'guardian.vbs');

// --- GLOBAL DEĞİŞKENLER ---
let mainWindow = null;
let splashWindow = null;
let usbInterval = null;
let securityInterval = null;
let lastViewMode = 'LOCKED'; 
let isQuitting = false; 

// --- YASAKLI UYGULAMALAR ---
const BROWSERS = ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'brave.exe'];
const SYSTEM_APPS = [
    'taskmgr.exe', 'cmd.exe', 'powershell.exe', 'regedit.exe', 
    'magnify.exe', 'narrator.exe', 'osk.exe', 'SystemSettings.exe', 
    'ApplicationFrameHost.exe', 'Control.exe', 'unins000.exe', 
    'Setup.exe', 'msiexec.exe'
];
const ALL_BANNED = [...BROWSERS, ...SYSTEM_APPS];

const KILL_COMMAND = `taskkill /F /IM ${ALL_BANNED.join(' /IM ')} /T`;

// 🔥 REGISTRY KİLİDİ (DEMİR YUMRUK)
function toggleTaskMgr(enable) {
    if (isDev) return; 
    const val = enable ? '0' : '1'; 
    const cmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /t REG_DWORD /d ${val} /f`;
    
    exec(cmd, (err) => {
        if (err) console.error("TaskMgr Registry Hatası:", err);
    });
}

// --- GÖLGE KORUYUCU (SHADOW GUARDIAN) ---
function startGuardian() {
    if (isDev) return; 

    const exePath = process.execPath; 
    const exeName = path.basename(exePath);
    
    // Tırnak işaretlerine dikkat
    const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Dim exeName, exePath, flagPath

exeName = "${exeName}"
exePath = "${exePath}"
flagPath = "${FLAG_PATH.replace(/\\/g, '\\\\')}" 

On Error Resume Next 

Do
    If fso.FileExists(flagPath) Then
        fso.DeleteFile flagPath
        WScript.Quit
    End If

    Set colProcesses = GetObject("winmgmts:").ExecQuery("Select * from Win32_Process Where Name = '" & exeName & "'")

    If colProcesses.Count = 0 Then
        WshShell.Run Chr(34) & exePath & Chr(34), 1, False
    End If

    WScript.Sleep 2000
Loop
    `;

    try {
        fs.writeFileSync(GUARD_SCRIPT_PATH, vbsContent);
        
        exec('taskkill /F /IM wscript.exe /FI "WINDOWTITLE eq guardian.vbs"', () => {
             // spawn kullanımı (Ölümsüzlük için)
             const child = spawn('wscript', [GUARD_SCRIPT_PATH], {
                 detached: true,
                 stdio: 'ignore',
                 windowsHide: true
             });
             child.unref();
        });
    } catch (e) {
        console.error("Guardian başlatılamadı:", e);
    }
}

// --- WINDOWS YÖNETİMİ ---
function aggressiveKill() {
    if (isDev) return; 
    exec('powershell -c (New-Object -ComObject WScript.Shell).SendKeys(String.fromCharCode(173))', () => {}); 
    exec(KILL_COMMAND, () => {});
    exec('taskkill /F /IM explorer.exe', () => {});
    toggleTaskMgr(false);
}

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

function startSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
    if (isDev) return; 
    
    securityInterval = setInterval(() => {
        exec(KILL_COMMAND, () => {});
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

// --- USB TARAYICI ---
const USB_KEY_DRIVE = 'sys_config.dat';
const USB_KEY_CONTENT = 'sistem_anahtari_2025';
let lastEmittedStatus = 'REMOVED'; 

function startUsbScanner() {
  if (usbInterval) clearInterval(usbInterval);
  usbInterval = setInterval(() => {
    const drives = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
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

    const currentStatus = foundUsbData ? 'INSERTED' : 'REMOVED';

    if (currentStatus !== lastEmittedStatus) {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('usb-status', { status: currentStatus, data: foundUsbData });
        }
        lastEmittedStatus = currentStatus;
    }
  }, 1000);
}

// --- IPC ---
ipcMain.handle('get-machine-id', () => {
    const idFilePath = path.join(USER_DATA_PATH, 'device_id.json');
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
    isQuitting = true;
    try { fs.writeFileSync(FLAG_PATH, '1'); } catch (e) {}
    toggleTaskMgr(true);
    stopSecurityWatchdog();
    if (mainWindow) mainWindow.destroy();
    startExplorer();
    setTimeout(() => { app.quit(); process.exit(0); }, 1000);
});

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
      isQuitting = true; 
      try { fs.writeFileSync(FLAG_PATH, '1'); } catch (e) {}
      toggleTaskMgr(true);
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
    } else { 
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
  
  globalShortcut.register('Ctrl+Shift+Q', () => {
      isQuitting = true;
      try { fs.writeFileSync(FLAG_PATH, '1'); } catch (e) {}
      toggleTaskMgr(true);
      app.quit();
  });

  splashWindow = new BrowserWindow({ 
      width: 400, height: 300, transparent: true, frame: false, 
      alwaysOnTop: true, center: true, type: 'screen-saver'
  });
  splashWindow.loadFile(path.join(__dirname, '../splash.html')).catch(() => {});

  mainWindow = new BrowserWindow({
    width, height, x: 0, y: 0, frame: false, show: false, 
    transparent: true, backgroundColor: '#00000000', 
    alwaysOnTop: true, skipTaskbar: true, kiosk: true, fullscreen: true,
    closable: false, 
    webPreferences: { 
        nodeIntegration: false, 
        contextIsolation: true, 
        preload: path.join(__dirname, 'preload.cjs'), // .cjs veya .js olduğuna dikkat et
        devTools: isDev 
    }
  });

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('close', (event) => {
      if (!isQuitting) {
          event.preventDefault(); 
          console.log("⛔ ZOMBİ MODU: Kapanma engellendi.");
          return false;
      }
      return true;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) event.preventDefault();
    if (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i')) event.preventDefault();
    if (input.key === 'F11') event.preventDefault();
  });

  if (!isDev) { 
      toggleTaskMgr(false);
      aggressiveKill(); 
      startSecurityWatchdog();
      startGuardian(); 
  }
  
  startUsbScanner();

  mainWindow.once('ready-to-show', () => {
      setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) { mainWindow.show(); mainWindow.focus(); }
          if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); }
      }, 2500); 
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin') {
        if (isQuitting) app.quit();
    }
});