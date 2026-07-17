'use client';

import { useEffect, useState } from 'react';
import { Alert, Box, Tab, Tabs } from '@mui/material';
import { alpha } from '@mui/material/styles';
import KeyStatTable from './KeyStatTable';
import UpgradeChecklist from './UpgradeChecklist';
import ProgressionSummaryCards from './ProgressionSummaryCards';
import EquipmentCompareTab from './EquipmentCompareTab';
import CategoryCompareTab from './CategoryCompareTab';

const TAB_OVERVIEW = 0;
const TAB_EQUIPMENT = 1;
const TAB_SYMBOLS = 2;
const TAB_HEXA = 3;
const TAB_UNION = 4;
const TAB_HYPER_STAT = 5;
const TAB_LINK_SKILL = 6;
const TAB_SET_EFFECTS = 7;
const TAB_FAMILIAR = 8;

const TAB_NAMES = [
  '總覽',
  '裝備',
  '符文',
  'HEXA',
  '聯盟',
  '極限屬性',
  '連結技能',
  '套裝效果',
  '萌獸',
];

// Index -> normalized-coverage key (see lib/characterComparison.js's
// normalize output); null for the always-available Overview tab.
const TAB_COVERAGE_KEY = [
  null,
  'equipment',
  'symbols',
  'hexa',
  'union',
  'hyperStat',
  'linkSkill',
  'setEffects',
  'familiar',
];

/**
 * Comparison detail tabs. A structurally missing category (both sides
 * lack coverage) disables its tab with a no-data indicator, per the
 * spec's Error and Partial-data Handling section. Tab content is driven
 * entirely by `comparison.categories` — no invented values.
 */
