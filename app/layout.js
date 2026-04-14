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
  title: {
    default: 'Maple Hub — MapleStory 角色查詢・戰力排行・成長追蹤',
    template: '%s | Maple Hub',
  },
  description:
    '免費的 MapleStory TW 角色查詢工具，即時查看戰鬥力、裝備、六轉核心、聯盟資訊，追蹤角色成長歷程，瀏覽戰力排行榜。',
  keywords: [
    'MapleStory',
    '新楓之谷',
    '角色查詢',
    '戰鬥力',
    '戰力排行',
    '裝備',
    '六轉',
    'HEXA',
    '聯盟',
    '成長追蹤',
  ],
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Maple Hub',
    locale: 'zh_TW',
    title: 'Maple Hub — MapleStory 角色查詢・戰力排行・成長追蹤',
    description:
      '免費的 MapleStory TW 角色查詢工具，即時查看戰鬥力、裝備、六轉核心、聯盟資訊，追蹤角色成長歷程，瀏覽戰力排行榜。',
  },
  alternates: {
    canonical: '/',
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
    document.documentElement.style.colorScheme = mode;
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
