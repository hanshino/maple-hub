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
  InputAdornment,
  IconButton,
  Button,
  Checkbox,
  FormControlLabel,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { FaCanadianMapleLeaf } from 'react-icons/fa';
import { useColorMode } from '../../components/MuiThemeProvider';
import { getGlassCardSx } from '../../lib/theme';
import {
  computeVip,
  mesoPointValue,
  tierIndexOf,
  LEVELS,
  TARGET_PRESETS,
} from '../../lib/vipCalculator';

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

// 折（8＝8折）→ 倍率(0–1)；空字串／非數字 → null（自動）。
function zheToMult(zhe) {
  if (zhe === '' || zhe == null) return null;
  const n = Number(zhe);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n / 10)) : null;
}

// 空字串→0（＝已達標）；其餘非數字亦→0（信任邊界）。
function toNum0(x) {
  if (x === '') return 0;
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}

// 分段轉換率標籤：單段顯示「X段 · N 點/樂豆」，跨段顯示「跨 N 段（a→b 點/樂豆）」。
function rateLabel(parts, key) {
  if (!parts || parts.length === 0) return '—';
  if (parts.length === 1) {
    const p = parts[0];
    return `${p.name}段 · ${key === 'self' ? p.self : p.gift} 點／樂豆`;
  }
  return `跨 ${parts.length} 段（${parts.map(p => (key === 'self' ? p.self : p.gift)).join('→')} 點／樂豆）`;
}

// 輸入框等寬字型（靜態，模組層級即可）。
const fieldSx = {
  '& .MuiInputBase-input': { fontFamily: 'monospace' },
};

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
        ...getGlassCardSx(mode),
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
      <CardContent sx={{ p: 2.75, '&:last-child': { pb: 2.75 } }}>
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

