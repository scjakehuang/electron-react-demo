import { ipcMain,BrowserWindow } from 'electron'
import axios from 'axios'

export const IPC_CHANNEL = {
  IPC_MESSAGE: 'ipc-message',
  IPC_HTTP_REQUEST: 'ipc-httpRequest',
  IPC_ASYNC_INFO: 'ipc-async-info',
  IPC_GET_WINDOW_INFO: 'get-window-info',
}

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

  ipcMain.handle(IPC_CHANNEL.IPC_HTTP_REQUEST, (event, ...args) => {
    return new Promise((resolve, reject) => {
      axios({
        method: args[1]||  'get',
        url: args[0] || '',
        ...args[2] || {},
      }).then((response) => {
        resolve(response.data)
      }).catch((error) => {
        reject(error)
      })
    })  
  })
  
}

export default initMainExtend
