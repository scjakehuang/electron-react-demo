import log from 'electron-log/main'
import { app } from 'electron'
import path from 'path'

const appDataDirectory = app.getPath('appData') // 获取应用数据目录
const documentsDirectory = app.getPath('documents') // 获取文档目录

// const prodLogPath = path.join(appDataDirectory, 'electron-demo', 'logs')
const prodLogPath = path.join(documentsDirectory, app.getName(), 'logs')

// 根据环境设置日志目录
const isDevelopment = !app.isPackaged // 判断是否为开发环境
const logDirectory = isDevelopment
  ? path.join(process.cwd(), 'logs') // 开发环境：项目根目录下的 logs 文件夹
  : prodLogPath // 生产环境：appData 下的 logs 文件夹

// 确保日志目录存在
import { mkdirSync, existsSync } from 'fs'
if (!existsSync(logDirectory)) {
  mkdirSync(logDirectory, { recursive: true })
}

// 自定义日志文件路径，按天分割
log.transports.file.resolvePathFn = () => {
    const date = new Date()
    const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    return path.join(logDirectory, `${dateStr}.log`)
  }

// 配置日志输出
log.transports.console.level = isDevelopment ? 'debug' : false // 开发环境输出到控制台，生产环境关闭控制台输出
log.transports.file.level = 'silly' // 文件日志级别
log.transports.file.maxSize = 10 * 1024 * 1024 // 文件最大不超过 10MB
log.transports.file.format =
  '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}]{scope} {text}'

// 初始化日志
log.initialize();

export default log