import { ipcMain, BrowserWindow } from 'electron'
import { exec, spawn } from 'child_process'
import axios from 'axios'
import { IPC_CHANNEL } from '../enums'
import { getConfig, getAppPath } from './configLoader'
import {getUserConfig,setUserConfig} from '../services/auth'

const initMainExtend = () => {
  ipcMain.on('ipc-example', (event, ...args) => {
    console.log('[Receive Renderer-process message]:', ...args, event)
    event.sender.send(
      'ipc-message',
      'main-process-reply',
      ...args,
      JSON.stringify(event)
    )
  })

  ipcMain.handle(IPC_CHANNEL.IPC_ASYNC_INFO, async (event, ...args) => {
    console.log('[Receive Renderer-process message]:', ...args)
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('main-process-reply')
      }, 2000)
    })
  })

  ipcMain.handle(IPC_CHANNEL.IPC_GET_WINDOW_INFO, (event, ...args) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (!window) return null
    return {
      width: window.getSize()[0],
      height: window.getSize()[1],
      x: window.getPosition()[0],
      y: window.getPosition()[1],
      isMaximized: window.isMaximized(),
      isFullScreen: window.isFullScreen()
    }
  })

  ipcMain.handle(IPC_CHANNEL.IPC_HTTP_REQUEST, (event, ...args) => {
    return new Promise((resolve, reject) => {
      axios({
        method: args[1] || 'get',
        url: args[0] || '',
        ...(args[2] || {})
      })
        .then(response => {
          resolve(response.data)
        })
        .catch(error => {
          reject(error)
        })
    })
  })

  ipcMain.handle(
    IPC_CHANNEL.IPC_LAUNCH_APP,
    (event, { appPath, args = [] }) => {
      return new Promise((resolve, reject) => {
        // 跨平台处理
        const command =
          process.platform === 'win32'
            ? `"${appPath}" ${args.join(' ')}` // Windows 需要引号包裹路径
            : `open "${appPath}" ${args.join(' ')}` // macOS 使用 open 命令

        // console.log('Launching command:', command)

        // 使用 spawn 实现更精细控制
        const child = spawn(
          process.platform === 'win32' ? appPath : 'open',
          process.platform === 'win32' ? args : ['-a', appPath, ...args],
          { shell: true }
        )

        // 监听结果
        child.on('error', (err: { message: any }) => {
          reject(`启动失败: ${err.message}`)
        })

        child.on('exit', (code: number) => {
          if (code === 0) {
            resolve('程序已启动')
          } else {
            reject(`程序异常退出，代码: ${code}`)
          }
        })
      })
    }
  )

  ipcMain.handle(IPC_CHANNEL.IPC_GET_APP_PATH, (event, appName) => {
    return new Promise((resolve, reject) => {
      const appPath = getAppPath(appName)
      if (appPath) {
        resolve(appPath)
      } else {
        reject(`未找到 ${appName} 的路径`)
      }
    })
  })

  ipcMain.handle(IPC_CHANNEL.IPC_GET_CONFIG, (event) => {
    return new Promise((resolve, reject) => {
      const config = getConfig()
      if (config) {
        resolve(config)
      } else {
        reject(`未找到的配置`)
      }
    })
  })

  ipcMain.handle(IPC_CHANNEL.IPC_USER_CONFIG, (event, ...data) => {
    console.log('[Receive Renderer-process message]:', ...data)
    if (data[0] === 'set') {
     return setUserConfig(data[1])
    }
    return getUserConfig()
  })
}

export default initMainExtend
