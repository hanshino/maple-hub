import './globals.css';
import Navigation from '../components/Navigation';
import MuiThemeProvider from '../components/MuiThemeProvider';

// 導入楓之谷主題字體
import '@fontsource/nunito/300.css';
import '@fontsource/nunito/400.css';
import '@fontsource/nunito/500.css';
import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/comic-neue/400.css';
import '@fontsource/comic-neue/700.css';

export const metadata = {
  title: 'Maple Hub',
  description: 'MapleStory 角色資訊儀表板',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MuiThemeProvider>
          <Navigation />
          {children}
        </MuiThemeProvider>
      </body>
    </html>
  );
}
