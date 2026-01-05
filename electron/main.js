// 🔥 COMMONJS FİNAL V2 (Explorer Loop Fix + Anti-Uninstall + Admin Mode) 🔥

const { app, BrowserWindow, ipcMain, screen, shell, net, powerMonitor } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

// 🔥 PERFORMANS VE GPU AYARLARI
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('use-angle', 'd3d9'); 
app.commandLine.appendSwitch('enable-webgl');
app.commandLine.appendSwitch('renderer-process-limit', '1');
app.commandLine.appendSwitch('disable-site-isolation-trials');

// --- DİZİN VE MOD AYARLARI ---
const isDev = !app.isPackaged; 

// --- SABİTLER ---
const USER_DATA_PATH = app.getPath('userData');
const FLAG_PATH = path.join(USER_DATA_PATH, 'sys_integrity.chk'); 
const GUARD_SCRIPT_PATH = path.join(USER_DATA_PATH, 'winsys.vbs'); 

// --- GLOBAL DEĞİŞKENLER ---
let mainWindow = null;
let splashWindow = null;
let usbInterval = null;
let securityInterval = null;
let lastViewMode = 'LOCKED'; 
let isQuitting = false; 

// 🛑 YENİ: Explorer Hortlamasını Engelleyen Soğuma Değişkeni
let lastExplorerLaunchTime = 0;

// --- YASAKLI UYGULAMALAR ---
const BROWSERS = ['chrome.exe', 'msedge.exe', 'firefox.exe', 'opera.exe', 'brave.exe'];
const SYSTEM_APPS = [
    'taskmgr.exe', 'cmd.exe', 'powershell.exe', 'regedit.exe', 
    'magnify.exe', 'narrator.exe', 'osk.exe', 'SystemSettings.exe', 
    'ApplicationFrameHost.exe', 'Control.exe', 'msiexec.exe', 
    'mmc.exe', 'netplwiz.exe', 'lusrmgr.msc', 'Setup.exe',
    'unins000.exe', 'unins001.exe', 'Uninstall.exe', 'installer.exe'
];
const ALL_BANNED = [...BROWSERS, ...SYSTEM_APPS];
const KILL_COMMAND = `taskkill /F /IM ${ALL_BANNED.join(' /IM ')} /T`;

// 🔥 REGISTRY KİLİDİ
function toggleTaskMgr(enable) {
    if (isDev) return; 
    const val = enable ? '0' : '1'; 
    const cmd = `reg add "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /t REG_DWORD /d ${val} /f`;
    exec(cmd, (err) => {});
}

// 🔥 ACİL DURUM
function emergencyUnlock() {
    console.error("⚠️ KRİTİK HATA: Acil durum kilidi açılıyor...");
    isQuitting = true; 
    try { fs.writeFileSync(FLAG_PATH, '1'); } catch (e) {} 
    toggleTaskMgr(true);
}

process.on('uncaughtException', (error) => {
    console.error('Beklenmeyen Hata:', error);
    emergencyUnlock();
    setTimeout(() => { app.exit(1); }, 2000);
});

