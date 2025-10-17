import Link from 'next/link';
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';

export default function Navigation() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          遊戲儀表板
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button color="inherit" component={Link} href="/">
            首頁
          </Button>
          <Button color="inherit" component={Link} href="/dashboard">
            儀表板
          </Button>
          <Button color="inherit" component={Link} href="/dashboard-progress">
            進度
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
