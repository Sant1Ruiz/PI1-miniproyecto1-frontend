import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from "./context/AuthContext"
import { ActivityStatsProvider } from "./context/ActivityStatsContext"

import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ActivityStatsProvider>
          <App />
        </ActivityStatsProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
