import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { startApiServer, setTicketUpdateCallback } from '../server/api'
import http from 'http'
import os from 'os'; // For OS specific checks if needed

// Configure electron-log
import log from 'electron-log';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log'); // 使用 resolvePathFn
log.transports.file.level = 'info';
log.transports.console.level = 'info'; // Keep console logging as well during dev
Object.assign(console, log.functions); // Redirect console to electron-log

// Call disableHardwareAcceleration immediately after app import if Win7
const isWin7 = process.platform === 'win32' && os.release().startsWith('6.1');
if (isWin7) {
  console.log('Windows 7 detected, disabling hardware acceleration BEFORE app ready.');
  app.disableHardwareAcceleration();
}

console.log('-----------------------------------------------------');
console.log(`Application starting. Electron version: ${process.versions.electron}, Node version: ${process.versions.node}, Chrome version: ${process.versions.chrome}`);
console.log(`OS: ${os.platform()} ${os.release()}`);
console.log('User data path:', app.getPath('userData'));
console.log('-----------------------------------------------------');


let win: BrowserWindow | null = null
const preloadScriptPath = path.join(__dirname, '../preload/index.js')
const indexHtml = path.join(__dirname, '../../dist/index.html')

// IPC: get-config
ipcMain.handle('get-config', async () => {
  console.log('IPC HANDLER: get-config invoked.');
  try {
    const configData = {
      cmd: 82,
      personnum: 1,
      line1: '欢迎光临',
      line2: '云程票务',
      line3: '请通行',
      line4: '祝您游玩愉快',
      line5: '',
      voice: '请进',
      filename: 'welcome.jpg',
      showcount: 1,
      title: '今日入场',
      entrycount: 0
    };
    console.log('IPC HANDLER: get-config returning:', JSON.stringify(configData));
    return configData;
  } catch (error) {
    console.error('IPC HANDLER: get-config error:', error);
    throw error; // Re-throw to be caught by renderer if it handles it
  }
})

// IPC: check-ticket
ipcMain.handle('check-ticket', async (_, ticketData) => {
  console.log(`IPC HANDLER: check-ticket invoked. Data: ${JSON.stringify(ticketData)}`);
  try {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(ticketData)
      const options = {
        hostname: '127.0.0.1',
        port: 3001,
        path: '/api/check-ticket',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      }
      
      console.log('IPC HANDLER: check-ticket - Sending HTTP request to API server with options:', options);
      const req = http.request(options, (res) => {
        let data = ''
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            console.log(`IPC HANDLER: check-ticket - API response: ${JSON.stringify(result)}`);
            resolve(result);
          } catch (parseError) {
            console.error(`IPC HANDLER: check-ticket - Failed to parse API response: ${parseError}. Raw data: ${data}`);
            reject(parseError);
          }
        });
      });
      req.on('error', (httpError) => {
        console.error(`IPC HANDLER: check-ticket - HTTP request to API server failed: ${httpError}`);
        reject(httpError);
      });
      req.write(postData);
      req.end();
    });
  } catch (error) {
    console.error('IPC HANDLER: check-ticket error:', error);
    throw error;
  }
})

