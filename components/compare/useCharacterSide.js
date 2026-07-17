'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export const SIDE_IDLE = 'idle';
export const SIDE_LOADING = 'loading';
export const SIDE_ERROR = 'error';
export const SIDE_SUCCESS = 'success';

/**
 * Resolves a character name to an OCID through the existing search API,
 * then fetches the full character response, keeping this side's
 * loading/error/success state independent of any other side.
 *
 * Superseded requests (name changed, retry called again) are aborted and
 * their eventual results ignored via a monotonically increasing request
 * token — belt-and-suspenders alongside AbortController, since a stale
 * request must never overwrite a newer one even if something in the
 * environment doesn't honor the abort signal.
 *
 * `skip` lets the caller decide not to issue a second, duplicate
 * full-character request — used for the "same character on both sides"
 * case (see docs/superpowers/specs/2026-07-17-character-power-comparison-design.md,
 * "Same character").
 */
export function useCharacterSide(name, { skip = false } = {}) {
  const [state, setState] = useState({
    status: SIDE_IDLE,
    data: null,
    error: null,
  });
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);

  const runFetch = useCallback(targetName => {
    const requestId = ++requestIdRef.current;
    if (controllerRef.current) controllerRef.current.abort();

    if (!targetName) {
      setState({ status: SIDE_IDLE, data: null, error: null });
      return;
    }

    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: SIDE_LOADING, data: null, error: null });

    (async () => {
      try {
        const searchRes = await fetch(
          `/api/character/search?name=${encodeURIComponent(targetName)}`,
          { signal: controller.signal }
        );
        if (!searchRes.ok) throw new Error('找不到此角色');
        const searchData = await searchRes.json();
        if (!searchData?.ocid) throw new Error('找不到此角色');
        if (requestIdRef.current !== requestId) return;

        const charRes = await fetch(`/api/character/${searchData.ocid}`, {
          signal: controller.signal,
        });
        if (!charRes.ok) {
          throw new Error(
            charRes.status === 404 ? '找不到此角色' : '載入角色資料失敗'
          );
        }
        const data = await charRes.json();
        if (requestIdRef.current !== requestId) return;

        setState({ status: SIDE_SUCCESS, data, error: null });
      } catch (err) {
        if (requestIdRef.current !== requestId) return;
        if (err.name === 'AbortError') return;
        setState({
          status: SIDE_ERROR,
          data: null,
          error: err.message || '載入角色資料失敗',
        });
      }
    })();
  }, []);

  useEffect(() => {
    if (skip) {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      setState({ status: SIDE_IDLE, data: null, error: null });
      return undefined;
    }
    runFetch(name);
    return () => {
      controllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, skip]);

  const retry = useCallback(() => {
    if (!skip) runFetch(name);
  }, [skip, runFetch, name]);

  return { ...state, retry };
}
