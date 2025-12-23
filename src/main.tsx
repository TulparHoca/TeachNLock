import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// DİKKAT: HashRouter kullanıyoruz!
import { HashRouter } from 'react-router-dom' 
import { LockProvider } from './context/LockContext'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LockProvider>
      {/* BrowserRouter YERİNE HashRouter KULLAN */}
      <HashRouter>
        <App />
      </HashRouter>
    </LockProvider>
  </React.StrictMode>,
)