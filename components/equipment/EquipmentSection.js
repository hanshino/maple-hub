'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Tabs,
  Tab,
  ToggleButtonGroup,
  ToggleButton,
  Chip,
  useMediaQuery,
} from '@mui/material';
import {
  processCashItemEquipmentData,
  getEquipmentPosition,
} from '../../lib/equipmentUtils';
import { identifyIndependentItems } from '../../lib/combatPowerCalculator';
import PetEquipmentPanel, {
  processPetEquipmentData,
} from '../PetEquipmentPanel';
import CashItemGrid from '../CashItemGrid';
import EquipmentList from '../EquipmentList';
import EquipmentDetailDrawer from '../EquipmentDetailDrawer';
import CashItemDetailDrawer from '../CashItemDetailDrawer';
import EquipmentCardCompact from './EquipmentCardCompact';
import PanelEmpty from '../panel/PanelEmpty';

// Display order for the compact card grid — mirrors EquipmentGrid's slot
// layout order so the "裝備" tab reads in a familiar sequence.
const SLOT_ORDER = [
  'hat',
  'face-accessory',
  'eye-accessory',
  'earring',
  'top',
  'bottom',
  'shoulder',
  'cape',
  'gloves',
  'shoes',
  'belt',
  'ring',
  'ring2',
  'ring3',
  'ring4',
  'necklace',
  'necklace2',
  'weapon',
  'sub-weapon',
  'pocket',
  'badge',
  'medal',
  'machine-heart',
];

const slotSortIndex = item => {
  const position = getEquipmentPosition(item.item_equipment_slot);
  const idx = SLOT_ORDER.indexOf(position);
  return idx === -1 ? SLOT_ORDER.length : idx;
};

/**
 * Normalizes the equipment API response into { active, presets } regardless
 * of whether the new `equipment_presets` contract field is present.
 * Falls back to the legacy preset_no + item_equipment_preset_N shape so this
 * component works before/independent of the data-layer rollout.
 */
const normalizePresets = equipmentData => {
  if (!equipmentData) return { active: '1', presets: {} };

  const base = equipmentData.item_equipment || [];

  if (equipmentData.equipment_presets?.presets) {
    const { active, presets } = equipmentData.equipment_presets;
    const legacyShape = {
      item_equipment: base,
      item_equipment_preset_1: presets[1],
      item_equipment_preset_2: presets[2],
      item_equipment_preset_3: presets[3],
    };
    const independentItems = identifyIndependentItems(legacyShape);
    return {
      active: String(active || 1),
      presets: Object.fromEntries(
        Object.entries(presets).map(([key, items]) => [
          key,
          [...items, ...independentItems],
        ])
      ),
    };
  }

  const independentItems = identifyIndependentItems(equipmentData);
  const presets = {};
  [1, 2, 3].forEach(n => {
    const rawPreset = equipmentData[`item_equipment_preset_${n}`];
    if (rawPreset?.length) {
      presets[n] = [...rawPreset, ...independentItems];
    }
  });
  if (Object.keys(presets).length === 0) {
    presets['1'] = base;
  }

  return { active: String(equipmentData.preset_no || 1), presets };
};

const TAB = { EQUIPMENT: 0, CASH: 1, PET: 2 };

/**
 * "One page, not a dialog" equipment section: preset-switchable compact
 * equipment cards, plus cash equipment and pet tabs that reuse the existing
 * CashItemGrid / PetEquipmentPanel wholesale.
 */
