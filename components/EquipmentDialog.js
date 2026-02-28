'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  CircularProgress,
  Alert,
  Button,
  useMediaQuery,
} from '@mui/material';
import { processEquipmentData } from '../lib/equipmentUtils';
import { getCachedData, setCachedData } from '../lib/cache';
import EquipmentGrid from './EquipmentGrid';
import EquipmentList from './EquipmentList';
import EquipmentDetailDrawer from './EquipmentDetailDrawer';

const EquipmentDialog = ({ ocid, character, open, onClose }) => {
  const [equipment, setEquipment] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [characterImage, setCharacterImage] = useState(
    '/character-placeholder.png'
  );
  const isDesktop = useMediaQuery('(min-width:768px)');

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cacheKey = `equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(
          `/api/character/equipment?ocid=${ocid}`
        );
        if (!response.ok) {
          throw new Error('載入裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processEquipmentData(data);
      setEquipment(processed);
    } catch (err) {
      console.error('Failed to load equipment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ocid]);

  useEffect(() => {
    if (character?.character_image) {
      setCharacterImage(character.character_image);
    }
  }, [character]);

  useEffect(() => {
    if (open && ocid) {
      loadEquipment();
      setSelectedSlot(null);
    }
  }, [open, ocid, loadEquipment]);

  const handleSlotClick = (slotKey) => {
    if (equipment?.[slotKey]) {
      setSelectedSlot(slotKey);
    }
  };

  const handleDrawerClose = () => {
    setSelectedSlot(null);
  };

  return (
    <>
      <Dialog
        open={!!open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        fullScreen={!isDesktop}
        aria-labelledby="equipment-dialog-title"
      >
        <DialogTitle id="equipment-dialog-title">角色裝備</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 2 }}>
              <Alert
                severity="error"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={loadEquipment}
                  >
                    重試
                  </Button>
                }
              >
                {error}
              </Alert>
            </Box>
          ) : (
            <Box sx={{ py: 1 }}>
              {isDesktop ? (
                <EquipmentGrid
                  equipment={equipment}
                  characterImage={characterImage}
                  selectedSlot={selectedSlot}
                  onSlotClick={handleSlotClick}
                />
              ) : (
                <EquipmentList
                  equipment={equipment}
                  selectedSlot={selectedSlot}
                  onSlotClick={handleSlotClick}
                />
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <EquipmentDetailDrawer
        item={selectedSlot ? equipment?.[selectedSlot] : null}
        open={!!selectedSlot}
        onClose={handleDrawerClose}
        isMobile={!isDesktop}
      />
    </>
  );
};

export default EquipmentDialog;
