'use client';

import { useState } from 'react';
import { Box, Card, CardContent, Tab, Tabs } from '@mui/material';
import { alpha } from '@mui/material/styles';
import CharacterStats from './CharacterStats';
import RuneSystems from './runes/RuneSystems';
import UnionRaiderPanel from './UnionRaiderPanel';
import HyperStatPanel from './HyperStatPanel';
import SetEffectPanel from './SetEffectPanel';
import UnionArtifactPanel from './UnionArtifactPanel';
import UnionChampionPanel from './UnionChampionPanel';
import LinkSkillPanel from './LinkSkillPanel';
import { track } from '../lib/analytics';

const TAB_STATS = 0;
const TAB_HYPER_STAT = 1;
const TAB_SET_EFFECT = 2;
const TAB_UNION_RAIDER = 3;
const TAB_UNION_ARTIFACT = 4;
const TAB_UNION_CHAMPION = 5;
const TAB_RUNES = 6;
const TAB_LINK_SKILL = 7;

const CharacterDataTabs = ({
  ocid,
  runes,
  setEffectData,
  statsData,
  hyperStatData,
  linkSkillData,
  unionRaiderData,
  unionArtifactData,
  unionChampionData,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_STATS);

  const tabNames = [
    '能力值',
    '極限屬性',
    '套裝效果',
    '聯盟戰地',
    '聯盟神器',
    '聯盟冠軍',
    '符文系統',
    '傳授技能',
  ];

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
    track('tab-switch', { tab: tabNames[newValue] });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TAB_STATS:
        return <CharacterStats statsData={statsData} />;
      case TAB_HYPER_STAT:
        return (
          <HyperStatPanel data={hyperStatData} loading={false} error={null} />
        );
      case TAB_SET_EFFECT:
        return (
          <SetEffectPanel data={setEffectData} loading={false} error={null} />
        );
      case TAB_UNION_RAIDER:
        return (
          <UnionRaiderPanel
            data={unionRaiderData}
            loading={false}
            error={null}
          />
        );
      case TAB_UNION_ARTIFACT:
        return (
          <UnionArtifactPanel
            data={unionArtifactData}
            loading={false}
            error={null}
          />
        );
      case TAB_UNION_CHAMPION:
        return (
          <UnionChampionPanel
            data={unionChampionData}
            loading={false}
            error={null}
          />
        );
      case TAB_RUNES:
        return <RuneSystems runes={runes} ocid={ocid} />;
      case TAB_LINK_SKILL:
        return (
          <LinkSkillPanel data={linkSkillData} loading={false} error={null} />
        );
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Box
          sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 0.5, mb: 2 }}
        >
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="角色資料分頁"
            sx={{
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                fontWeight: 600,
                minHeight: 40,
                py: 0.75,
                px: 2,
                borderRadius: '20px',
                transition: 'background-color 150ms ease',
                '&:hover:not(.Mui-selected)': {
                  bgcolor: theme => alpha(theme.palette.primary.main, 0.06),
                },
              },
              '& .MuiTab-root.Mui-selected': {
                bgcolor: theme => alpha(theme.palette.primary.main, 0.12),
                borderRadius: '20px',
                color: 'primary.main',
                fontWeight: 700,
              },
            }}
          >
            {tabNames.map((name, i) => (
              <Tab
                key={i}
                label={name}
                id={`char-tab-${i}`}
                aria-controls={`char-tabpanel-${i}`}
              />
            ))}
          </Tabs>
        </Box>
        <Box
          role="tabpanel"
          id={`char-tabpanel-${activeTab}`}
          aria-labelledby={`char-tab-${activeTab}`}
          aria-live="polite"
          sx={{ mt: 2 }}
        >
          {renderTabContent()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CharacterDataTabs;