function createWindow() {
  console.log('Attempting to create main window...');
  try {
    win = new BrowserWindow({
      width: 900,
      height: 640,
      show: false, // Use 'ready-to-show' event
      webPreferences: {
        preload: preloadScriptPath,
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true, // Recommended for production
        allowRunningInsecureContent: false, // Recommended for production
        devTools: process.env.NODE_ENV !== 'production', // Open DevTools in dev mode
      },
    });

    console.log('Main window created. Adding event listeners...');

    win.once('ready-to-show', () => {
      console.log('Main window is ready to show. Showing window.');
      win?.show();
    });

    win.on('focus', () => console.log('Main window focused.'));
    win.on('blur', () => console.log('Main window blurred.'));
    win.on('closed', () => {
      console.log('Main window closed.');
      win = null;
    });
    win.on('unresponsive', () => console.warn('Main window has become unresponsive!'));
    win.on('responsive', () => console.log('Main window has become responsive again.'));
    // win.on('crash', (event, killed) => console.error(`Main window CRASHED! Killed: ${killed}`, event)); // This was incorrect


    const wc = win.webContents;
    wc.on('did-start-loading', () => console.log('webContents: did-start-loading'));
    wc.on('dom-ready', () => console.log('webContents: dom-ready'));
    wc.on('did-finish-load', () => console.log('webContents: did-finish-load'));
    wc.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
      console.error(`webContents: did-fail-load. URL: ${validatedURL}, Code: ${errorCode}, Desc: ${errorDescription}`);
    });
    wc.on('crashed', (event: Electron.Event, killed: boolean) => console.error(`webContents: CRASHED! Killed: ${killed}`, event)); // Corrected event and typed parameters
    wc.on('render-process-gone', (event, details) => console.error(`webContents: render-process-gone! Reason: ${details.reason}`, event, details));
    wc.on('did-stop-loading', () => console.log('webContents: did-stop-loading'));


    // 音频权限 - This might not be necessary if not directly using microphone/camera
    // win.webContents.session.setPermissionRequestHandler(
    //   (webContents, permission, callback) => {
    //     if (permission === 'media') {
    //       console.log('Granting media permission.');
    //       return callback(true);
    //     }
    //     callback(true); // Default grant other permissions
    //   }
    // );
    
    const devServerUrl = process.env.VITE_DEV_SERVER_URL;
    console.log(`VITE_DEV_SERVER_URL: ${devServerUrl || 'Not set (production mode expected)'}`);
    
    if (devServerUrl) {
      console.log(`Loading URL: ${devServerUrl}`);
      win.loadURL(devServerUrl)
        .then(() => console.log(`Successfully loaded URL: ${devServerUrl}`))
        .catch(err => console.error(`Failed to load URL ${devServerUrl}:`, err));
    } else {
      console.log(`Loading file: ${indexHtml}`);
      win.loadFile(indexHtml)
        .then(() => console.log(`Successfully loaded file: ${indexHtml}`))
        .catch(err => console.error(`Failed to load file ${indexHtml}:`, err));
    }

  } catch (error) {
    console.error('Error during createWindow:', error);
    // Potentially quit app if window creation fails critically
    // app.quit();
  }
}

// Global error handlers
process.on('uncaughtException', (error, origin) => {
  console.error(`UNCAUGHT EXCEPTION: Origin: ${origin}`, error);
  // Consider app.quit() in production for unrecoverable errors
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION at:', promise, 'reason:', reason);
});

app.on('ready', () => { // Changed from whenReady().then() to direct event for clarity
  console.log('App "ready" event fired.');
  

  console.log('Starting API server...');
  try {
    startApiServer();
    console.log('API server started successfully.');
  } catch (error) {
    console.error('Failed to start API server:', error);
  }

  console.log('Setting up ticket update callback...');
  try {
    setTicketUpdateCallback((ticketData) => {
      console.log(`Received ticket update from API server: ${JSON.stringify(ticketData)}`);
      if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
        console.log('Sending "ticket-updated" event to renderer process.');
        win.webContents.send('ticket-updated', ticketData);
      } else {
        console.warn('Window or webContents not available to send "ticket-updated" event.');
      }
    });
    console.log('Ticket update callback set.');
  } catch (error) {
    console.error('Failed to set ticket update callback:', error);
  }
  
  createWindow();
});

app.on('window-all-closed', () => {
  console.log('All windows closed.');
  if (process.platform !== 'darwin') {
    console.log('Quitting application (not macOS).');
    app.quit();
  }
});

app.on('activate', () => {
  console.log('App "activate" event fired.');
  if (BrowserWindow.getAllWindows().length === 0) {
    console.log('No windows open, creating new window.');
    createWindow();
  }
});

app.on('before-quit', (event) => {
  console.log('App "before-quit" event fired.');
  // event.preventDefault(); // Example: to prevent quitting
});

app.on('will-quit', (event) => {
  console.log('App "will-quit" event fired.');
  // event.preventDefault(); // Example: to prevent quitting
});

app.on('quit', (event, exitCode) => {
  console.log(`App "quit" event fired. Exit code: ${exitCode}`);
});