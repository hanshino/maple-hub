'use client';

import { Chip } from '@mui/material';
import { EVIDENCE_COLORS, EVIDENCE_LABELS } from './compareFormat';

/**
 * Shared evidence-level badge (API/推導/未知), previously copy-pasted
 * across KeyStatTable, ProgressionSummaryCards, UpgradeChecklist,
 * CategoryCompareTab, and EquipmentCompareTab.
 */
export default function EvidenceChip({ evidence, sx }) {
  return (
    <Chip
      label={EVIDENCE_LABELS[evidence]}
      size="small"
      color={EVIDENCE_COLORS[evidence]}
      sx={{
        px: 1,
        height: 20,
        fontSize: '0.65rem',
        fontWeight: 700,
        ...sx,
      }}
    />
  );
}
