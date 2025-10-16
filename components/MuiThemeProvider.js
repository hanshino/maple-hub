'use client'

import { createTheme, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#f7931e', // 🍊 主橘色，屋頂顏色
      light: '#ffb347',
      dark: '#cc6e00',
      contrastText: '#fff',
    },
    secondary: {
      main: '#8c6239', // 🪵 木頭色（門、家具）
      light: '#b07d52',
      dark: '#5e3f22',
      contrastText: '#fff',
    },
    background: {
      default: '#fff7ec', // 🏡 奶油色背景（牆面）
      paper: '#fff3e0',   // 柔和的卡片底色
    },
    text: {
      primary: '#4e342e',  // 深棕文字
      secondary: '#6d4c41', // 淺棕次文字
    },
    success: {
      main: '#7cb342', // 🌿 綠意（楓之谷樹木元素）
    },
    error: {
      main: '#e53935', // 🍎 鮮紅（地圖傳送門、怪物）
    },
    warning: {
      main: '#ffa726', // ⚠️ 黃橙提醒
    },
    info: {
      main: '#4fc3f7', // 💧 藍色 UI 元素
    },
  },
  shape: {
    borderRadius: 16, // 圓潤可愛的風格
  },
  typography: {
    fontFamily: '"Nunito", "Noto Sans TC", "Comic Neue", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
  },
})

export default function MuiThemeProvider({ children }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}