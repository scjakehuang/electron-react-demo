import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { startApiServer, setTicketUpdateCallback } from '../server/api'
import http from 'http'

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

// 添加 IPC 处理器用于获取配置
ipcMain.handle('get-config', async () => {
  log('IPC: get-config 被调用')
  return {
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
  }
})

// 添加 IPC 处理器用于检票
ipcMain.handle('check-ticket', async (_, ticketData) => {
  log(`IPC: check-ticket 被调用，数据: ${JSON.stringify(ticketData)}`)
  
  // 向本地 API 服务器发送请求
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
    
    const req = http.request(options, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const result = JSON.parse(data)
          log(`API响应: ${JSON.stringify(result)}`)
          resolve(result)
        } catch (error) {
          log(`解析API响应失败: ${error}`)
          reject(error)
        }
      })
    })
    
    req.on('error', (error) => {
      log(`API请求失败: ${error}`)
      reject(error)
    })
    
    req.write(postData)
    req.end()
  })
})

function createWindow() {
  try {
    log('开始创建窗口')
    
    // 使用最简单的窗口配置
    win = new BrowserWindow({
      width: 1200,
      height: 800,
      show: true, // 直接显示窗口
      webPreferences: {
        // 启用preload脚本
        preload: preloadScriptPath,
        nodeIntegration: false,
        contextIsolation: true,
        // 添加对音频的支持
        webSecurity: false, // 允许加载本地资源
        allowRunningInsecureContent: true, // 允许运行不安全内容
      },
    })
    
    // 音频权限
    win.webContents.session.setPermissionRequestHandler(
      (webContents, permission, callback) => {
        if (permission === 'media') {
          log('授予媒体权限');
          return callback(true);
        }
        callback(true);
      }
    );
    
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
  log('应用程序 ready 事件触发')

  // 启动 API 服务
  log('正在启动 API 服务...')
  startApiServer()
  log('API 服务启动完成')

  // 设置检票更新回调
  setTicketUpdateCallback((ticketData) => {
    log(`收到API服务检票更新通知: ${JSON.stringify(ticketData)}`)
    if (win && !win.isDestroyed()) {
      win.webContents.send('ticket-updated', ticketData)
      log('已向渲染进程发送检票更新事件')
    }
  })

  // 创建并显示窗口
  createWindow()
})

app.on('window-all-closed', () => {
  log('所有窗口已关闭')
  app.quit() // 始终退出应用以简化调试
})