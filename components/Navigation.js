import Link from 'next/link';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';

export default function Navigation() {
  return (
    <AppBar position="static" color="primary">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/"
          sx={{
            flexGrow: 1,
            textDecoration: 'none',
            color: 'inherit',
            '&:hover': {
              textDecoration: 'underline',
            },
          }}
        >
          Maple Hub
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {/* 移除首頁按鈕，讓標題本身就是鏈接 */}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
