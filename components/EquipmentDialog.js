'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Button,
  Grid,
  Box,
  Avatar,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';
import Image from 'next/image';
import {
  processEquipmentData,
  getEquipmentPosition,
} from '../lib/equipmentUtils';
import { getCachedData, setCachedData } from '../lib/cache';

const EquipmentDialog = ({ ocid, character, open, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(false);
  const [characterImage, setCharacterImage] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  // Use external control if open prop is provided, otherwise use internal state
  const dialogOpen = open !== undefined ? open : isOpen;
  const handleDialogClose = onClose || (() => setIsOpen(false));

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(`/api/character/equipment?ocid=${ocid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch equipment data');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processEquipmentData(data);
      setEquipment(processed);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  }, [ocid]);

  // Update character image when character prop changes
  useEffect(() => {
    if (character && character.character_image) {
      setCharacterImage(character.character_image);
    } else {
      setCharacterImage('/character-placeholder.png');
    }
  }, [character]);

  // Load equipment when dialog opens (for external control)
  useEffect(() => {
    if (open && ocid) {
      loadEquipment();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ocid]);

  const handleClickOpen = () => {
    setIsOpen(true);
    loadEquipment();
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleKeyDown = (event, slot) => {
    if (event.key === 'Enter' || event.key === ' ') {
      // Could add interaction if needed
      event.preventDefault();
    }
  };

  const renderEquipmentSlot = (slot, position) => {
    const equipmentItem = equipment?.[slot];
    const imageError = imageErrors[slot];

    const handleImageError = () => {
      setImageErrors(prev => ({ ...prev, [slot]: true }));
    };

    return (
      <Paper
        elevation={2}
        sx={{
          width: 100,
          height: 100,
          p: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: equipmentItem ? '#f5f5f5' : '#ffffff',
          border: equipmentItem ? '2px solid #1976d2' : '1px solid #e0e0e0',
        }}
        tabIndex={0}
        role="button"
        aria-label={`${slot} equipment slot${equipmentItem ? `: ${equipmentItem.item_name}` : ': empty'}`}
        onKeyDown={event => handleKeyDown(event, slot)}
      >
        {equipmentItem && equipmentItem.item_icon && !imageError ? (
          <Box
            sx={{
              mb: 0.5,
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Image
              src={equipmentItem.item_icon}
              alt={equipmentItem.item_name}
              fill
              sizes="50px"
              style={{
                objectFit: 'contain',
              }}
              onError={handleImageError}
            />
          </Box>
        ) : equipmentItem && equipmentItem.item_icon && imageError ? (
          <Box
            sx={{
              mb: 0.5,
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ccc',
            }}
          >
            <Typography variant="caption" color="textSecondary">
              圖片載入失敗
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              mb: 0.5,
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="caption" color="textSecondary">
              無圖片
            </Typography>
          </Box>
        )}
        <Typography
          variant="caption"
          align="center"
          sx={{ mb: 0.5, fontSize: '0.7rem' }}
        >
          {slot}
        </Typography>
        {equipmentItem ? (
          <Box sx={{ textAlign: 'center', px: 0.5 }}>
            <Typography
              variant="body2"
              sx={{ fontSize: '0.7rem', lineHeight: 1.1 }}
            >
              {equipmentItem.item_name}
            </Typography>
            {equipmentItem.item_level && (
              <Typography
                variant="caption"
                color="textSecondary"
                sx={{ fontSize: '0.65rem' }}
              >
                Lv. {equipmentItem.item_level}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography
            variant="caption"
            color="textSecondary"
            sx={{ fontSize: '0.7rem' }}
          >
            Empty
          </Typography>
        )}
      </Paper>
    );
  };

  return (
    <>
      {open === undefined && (
        <Button variant="contained" onClick={handleClickOpen}>
          裝備
        </Button>
      )}
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="equipment-dialog-title"
        aria-describedby="equipment-dialog-description"
      >
        <DialogTitle id="equipment-dialog-title">角色裝備</DialogTitle>
        <DialogContent id="equipment-dialog-description">
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ p: 2 }}>
              {/* Equipment Grid Layout */}
              <Grid container spacing={1} sx={{ maxWidth: 700, mx: 'auto' }}>
                {/* Row 1 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid>{renderEquipmentSlot('ring', '戒指')}</Grid>
                    <Grid>{renderEquipmentSlot('eye-accessory', '眼飾')}</Grid>
                    <Grid>
                      <Box
                        sx={{
                          width: 100,
                          height: 100,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Avatar
                          src={characterImage}
                          sx={{ width: 90, height: 90 }}
                        />
                      </Box>
                    </Grid>
                    <Grid>{renderEquipmentSlot('hat', '帽子')}</Grid>
                    <Grid>{renderEquipmentSlot('cape', '披風')}</Grid>
                  </Grid>
                </Grid>

                {/* Row 2 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid>{renderEquipmentSlot('ring2', '戒指')}</Grid>
                    <Grid>{renderEquipmentSlot('face-accessory', '臉飾')}</Grid>
                    <Grid>
                      <Box sx={{ width: 100, height: 100 }} />
                    </Grid>
                    <Grid>{renderEquipmentSlot('top', '衣服')}</Grid>
                    <Grid>{renderEquipmentSlot('gloves', '手套')}</Grid>
                  </Grid>
                </Grid>

                {/* Row 3 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid>{renderEquipmentSlot('ring3', '戒指')}</Grid>
                    <Grid>{renderEquipmentSlot('earring', '耳環')}</Grid>
                    <Grid>
                      <Box sx={{ width: 100, height: 100 }} />
                    </Grid>
                    <Grid>{renderEquipmentSlot('bottom', '褲子')}</Grid>
                    <Grid>{renderEquipmentSlot('shoes', '鞋子')}</Grid>
                  </Grid>
                </Grid>

                {/* Row 4 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid>{renderEquipmentSlot('ring4', '戒指')}</Grid>
                    <Grid>{renderEquipmentSlot('necklace', '墜飾')}</Grid>
                    <Grid>
                      <Box sx={{ width: 100, height: 100 }} />
                    </Grid>
                    <Grid>{renderEquipmentSlot('shoulder', '肩膀裝飾')}</Grid>
                    <Grid>{renderEquipmentSlot('medal', '勳章')}</Grid>
                  </Grid>
                </Grid>

                {/* Row 5 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid>{renderEquipmentSlot('belt', '腰帶')}</Grid>
                    <Grid>{renderEquipmentSlot('necklace2', '墜飾')}</Grid>
                    <Grid>{renderEquipmentSlot('weapon', '武器')}</Grid>
                    <Grid>{renderEquipmentSlot('sub-weapon', '輔助武器')}</Grid>
                    <Grid>{renderEquipmentSlot('badge', '徽章')}</Grid>
                  </Grid>
                </Grid>

                {/* Row 6 */}
                <Grid size={{ xs: 12 }}>
                  <Grid container justifyContent="center" spacing={1}>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {renderEquipmentSlot('pocket', '口袋道具')}
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {renderEquipmentSlot('machine-heart', '機器心臟')}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EquipmentDialog;
