import { ipcMain,BrowserWindow } from 'electron'

const initMainExtend = () => {
  ipcMain.on('ipc-example', (event, ...args) => {
    console.log('[Receive Renderer-process message]:', ...args, event )
    event.sender.send('ipc-message', 'main-process-reply', ...args, JSON.stringify(event))
  })

  ipcMain.handle('ipc-async-info', async (event, ...args) => {
    console.log('[Receive Renderer-process message]:', ...args)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('main-process-reply')
      }, 2000)
    })
  })
  
  ipcMain.handle('get-window-info', (event, ...args) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return null;
    return {
      width: window.getSize()[0],
      height: window.getSize()[1],
      x: window.getPosition()[0],
      y: window.getPosition()[1],
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen(),
    };
  })
}

export default initMainExtend
