'use client';

import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';

const POTENTIAL_GRADE_COLORS = {
  特殊: '#4fc3f7', // Rare — blue
  稀有: '#ba68c8', // Epic — purple
  罕見: '#ffd54f', // Unique — gold
  傳說: '#66bb6a', // Legendary — green
};

const STAT_FIELDS = [
  { key: 'str', label: 'STR' },
  { key: 'dex', label: 'DEX' },
  { key: 'int', label: 'INT' },
  { key: 'luk', label: 'LUK' },
  { key: 'max_hp', label: 'HP' },
  { key: 'max_mp', label: 'MP' },
  { key: 'attack_power', label: '攻擊力' },
  { key: 'magic_power', label: '魔力' },
  { key: 'armor', label: '防禦力' },
  { key: 'boss_damage', label: 'BOSS傷害' },
  { key: 'ignore_monster_armor', label: '無視防禦' },
  { key: 'all_stat', label: '全屬性%' },
];

const SOURCE_COLORS = {
  base: '#bdbdbd', // 中灰 — 基礎（明暗模式皆可辨識）
  star: '#ffd54f', // 黃色 — 星力
  add: '#81c784', // 淺綠 — 附加
  scroll: '#90caf9', // 淺藍 — 卷軸
};

const StatRow = ({ label, total, base, star, add, scroll }) => {
  const t = parseInt(total) || 0;
  if (t === 0) return null;

  const sources = [
    { value: parseInt(base) || 0, color: SOURCE_COLORS.base },
    { value: parseInt(star) || 0, color: SOURCE_COLORS.star },
    { value: parseInt(add) || 0, color: SOURCE_COLORS.add },
    { value: parseInt(scroll) || 0, color: SOURCE_COLORS.scroll },
  ].filter(s => s.value !== 0);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        py: 0.5,
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 48 }}>
        {label}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.75 }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          +{t}
        </Typography>
        {sources.length > 1 && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            (
            {sources.map((s, i) => (
              <Typography
                key={i}
                component="span"
                variant="caption"
                sx={{ color: s.color, fontWeight: 600 }}
              >
                {i > 0 && '+'}
                {s.value}
              </Typography>
            ))}
            )
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const EquipmentDetailDrawer = ({ item, open, onClose, isMobile }) => {
  const hasPotential = item?.potential_option_1;
  const hasAdditionalPotential = item?.additional_potential_option_1;
  const hasStats =
    item?.item_total_option && typeof item.item_total_option === 'object';
  const potentialColor =
    POTENTIAL_GRADE_COLORS[item?.potential_option_grade] || 'text.primary';
  const additionalColor =
    POTENTIAL_GRADE_COLORS[item?.additional_potential_option_grade] ||
    'text.primary';

  return (
    <Drawer
      anchor={isMobile ? 'bottom' : 'right'}
      open={open && !!item}
      onClose={onClose}
      sx={{ zIndex: 1400 }}
      PaperProps={{
        sx: {
          width: isMobile ? '100%' : 360,
          height: isMobile ? '60vh' : '100%',
          borderRadius: isMobile ? '16px 16px 0 0' : 0,
          overflowY: 'auto',
        },
      }}
      transitionDuration={250}
    >
      {item && (
        <Box sx={{ p: 2.5 }}>
          {/* Close button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} aria-label="關閉" size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Header: icon + name + starforce */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 2,
            }}
          >
            {item.item_icon && (
              <img
                src={item.item_icon}
                alt={item.item_name}
                style={{
                  width: 80,
                  height: 80,
                  objectFit: 'contain',
                }}
              />
            )}
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, lineHeight: 1.3 }}
              >
                {item.item_name}
              </Typography>
              {item.starforce && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  <StarIcon sx={{ fontSize: 16, color: '#ffd54f' }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {item.starforce}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Potential */}
          {hasPotential && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: potentialColor,
                }}
              >
                潛在能力
              </Typography>
              {[
                item.potential_option_1,
                item.potential_option_2,
                item.potential_option_3,
              ]
                .filter(Boolean)
                .map((opt, i) => (
                  <Typography key={i} variant="body2" sx={{ py: 0.25 }}>
                    {opt}
                  </Typography>
                ))}
            </>
          )}

          {/* Additional Potential */}
          {hasAdditionalPotential && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  mb: 1,
                  color: additionalColor,
                }}
              >
                附加潛能
              </Typography>
              {[
                item.additional_potential_option_1,
                item.additional_potential_option_2,
                item.additional_potential_option_3,
              ]
                .filter(Boolean)
                .map((opt, i) => (
                  <Typography key={i} variant="body2" sx={{ py: 0.25 }}>
                    {opt}
                  </Typography>
                ))}
            </>
          )}

          {/* Stats */}
          {hasStats && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                裝備屬性
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  gap: 1,
                  mb: 1,
                  flexWrap: 'wrap',
                }}
              >
                {[
                  { color: SOURCE_COLORS.base, label: '基礎' },
                  { color: SOURCE_COLORS.star, label: '星力' },
                  { color: SOURCE_COLORS.add, label: '星火' },
                  { color: SOURCE_COLORS.scroll, label: '卷軸' },
                ].map(s => (
                  <Box
                    key={s.label}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: s.color,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.secondary', fontSize: '0.65rem' }}
                    >
                      {s.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {STAT_FIELDS.map(({ key, label }) => (
                <StatRow
                  key={key}
                  label={label}
                  total={item.item_total_option?.[key]}
                  base={item.item_base_option?.[key]}
                  star={item.item_starforce_option?.[key]}
                  add={item.item_add_option?.[key]}
                  scroll={item.item_etc_option?.[key]}
                />
              ))}
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default EquipmentDetailDrawer;