const EquipmentSection = ({
  equipmentData,
  cashEquipmentData,
  petEquipmentData,
  characterImage,
}) => {
  const isDesktop = useMediaQuery('(min-width:768px)');
  const [tabIndex, setTabIndex] = useState(TAB.EQUIPMENT);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedCashSlot, setSelectedCashSlot] = useState(null);

  const { active, presets } = useMemo(
    () => normalizePresets(equipmentData),
    [equipmentData]
  );
  const presetKeys = useMemo(
    () => Object.keys(presets).sort((a, b) => Number(a) - Number(b)),
    [presets]
  );
  const [presetKey, setPresetKey] = useState(
    presetKeys.includes(active) ? active : presetKeys[0]
  );

  useEffect(() => {
    setPresetKey(presetKeys.includes(active) ? active : presetKeys[0]);
    // Reset preset selection whenever the underlying equipment data changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipmentData]);

  const currentItems = useMemo(() => {
    const items = presets[presetKey] || [];
    return [...items]
      .filter(Boolean)
      .sort((a, b) => slotSortIndex(a) - slotSortIndex(b));
  }, [presets, presetKey]);

  const cashItemEquipment = useMemo(() => {
    if (!cashEquipmentData?.cash_item_equipment_base) return {};
    return processCashItemEquipmentData(cashEquipmentData);
  }, [cashEquipmentData]);

  const petEquipment = useMemo(() => {
    if (!petEquipmentData) return [];
    return processPetEquipmentData(petEquipmentData);
  }, [petEquipmentData]);

  const handleTabChange = (_event, newValue) => {
    setTabIndex(newValue);
    setSelectedItem(null);
    setSelectedCashSlot(null);
  };

  return (
    <Box>
      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="裝備" />
        <Tab label="現金裝備" />
        <Tab label="寵物" />
      </Tabs>

      {tabIndex === TAB.EQUIPMENT && (
        <Box>
          {presetKeys.length > 1 && (
            <ToggleButtonGroup
              value={presetKey}
              exclusive
              onChange={(_, v) => v !== null && setPresetKey(v)}
              size="small"
              sx={{ my: 2 }}
              aria-label="裝備預設選擇"
            >
              {presetKeys.map(key => (
                <ToggleButton
                  key={key}
                  value={key}
                  sx={{ px: 2, borderRadius: '20px !important', gap: 0.5 }}
                >
                  預設 {key}
                  {key === active && (
                    <Chip
                      label="使用中"
                      size="small"
                      color="primary"
                      sx={{ height: 16, fontSize: '0.6rem', ml: 0.5 }}
                    />
                  )}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          )}

          {currentItems.length === 0 ? (
            <PanelEmpty message="此預設尚無裝備資料" />
          ) : (
            <Grid container spacing={2}>
              {currentItems.map(item => (
                <Grid
                  key={`${item.item_equipment_slot}-${item.item_name}`}
                  size={{ xs: 12, md: 6 }}
                >
                  <EquipmentCardCompact item={item} onClick={setSelectedItem} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {tabIndex === TAB.CASH && (
        <Box sx={{ py: 1 }}>
          {isDesktop ? (
            <CashItemGrid
              equipment={cashItemEquipment}
              characterImage={characterImage}
              selectedSlot={selectedCashSlot}
              onSlotClick={slot => {
                if (cashItemEquipment?.[slot]) setSelectedCashSlot(slot);
              }}
            />
          ) : (
            <EquipmentList
              equipment={cashItemEquipment}
              selectedSlot={selectedCashSlot}
              onSlotClick={slot => {
                if (cashItemEquipment?.[slot]) setSelectedCashSlot(slot);
              }}
            />
          )}
        </Box>
      )}

      {tabIndex === TAB.PET && (
        <PetEquipmentPanel loading={false} error={null} pets={petEquipment} />
      )}

      <EquipmentDetailDrawer
        item={tabIndex === TAB.EQUIPMENT ? selectedItem : null}
        open={tabIndex === TAB.EQUIPMENT && !!selectedItem}
        onClose={() => setSelectedItem(null)}
        isMobile={!isDesktop}
      />
      <CashItemDetailDrawer
        item={
          tabIndex === TAB.CASH && selectedCashSlot
            ? cashItemEquipment?.[selectedCashSlot]
            : null
        }
        open={tabIndex === TAB.CASH && !!selectedCashSlot}
        onClose={() => setSelectedCashSlot(null)}
        isMobile={!isDesktop}
      />
    </Box>
  );
};

export default EquipmentSection;
