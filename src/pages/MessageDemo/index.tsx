import { useEffect, memo, useState } from 'react'
import axios from 'axios'

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
      </div>
    </div>
  )
}

export default MessageDemo