export default function CompareTabs({
  comparison,
  upgradeDirections,
  leftNormalized,
  rightNormalized,
  leftRaw,
  rightRaw,
}) {
  const isDisabled = index => {
    const key = TAB_COVERAGE_KEY[index];
    if (!key) return false;
    return (
      !leftNormalized?.[key]?.coverage && !rightNormalized?.[key]?.coverage
    );
  };

  const [activeTab, setActiveTab] = useState(TAB_OVERVIEW);

  // If the active tab becomes unavailable (e.g. after swapping/replacing
  // to a pair with a structurally missing category), fall back to
  // Overview rather than rendering a disabled tab's content.
  useEffect(() => {
    if (isDisabled(activeTab)) setActiveTab(TAB_OVERVIEW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leftNormalized, rightNormalized]);

  const { categories } = comparison;

  return (
    <Box>
      <Tabs
        value={activeTab}
        onChange={(_event, value) => setActiveTab(value)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="比較分頁"
        sx={{
          mb: 3,
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            fontWeight: 700,
            minHeight: 40,
            borderRadius: '20px',
            px: 2,
          },
          '& .MuiTab-root.Mui-selected': {
            bgcolor: theme => alpha(theme.palette.primary.main, 0.14),
            color: 'primary.main',
          },
        }}
      >
        {TAB_NAMES.map((name, index) => (
          <Tab
            key={name}
            label={
              isDisabled(index) ? (
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}
                >
                  {name}
                  <Box
                    component="span"
                    title="無資料"
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      bgcolor: 'text.disabled',
                    }}
                  />
                </Box>
              ) : (
                name
              )
            }
            disabled={isDisabled(index)}
            id={`compare-tab-${index}`}
            aria-controls={`compare-tabpanel-${index}`}
          />
        ))}
      </Tabs>

      <Box
        role="tabpanel"
        id={`compare-tabpanel-${activeTab}`}
        aria-labelledby={`compare-tab-${activeTab}`}
      >
        {activeTab === TAB_OVERVIEW && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box>
              <Box
                component="h3"
                sx={{ fontWeight: 800, mb: 2, fontSize: '1.05rem' }}
              >
                關鍵屬性對照
              </Box>
              {comparison.sameClass ? (
                <KeyStatTable comparison={comparison} />
              ) : (
                <Alert severity="info">
                  兩位角色職業不同，主屬性與傷害相關公式不可直接比較，因此不顯示逐項屬性對照。
                </Alert>
              )}
            </Box>

            <Box>
              <Box
                component="h3"
                sx={{ fontWeight: 800, mb: 2, fontSize: '1.05rem' }}
              >
                值得優先檢查的系統
              </Box>
              {comparison.sameClass ? (
                <UpgradeChecklist directions={upgradeDirections} />
              ) : (
                <Alert severity="info">
                  職業不同時不提供檢查清單排序，僅顯示下方共同的進度系統摘要。
                </Alert>
              )}
            </Box>

            <Box>
              <Box
                component="h3"
                sx={{ fontWeight: 800, mb: 2, fontSize: '1.05rem' }}
              >
                進度系統摘要
              </Box>
              <ProgressionSummaryCards comparison={comparison} />
            </Box>
          </Box>
        )}

        {activeTab === TAB_EQUIPMENT && (
          <EquipmentCompareTab
            leftEquipmentData={leftRaw?.equipment}
            rightEquipmentData={rightRaw?.equipment}
            starSumRow={categories.equipment.starSum}
            starForceRow={categories.equipment.finalStatStarForce}
            scrollAttackRow={categories.equipment.scrollAttackSum}
            scrollMagicRow={categories.equipment.scrollMagicSum}
          />
        )}

        {activeTab === TAB_SYMBOLS && (
          <CategoryCompareTab
            rows={[
              { label: '符文等級總和', row: categories.symbols.totalLevel },
              { label: '真實之力', row: categories.symbols.authenticForce },
            ]}
          />
        )}

        {activeTab === TAB_HEXA && (
          <CategoryCompareTab
            rows={[
              {
                label: 'HEXA 核心等級總和',
                row: categories.hexa.totalCoreLevel,
              },
              {
                label: 'HEXA 屬性等級總和',
                row: categories.hexa.totalStatLevel,
              },
            ]}
          />
        )}

        {activeTab === TAB_UNION && (
          <CategoryCompareTab
            rows={[
              { label: '聯盟等級', row: categories.union.level },
              {
                label: '聯盟戰地屬性項目數',
                row: categories.union.raider.statCount,
              },
            ]}
          />
        )}

        {activeTab === TAB_HYPER_STAT && (
          <CategoryCompareTab
            presetInfo={{
              label: '啟用中的極限屬性 Preset',
              left: categories.hyperStat.activePresetNo.left,
              right: categories.hyperStat.activePresetNo.right,
            }}
            rows={[
              {
                label: '極限屬性等級總和',
                row: categories.hyperStat.totalLevel,
              },
            ]}
          />
        )}

        {activeTab === TAB_LINK_SKILL && (
          <CategoryCompareTab
            presetInfo={{
              label: '啟用中的連結技能 Preset',
              left: categories.linkSkill.activePresetNo.left,
              right: categories.linkSkill.activePresetNo.right,
            }}
            rows={[
              {
                label: '連結技能等級總和',
                row: categories.linkSkill.totalLevel,
              },
            ]}
          />
        )}

        {activeTab === TAB_SET_EFFECTS && (
          <CategoryCompareTab
            rows={[
              {
                label: '套裝件數總和',
                row: categories.setEffects.totalSetCount,
              },
            ]}
          />
        )}

        {activeTab === TAB_FAMILIAR && (
          <CategoryCompareTab
            rows={[
              {
                label: '已登錄萌獸數',
                row: categories.familiar.registeredCount,
              },
              {
                label: '連結中萌獸數',
                row: categories.familiar.linkedCount,
              },
              {
                label: '連結萌獸選項等級總和',
                row: categories.familiar.linkedOptionLevelSum,
              },
            ]}
          />
        )}
      </Box>
    </Box>
  );
}
