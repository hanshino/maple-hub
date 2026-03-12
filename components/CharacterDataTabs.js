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
import LinkSkillPanel from './LinkSkillPanel';

const TAB_STATS = 0;
const TAB_UNION_RAIDER = 1;
const TAB_HYPER_STAT = 2;
const TAB_SET_EFFECT = 3;
const TAB_UNION_ARTIFACT = 4;
const TAB_RUNES = 5;
const TAB_LINK_SKILL = 6;

const CharacterDataTabs = ({
  ocid,
  runes,
  setEffectData,
  statsData,
  hyperStatData,
  linkSkillData,
  unionRaiderData,
  unionArtifactData,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_STATS);

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TAB_STATS:
        return <CharacterStats statsData={statsData} />;
      case TAB_UNION_RAIDER:
        return (
          <UnionRaiderPanel
            data={unionRaiderData}
            loading={false}
            error={null}
          />
        );
      case TAB_HYPER_STAT:
        return (
          <HyperStatPanel
            data={hyperStatData}
            loading={false}
            error={null}
          />
        );
      case TAB_SET_EFFECT:
        return (
          <SetEffectPanel
            data={setEffectData}
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
      case TAB_RUNES:
        return <RuneSystems runes={runes} ocid={ocid} />;
      case TAB_LINK_SKILL:
        return (
          <LinkSkillPanel
            data={linkSkillData}
            loading={false}
            error={null}
          />
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
            <Tab
              label="能力值"
              id="char-tab-0"
              aria-controls="char-tabpanel-0"
            />
            <Tab
              label="聯盟戰地"
              id="char-tab-1"
              aria-controls="char-tabpanel-1"
            />
            <Tab
              label="極限屬性"
              id="char-tab-2"
              aria-controls="char-tabpanel-2"
            />
            <Tab
              label="套裝效果"
              id="char-tab-3"
              aria-controls="char-tabpanel-3"
            />
            <Tab
              label="聯盟神器"
              id="char-tab-4"
              aria-controls="char-tabpanel-4"
            />
            <Tab
              label="符文系統"
              id="char-tab-5"
              aria-controls="char-tabpanel-5"
            />
            <Tab
              label="傳授技能"
              id="char-tab-6"
              aria-controls="char-tabpanel-6"
            />
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
