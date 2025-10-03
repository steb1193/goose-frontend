import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, type RoundListItem } from '../api';
import { useAuth } from '../store/auth';
import { gooseWebSocketService } from '../services/websocket';
import type { RoundUpdatePayload } from '../services/websocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

function fmt(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

function statusBadge(status: 'cooldown' | 'active' | 'finished') {
  const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium';
  if (status === 'active') return `${base} bg-green-100 text-green-800`;
  if (status === 'cooldown') return `${base} bg-amber-100 text-amber-800`;
  return `${base} bg-gray-100 text-gray-700`;
}

export default function GooseRoundsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [allRounds, setAllRounds] = useState<RoundListItem[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastRoundId, setLastRoundId] = useState<string | undefined>();

  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: allRounds.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
  });

  const roundsQuery = useQuery({
    queryKey: ['rounds', lastRoundId],
    queryFn: () => api.listRounds(lastRoundId, 20),
    refetchOnWindowFocus: false,
    refetchOnMount: lastRoundId === undefined,
  });

  useEffect(() => {
    if (roundsQuery.data) {
      if (!lastRoundId) {
        const sortedData = [...roundsQuery.data.data].sort(
          (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
        );
        setAllRounds(sortedData);
      } else {
        setAllRounds((prev) => {
          const combined = [...prev, ...roundsQuery.data.data];
          return combined.sort(
            (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
          );
        });
      }
      setHasMore(roundsQuery.data.hasMore);
      setIsLoadingMore(false);
    }
  }, [roundsQuery.data, lastRoundId]);

  useEffect(() => {
    const handleConnect = () => {
      void queryClient.invalidateQueries({ queryKey: ['rounds'] });
    };

    if (gooseWebSocketService.isConnected()) {
      handleConnect();
    }

    gooseWebSocketService.onConnect(handleConnect);

    const handleRoundUpdate = (data: RoundUpdatePayload) => {
      setAllRounds((prev) => {
        const idx = prev.findIndex((r) => r.id === data.id);
        const nextItem: RoundListItem = {
          id: data.id,
          startAt: data.startAt,
          endAt: data.endAt,
          totalPoints: data.totalPoints,
          status: data.status,
        };

        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...prev[idx], ...nextItem };
          return updated.sort(
            (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
          );
        } else {
          const combined = [nextItem, ...prev];
          return combined.sort(
            (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
          );
        }
      });
    };

    gooseWebSocketService.onRoundUpdate(handleRoundUpdate);
    gooseWebSocketService.onRoundFinished((data) => {
      setAllRounds((prev) => {
        const idx = prev.findIndex((r) => r.id === data.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = { ...prev[idx], status: 'finished' };
          return updated.sort(
            (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
          );
        }
        return prev;
      });
    });

    return () => {
      gooseWebSocketService.offConnect(handleConnect);
      gooseWebSocketService.offRoundUpdate(handleRoundUpdate);
      gooseWebSocketService.offRoundFinished();
    };
  }, [queryClient]);

  const [isCreating, setIsCreating] = React.useState(false);

  function loadMore() {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    if (allRounds.length > 0) {
      const currentLastRound = allRounds[allRounds.length - 1];
      setLastRoundId(currentLastRound.id);
    }
  }

  async function onCreateRound() {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const r = await api.createRound();
      void queryClient.invalidateQueries({ queryKey: ['rounds'] });
      navigate(`/rounds/${r.data.id}`);
    } finally {
      setIsCreating(false);
    }
  }

  const canCreate = useMemo(() => user?.role === 'admin', [user]);

  if (roundsQuery.isLoading)
    return (
      <div className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="h-8 w-40 animate-pulse rounded bg-gray-200" />
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-gray-200" />
              </div>
              <div className="mb-2 h-4 w-52 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="mt-3 h-4 w-28 animate-pulse rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );

  if (roundsQuery.isError) {
    return (
      <div className="mx-auto max-w-5xl p-6 sm:p-8">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-red-600">Ошибка загрузки раундов</h1>
          <p className="mt-2 text-gray-600">Не удалось загрузить список раундов</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Заголовок */}
      <div className="flex-shrink-0 p-4 sm:p-6 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Раунды</h1>
              <p className="mt-1 text-sm text-gray-600 hidden sm:block">
                Текущие и прошедшие игры. Нажми для деталей.
              </p>
              <p className="mt-1 text-sm text-gray-600 sm:hidden">Игры. Нажми для деталей.</p>
            </div>
            {user && canCreate && (
              <button
                onClick={onCreateRound}
                disabled={isCreating}
                className="rounded-lg border border-blue-600 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm text-white bg-blue-600 transition shadow-sm hover:bg-blue-700 hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">
                  {isCreating ? 'Создание...' : 'Создать раунд'}
                </span>
                <span className="sm:hidden">{isCreating ? '...' : '+'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Виртуальный скролл контейнер на всю оставшуюся высоту */}
      <div ref={parentRef} className="overflow-auto h-[calc(100vh-150px)] sm:h-[calc(100vh-166px)]">
        <div className="mx-auto max-w-5xl p-4 sm:p-6">
          <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const r = allRounds[virtualItem.index];
              return (
                <div
                  key={virtualItem.key}
                  className="absolute top-0 left-0 w-full "
                  style={{
                    height: `${virtualItem.size}px`,
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <div className="px-1">
                    <Link
                      to={`/rounds/${r.id}`}
                      className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] mb-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs uppercase tracking-wide text-gray-500">Раунд</div>
                        <span className={statusBadge(r.status)}>
                          {r.status === 'active'
                            ? 'Активен'
                            : r.status === 'cooldown'
                              ? 'Cooldown'
                              : 'Завершен'}
                        </span>
                      </div>
                      <div className="truncate font-mono text-sm text-gray-900">{r.id}</div>
                      <div className="mt-3 grid grid-cols-1 gap-1 text-sm text-gray-700">
                        <div>
                          Начало: <span className="text-gray-900">{fmt(r.startAt)}</span>
                        </div>
                        <div>
                          Конец: <span className="text-gray-900">{fmt(r.endAt)}</span>
                        </div>
                      </div>
                      <div className="mt-3 text-sm text-gray-700">
                        Общий счёт:{' '}
                        <span className="font-semibold text-gray-900">{r.totalPoints}</span>
                      </div>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Кнопка "Показать еще" */}
          {hasMore && allRounds.length > 0 && (
            <div className="mt-6 flex justify-center pb-6">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="rounded-lg border border-gray-300 px-4 py-2 sm:px-6 sm:py-3 text-xs sm:text-sm text-gray-700 bg-white transition shadow-sm hover:bg-gray-50 hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="hidden sm:inline">
                  {isLoadingMore ? 'Загрузка...' : 'Показать еще'}
                </span>
                <span className="sm:hidden">{isLoadingMore ? '...' : 'Еще'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
