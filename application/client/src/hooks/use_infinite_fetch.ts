import { useCallback, useEffect, useRef, useState } from "react";

const INITIAL_LIMIT = 3;
const LIMIT = 10;

declare global {
  interface Window {
    __INITIAL_POSTS__?: unknown[];
  }
}

function consumeInitialData<T>(apiPath: string): T[] | null {
  if (apiPath === "/api/v1/posts" && window.__INITIAL_POSTS__ != null) {
    const data = window.__INITIAL_POSTS__ as T[];
    window.__INITIAL_POSTS__ = undefined;
    return data;
  }
  return null;
}

interface ReturnValues<T> {
  data: Array<T>;
  error: Error | null;
  isLoading: boolean;
  fetchMore: () => void;
}

export function useInfiniteFetch<T>(
  apiPath: string,
  fetcher: (apiPath: string) => Promise<T[]>,
): ReturnValues<T> {
  const internalRef = useRef({ isLoading: false, offset: 0, hasMore: true });

  const initialData = consumeInitialData<T>(apiPath);
  const [result, setResult] = useState<Omit<ReturnValues<T>, "fetchMore">>({
    data: initialData ?? [],
    error: null,
    isLoading: initialData == null,
  });

  // 初期データがある場合は offset を進めておく
  if (initialData != null && internalRef.current.offset === 0) {
    internalRef.current = {
      isLoading: false,
      offset: initialData.length,
      hasMore: initialData.length >= INITIAL_LIMIT,
    };
  }

  const fetchMore = useCallback(() => {
    const { isLoading, offset, hasMore } = internalRef.current;
    if (isLoading || !apiPath || !hasMore) {
      return;
    }

    setResult((cur) => ({
      ...cur,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: true,
      offset,
      hasMore: internalRef.current.hasMore,
    };

    const currentLimit = offset === 0 ? INITIAL_LIMIT : LIMIT;
    const separator = apiPath.includes("?") ? "&" : "?";
    const paginatedUrl = `${apiPath}${separator}limit=${currentLimit}&offset=${offset}`;

    void fetcher(paginatedUrl).then(
      (pageData) => {
        setResult((cur) => ({
          ...cur,
          data: [...cur.data, ...pageData],
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset: offset + currentLimit,
          hasMore: pageData.length >= currentLimit,
        };
      },
      (error) => {
        setResult((cur) => ({
          ...cur,
          error,
          isLoading: false,
        }));
        internalRef.current = {
          isLoading: false,
          offset,
          hasMore: internalRef.current.hasMore,
        };
      },
    );
  }, [apiPath, fetcher]);

  useEffect(() => {
    // 初期データがある場合は fetch をスキップ
    if (result.data.length > 0 && !result.isLoading) {
      return;
    }

    setResult(() => ({
      data: [],
      error: null,
      isLoading: true,
    }));
    internalRef.current = {
      isLoading: false,
      offset: 0,
      hasMore: true,
    };

    fetchMore();
  }, [fetchMore]);

  return {
    ...result,
    fetchMore,
  };
}
