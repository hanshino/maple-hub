'use client';

import { useState, useCallback } from 'react';
import { Box, Card, CardContent, Tab, Tabs } from '@mui/material';
import CharacterStats from './CharacterStats';
import RuneSystems from './runes/RuneSystems';
import UnionRaiderPanel from './UnionRaiderPanel';
import HyperStatPanel from './HyperStatPanel';
import SetEffectPanel from './SetEffectPanel';
import UnionArtifactPanel from './UnionArtifactPanel';
import { getCachedData, setCachedData } from '../lib/cache';

const TAB_STATS = 0;
const TAB_UNION_RAIDER = 1;
const TAB_HYPER_STAT = 2;
const TAB_SET_EFFECT = 3;
const TAB_UNION_ARTIFACT = 4;
const TAB_RUNES = 5;

const CharacterDataTabs = ({
  ocid,
  runes,
  setEffectData,
  setEffectLoading,
  setEffectError,
  onRetrySetEffect,
}) => {
  const [activeTab, setActiveTab] = useState(TAB_STATS);

  // Union Raider lazy state
  const [unionRaiderData, setUnionRaiderData] = useState(null);
  const [unionRaiderLoading, setUnionRaiderLoading] = useState(false);
  const [unionRaiderError, setUnionRaiderError] = useState(null);
  const [unionRaiderLoaded, setUnionRaiderLoaded] = useState(false);

  // Hyper Stat lazy state
  const [hyperStatData, setHyperStatData] = useState(null);
  const [hyperStatLoading, setHyperStatLoading] = useState(false);
  const [hyperStatError, setHyperStatError] = useState(null);
  const [hyperStatLoaded, setHyperStatLoaded] = useState(false);

  // Union Artifact lazy state
  const [unionArtifactData, setUnionArtifactData] = useState(null);
  const [unionArtifactLoading, setUnionArtifactLoading] = useState(false);
  const [unionArtifactError, setUnionArtifactError] = useState(null);
  const [unionArtifactLoaded, setUnionArtifactLoaded] = useState(false);

  const fetchTabData = useCallback(
    async (
      apiPath,
      cachePrefix,
      setData,
      setLoading,
      setError,
      setLoaded
    ) => {
      setLoading(true);
      setError(null);
      try {
        const cacheKey = `${cachePrefix}_${ocid}`;
        let data = getCachedData(cacheKey);
        if (!data) {
          const response = await fetch(`/api/character/${apiPath}?ocid=${ocid}`);
          if (!response.ok) throw new Error('載入失敗');
          data = await response.json();
          setCachedData(cacheKey, data);
        }
        setData(data);
        setLoaded(true);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [ocid]
  );

  const handleTabChange = (_event, newValue) => {
    setActiveTab(newValue);

    if (newValue === TAB_UNION_RAIDER && !unionRaiderLoaded) {
      fetchTabData(
        'union-raider',
        'union_raider',
        setUnionRaiderData,
        setUnionRaiderLoading,
        setUnionRaiderError,
        setUnionRaiderLoaded
      );
    }

    if (newValue === TAB_HYPER_STAT && !hyperStatLoaded) {
      fetchTabData(
        'hyper-stat',
        'hyper_stat',
        setHyperStatData,
        setHyperStatLoading,
        setHyperStatError,
        setHyperStatLoaded
      );
    }

    if (newValue === TAB_UNION_ARTIFACT && !unionArtifactLoaded) {
      fetchTabData(
        'union-artifact',
        'union_artifact',
        setUnionArtifactData,
        setUnionArtifactLoading,
        setUnionArtifactError,
        setUnionArtifactLoaded
      );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case TAB_STATS:
        return <CharacterStats ocid={ocid} />;
      case TAB_UNION_RAIDER:
        return (
          <UnionRaiderPanel
            data={unionRaiderData}
            loading={unionRaiderLoading}
            error={unionRaiderError}
          />
        );
      case TAB_HYPER_STAT:
        return (
          <HyperStatPanel
            data={hyperStatData}
            loading={hyperStatLoading}
            error={hyperStatError}
          />
        );
      case TAB_SET_EFFECT:
        return (
          <SetEffectPanel
            data={setEffectData}
            loading={setEffectLoading}
            error={setEffectError}
            onRetry={onRetrySetEffect}
          />
        );
      case TAB_UNION_ARTIFACT:
        return (
          <UnionArtifactPanel
            data={unionArtifactData}
            loading={unionArtifactLoading}
            error={unionArtifactError}
          />
        );
      case TAB_RUNES:
        return <RuneSystems runes={runes} ocid={ocid} />;
      default:
        return null;
    }
  };

  return (
    <Card elevation={2}>
      <CardContent sx={{ p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="角色資料分頁"
        >
          <Tab label="能力值" />
          <Tab label="聯盟戰地" />
          <Tab label="極限屬性" />
          <Tab label="套裝效果" />
          <Tab label="聯盟神器" />
          <Tab label="符文系統" />
        </Tabs>
        <Box aria-live="polite" sx={{ mt: 2 }}>
          {renderTabContent()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default CharacterDataTabs;
