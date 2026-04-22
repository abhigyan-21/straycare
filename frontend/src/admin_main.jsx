import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp'
import { AuthProvider } from './context/AuthContext'

ReactDOM.createRoot(document.getElementById('admin-root')).render(
  <React.StrictMode>
    <AuthProvider>
      <AdminApp />
    </AuthProvider>
  </React.StrictMode>
)
