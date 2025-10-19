'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  CircularProgress,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { processStatsData, formatStatValue } from '../lib/statsUtils';
import { getCachedData, setCachedData } from '../lib/cache';

const CharacterStats = ({ ocid, expanded: initialExpanded = false }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(initialExpanded);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const cacheKey = `stats_${ocid}`;
      let data = getCachedData(cacheKey);

      if (!data) {
        const response = await fetch(`/api/character/stats?ocid=${ocid}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats data');
        }
        data = await response.json();
        setCachedData(cacheKey, data);
      }

      const processed = processStatsData(data);
      setStats(processed);
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }, [ocid]);

  // Load stats when component mounts or when ocid changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleChange = (event, isExpanded) => {
    setExpanded(isExpanded);
  };

  if (loading) {
    return (
      <Accordion expanded={true}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="stats-content"
          id="stats-header"
        >
          <Typography variant="h6">角色能力值</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: 200,
              p: 2,
            }}
          >
            <CircularProgress />
          </Box>
        </AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Accordion expanded={expanded} onChange={handleChange}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="stats-content"
        id="stats-header"
      >
        <Typography variant="h6">角色能力值</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Box sx={{ mt: 2 }}>
          {(() => {
            // Define the core stats groups (API returns English names)
            const coreStatsGroup1 = ['STR', 'DEX', 'INT', 'LUK', 'HP', 'MP'];
            const coreStatsGroup2 = [
              '星力',
              '神秘力量',
              '真實之力',
              '道具掉落率',
              '楓幣獲得量',
              '獲得額外經驗值',
            ];

            // Define stats to hide
            const hiddenStats = [
              '狀態異常耐性',
              '格擋',
              '防禦力',
              '移動速度',
              '跳躍力',
              '攻擊速度',
              '無視屬性耐性',
              '狀態異常追加傷害',
              '武器熟練度',
            ];

            // Separate stats into groups
            const group1Data = stats.filter(stat =>
              coreStatsGroup1.includes(stat.name)
            );
            const group2Data = stats.filter(stat =>
              coreStatsGroup2.includes(stat.name)
            );
            const otherStats = stats.filter(
              stat =>
                !coreStatsGroup1.includes(stat.name) &&
                !coreStatsGroup2.includes(stat.name) &&
                !hiddenStats.includes(stat.name)
            );

            const groups = [];

            // Helper function to render a stats group with its own border
            const renderStatsGroup = (statsData, groupIndex) => {
              const groupRows = [];
              for (let i = 0; i < statsData.length; i += 2) {
                const rowStats = statsData.slice(i, i + 2);
                groupRows.push(
                  <TableRow key={`group-${groupIndex}-${i / 2}`}>
                    {rowStats.map(stat => (
                      <React.Fragment key={stat.name}>
                        <TableCell
                          component="th"
                          scope="row"
                          sx={{
                            fontWeight: 'bold',
                            p: 1,
                            width: '40%',
                          }}
                        >
                          {stat.name}
                        </TableCell>
                        <TableCell
                          sx={{
                            p: 1,
                            width: '10%',
                          }}
                        >
                          {formatStatValue(stat.value)}
                        </TableCell>
                      </React.Fragment>
                    ))}
                    {/* Fill empty cells if less than 2 stats in this row */}
                    {rowStats.length < 2 && (
                      <>
                        <TableCell
                          sx={{
                            p: 1,
                            width: '40%',
                          }}
                        ></TableCell>
                        <TableCell
                          sx={{
                            p: 1,
                            width: '10%',
                          }}
                        ></TableCell>
                      </>
                    )}
                  </TableRow>
                );
              }

              return (
                <Box
                  key={`group-${groupIndex}`}
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    mb: 2,
                    p: 1,
                  }}
                >
                  <TableContainer>
                    <Table
                      size="small"
                      aria-label={`Stats group ${groupIndex + 1} table`}
                      sx={{
                        '& .MuiTableCell-root': {
                          border: 'none',
                        },
                      }}
                    >
                      <TableBody>{groupRows}</TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            };

            // Add group 1 (STR, DEX, INT, LUK, HP, MP) - light gray background
            if (group1Data.length > 0) {
              groups.push(renderStatsGroup(group1Data, 0));
            }

            // Add group 2 (星力, 神秘力量, 真實之力, 道具掉落率, 楓幣獲得量, Buff持續時間) - light orange background
            if (group2Data.length > 0) {
              groups.push(renderStatsGroup(group2Data, 1));
            }

            // Add other stats in their own bordered container
            if (otherStats.length > 0) {
              const otherRows = [];
              otherStats.reduce((acc, stat, index) => {
                if (index % 2 === 0) {
                  const nextStat = otherStats[index + 1];
                  otherRows.push(
                    <TableRow key={`other-${index / 2}`}>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{ fontWeight: 'bold', p: 1, width: '40%' }}
                      >
                        {stat.name}
                      </TableCell>
                      <TableCell sx={{ p: 1, width: '10%' }}>
                        {formatStatValue(stat.value)}
                      </TableCell>
                      {nextStat && (
                        <>
                          <TableCell
                            component="th"
                            scope="row"
                            sx={{ fontWeight: 'bold', p: 1, width: '40%' }}
                          >
                            {nextStat.name}
                          </TableCell>
                          <TableCell sx={{ p: 1, width: '10%' }}>
                            {formatStatValue(nextStat.value)}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                }
                return acc;
              }, []);

              groups.push(
                <Box
                  key="other-group"
                  sx={{
                    border: '1px solid #e0e0e0',
                    borderRadius: 2,
                    overflow: 'hidden',
                    p: 1,
                  }}
                >
                  <TableContainer>
                    <Table
                      size="small"
                      aria-label="Other stats table"
                      sx={{
                        '& .MuiTableCell-root': {
                          border: 'none',
                        },
                      }}
                    >
                      <TableBody>{otherRows}</TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              );
            }

            return groups;
          })()}
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default CharacterStats;
