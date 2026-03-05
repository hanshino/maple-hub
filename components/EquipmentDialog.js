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
  Tabs,
  Tab,
} from '@mui/material';
import {
  processEquipmentData,
  processCashItemEquipmentData,
} from '../lib/equipmentUtils';
import { getCachedData, setCachedData } from '../lib/cache';
import EquipmentGrid from './EquipmentGrid';
import EquipmentList from './EquipmentList';
import EquipmentDetailDrawer from './EquipmentDetailDrawer';
import CashItemGrid from './CashItemGrid';
import CashItemDetailDrawer from './CashItemDetailDrawer';
import PetEquipmentPanel, {
  processPetEquipmentData,
} from './PetEquipmentPanel';

const EquipmentDialog = ({ ocid, character, open, onClose, prefetchedData }) => {
  const [equipment, setEquipment] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [characterImage, setCharacterImage] = useState(
    '/character-placeholder.png'
  );
  const isDesktop = useMediaQuery('(min-width:768px)');

  const [tabIndex, setTabIndex] = useState(0);
  const [cashItemEquipment, setCashItemEquipment] = useState({});
  const [cashItemLoading, setCashItemLoading] = useState(false);
  const [cashItemError, setCashItemError] = useState(null);
  const [cashItemLoaded, setCashItemLoaded] = useState(false);

  const [petEquipment, setPetEquipment] = useState([]);
  const [petLoading, setPetLoading] = useState(false);
  const [petError, setPetError] = useState(null);
  const [petLoaded, setPetLoaded] = useState(false);

  const loadEquipment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (prefetchedData) {
        data = prefetchedData;
      } else {
        const cacheKey = `equipment_${ocid}`;
        data = getCachedData(cacheKey);
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
      }
      const processed = processEquipmentData(data);
      setEquipment(processed);
    } catch (err) {
      console.error('Failed to load equipment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [ocid, prefetchedData]);

  const loadPetEquipment = useCallback(async () => {
    setPetLoading(true);
    setPetError(null);
    try {
      const cacheKey = `pet_equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(
          `/api/character/pet-equipment?ocid=${ocid}`
        );
        if (!response.ok) {
          throw new Error('載入寵物裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processPetEquipmentData(data);
      setPetEquipment(processed);
      setPetLoaded(true);
    } catch (err) {
      console.error('Failed to load pet equipment:', err);
      setPetError(err.message);
    } finally {
      setPetLoading(false);
    }
  }, [ocid]);

  const loadCashItemEquipment = useCallback(async () => {
    setCashItemLoading(true);
    setCashItemError(null);
    try {
      const cacheKey = `cashitem_equipment_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(
          `/api/character/cashitem-equipment?ocid=${ocid}`
        );
        if (!response.ok) {
          throw new Error('載入現金裝備失敗');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processCashItemEquipmentData(data);
      setCashItemEquipment(processed);
      setCashItemLoaded(true);
    } catch (err) {
      console.error('Failed to load cash item equipment:', err);
      setCashItemError(err.message);
    } finally {
      setCashItemLoading(false);
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
      setTabIndex(0);
      setCashItemLoaded(false);
      setPetLoaded(false);
    }
  }, [open, ocid, loadEquipment]);

  useEffect(() => {
    if (tabIndex === 1 && !cashItemLoaded && ocid) {
      loadCashItemEquipment();
    }
  }, [tabIndex, cashItemLoaded, ocid, loadCashItemEquipment]);

  useEffect(() => {
    if (tabIndex === 2 && !petLoaded && ocid) {
      loadPetEquipment();
    }
  }, [tabIndex, petLoaded, ocid, loadPetEquipment]);

  const handleSlotClick = (slotKey) => {
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
    if (cashItemLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (cashItemError) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={loadCashItemEquipment}
              >
                重試
              </Button>
            }
          >
            {cashItemError}
          </Alert>
        </Box>
      );
    }
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
        <DialogTitle id="equipment-dialog-title">角色裝備</DialogTitle>
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
              loading={petLoading}
              error={petError}
              pets={petEquipment}
              onRetry={loadPetEquipment}
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
