import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import logger from '../services/logger'

// 获取开发环境的默认配置路径
function getDefaultConfigPath () {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'config/apps.json') // 打包后的路径
    : path.join(app.getAppPath(), 'config/apps.json') // 开发环境路径
}

// 获取用户数据目录的配置路径
function getConfigPath () {
  // 暂时修改为文档目录，后期需要修改为用户数据目录
  // const userDataPath = app.getPath('userData')
  const documentsPath = app.getPath('documents')
  const configDirectory = path.join(documentsPath, app.getName())
  return path.join(configDirectory, 'app-config.json')
}

// 获取第三方APPPath
export function getAppPath (appName: string | number) {
  // 优先加载用户配置
  const userConfig = safeLoadConfig(getConfigPath())
  const currentPlatform = process.platform
  const platformMap = {
    win32: 'windows',
    darwin: 'macOS',
    linux: 'linux'
  }
  const currentPlatformName =
    platformMap[currentPlatform as keyof typeof platformMap] || 'unknown'

  // 如果用户配置未定义，则加载默认配置
  if (!userConfig.allowedApps?.[appName]) {
    const defaultConfig = safeLoadConfig(getDefaultConfigPath())
    return defaultConfig.allowedApps?.[appName]?.[currentPlatformName]
  }

  // 优先级：用户自定义路径 > 用户配置的白名单路径
  return (
    userConfig.customPaths?.[appName]?.[currentPlatformName] ||
    userConfig.allowedApps?.[appName]?.[currentPlatformName]
  )
}

function safeLoadConfig (configPath: fs.PathOrFileDescriptor) {
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  } catch (error) {
    logger.error('配置文件加载失败:', configPath, error)
    return { allowedApps: {}, customPaths: {} }
  }
}

// 加载配置文件
export function loadConfig () {
  try {
    const configPath = getConfigPath()
    // 首次运行自动创建配置文件
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        allowedApps: {},
        customPaths: {}
      }
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2))
    }
    const rawData = fs.readFileSync(configPath, 'utf-8')
    return JSON.parse(rawData)
  } catch (error) {
    console.error('配置文件加载失败:', error)
    return { allowedApps: {}, customPaths: {} }
  }
}

//
export function getConfig () {
  // 优先加载用户配置
  const userConfig = safeLoadConfig(getConfigPath())
  return userConfig
}

// 初始化配置文件
const initConfig = () => {
  try {
    loadConfig()
  } catch (error) {
    logger.error('配置文件初始化失败:', error)
    const configPath = getConfigPath()
    // 创建空配置
    fs.writeFileSync(
      configPath,
      JSON.stringify(
        {
          version: '1.0.0',
          allowedApps: {},
          customPaths: {}
        },
        null,
        2
      )
    )
  }
}

export default initConfig
