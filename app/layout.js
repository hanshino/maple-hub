import './globals.css';
import Navigation from '../components/Navigation';
import MuiThemeProvider from '../components/MuiThemeProvider';
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
    <html lang="zh-tw">
      <body>
        <MuiThemeProvider>
          <Navigation />
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
