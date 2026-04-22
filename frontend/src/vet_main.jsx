import React from 'react'
import ReactDOM from 'react-dom/client'
import VetApp from './VetApp'
import { AuthProvider } from './context/AuthContext'
import "leaflet/dist/leaflet.css";

ReactDOM.createRoot(document.getElementById('vet-root')).render(
  <React.StrictMode>
    <AuthProvider>
      <VetApp />
    </AuthProvider>
  </React.StrictMode>
)
