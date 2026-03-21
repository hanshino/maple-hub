import { NextResponse } from 'next/server';
import { getExpSnapshots } from '@/lib/db/guildQueries.js';
import { getGuildWithMembers } from '@/lib/db/guildQueries.js';
import { startExpBackfill } from '@/lib/guildExpBackfillService.js';

function formatDate(d) {
  return d.toISOString().slice(0, 10);
}

/**
 * Calculate exp growth between two snapshots.
 * Accounts for level-ups: each level-up = 100% exp.
 */
function calcExpGrowth(current, past) {
  if (!current || !past) return null;
  const curRate = parseFloat(current.characterExpRate) || 0;
  const pastRate = parseFloat(past.characterExpRate) || 0;
  const levelDiff = (current.characterLevel || 0) - (past.characterLevel || 0);
  return levelDiff * 100 + (curRate - pastRate);
}

/**
 * Level-weighted effort reflecting the exponential difficulty curve.
 * - Lv200-280: every 10 levels doubles the weight
 * - Lv280+: every 5 levels doubles (much steeper, matches real game curve)
 */
function calcEffortScore(rawGrowth, level) {
  if (rawGrowth == null || rawGrowth <= 0 || !level) return 0;
  let penalty = 1;
  if (level < 260) {
    // Lv260 以下經驗太容易取得，大幅降低權重
    penalty = Math.pow(0.1, (260 - Math.max(level, 200)) / 20);
  }
  const base = Math.max(0, Math.min(level, 280) - 200) / 10;
  const high = level > 280 ? (level - 280) / 5 : 0;
  const weight = Math.pow(2, base + high);
  return rawGrowth * weight * penalty;
}

/**
 * Assign effort ranks (1 = highest effort) based on weighted scores.
 * Members with no growth data get null rank.
 */
function assignEffortRanks(members, growthKey, rankKey) {
  const scored = members
    .map((m, i) => ({
      idx: i,
      score: calcEffortScore(m[growthKey], m.characterLevel),
      hasData: m[growthKey] != null,
    }))
    .filter(s => s.hasData && s.score > 0)
    .sort((a, b) => b.score - a.score);

  const ranks = new Array(members.length).fill(null);
  scored.forEach((s, rank) => {
    ranks[s.idx] = rank + 1;
  });
  return members.map((m, i) => ({ ...m, [rankKey]: ranks[i] }));
}

export async function GET(request, { params }) {
  const { oguildId } = await params;

  try {
    const guild = await getGuildWithMembers(oguildId);
    if (!guild) {
      return NextResponse.json({ error: '工會不存在' }, { status: 404 });
    }

    const now = new Date();
    const today = formatDate(now);
    const date7 = formatDate(new Date(now - 7 * 86400000));
    const date30 = formatDate(new Date(now - 30 * 86400000));

    // Fetch historical snapshots (today's data comes from the characters table)
    const snapshots = await getExpSnapshots(oguildId, [date7, date30]);

    // Build growth data per member
    const members = guild.members
      .filter(m => m.ocid)
      .map(m => {
        const s = snapshots[m.ocid] || {};
        // Use current character data as "today" instead of requiring a
        // today snapshot — avoids null when members weren't re-synced.
        const current = {
          characterLevel: m.characterLevel,
          characterExpRate: m.characterExpRate,
        };
        return {
          characterName: m.characterName,
          characterClass: m.characterClass,
          characterLevel: m.characterLevel,
          characterImage: m.characterImage,
          growth7: calcExpGrowth(current, s[date7]),
          growth30: calcExpGrowth(current, s[date30]),
        };
      });

    // Assign effort ranks (level-weighted)
    let ranked = assignEffortRanks(members, 'growth7', 'effortRank7');
    ranked = assignEffortRanks(ranked, 'growth30', 'effortRank30');

    // Trigger backfill for missing snapshots (non-blocking)
    const backfillStatus = await startExpBackfill(oguildId);

    return NextResponse.json({
      members: ranked,
      backfillStatus,
      dates: { today, date7, date30 },
    });
  } catch (error) {
    console.error('Exp growth error:', error);
    return NextResponse.json(
      { error: '取得經驗成長資料時發生錯誤' },
      { status: 500 }
    );
  }
}