// --- GÖLGE KORUYUCU (VBScript) ---
function startGuardian() {
    if (isDev) return; 
    const exePath = process.execPath; 
    const exeName = path.basename(exePath);
    const safeFlagPath = FLAG_PATH.replace(/\\/g, '\\\\');
    
    const vbsContent = `
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Dim exeName, exePath, flagPath
exeName = "${exeName}"
exePath = "${exePath}"
flagPath = "${safeFlagPath}"
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
        exec('taskkill /F /IM wscript.exe /FI "WINDOWTITLE eq winsys.vbs"', () => {
             const child = spawn('wscript', [GUARD_SCRIPT_PATH], { detached: true, stdio: 'ignore', windowsHide: true });
             child.unref();
        });
    } catch (e) { console.error("Guardian hatası:", e); }
}

// 👇👇👇 DÜZELTİLEN EXPLORER MANTIĞI 👇👇👇
function startExplorer() {
  if (isDev) return;
  
  // Eğer son 5 saniye içinde zaten başlattıysak, SAKIN DOKUNMA!
  const now = Date.now();
  if (now - lastExplorerLaunchTime < 7000) {
      console.log("⏳ Explorer zaten yeni başlatıldı, bekleniyor...");
      return;
  }

  // Bekçiyi durdur ki biz açarken o kapatmasın
  stopSecurityWatchdog();
  
  // Zaman damgasını güncelle
  lastExplorerLaunchTime = now;

  console.log("🚀 Explorer Shell (Tek Seferlik) tetikleniyor...");

  const winDir = process.env.windir || 'C:\\Windows';
  const explorerPath = path.join(winDir, 'explorer.exe');

  // Önce var mı diye kontrol et, varsa HİÇBİR ŞEY YAPMA
  exec('tasklist /FI "IMAGENAME eq explorer.exe" /NH', (err, stdout) => {
      if (stdout && stdout.toLowerCase().includes('explorer.exe')) {
          console.log("✅ Explorer zaten açık, işlem iptal.");
          return;
      }

      // Yoksa başlat
      exec(`start "" "${explorerPath}"`, { windowsHide: true }, (err) => {
          if (err) console.error("Explorer başlatma hatası:", err);
      });
  });
}
// 👆👆👆 --------------------------- 👆👆👆

// --- GÜVENLİK BEKÇİSİ ---
// startSecurityWatchdog fonksiyonunu bununla değiştir:

function startSecurityWatchdog() {
    if (securityInterval) clearInterval(securityInterval);
    if (isDev) return; 

    securityInterval = setInterval(() => {
        // 🔥 KRİTİK DÜZELTME: Eğer çıkış yapılıyorsa HİÇBİR ŞEYİ ÖLDÜRME!
        // Bu sayede Uninstall işlemi rahatça çalışabilir.
        if (isQuitting) {
            clearInterval(securityInterval);
            securityInterval = null;
            return;
        }

        // 1. Yasaklıları Vur
        exec(KILL_COMMAND, () => {});

        // 2. Uninstaller Avcısı (PowerShell)
        // 🔥 DÜZELTME: Sadece LOCKED modundaysak avlan, yoksa elleme.
        if (lastViewMode === 'LOCKED') {
             const killerScript = `
                Get-Process | Where-Object { 
                    ($_.ProcessName -like '*unins*') -or 
                    ($_.ProcessName -like '*setup*') -or 
                    ($_.MainWindowTitle -like '*Kaldır*') -or
                    ($_.MainWindowTitle -like '*Uninstall*')
                } | Stop-Process -Force -ErrorAction SilentlyContinue
            `;
            exec(`powershell -c "${killerScript}"`, { windowsHide: true }, () => {});
        }

        // 3. Explorer Kontrolü
        if (lastViewMode === 'LOCKED') {
            exec('tasklist /FI "IMAGENAME eq explorer.exe" /NH', (err, stdout) => {
                if (!isQuitting && stdout && stdout.toLowerCase().includes('explorer.exe')) {
                     exec('taskkill /F /IM explorer.exe', () => {}); 
                }
            });
        }
        
        // 4. Pencere Odaklanması
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

function killExplorer() { 
    if (isDev || isQuitting) return; 
    exec('taskkill /F /IM explorer.exe', () => {}); 
}

// --- USB TARAMA ---
const USB_KEY_DRIVE = 'sys_config.dat';
const USB_KEY_CONTENT = 'sistem_anahtari_2025';
let lastEmittedStatus = 'REMOVED'; 

function startUsbScanner() {
  if (usbInterval) clearInterval(usbInterval);
  usbInterval = setInterval(() => {
    if (isQuitting) return;

    const drives = 'DEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    let foundUsbData = null;
    
    for (const drive of drives) {
      try {
        const p = `${drive}:\\${USB_KEY_DRIVE}`;
        if (fs.existsSync(p)) {
          const fileContent = fs.readFileSync(p, 'utf-8');
          if (fileContent.includes(USB_KEY_CONTENT)) {
             try { foundUsbData = JSON.parse(fileContent); } catch { foundUsbData = { teacher_name: 'Admin', app_key: USB_KEY_CONTENT }; }
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
  }, 3000); 
}

// --- IPC HANDLERS ---
ipcMain.handle('get-machine-id', () => {
    const idFilePath = path.join(USER_DATA_PATH, 'device_id.json');
    try {
        if (fs.existsSync(idFilePath)) return JSON.parse(fs.readFileSync(idFilePath, 'utf-8')).id;
        const newId = crypto.randomUUID();
        fs.writeFileSync(idFilePath, JSON.stringify({ id: newId }));
        return newId;
    } catch { return 'FALLBACK_' + Date.now(); }
});

ipcMain.on('set-system-mute', (event, muted) => {
    const script = '(New-Object -ComObject WScript.Shell).SendKeys([char]173)';
    exec(`powershell -c "${script}"`, (err) => {});
});

ipcMain.on('stop-media', () => {
    const script = '(New-Object -ComObject WScript.Shell).SendKeys([char]178)';
    exec(`powershell -c "${script}"`, (err) => {});
});

ipcMain.handle('shutdown-pc', () => { exec('shutdown /p /f'); });

// 👇👇👇 GÜVENLİ ÇIKIŞ 👇👇👇
const performSafeExit = () => {
    console.log("⚠️ GÜVENLİ ÇIKIŞ İSTEĞİ ALINDI ⚠️");
    
    isQuitting = true; 
    try { fs.writeFileSync(FLAG_PATH, '1'); } catch (e) {}

    stopSecurityWatchdog();
    if (usbInterval) clearInterval(usbInterval);
    toggleTaskMgr(true);

    if (mainWindow && !mainWindow.isDestroyed()) {
        try {
            mainWindow.setAlwaysOnTop(false);
            mainWindow.setIgnoreMouseEvents(true);
            mainWindow.destroy(); 
            mainWindow = null;
        } catch (e) { console.error("Pencere kapatma hatası:", e); }
    }

    console.log("🚀 Explorer Shell başlatılıyor...");
    startExplorer(); 

    setTimeout(() => { 
        console.log("💀 Process Killed.");
        app.exit(0); 
    }, 1500);
};

ipcMain.on('quit-app', performSafeExit);

// 🔥 GÜNCELLEME SİSTEMİ
ipcMain.on('start-update', (event, { downloadUrl, expectedHash }) => {
  console.log('Güncelleme Başlıyor:', downloadUrl);
  const tempPath = app.getPath('temp');
  const installerPath = path.join(tempPath, 'ServiceHost_Update.exe');
  
  try { if (fs.existsSync(installerPath)) fs.unlinkSync(installerPath); } catch(e) {}
  
  const file = fs.createWriteStream(installerPath);
  const request = net.request(downloadUrl);
  
  request.on('response', (response) => {
    if (response.statusCode !== 200) return;
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      if (expectedHash) {
          const fileBuffer = fs.readFileSync(installerPath);
          const hashSum = crypto.createHash('sha256');
          hashSum.update(fileBuffer);
          if (hashSum.digest('hex') !== expectedHash) {
              try { fs.unlinkSync(installerPath); } catch(e) {}
              return;
          }
      }
      shell.openPath(installerPath);
      performSafeExit();
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
    mainWindow.moveTop();
    mainWindow.focus();
  } else {
    lastViewMode = mode; 
    
    // 👇 BURAYA DA ÇİFT DİKİŞ KORUMA
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
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.setIgnoreMouseEvents(ignore, { forward: true });
});

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  toggleTaskMgr(true);

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
        nodeIntegration: false, contextIsolation: true, 
        preload: path.join(__dirname, 'preload.cjs'),
        devTools: isDev
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver'); 
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.removeMenu(); 

  mainWindow.on('blur', () => {
    setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed() && lastViewMode === 'LOCKED') {
            mainWindow.moveTop();
            mainWindow.focus();
        }
    }, 100);
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  const startUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.on('close', (event) => {
      if (!isQuitting) { event.preventDefault(); return false; }
      return true;
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && input.shift && input.key.toLowerCase() === 'q') {
        event.preventDefault(); performSafeExit(); return;
    }
    if (input.key === 'F5' || (input.control && input.key.toLowerCase() === 'r')) event.preventDefault();
    if (input.key === 'F11') event.preventDefault();
  });

  if (!isDev) { 
      exec('taskkill /F /IM explorer.exe', () => {}); 
      toggleTaskMgr(false); 
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

app.whenReady().then(() => {
    createWindow();
    powerMonitor.on('suspend', () => {
        if (mainWindow) mainWindow.webContents.send('system-suspend');
    });
    powerMonitor.on('resume', () => {
        if (mainWindow) mainWindow.webContents.send('system-resume');
    });
});

app.on('window-all-closed', () => { 
    if (process.platform !== 'darwin' && isQuitting) app.exit(0); 
});