// 自用／送禮雙路比較卡：兩張只差標題、比率標籤、樂豆與需儲值數字，以及是否「最省」高亮。
function PathCard({ mode, highlighted, title, subtitle, leadouLabel, leadou, cost }) {
  return (
    <Card
      elevation={0}
      sx={{
        ...getGlassCardSx(mode),
        height: '100%',
        position: 'relative',
        overflow: 'visible',
        ...(highlighted && {
          borderColor:
            mode === 'dark' ? 'rgba(143,206,110,0.5)' : 'rgba(91,156,63,0.5)',
        }),
      }}
    >
      {highlighted && (
        <Chip
          label="最省"
          color="success"
          size="small"
          sx={{
            position: 'absolute',
            top: -10,
            right: 14,
            fontWeight: 800,
            height: 22,
          }}
        />
      )}
      <CardContent sx={{ p: 2.75, '&:last-child': { pb: 2.75 } }}>
        <Typography
          sx={{
            fontWeight: 800,
            color: highlighted ? 'success.main' : 'primary.dark',
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontFamily: 'monospace',
            color: 'text.disabled',
            mb: 1.5,
            minHeight: 16,
          }}
        >
          {subtitle}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 0.75,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {leadouLabel}
          </Typography>
          <Typography sx={{ fontFamily: 'monospace', fontWeight: 700 }}>
            {fmt(leadou)} 樂豆
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            py: 0.75,
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            需儲值
          </Typography>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: '1.35rem',
              color: highlighted ? 'success.main' : 'primary.main',
            }}
          >
            NT$ {fmt(cost)}
          </Typography>
        </Box>
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
  const [targetPreset, setTargetPreset] = useState(String(TARGET_PRESETS[4])); // 皇家達成
  const [customPts, setCustomPts] = useState('3675000');
  const [deficitPts, setDeficitPts] = useState('2092440');
  const [bonusPct, setBonusPct] = useState('5');
  const [baseRate, setBaseRate] = useState('1');

  // 商家：銷售與預算
  const [costCap, setCostCap] = useState('20000');
  const [cash, setCash] = useState('40000');

  // 商家：分批賣客（混合折數）
  const [tranches, setTranches] = useState([
    { face: '10000', discZhe: '7.8' },
    { face: '20000', discZhe: '8.0' },
  ]);
  const [remDiscZhe, setRemDiscZhe] = useState('');

  // 商家：自用點數兌換 + 遊戲幣回收
  const [exPts, setExPts] = useState('45000');
  const [exReward, setExReward] = useState('150');
  const [sellMeso, setSellMeso] = useState(true);
  const [mesoPts, setMesoPts] = useState('5');
  const [mesoAmtYi, setMesoAmtYi] = useState('1');
  const [cashNtd, setCashNtd] = useState('1');
  const [cashMesoWan, setCashMesoWan] = useState('2700');

  const targetPts = targetPreset === 'custom' ? customPts : targetPreset;
  const targetPtsNum = Number(targetPts) || 0;
  const deficitNum = toNum0(deficitPts);
  const currentPts = Math.max(0, targetPtsNum - deficitNum);
  const curTierIdx = tierIndexOf(currentPts);
  const tgtTierIdx = tierIndexOf(targetPtsNum); // 達到 target 時所在等級（皇家門檻 3.675M ⇒ 皇家）

  const updateTranche = (idx, key, value) =>
    setTranches(prev =>
      prev.map((t, i) => (i === idx ? { ...t, [key]: value } : t))
    );
  const addTranche = () =>
    setTranches(prev => [...prev, { face: '10000', discZhe: '' }]);
  const removeTranche = idx =>
    setTranches(prev => prev.filter((_, i) => i !== idx));

  const trancheInputs = useMemo(
    () =>
      tranches.map(t => ({
        face: Number(t.face) || 0,
        disc: zheToMult(t.discZhe),
      })),
    [tranches]
  );
  const autoDiscount = useMemo(() => zheToMult(remDiscZhe), [remDiscZhe]);

  const marketValue = useMemo(() => {
    if (!sellMeso) return 0;
    const ntd = Number(cashNtd) || 0;
    const wan = Number(cashMesoWan) || 0;
    return mesoPointValue({
      pointsPerBatch: Number(mesoPts) || 0,
      mesoPerBatch: (Number(mesoAmtYi) || 0) * 1e8,
      mesoPerNtd: ntd > 0 ? (wan * 1e4) / ntd : 0,
    });
  }, [sellMeso, mesoPts, mesoAmtYi, cashNtd, cashMesoWan]);

  const inputs = useMemo(
    () => ({
      targetPts,
      currentPts,
      bonusPct,
      baseRate,
      costCap,
      cash,
      tranches: trancheInputs,
      autoDiscount,
      exPts,
      exReward,
      marketValue,
    }),
    [
      targetPts,
      currentPts,
      bonusPct,
      baseRate,
      costCap,
      cash,
      trancheInputs,
      autoDiscount,
      exPts,
      exReward,
      marketValue,
    ]
  );

  const result = useMemo(() => computeVip(inputs), [inputs]);

  const costCapNum = Number(costCap) || 0;

  // 自用／送禮雙路比較
  const done = result.remainingPts <= 0;
  const bothPathsFinite =
    Number.isFinite(result.buyCostSelf) && Number.isFinite(result.buyCostGift);
  const selfCheaper = result.buyCostSelf <= result.buyCostGift;
  const pathSaving = Math.abs(result.buyCostGift - result.buyCostSelf);
  const selfWins = !done && bothPathsFinite && selfCheaper;
  const giftWins = !done && bothPathsFinite && !selfCheaper;

  // 分批賣客：總面額／賣超判斷（僅供 UI 提示，非引擎計算）
  const totalFace = trancheInputs.reduce((sum, t) => sum + t.face, 0);
  const oversold =
    Number.isFinite(result.requiredLeadou) &&
    totalFace > result.requiredLeadou + 1e-6;
  const coveragePct =
    Number.isFinite(result.requiredLeadou) && result.requiredLeadou > 0
      ? Math.min(100, (result.pricedFace / result.requiredLeadou) * 100)
      : 0;
  const belowSuggested = result.autoDiscountUsed < result.minDiscount - 1e-9;
  const suggestedZhe = Number.isFinite(result.minDiscount)
    ? (result.minDiscount * 10).toFixed(1)
    : '';
  const remDiscDisplay =
    remDiscZhe !== '' ? remDiscZhe : result.autoVolume > 0 ? suggestedZhe : '';

  // 遊戲幣回收：換算比例只做單位換算（億/萬），元/點市值由 mesoPointValue 算出
  const mesoPerPoint =
    (Number(mesoPts) || 0) > 0
      ? ((Number(mesoAmtYi) || 0) * 1e8) / (Number(mesoPts) || 0)
      : 0;
  const totalMesoYi = (result.gamePoints * mesoPerPoint) / 1e8;

  const netCostTone = Number.isFinite(result.netCost)
    ? result.netCost <= costCapNum
      ? 'success'
      : 'error'
    : 'neutral';
  const effCostTone = Number.isFinite(result.effCost)
    ? result.effCost <= costCapNum
      ? 'success'
      : 'error'
    : 'neutral';

  const lossDiff = Math.abs(result.lossSum - result.netCost);
  const crossCheckOk = lossDiff < 1;

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
          ...getGlassCardSx(mode),
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
          ...getGlassCardSx(mode),
        }}
      >
        {LEVELS.map((l, idx) => {
          const active = idx === curTierIdx;
          const isTarget = idx === tgtTierIdx;
          return (
            <Box
              key={l.name}
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
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 0.5,
                  minHeight: 16,
                  mb: 0.5,
                }}
              >
                {active && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: '#fff',
                      bgcolor: 'primary.main',
                      borderRadius: 999,
                      px: 0.75,
                      lineHeight: '15px',
                    }}
                  >
                    目前
                  </Box>
                )}
                {isTarget && (
                  <Box
                    component="span"
                    sx={{
                      fontSize: 9,
                      fontWeight: 800,
                      color: 'primary.dark',
                      border: '1px solid',
                      borderColor: 'primary.main',
                      borderRadius: 999,
                      px: 0.75,
                      lineHeight: '13px',
                    }}
                  >
                    🎯 目標
                  </Box>
                )}
              </Box>
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
          <Card elevation={0} sx={getGlassCardSx(mode)}>
            <CardContent sx={{ p: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 800, color: 'primary.dark', mb: 2 }}
              >
                帳號與門檻
              </Typography>

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
                label="距離目標還差 VIP 點數"
                value={deficitPts}
                onChange={e => setDeficitPts(e.target.value)}
                placeholder="遊戲顯示的「還差」點數"
                helperText="填遊戲會員頁面顯示的「距離目標還差」點數（例：還差 2,092,440 上皇家）。留空＝已達標。目前累積與等級會用「目標－還差」自動反推。"
                sx={{
                  mb: 0.75,
                  ...fieldSx,
                  '& .MuiOutlinedInput-root': {
                    bgcolor:
                      mode === 'dark'
                        ? 'rgba(247,147,30,0.12)'
                        : 'rgba(247,147,30,0.08)',
                    '& fieldset': { borderColor: 'primary.main' },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontFamily: 'monospace',
                  color: 'text.secondary',
                  mb: 2,
                  lineHeight: 1.6,
                }}
              >
                目前累積約{' '}
                <Box
                  component="span"
                  sx={{ color: 'primary.dark', fontWeight: 700 }}
                >
                  {fmt(currentPts)}
                </Box>{' '}
                點 → 等級{' '}
                <Box
                  component="span"
                  sx={{ color: 'primary.dark', fontWeight: 700 }}
                >
                  {LEVELS[curTierIdx].name}
                </Box>
                （自用 {LEVELS[curTierIdx].self}／送禮 {LEVELS[curTierIdx].rate}{' '}
                點/樂豆）
              </Typography>

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
            <Card elevation={0} sx={getGlassCardSx(mode)}>
              <CardContent sx={{ p: 3 }}>
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

                <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
                  分批賣客（混合折數）
                </Typography>

                <Box sx={{ display: 'flex', gap: 1, mb: 0.75, px: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{ flex: 1, color: 'text.disabled', fontWeight: 700 }}
                  >
                    賣出面額（元 / 樂豆，1:1）
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      width: 100,
                      textAlign: 'center',
                      color: 'text.disabled',
                      fontWeight: 700,
                    }}
                  >
                    折數（留空＝自動）
                  </Typography>
                  <Box sx={{ width: 34 }} />
                </Box>

                {tranches.map((t, idx) => (
                  <Box
                    key={idx}
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 1,
                      alignItems: 'center',
                    }}
                  >
                    <TextField
                      size="small"
                      type="number"
                      value={t.face}
                      onChange={e => updateTranche(idx, 'face', e.target.value)}
                      sx={{ flex: 1, minWidth: 0, ...fieldSx }}
                    />
                    <TextField
                      size="small"
                      type="number"
                      placeholder="自動"
                      value={t.discZhe}
                      onChange={e =>
                        updateTranche(idx, 'discZhe', e.target.value)
                      }
                      sx={{ width: 96, flexShrink: 0, ...fieldSx }}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">折</InputAdornment>
                          ),
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      aria-label="刪除"
                      disabled={tranches.length <= 1}
                      onClick={() => removeTranche(idx)}
                      sx={{
                        flexShrink: 0,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 2,
                        color: 'error.main',
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={addTranche}
                  sx={{
                    mb: 2,
                    borderStyle: 'dashed',
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  新增一筆客人
                </Button>

                <Box
                  sx={{
                    p: 2.25,
                    borderRadius: 2,
                    mb: 2,
                    bgcolor:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.04)'
                        : 'rgba(247,147,30,0.06)',
                    border: '1px solid',
                    borderColor:
                      mode === 'dark'
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(247,147,30,0.12)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 1,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        color: 'primary.main',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {Number.isFinite(result.requiredLeadou) &&
                      result.requiredLeadou > 0 &&
                      result.discountUsed > 0
                        ? `${(result.discountUsed * 10).toFixed(1)} 折`
                        : '—'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      有效折數（含未定折推算）
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        ml: 'auto',
                        fontFamily: 'monospace',
                        color: 'text.secondary',
                      }}
                    >
                      收回 NT$ {fmt(result.soldRecover)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 9,
                      borderRadius: 999,
                      bgcolor: 'rgba(247,147,30,0.15)',
                      my: 1.5,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${coveragePct}%`,
                        borderRadius: 999,
                        background: 'linear-gradient(90deg, #f7931e, #cc6e00)',
                        transition: 'width .25s',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontFamily: 'monospace',
                      color: oversold ? 'error.main' : 'text.disabled',
                    }}
                  >
                    {oversold
                      ? `⚠ 已配置 ${fmt(totalFace)} 超過需賣總量 ${fmt(result.requiredLeadou)}（賣超了 ${fmt(totalFace - result.requiredLeadou)}）`
                      : `已定折 ${fmt(result.pricedFace)} / 需賣 ${fmt(result.requiredLeadou)}　未定折（空白列＋剩餘） ${fmt(result.autoVolume)}`}
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontWeight: 600,
                    color: 'text.secondary',
                    mb: 1,
                  }}
                >
                  未填折數的量（空白列＋剩餘），用幾折推算？（留空＝自動＝剛好卡成本上限）
                </Typography>
                <Box
                  sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
                >
                  <TextField
                    size="small"
                    type="number"
                    placeholder="建議值"
                    value={remDiscDisplay}
                    onChange={e => setRemDiscZhe(e.target.value)}
                    sx={{ width: 130, flexShrink: 0, ...fieldSx }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">折</InputAdornment>
                        ),
                      },
                    }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<RestartAltIcon />}
                    onClick={() => setRemDiscZhe('')}
                    sx={{ textTransform: 'none', fontWeight: 700 }}
                  >
                    用建議折數
                  </Button>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: belowSuggested ? 'error.main' : 'text.disabled',
                    lineHeight: 1.6,
                    mb: 3,
                  }}
                >
                  {result.autoVolume <= 0
                    ? '所有量都已定折，沒有需要推算的部分。'
                    : `未定折的量共 ${fmt(result.autoVolume)} 樂豆，以 ${(result.autoDiscountUsed * 10).toFixed(1)} 折推算。建議 ≥ ${(result.minDiscount * 10).toFixed(1)} 折才不會超過成本上限 ${fmt(costCapNum)}${result.autoDiscountUsed <= 1e-9 ? '（0＝自用不賣）' : ''}。留空＝自動用建議值。`}
                </Typography>

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

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={sellMeso}
                      onChange={e => setSellMeso(e.target.checked)}
                    />
                  }
                  label="把自用點數換遊戲幣賣掉回收現金"
                  sx={{
                    mb: 1,
                    '& .MuiFormControlLabel-label': {
                      fontWeight: 700,
                      fontSize: '0.875rem',
                    },
                  }}
                />

                <Box
                  sx={{
                    opacity: sellMeso ? 1 : 0.4,
                    pointerEvents: sellMeso ? 'auto' : 'none',
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 600,
                      color: 'text.secondary',
                      mt: 1,
                      mb: 1,
                    }}
                  >
                    ① 遊戲內：點數換遊戲幣的比例
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="點數"
                      value={mesoPts}
                      onChange={e => setMesoPts(e.target.value)}
                      sx={fieldSx}
                    />
                    <Typography
                      sx={{ fontWeight: 800, color: 'primary.main', pb: 1 }}
                    >
                      ＝
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="遊戲幣（億）"
                      value={mesoAmtYi}
                      onChange={e => setMesoAmtYi(e.target.value)}
                      sx={fieldSx}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      fontWeight: 600,
                      color: 'text.secondary',
                      mb: 1,
                    }}
                  >
                    ② 市場：玩家收購遊戲幣的行情
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-end',
                      gap: 1,
                      mb: 2,
                    }}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="台幣"
                      value={cashNtd}
                      onChange={e => setCashNtd(e.target.value)}
                      sx={fieldSx}
                    />
                    <Typography
                      sx={{ fontWeight: 800, color: 'primary.main', pb: 1 }}
                    >
                      ＝
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      type="number"
                      label="遊戲幣（萬）"
                      value={cashMesoWan}
                      onChange={e => setCashMesoWan(e.target.value)}
                      sx={fieldSx}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      color: 'text.disabled',
                      lineHeight: 1.6,
                    }}
                  >
                    {!sellMeso
                      ? '未啟用：自用點數留著自用，回收現金 0。'
                      : result.gamePoints <= 0
                        ? '目前兌換設定得到 0 遊戲點數。'
                        : `${fmt(result.gamePoints)} 遊戲點 → ${fmt(totalMesoYi)} 億遊戲幣 → 回收 NT$ ${fmt(result.redeemValue)}（等效 ${marketValue.toFixed(2)} 元/點）`}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* 試算結果 */}
      <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
        試算結果
      </Typography>

      {/* 還差 hero */}
      <Card
        elevation={0}
        sx={{
          ...getGlassCardSx(mode),
          mb: 2.5,
          background:
            mode === 'dark'
              ? 'linear-gradient(135deg, rgba(247,147,30,0.16), transparent 85%)'
              : 'linear-gradient(135deg, rgba(247,147,30,0.12), transparent 85%)',
          ...(done && {
            borderColor:
              mode === 'dark'
                ? 'rgba(143,206,110,0.35)'
                : 'rgba(91,156,63,0.35)',
          }),
        }}
      >
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: 'text.secondary',
              letterSpacing: 0.3,
            }}
          >
            {done ? '已達標' : '距離目標還差'}
          </Typography>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontWeight: 800,
              fontSize: 'clamp(1.7rem, 6vw, 2.3rem)',
              color: done ? 'success.main' : 'primary.dark',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.15,
              mt: 0.25,
            }}
          >
            {done ? '🎉 已達到目標門檻' : `${fmt(result.remainingPts)} 點`}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontFamily: 'monospace',
              color: 'text.disabled',
              mt: 0.5,
            }}
          >
            {done
              ? `目前 ${fmt(currentPts)} ≥ 目標 ${fmt(targetPtsNum)}`
              : `目標 ${fmt(targetPtsNum)} － 還差 ${fmt(result.remainingPts)} ⇒ 目前累積約 ${fmt(currentPts)}`}
          </Typography>
        </CardContent>
      </Card>

      {/* 自己消費 / 送禮 雙欄卡 */}
      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <PathCard
            mode={mode}
            highlighted={selfWins}
            title="自己消費（自用購買）"
            subtitle={rateLabel(result.parts, 'self')}
            leadouLabel="需自己買"
            leadou={result.leadouSelf}
            cost={result.buyCostSelf}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <PathCard
            mode={mode}
            highlighted={giftWins}
            title="送禮（贈送他人）"
            subtitle={rateLabel(result.parts, 'gift')}
            leadouLabel="需送禮"
            leadou={result.leadouGift}
            cost={result.buyCostGift}
          />
        </Grid>
      </Grid>

      <Typography
        variant="body2"
        sx={{ fontFamily: 'monospace', color: 'text.secondary', mb: 3 }}
      >
        {done
          ? '已達標，兩種方式都不用再花錢。'
          : bothPathsFinite
            ? `${selfCheaper ? '自己消費' : '送禮'} 比 ${selfCheaper ? '送禮' : '自己消費'} 省 NT$ ${fmt(pathSaving)}（自用轉換率較高）。送禮較貴但適合代儲——可向客人收回現金（見商家模式）。`
            : '—'}
      </Typography>

      {/* 分段明細 */}
      {result.parts.length > 0 && (
        <>
          <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 1.5 }}>
            分段明細{result.parts.length > 1 ? '（跨等級用各段比率）' : ''}
          </Typography>
          <Card elevation={0} sx={{ ...getGlassCardSx(mode), mb: 4 }}>
            <CardContent sx={{ p: 3 }}>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 460 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>等級段</TableCell>
                      <TableCell align="right">這段點數</TableCell>
                      <TableCell align="right">自用（樂豆）</TableCell>
                      <TableCell align="right">送禮（樂豆）</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.parts.map(p => (
                      <TableRow key={p.tierIndex}>
                        <TableCell sx={fieldSx}>
                          {p.name}（{p.self}／{p.gift}）
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(p.pts)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(p.ldSelf)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(p.ldGift)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {result.parts.length > 1 && (
                      <TableRow
                        sx={{
                          '& td': {
                            fontWeight: 800,
                            color: 'primary.dark',
                            borderTop: '1px solid',
                            borderColor: 'divider',
                          },
                        }}
                      >
                        <TableCell>總計</TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(result.remainingPts)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(result.leadouSelf)}
                        </TableCell>
                        <TableCell align="right" sx={fieldSx}>
                          {fmt(result.leadouGift)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {isMerchant && (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              mode={mode}
              label="賣客收回總額"
              value={`NT$ ${fmt(result.soldRecover)}`}
              sub={`有效折數 ${(result.discountUsed * 10).toFixed(1)} 折`}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              mode={mode}
              label="淨成本（買進－收回）"
              value={`NT$ ${fmt(result.netCost)}`}
              tone={netCostTone}
              sub={
                result.netCost <= costCapNum
                  ? `✓ 在成本上限 ${fmt(costCapNum)} 內`
                  : `✗ 超過成本上限 ${fmt(costCapNum)}`
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              mode={mode}
              label="遊戲幣回收現金"
              value={`NT$ ${fmt(result.redeemValue)}`}
              sub={
                sellMeso
                  ? `${fmt(result.gamePoints)} 遊戲點換幣賣出`
                  : '未啟用（留自用）'
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <StatCard
              mode={mode}
              label="實際成本（淨成本－回收）"
              value={`NT$ ${fmt(result.effCost)}`}
              tone={effCostTone}
              sub={
                result.effCost <= costCapNum
                  ? `✓ 在成本上限 ${fmt(costCapNum)} 內`
                  : `✗ 超過成本上限 ${fmt(costCapNum)}`
              }
            />
          </Grid>
        </Grid>
      )}

      {/* 滾動操作模擬 */}
      {isMerchant && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            滾動操作模擬
          </Typography>
          <Card elevation={0} sx={getGlassCardSx(mode)}>
            <CardContent sx={{ p: 3 }}>
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
