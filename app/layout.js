import Script from 'next/script';
import './globals.css';
import Navigation from '../components/Navigation';
import MuiThemeProvider from '../components/MuiThemeProvider';
import PageTransition from '../components/PageTransition';
import { validateEnvironmentOnLoad } from '../lib/envValidation';

// 導入楓之谷主題字體
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';

// 應用程式啟動時驗證環境變數
if (typeof window === 'undefined') {
  validateEnvironmentOnLoad();
}

export const metadata = {
  title: 'Maple Hub',
  description: 'MapleStory 角色資訊儀表板',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-tw" suppressHydrationWarning>
      <head>
        <Script id="color-mode-init" strategy="beforeInteractive">
          {`(function() {
  try {
    var mode = localStorage.getItem('color-mode');
    if (!mode) {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-color-mode', mode);
    if (mode === 'dark') {
      document.documentElement.style.backgroundColor = '#1a1210';
    }
  } catch(e) {}
})()`}
        </Script>
      </head>
      <body>
        <MuiThemeProvider>
          <Navigation />
          <PageTransition>{children}</PageTransition>
        </MuiThemeProvider>
      </body>
    </html>
  );
}
