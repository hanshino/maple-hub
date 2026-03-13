'use client';

import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import TimelineIcon from '@mui/icons-material/Timeline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import BackpackIcon from '@mui/icons-material/Backpack';
import GitHubIcon from '@mui/icons-material/GitHub';
import BugReportIcon from '@mui/icons-material/BugReport';
import StorageIcon from '@mui/icons-material/Storage';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import { FaCanadianMapleLeaf, FaDiscord } from 'react-icons/fa';
import Link from 'next/link';
import { useColorMode } from '../../components/MuiThemeProvider';

const FEATURES = [
  {
    icon: SearchIcon,
    title: '角色查詢',
    description: '打名字就能看到角色的完整資料，不用自己算',
  },
  {
    icon: EqualizerIcon,
    title: '能力值分析',
    description: '用雷達圖看素質配點平不平衡，哪邊該補一目了然',
  },
  {
    icon: BackpackIcon,
    title: '裝備檢視',
    description: '裝備、套裝效果、潛能通通列出來，方便跟朋友比較',
  },
  {
    icon: TimelineIcon,
    title: '經驗值追蹤',
    description: '每天記錄經驗值變化，練到懷疑人生時回來看看其實有在動',
  },
  {
    icon: AutoFixHighIcon,
    title: '六轉核心',
    description: 'HEXA 核心跟能力值強化到幾等，點進來就知道',
  },
  {
    icon: LeaderboardIcon,
    title: '戰力排行',
    description: '戰力排行榜，看看自己排第幾、離前面的人差多少',
  },
];

const TECH_STACK = [
  'Next.js 15',
  'React 19',
  'MUI 7',
  'Tailwind CSS 4',
  'Drizzle ORM',
  'MySQL',
  'Redis',
  'Docker',
];

export default function AboutPage() {
  const { mode } = useColorMode();

  const glassCardSx = {
    borderRadius: 3,
    border: '1px solid',
    borderColor:
      mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(247,147,30,0.15)',
    bgcolor: mode === 'dark' ? 'rgba(42,31,26,0.6)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow:
        mode === 'dark'
          ? '0 8px 24px rgba(0,0,0,0.3)'
          : '0 8px 24px rgba(247,147,30,0.12)',
    },
  };

  const linkBtnSx = {
    border: '1px solid',
    borderColor:
      mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
    borderRadius: '10px',
    width: 36,
    height: 36,
    '&:hover': {
      bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
    },
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 7 } }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 72,
            height: 72,
            borderRadius: '20px',
            bgcolor: 'primary.main',
            color: '#fff',
            mb: 2.5,
            boxShadow: '0 4px 20px rgba(247,147,30,0.3)',
          }}
        >
          <FaCanadianMapleLeaf size={36} />
        </Box>
        <Typography
          variant="h3"
          component="h1"
          sx={{ fontWeight: 800, mb: 1.5 }}
        >
          Maple Hub
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ fontWeight: 400, maxWidth: 520, mx: 'auto', lineHeight: 1.6 }}
        >
          查角色資料不用再翻一堆網頁了，搜一下就有
        </Typography>
      </Box>

      {/* Features Section */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          可以做什麼
        </Typography>
        <Grid container spacing={2}>
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <Grid size={{ xs: 12, sm: 6 }} key={title}>
              <Card elevation={0} sx={{ ...glassCardSx, height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        bgcolor:
                          mode === 'dark'
                            ? 'rgba(247,147,30,0.15)'
                            : 'rgba(247,147,30,0.1)',
                        color: 'primary.main',
                        flexShrink: 0,
                      }}
                    >
                      <Icon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, mb: 0.5 }}
                      >
                        {title}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ lineHeight: 1.6 }}
                      >
                        {description}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Tech Stack Section */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          用了哪些技術
        </Typography>
        <Card elevation={0} sx={glassCardSx}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {TECH_STACK.map(tech => (
                <Chip
                  key={tech}
                  label={tech}
                  variant="outlined"
                  sx={{
                    borderColor:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.15)'
                        : 'rgba(247,147,30,0.3)',
                    fontWeight: 600,
                    px: 0.5,
                  }}
                />
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Data Source Section */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          資料哪來的
        </Typography>
        <Card elevation={0} sx={glassCardSx}>
          <CardContent
            sx={{
              p: 3,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor:
                  mode === 'dark'
                    ? 'rgba(79,195,247,0.15)'
                    : 'rgba(79,195,247,0.1)',
                color: 'info.main',
                flexShrink: 0,
              }}
            >
              <StorageIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                Nexon Open API
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1.6 }}
              >
                資料都是從 Nexon 官方的 Open API
                拉的，每天更新。這邊只負責把資料整理好給你看，不會存你的帳號密碼。
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ mb: { xs: 5, md: 7 } }} />

      {/* Author Section */}
      <Box sx={{ mb: { xs: 5, md: 7 } }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, mb: 3 }}>
          我是誰
        </Typography>
        <Card elevation={0} sx={glassCardSx}>
          <CardContent sx={{ p: 3 }}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' },
                gap: 2.5,
              }}
            >
              <Avatar
                alt="hanshino"
                src="https://github.com/hanshino.png"
                sx={{ width: 72, height: 72, flexShrink: 0 }}
              />
              <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                  hanshino
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ lineHeight: 1.6, mb: 2 }}
                >
                  六轉開放才回歸的 MS 寶，坐牢之餘靠 Vibe Coding
                  打造了本網站，希望能讓大家查角色資料更方便一點。
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1,
                    justifyContent: { xs: 'center', sm: 'flex-start' },
                    alignItems: 'center',
                  }}
                >
                  <Chip
                    component={Link}
                    href="/?name=影之愛衣"
                    icon={<SportsEsportsIcon sx={{ fontSize: 16 }} />}
                    label="影之愛衣"
                    clickable
                    size="small"
                    sx={{
                      height: 36,
                      px: 1.5,
                      fontWeight: 600,
                      borderColor:
                        mode === 'dark'
                          ? 'rgba(255,255,255,0.15)'
                          : 'rgba(0,0,0,0.12)',
                      color: 'text.primary',
                      '&:hover': {
                        bgcolor:
                          mode === 'dark'
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.04)',
                      },
                    }}
                    variant="outlined"
                  />
                  <Tooltip title="GitHub" arrow>
                    <IconButton
                      component="a"
                      href="https://github.com/hanshino"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="GitHub 個人頁面"
                      size="small"
                      sx={linkBtnSx}
                    >
                      <GitHubIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Issues" arrow>
                    <IconButton
                      component="a"
                      href="https://github.com/hanshino/maple-hub/issues"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="回報問題"
                      size="small"
                      sx={linkBtnSx}
                    >
                      <BugReportIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="hanshino17" arrow>
                    <IconButton
                      component="a"
                      href="https://discord.com/users/542332441478823947"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Discord: hanshino17"
                      size="small"
                      sx={linkBtnSx}
                    >
                      <FaDiscord size={20} />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Footer Note */}
      <Box sx={{ textAlign: 'center', pb: 4 }}>
        <Typography variant="body2" color="text.secondary">
          程式碼放在 GitHub 上，有想法或發現 bug 都歡迎開 issue 聊聊。
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', mt: 1, opacity: 0.7 }}
        >
          本站為個人作品，與 Nexon 沒有關係。遊戲素材版權屬於 Nexon。
        </Typography>
      </Box>
    </Container>
  );
}
