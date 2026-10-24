'use client';

import { useEffect, useState } from 'react';
import { useCreatorStore } from './store';
import { errorMessage, isNetworkError } from './api';
import type { ApiResponse } from './types';

/**
 * Loads one channel-level dataset (sentiment, insights, trends) when it is
 * missing. Responses that arrive after the user switched channels are dropped,
 * and failures are returned as a message with a retry callback.
 */
export function useChannelData<T>(
  data: T | null,
  load: (channelId: string) => Promise<ApiResponse<T>>,
  save: (value: T) => void,
) {
  const channelId = useCreatorStore((s) => s.channelId);
  const [attempt, setAttempt] = useState(0);
  // The error belongs to one channel + attempt, so switching channels or
  // retrying clears it without resetting state inside the effect.
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const key = `${channelId}:${attempt}`;

  useEffect(() => {
    if (!channelId || data) return;
    const isCurrent = () => useCreatorStore.getState().channelId === channelId;
    load(channelId)
      .then((r) => {
        if (!isCurrent()) return;
        if (r.success) save(r.data);
        else setFailure({ key, message: r.error || 'Could not load this data.' });
      })
      .catch((e) => {
        if (!isCurrent()) return;
        if (isNetworkError(e)) useCreatorStore.getState().setBackendStatus('offline');
        setFailure({ key, message: errorMessage(e) });
      });
  // load/save are recreated every render; re-run only when the inputs change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channelId, data, attempt]);

  return {
    error: failure?.key === key ? failure.message : null,
    retry: () => setAttempt((n) => n + 1),
  };
}
