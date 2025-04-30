import { useEffect, memo, useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from './assets/logo-vite.svg'
import logoElectron from './assets/logo-electron.svg'
import './App.css'

// Extend the Window interface to include electronApi


const Button = memo(() => {
  useEffect(() => {
    window.ipcRenderer.on('ipc-demo', (event, args) => {
      console.log('[信息来自主进程]:', args)
    })
  }, [])

  return (
    <button
      onClick={() => {
        window.ipcRenderer.send('ipc-example', {
          url: 'http://localhost:3000'
        })
      }}
    >
      向主进程发送消息
    </button>
  )
})

const AsyncButton = memo(() => {
  useEffect(() => {
    window.ipcRenderer.on('ipc-demo', (event, args) => {
      console.log('[信息来自主进程]:', args)
    })
    console.warn('渲染')
  }, [])

  return (
    <button
      onClick={async () => {
        const res = await window.ipcRenderer.invoke('ipc-async-info', {
          data: '123'
        })
        console.log('invoke res:', res)
      }}
    >
      获取文件信息
    </button>
  )
})

function App () {
  const [count, setCount] = useState(0)

  return (
    <div className='App'>
      <div className='logo-box'>
        <a
          href='https://github.com/electron-vite/electron-vite-react'
          target='_blank'
        >
          <img
            src={logoVite}
            className='logo vite'
            alt='Electron + Vite logo'
          />
          <img
            src={logoElectron}
            className='logo electron'
            alt='Electron + Vite logo'
          />
        </a>
      </div>
      <h1 className='content'>Electron + Vite + React: docker pack v0.2.3</h1>
      <div className='card'>
        <button onClick={() => setCount(count => count + 1)}>
          count is {count}
        </button>
        <Button></Button>
        <AsyncButton></AsyncButton>
        <button
          onClick={async () => {
            const winInfo = await window.electronApi.getWindowInfo();
            if (winInfo) {
              console.log('窗口信息:', winInfo);
            } else {
              console.warn('electronApi or getWindowInfo is undefined');
            }
          }}
        >
          获取窗口信息
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className='read-the-docs'>
        Click on the Electron + Vite logo to learn more
      </p>
      <div className='flex-center'>
        Place static files into the<code>/public</code> folder{' '}
        <img style={{ width: '5em' }} src='./node.svg' alt='Node logo' />
      </div>
      <UpdateElectron />
    </div>
  )
}

export default App
