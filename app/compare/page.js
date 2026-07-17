'use client';

import { Suspense, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Alert, Container, Typography } from '@mui/material';
import {
  normalizeCharacterForComparison,
  compareCharacters,
  rankUpgradeDirections,
} from '../../lib/characterComparison';
import { useCharacterSide } from '../../components/compare/useCharacterSide';
import CharacterSearchBar from '../../components/compare/CharacterSearchBar';
import CompareHeaderCard from '../../components/compare/CompareHeaderCard';
import DataQualityNotice from '../../components/compare/DataQualityNotice';
import CompareTabs from '../../components/compare/CompareTabs';

export default function ComparePage() {
  return (
    <Suspense>
      <CompareContent />
    </Suspense>
  );
}

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const leftParam = (searchParams.get('left') || '').trim();
  const rightParam = (searchParams.get('right') || '').trim();
  const isSameName = !!leftParam && !!rightParam && leftParam === rightParam;

  // The right side never issues a fetch when both names are identical —
  // one full-character request total, per the spec's "Same character"
  // handling.
  const left = useCharacterSide(leftParam);
  const right = useCharacterSide(rightParam, { skip: isSameName });

  const updateParams = useCallback(
    updates => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value);
        else params.delete(key);
      });
      router.replace(`/compare?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleSearch = useCallback(
    (side, name) => updateParams({ [side]: name }),
    [updateParams]
  );

  const handleSwap = useCallback(() => {
    updateParams({ left: rightParam, right: leftParam });
  }, [updateParams, leftParam, rightParam]);

  const leftNormalized = useMemo(
    () => (left.data ? normalizeCharacterForComparison(left.data) : null),
    [left.data]
  );
  const rightNormalized = useMemo(
    () => (right.data ? normalizeCharacterForComparison(right.data) : null),
    [right.data]
  );

  const comparison = useMemo(() => {
    if (!leftNormalized || !rightNormalized) return null;
    return compareCharacters(leftNormalized, rightNormalized);
  }, [leftNormalized, rightNormalized]);

  const upgradeDirections = useMemo(
    () => (comparison ? rankUpgradeDirections(comparison) : []),
    [comparison]
  );

  // `comparison` is non-null iff both sides successfully loaded data (see
  // useCharacterSide.js — `data` is only ever set alongside status
  // 'success'), so its truthiness alone determines readiness.
  const bothReady = !!comparison;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography
        variant="overline"
        sx={{ color: 'primary.main', fontWeight: 800, letterSpacing: 1.5 }}
      >
        Maple Hub
      </Typography>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 800, mb: 2 }}>
        角色戰力比較
      </Typography>

      <CharacterSearchBar
        leftName={leftParam}
        rightName={rightParam}
        onSearch={handleSearch}
        leftLoading={left.status === 'loading'}
        rightLoading={right.status === 'loading'}
      />

      {isSameName ? (
        <Alert severity="info">
          兩側輸入了相同的角色，請替換其中一側以進行比較。
        </Alert>
      ) : (
        <>
          <CompareHeaderCard
            left={left}
            right={right}
            leftNormalized={leftNormalized}
            rightNormalized={rightNormalized}
            comparison={comparison}
            onSwap={handleSwap}
          />

          {bothReady && (
            <>
              <DataQualityNotice
                comparison={comparison}
                leftNormalized={leftNormalized}
                rightNormalized={rightNormalized}
              />
              <CompareTabs
                comparison={comparison}
                upgradeDirections={upgradeDirections}
                leftNormalized={leftNormalized}
                rightNormalized={rightNormalized}
                leftRaw={left.data}
                rightRaw={right.data}
              />
            </>
          )}
        </>
      )}
    </Container>
  );
}
