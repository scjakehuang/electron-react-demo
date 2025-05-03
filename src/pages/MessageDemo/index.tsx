import { useEffect, memo, useState } from 'react'
import axios from 'axios'
import log from 'electron-log/renderer'

const MessageDemo = () => {
  return (
    <div className='flex flex-col items-start justify-start h-screen'>
      <h2>消息通信示例</h2>
      <div className='flex flex-col items-start justify-start'>
        <p>http通信</p>
        <button
          onClick={() => {
            axios({
              method: 'get',
              url: 'http://www.baidu.com',
              params: {
                ID: 12345
              }
            })
              .then(function (response) {
                // 处理成功情况
                console.log('请求成功', response)
              })
              .catch(function (error) {
                // 处理错误情况
                console.log(error)
              })
              .finally(function () {
                // 总是会执行
              })
          }}
        >
          http请求【去除跨域限制】
        </button>
        <button
          onClick={() => {
            window.electronApi
              .httpRequest('http://www.baidu.com', 'get', {
                params: {
                  ID: 12345
                }
              })
              .then(function (response) {
                // 处理成功情况
                console.log('请求成功', response)
              })
              .catch(function (error) {
                // 处理错误情况
                console.log(error)
              })
          }}
        >
          主线程代理转发
        </button>
        <button
          onClick={() => {
            log.info('Log from the renderer process')
            log.error('Error from the renderer process', { scope: 'test' })
            log.warn('Warn from the renderer process', { scope: 'test' })
            log.debug('Debug from the renderer process', { scope: 'test' })
            log.silly('Silly from the renderer process', { scope: 'test' })
            log.verbose('Verbose from the renderer process', { scope: 'test' })
          }}
        >
          生成日志
        </button>
        <button onClick={async () => {
          console.log('调用其他程序', window.electronApi)
          try {
            const result = await window.electronApi.lauchApp('Safari', ['http://www.baidu.com']);
          } catch (error) {
            log.error('Error Launch App:', error)
          }
        }}>
          调用其他程序
        </button>
        <button
          onClick={async () => {
            try {
              const result = await window.electronApi.getAppPath('vscode')
              log.info('获取vscode路径', result)
            } catch (error) {       
              log.error('Error 获取App路径:', error)
            }
          }}
        >
          获取config中vscode启动路径
        </button>
        <button
          onClick={async () => {
            try {
              const result = await window.electronApi.getConfig()
              log.info('获取config', result)
            } catch (error) {       
              log.error('Error 获取onfig:', error)
            }
          }}
        >
          获取config
        </button>
      </div>
    </div>
  )
}

export default MessageDemo
