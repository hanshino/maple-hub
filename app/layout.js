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

// 應用程式啟動時驗證環境變數（跳過 Docker build 階段）
if (typeof window === 'undefined' && !process.env.NEXT_BUILD_PHASE) {
  validateEnvironmentOnLoad();
}

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://maple-hub.hanshino.dev'
  ),
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
          <main id="main-content">
            <PageTransition>{children}</PageTransition>
          </main>
        </MuiThemeProvider>
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            defer
            src={`${process.env.NEXT_PUBLIC_UMAMI_URL || 'https://umami.hanshino.dev'}/script.js`}
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
