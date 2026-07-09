'use client';

import { useMemo, useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
} from '@mui/material';
import { FaCanadianMapleLeaf } from 'react-icons/fa';
import { useColorMode } from '../../components/MuiThemeProvider';
import { computeVip, LEVELS, TARGET_PRESETS } from '../../lib/vipCalculator';

// UI-only labels for TARGET_PRESETS — purely presentational, no calc here.
const TARGET_LABELS = [
  '金牌達成',
  '金牌維持',
  '鑽石達成',
  '鑽石維持',
  '皇家達成',
  '皇家維持',
];

const fmt = n =>
  Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : '—';

function glassSx(mode) {
  return {
    borderRadius: 3,
    border: '1px solid',
    borderColor:
      mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(247,147,30,0.15)',
    bgcolor: mode === 'dark' ? 'rgba(42,31,26,0.6)' : 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
  };
}

function toneColor(tone) {
  if (tone === 'success') return 'success.main';
  if (tone === 'error') return 'error.main';
  if (tone === 'neutral') return 'text.primary';
  return 'primary.main';
}

function StatCard({ mode, label, value, sub, tone }) {
  return (
    <Card
      elevation={0}
      sx={{
        ...glassSx(mode),
        height: '100%',
        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow:
            mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.3)'
              : '0 8px 24px rgba(247,147,30,0.12)',
        },
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Typography
          variant="caption"
          sx={{ display: 'block', fontWeight: 600, color: 'text.secondary' }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 700,
            fontSize: '1.35rem',
            color: toneColor(tone),
            fontVariantNumeric: 'tabular-nums',
            mt: 0.5,
          }}
        >
          {value}
        </Typography>
        {sub && (
          <Typography
            variant="caption"
            sx={{ display: 'block', color: 'text.disabled', mt: 0.25 }}
          >
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function VipCalculatorPage() {
  const { mode } = useColorMode();

  // 模式：玩家（預設） / 商家
  const [uiMode, setUiMode] = useState('player');
  const isMerchant = uiMode === 'merchant';

  // 帳號與門檻
  const [level, setLevel] = useState(LEVELS[2].rate); // 鑽石
  const [targetPreset, setTargetPreset] = useState(String(TARGET_PRESETS[4])); // 皇家達成
  const [customPts, setCustomPts] = useState('3675000');
  const [bonusPct, setBonusPct] = useState('5');
  const [baseRate, setBaseRate] = useState('1');

  // 商家：銷售與預算
  const [costCap, setCostCap] = useState('20000');
  const [cash, setCash] = useState('40000');
  const [discount, setDiscount] = useState('');

  // 商家：自用點數兌換
  const [exPts, setExPts] = useState('45000');
  const [exReward, setExReward] = useState('150');
  const [marketValue, setMarketValue] = useState('0');

  const targetPts = targetPreset === 'custom' ? customPts : targetPreset;

  const inputs = useMemo(
    () => ({
      giftRate: level,
      targetPts,
      bonusPct,
      baseRate,
      costCap,
      cash,
      discount,
      exPts,
      exReward,
      marketValue,
    }),
    [
      level,
      targetPts,
      bonusPct,
      baseRate,
      costCap,
      cash,
      discount,
      exPts,
      exReward,
      marketValue,
    ]
  );

  const result = useMemo(() => computeVip(inputs), [inputs]);

  const costCapNum = Number(costCap) || 0;
  const marketValueNum = Number(marketValue) || 0;

  const netCostTone = Number.isFinite(result.netCost)
    ? result.netCost <= costCapNum
      ? 'success'
      : 'error'
    : 'neutral';
  const effCostTone =
    marketValueNum > 0 && Number.isFinite(result.effCost)
      ? result.effCost <= costCapNum
        ? 'success'
        : 'error'
      : 'neutral';

  const lossDiff = Math.abs(result.lossSum - result.netCost);
  const crossCheckOk = lossDiff < 1;

  const fieldSx = {
    '& .MuiInputBase-input': { fontFamily: 'monospace' },
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 0.5 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>
          <FaCanadianMapleLeaf size={26} />
        </Box>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
          VIP 儲值試算器
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {isMerchant
          ? '含折數、賣客淨成本與滾動操作模擬的代儲成本試算'
          : '算出衝到目標 VIP 等級要花多少台幣'}
      </Typography>
      <Typography
        variant="caption"
        color="text.disabled"
        sx={{ display: 'block', mb: 3, lineHeight: 1.6 }}
      >
        假設 1 樂豆 ≈ 1
        元台幣面值；儲值回饋／基準匯率只影響買進側，不影響賣客回收側的折數計算。
      </Typography>

      {/* 模式切換 */}
      <ToggleButtonGroup
        value={uiMode}
        exclusive
        onChange={(e, v) => v && setUiMode(v)}
        size="small"
        sx={{
          mb: 3,
          p: 0.5,
          borderRadius: 3,
          ...glassSx(mode),
        }}
      >
        <ToggleButton
          value="player"
          sx={{
            border: 'none',
            borderRadius: 2,
            px: 2.5,
            fontWeight: 700,
            textTransform: 'none',
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          玩家
        </ToggleButton>
        <ToggleButton
          value="merchant"
          sx={{
            border: 'none',
            borderRadius: 2,
            px: 2.5,
            fontWeight: 700,
            textTransform: 'none',
            color: 'text.secondary',
            '&.Mui-selected': {
              bgcolor: 'primary.main',
              color: '#fff',
              '&:hover': { bgcolor: 'primary.dark' },
            },
          }}
        >
          商家 / 代儲
        </ToggleButton>
      </ToggleButtonGroup>

      {/* VIP 階梯 */}
      <Box
        sx={{
          display: 'flex',
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          ...glassSx(mode),
        }}
      >
        {LEVELS.map(l => {
          const active = l.rate === level;
          return (
            <Box
              key={l.rate}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1.5,
                px: 1,
                borderRight: '1px solid',
                borderColor:
                  mode === 'dark'
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(247,147,30,0.12)',
                '&:last-of-type': { borderRight: 'none' },
                bgcolor: active
                  ? mode === 'dark'
                    ? 'rgba(247,147,30,0.16)'
                    : 'rgba(247,147,30,0.12)'
                  : 'transparent',
                borderTop: '3px solid',
                borderTopColor: active ? 'primary.main' : 'transparent',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: active ? 'primary.dark' : 'text.secondary',
                }}
              >
                {l.name}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontFamily: 'monospace',
                  fontSize: 11,
                  color: 'text.disabled',
                }}
              >
                {l.ptsLabel}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {/* 輸入區 */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: isMerchant ? 6 : 12 }}>
          <Card elevation={0} sx={glassSx(mode)}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: 'primary.dark', mb: 2 }}
              >
                帳號與門檻
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="vip-level-label">
                  目前 VIP 等級（決定送禮轉換率）
                </InputLabel>
                <Select
                  labelId="vip-level-label"
                  label="目前 VIP 等級（決定送禮轉換率）"
                  value={level}
                  onChange={e => setLevel(Number(e.target.value))}
                >
                  {LEVELS.map(l => (
                    <MenuItem key={l.rate} value={l.rate}>
                      {l.name}（{l.rate} 點／樂豆）
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel id="vip-target-label">目標門檻</InputLabel>
                <Select
                  labelId="vip-target-label"
                  label="目標門檻"
                  value={targetPreset}
                  onChange={e => setTargetPreset(e.target.value)}
                >
                  {TARGET_PRESETS.map((pts, i) => (
                    <MenuItem key={pts} value={String(pts)}>
                      {TARGET_LABELS[i]}：{pts.toLocaleString('en-US')} 點
                    </MenuItem>
                  ))}
                  <MenuItem value="custom">自訂點數</MenuItem>
                </Select>
              </FormControl>

              {targetPreset === 'custom' && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="自訂目標點數"
                  value={customPts}
                  onChange={e => setCustomPts(e.target.value)}
                  sx={{ mb: 2, ...fieldSx }}
                />
              )}

              <TextField
                fullWidth
                size="small"
                type="number"
                label="儲值回饋（%）"
                value={bonusPct}
                onChange={e => setBonusPct(e.target.value)}
                sx={{ mb: isMerchant ? 2 : 0, ...fieldSx }}
              />

              {isMerchant && (
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="基準匯率（樂豆／台幣）"
                  value={baseRate}
                  onChange={e => setBaseRate(e.target.value)}
                  sx={fieldSx}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {isMerchant && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card elevation={0} sx={glassSx(mode)}>
              <CardContent sx={{ p: 2.5 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: 'primary.dark', mb: 2 }}
                >
                  銷售與預算
                  <Chip
                    label="商家"
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: 10, fontWeight: 700 }}
                  />
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="可承受淨成本上限（元）"
                      value={costCap}
                      onChange={e => setCostCap(e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="手上可動用現金（元）"
                      value={cash}
                      onChange={e => setCash(e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="給客人的折數（0.78＝78折）"
                  placeholder="留空＝自動算最低折數"
                  value={discount}
                  onChange={e => setDiscount(e.target.value)}
                  sx={{ mb: 3, ...fieldSx }}
                />

                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 800, color: 'primary.dark', mb: 2 }}
                >
                  自用點數兌換
                  <Chip
                    label="商家"
                    size="small"
                    color="primary"
                    sx={{ ml: 1, height: 20, fontSize: 10, fontWeight: 700 }}
                  />
                </Typography>

                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="VIP 點數／每次兌換"
                      value={exPts}
                      onChange={e => setExPts(e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                  <Grid size={6}>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="兌換得遊戲點數／次"
                      value={exReward}
                      onChange={e => setExReward(e.target.value)}
                      sx={fieldSx}
                    />
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="該遊戲點數市值（元／點，沒有填 0）"
                  value={marketValue}
                  onChange={e => setMarketValue(e.target.value)}
                  sx={fieldSx}
                />
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 試算結果 */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        試算結果
      </Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            mode={mode}
            label="需消耗樂豆點數"
            value={`${fmt(result.requiredLeadou)} 樂豆`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <StatCard
            mode={mode}
            label="需儲值金額（已含回饋）"
            value={`NT$ ${fmt(result.buyCost)}`}
          />
        </Grid>

        {isMerchant && (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                mode={mode}
                label="卡在成本上限內的最低折數"
                value={
                  result.minDiscount <= 0
                    ? '不用賣客人，預算就夠'
                    : `${(result.minDiscount * 10).toFixed(1)} 折`
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                mode={mode}
                label="依折數計算的淨成本"
                value={`NT$ ${fmt(result.netCost)}`}
                tone={netCostTone}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                mode={mode}
                label="自用兌換次數／剩餘點數"
                value={`${result.redemptions} 次`}
                sub={`剩 ${fmt(result.leftoverPts)} 點`}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                mode={mode}
                label="自用點數市值"
                value={`${fmt(result.gamePoints)} 點`}
                sub={
                  marketValueNum > 0
                    ? `≈ NT$ ${fmt(result.redeemValue)}`
                    : '未填市值'
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <StatCard
                mode={mode}
                label="扣自用點數後的實際成本"
                value={`NT$ ${fmt(result.effCost)}`}
                tone={effCostTone}
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* 滾動操作模擬 */}
      {isMerchant && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            滾動操作模擬
          </Typography>
          <Card elevation={0} sx={glassSx(mode)}>
            <CardContent sx={{ p: 2.5 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 520 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>輪次</TableCell>
                      <TableCell align="right">投入現金</TableCell>
                      <TableCell align="right">買到樂豆</TableCell>
                      <TableCell align="right">累積樂豆</TableCell>
                      <TableCell align="right">賣出收回</TableCell>
                      <TableCell align="right">手上現金</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.sim.map(s => (
                      <TableRow
                        key={s.round}
                        sx={{
                          bgcolor: s.done
                            ? mode === 'dark'
                              ? 'rgba(247,147,30,0.12)'
                              : 'rgba(247,147,30,0.08)'
                            : 'transparent',
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: s.done ? 700 : 400,
                            color: s.done ? 'primary.dark' : 'text.primary',
                          }}
                        >
                          第{s.round}輪{s.done ? ' ✓達標' : ''}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(s.investCash)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(s.bought)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(s.acc)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(s.soldBack)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(s.cash)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {result.sim.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  現金或匯率不足以開始模擬。
                </Alert>
              ) : !result.reached ? (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  現金不足以在 40 輪內達標，需更多本金或更低折數。
                </Alert>
              ) : (
                <Chip
                  label={`滾動總淨損 NT$ ${fmt(result.lossSum)} ＝ 單筆淨成本 NT$ ${fmt(result.netCost)} ${crossCheckOk ? '✓ 一致' : '✗ 不一致'}`}
                  color={crossCheckOk ? 'success' : 'error'}
                  variant="outlined"
                  sx={{
                    mt: 2,
                    fontFamily: 'monospace',
                    height: 'auto',
                    py: 0.75,
                    '& .MuiChip-label': { whiteSpace: 'normal' },
                  }}
                />
              )}

              <Typography
                variant="caption"
                color="text.disabled"
                sx={{ display: 'block', mt: 2, lineHeight: 1.7 }}
              >
                一輪：用手上現金買樂豆（現金 × 匯率 × (1+回饋)）→
                整批送禮給客人累積 VIP 點數，同時收「樂豆張數 × 折數」的現金 →
                回進下一輪，累積到門檻為止（最後一輪只補缺口）。假設 1 樂豆 ≈ 1
                元面值；實務上請收到客人款項後再進下一輪，避免資金卡死。
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
}
