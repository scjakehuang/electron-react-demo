import { app, BrowserWindow } from 'electron'
import path from 'node:path'
// 暂时注释掉API服务，排除其可能导致的崩溃
// import { startApiServer } from '../server/api'

// 简单的控制台日志辅助函数
const log = (message: string) => {
  console.log(`[${new Date().toISOString()}] ${message}`)
}

// 程序启动时记录日志
log('应用程序启动')

let win: BrowserWindow | null = null
// __dirname in CJS (after Vite build) will be dist-electron/main/
const preloadScriptPath = path.join(__dirname, '../preload/index.js')
const indexHtml = path.join(__dirname, '../../dist/index.html')

// 暂时注释掉API服务启动
// startApiServer()

// 简单版本的IPC处理，避免可能的错误
// ipcMain.handle('get-config', () => {...})

function createWindow() {
  try {
    log('开始创建窗口')
    
    // 使用最简单的窗口配置
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true, // 直接显示窗口
      webPreferences: {
        // 暂时禁用preload，排除它可能导致的问题
        // preload: preloadScriptPath,
        nodeIntegration: true,
        contextIsolation: false,
      },
    })
    
    log('窗口已创建')

    // 开发模式直接显示开发者工具
    win.webContents.openDevTools()
    
    // 显示状态日志
    win.on('show', () => log('窗口已显示'))
    win.on('hide', () => log('窗口已隐藏'))
    win.on('close', () => log('窗口关闭中'))

    // 简化内容加载逻辑
    const devServerUrl = process.env.VITE_DEV_SERVER_URL
    log(`开发服务器URL: ${devServerUrl || '未设置'}`)
    
    if (devServerUrl) {
      log(`尝试加载: ${devServerUrl}`)
      win.loadURL(devServerUrl)
        .then(() => log('URL加载成功'))
        .catch(err => log(`URL加载失败: ${err}`))
    } else {
      log(`尝试加载文件: ${indexHtml}`)
      win.loadFile(indexHtml)
        .then(() => log('文件加载成功'))
        .catch(err => log(`文件加载失败: ${err}`))
    }

    win.on('closed', () => {
      win = null
      log('窗口已关闭')
    })

  } catch (err) {
    log(`窗口创建失败: ${err}`)
    // 记录详细的错误堆栈
    if (err instanceof Error) {
      log(`错误堆栈: ${err.stack}`)
    }
  }
}

// 确保任何未捕获的异常都被记录下来
process.on('uncaughtException', (error) => {
  log(`未捕获的异常: ${error}`)
  if (error.stack) log(`堆栈: ${error.stack}`)
})

app.whenReady().then(() => {
  log('应用程序ready事件触发')
  createWindow()
})

app.on('window-all-closed', () => {
  log('所有窗口已关闭')
  app.quit() // 始终退出应用以简化调试
})
