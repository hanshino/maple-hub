'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  useMediaQuery,
  Tabs,
  Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
  processEquipmentData,
  processCashItemEquipmentData,
} from '../lib/equipmentUtils';
import EquipmentGrid from './EquipmentGrid';
import EquipmentList from './EquipmentList';
import EquipmentDetailDrawer from './EquipmentDetailDrawer';
import CashItemGrid from './CashItemGrid';
import CashItemDetailDrawer from './CashItemDetailDrawer';
import PetEquipmentPanel, {
  processPetEquipmentData,
} from './PetEquipmentPanel';

const EquipmentDialog = ({
  ocid,
  character,
  open,
  onClose,
  prefetchedData,
  cashEquipmentData,
  petEquipmentData,
}) => {
  const [equipment, setEquipment] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [characterImage, setCharacterImage] = useState(
    '/character-placeholder.png'
  );
  const isDesktop = useMediaQuery('(min-width:768px)');
  const [tabIndex, setTabIndex] = useState(0);

  const cashItemEquipment = useMemo(() => {
    if (!cashEquipmentData?.cash_item_equipment_base) return {};
    return processCashItemEquipmentData(cashEquipmentData);
  }, [cashEquipmentData]);

  const petEquipment = useMemo(() => {
    if (!petEquipmentData) return [];
    return processPetEquipmentData(petEquipmentData);
  }, [petEquipmentData]);

  const loadEquipment = useCallback(() => {
    setLoading(true);
    setError(null);
    try {
      const data = prefetchedData;
      if (!data) {
        setLoading(false);
        return;
      }
      const processed = processEquipmentData(data);
      setEquipment(processed);
    } catch (err) {
      console.error('Failed to load equipment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [prefetchedData]);

  useEffect(() => {
    if (character?.character_image) {
      setCharacterImage(character.character_image);
    }
  }, [character]);

  useEffect(() => {
    if (open && ocid) {
      loadEquipment();
      setSelectedSlot(null);
      setTabIndex(0);
    }
  }, [open, ocid, loadEquipment]);

  const handleSlotClick = slotKey => {
    const source = tabIndex === 0 ? equipment : cashItemEquipment;
    if (source?.[slotKey]) {
      setSelectedSlot(slotKey);
    }
  };

  const handleDrawerClose = () => {
    setSelectedSlot(null);
  };

  const handleTabChange = (_event, newValue) => {
    setTabIndex(newValue);
    setSelectedSlot(null);
  };

  const renderRegularEquipment = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={loadEquipment}>
                重試
              </Button>
            }
          >
            {error}
          </Alert>
        </Box>
      );
    }
    return (
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
    );
  };

  const renderCashItemEquipment = () => {
    return (
      <Box sx={{ py: 1 }}>
        {isDesktop ? (
          <CashItemGrid
            equipment={cashItemEquipment}
            characterImage={characterImage}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        ) : (
          <EquipmentList
            equipment={cashItemEquipment}
            selectedSlot={selectedSlot}
            onSlotClick={handleSlotClick}
          />
        )}
      </Box>
    );
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
        <DialogTitle
          id="equipment-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pr: 1.5,
          }}
        >
          角色裝備
          <IconButton
            onClick={onClose}
            aria-label="關閉裝備視窗"
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="裝備" />
          <Tab label="現金裝備" />
          <Tab label="寵物" />
        </Tabs>
        <DialogContent>
          {tabIndex === 0 && renderRegularEquipment()}
          {tabIndex === 1 && renderCashItemEquipment()}
          {tabIndex === 2 && (
            <PetEquipmentPanel
              loading={false}
              error={null}
              pets={petEquipment}
            />
          )}
        </DialogContent>
      </Dialog>

      {tabIndex === 0 ? (
        <EquipmentDetailDrawer
          item={selectedSlot ? equipment?.[selectedSlot] : null}
          open={!!selectedSlot}
          onClose={handleDrawerClose}
          isMobile={!isDesktop}
        />
      ) : (
        <CashItemDetailDrawer
          item={selectedSlot ? cashItemEquipment?.[selectedSlot] : null}
          open={!!selectedSlot}
          onClose={handleDrawerClose}
          isMobile={!isDesktop}
        />
      )}
    </>
  );
};

export default EquipmentDialog;
