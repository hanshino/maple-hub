'use client';

import { Drawer, Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const CashItemDetailDrawer = ({ item, open, onClose, isMobile }) => {
  const hasOptions = item?.cash_item_option?.length > 0;
  const hasExpiry = item?.date_expire != null;

  const formatExpiry = dateStr => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

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
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
            <IconButton onClick={onClose} aria-label="關閉" size="small">
              <CloseIcon />
            </IconButton>
          </Box>

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
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary', mt: 0.5 }}
              >
                {item.cash_item_equipment_part}
              </Typography>
            </Box>
          </Box>

          {hasOptions && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                能力值
              </Typography>
              {item.cash_item_option.map((opt, i) => (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    py: 0.5,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {opt.option_type}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    +{opt.option_value}
                  </Typography>
                </Box>
              ))}
            </>
          )}

          {hasExpiry && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  到期日
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatExpiry(item.date_expire)}
                </Typography>
              </Box>
            </>
          )}
        </Box>
      )}
    </Drawer>
  );
};

export default CashItemDetailDrawer;
