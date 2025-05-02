import { useEffect, memo, useState } from 'react'
import UpdateElectron from '@/components/update'
import logoVite from '@/assets/logo-vite.svg'
import logoElectron from '@/assets/logo-electron.svg'
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom'
import OfficalDemo from '@/pages/OfficialDemo'
import MessageDemo from '@/pages/MessageDemo'
import './App.css'

function App () {
  const [count, setCount] = useState(0)

  return (
    <BrowserRouter>
      <div className='nav-bar'>
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
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/official">Electron + Vite + React 官方示例</Link>
            </li>
          </ul>
        </nav>
      </div>
      <Routes>
        <Route path='/' element={<MessageDemo />} />
        {/* <Route path='/about' element={<About />} />  */}
        <Route path='/official' element={<OfficalDemo />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
