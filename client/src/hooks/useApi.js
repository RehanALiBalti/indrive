import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../lib/api.js';

/**
 * Data-fetching hook returning explicit loading / error / empty / success state
 * so every screen can render the right thing instead of a blank area.
 *
 * @param {string|null} path  Pass null to skip the request (conditional fetch).
 */
export const useApi = (path, { params, auth = false, enabled = true, initialData = null } = {}) => {
  const [data, setData] = useState(initialData);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(Boolean(path) && enabled && initialData == null);
  const [reloadToken, setReloadToken] = useState(0);

  // Serialised so callers can pass an inline object without causing a loop.
  const paramsKey = JSON.stringify(params ?? null);

  useEffect(() => {
    if (!path || !enabled) {
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setError(null);
    setLoading(true);

    apiRequest(path, { params: params ?? undefined, auth, signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setMeta(result.meta);
      })
      .catch((requestError) => {
        if (!active) return;
        if (requestError.name === 'AbortError') return;
        setError(requestError);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, paramsKey, auth, enabled, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  const isEmpty =
    !loading &&
    !error &&
    (data === null ||
      data === undefined ||
      (Array.isArray(data) && data.length === 0) ||
      (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0));

  return { data, meta, error, loading, isEmpty, refetch, setData };
};

/**
 * Wraps an async action (submit, delete, publish…) with pending/error/success
 * state so buttons can disable themselves and surface failures consistently.
 */
export const useAction = (action, { onSuccess, onError } = {}) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const run = useCallback(
    async (...args) => {
      setPending(true);
      setError(null);
      setSuccess(false);
      try {
        const result = await action(...args);
        setSuccess(true);
        onSuccess?.(result);
        return result;
      } catch (actionError) {
        setError(actionError);
        onError?.(actionError);
        throw actionError;
      } finally {
        setPending(false);
      }
    },
    [action, onSuccess, onError],
  );

  const reset = useCallback(() => {
    setError(null);
    setSuccess(false);
  }, []);

  return { run, pending, error, success, reset };
};

export default useApi;
