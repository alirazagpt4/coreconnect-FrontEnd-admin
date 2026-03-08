import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext' // 👈 Import karein
import { ThemeProvider } from '@mui/material/styles'
import theme from './themes/theme.js' // Jo humne pehle banaya tha


ReactDOM.createRoot(document.getElementById('root')).render(

    <ThemeProvider theme={theme}>
      <AuthProvider> {/* 👈 Poori App ko wrap kar diya */}
        <App />
      </AuthProvider>
    </ThemeProvider>
 
)