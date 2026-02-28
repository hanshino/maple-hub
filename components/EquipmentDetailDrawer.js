'use client';

import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';

const POTENTIAL_GRADE_COLORS = {
  레어: '#4fc3f7', // Rare — blue
  에픽: '#ba68c8', // Epic — purple
  유니크: '#ffd54f', // Unique — gold
  레전드리: '#66bb6a', // Legendary — green
};

const StatRow = ({ label, value }) => {
  if (!value || value === '0') return null;
  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        +{value}
      </Typography>
    </Box>
  );
};

const EquipmentDetailDrawer = ({ item, open, onClose, isMobile }) => {
  const hasPotential = item?.potential_option_1;
  const hasAdditionalPotential = item?.additional_potential_option_1;
  const hasStats =
    item?.item_total_option &&
    typeof item.item_total_option === 'object';
  const potentialColor =
    POTENTIAL_GRADE_COLORS[item?.potential_option_grade] ||
    'text.primary';
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
          <Box
            sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}
          >
            <IconButton
              onClick={onClose}
              aria-label="關閉"
              size="small"
            >
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
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600 }}
                  >
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
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 700, mb: 1 }}
              >
                裝備屬性
              </Typography>
              <StatRow label="STR" value={item.item_total_option.str} />
              <StatRow label="DEX" value={item.item_total_option.dex} />
              <StatRow label="INT" value={item.item_total_option.int} />
              <StatRow label="LUK" value={item.item_total_option.luk} />
              <StatRow
                label="HP"
                value={item.item_total_option.max_hp}
              />
              <StatRow
                label="攻擊力"
                value={item.item_total_option.attack_power}
              />
              <StatRow
                label="魔力"
                value={item.item_total_option.magic_power}
              />
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default EquipmentDetailDrawer;
