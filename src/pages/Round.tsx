import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, type RoundInfo } from '../api';
import { gooseWebSocketService } from '../services/websocket';
import type {
  RoundUpdatePayload,
  RoundFinishedPayload,
  TapResultPayload,
} from '../services/websocket';
import { useQuery } from '@tanstack/react-query';

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => savedCallback.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function formatRemaining(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

export default function GooseRoundPage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<RoundInfo | null>(null);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());
  const [leaderboard, setLeaderboard] = useState<
    Array<{ place: number; userId: string; username: string; taps: number; points: number }>
  >([]);
  const lastTsRef = useRef<number>(0);

  const infoQuery = useQuery<RoundInfo>({
    queryKey: ['round', id],
    enabled: Boolean(id),
    queryFn: () => api.getRound(id!),
  });
  useEffect(() => {
    if (infoQuery.data) setInfo(infoQuery.data);
    if (infoQuery.error) setError(infoQuery.error?.message ?? 'Ошибка');
  }, [infoQuery.data, infoQuery.error]);

  useInterval(() => setNow(Date.now()), 1000);

  useEffect(() => {
    if (!id) return;

    gooseWebSocketService.joinRound(id);
    gooseWebSocketService.getLeaderboard(id);

    const handleRoundUpdate = (data: RoundUpdatePayload) => {
      if (data.id === id) {
        setInfo((prev) => (prev ? { ...prev, ...data } : null));
      }
    };

    const handleRoundFinished = (data: RoundFinishedPayload) => {
      if (data.id === id) {
        setInfo((prev) => (prev ? { ...prev, status: 'finished', winner: data.winner } : null));
      }
    };

    const handleTapResult = (data: TapResultPayload) => {
      const ts = new Date(data.timestamp).getTime();
      if (Number.isFinite(ts) && ts < lastTsRef.current) return;
      lastTsRef.current = ts;
      if (data.success) {
        setInfo((prev) => (prev ? { ...prev, myPoints: data.myPoints ?? prev.myPoints } : prev));
      } else {
        if (data.error === 'round not active') {
          api
            .getRound(id)
            .then(setInfo)
            .catch(() => {});
        } else {
          setError(data.error || 'Ошибка тапа');
        }
      }
    };

    gooseWebSocketService.onRoundUpdate(handleRoundUpdate);
    gooseWebSocketService.onRoundFinished(handleRoundFinished);
    gooseWebSocketService.onTapResult(handleTapResult);
    gooseWebSocketService.onLeaderboard((data) => {
      if (data.id !== id) return;
      const sorted = [...data.leaderboard].sort((a, b) => a.place - b.place);
      setLeaderboard(sorted);
    });

    return () => {
      gooseWebSocketService.leaveRound(id);
      gooseWebSocketService.offRoundUpdate(handleRoundUpdate);
      gooseWebSocketService.offRoundFinished(handleRoundFinished);
      gooseWebSocketService.offTapResult(handleTapResult);
      gooseWebSocketService.offLeaderboard();
    };
  }, [id]);

  const currentStatus = useMemo(() => {
    if (!info) return 'loading';
    const start = new Date(info.startAt).getTime();
    const end = new Date(info.endAt).getTime();

    if (now < start) return 'cooldown';
    if (now >= start && now < end) return 'active';
    return 'finished';
  }, [info, now]);

  const remainingLabel = useMemo(() => {
    if (!info) return '';
    const start = new Date(info.startAt).getTime();
    const end = new Date(info.endAt).getTime();

    if (currentStatus === 'cooldown') return `до начала раунда ${formatRemaining(start - now)}`;
    if (currentStatus === 'active') return `До конца осталось: ${formatRemaining(end - now)}`;
    return '';
  }, [info, now, currentStatus]);

  function onTap() {
    if (!id) return;
    gooseWebSocketService.tap(id);
  }

  if (!info) return <div className="p-6">Загрузка...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <pre
          onClick={currentStatus === 'active' ? onTap : undefined}
          className={`inline-block p-4 border border-gray-200 rounded-lg select-none transition-transform duration-100 ${
            currentStatus === 'active'
              ? 'cursor-pointer hover:scale-105 active:scale-95'
              : 'cursor-default'
          }`}
        >
          {`           ░░░░░░░░░░░░░░░            
         ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░           
       ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         
       ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░         
     ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░       
   ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░   
   ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░   
   ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░   
     ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░     
       ░░░░░░░░░░░░░░░░░░░░░░░░░░     `}
        </pre>
      </div>
      <div className="text-center mb-2">
        {currentStatus === 'active'
          ? 'Раунд активен!'
          : currentStatus === 'cooldown'
            ? 'Cooldown'
            : 'Раунд завершен'}
      </div>
      {currentStatus !== 'finished' && <div className="text-center mb-2">{remainingLabel}</div>}
      <div className="text-center mb-4">
        Мои очки -
        <span
          className="inline-block w-16 text-right ml-2 tabular-nums font-mono leading-none whitespace-nowrap"
          key={info.myPoints}
        >
          {info.myPoints}
        </span>
      </div>
      {currentStatus === 'active' && (
        <div className="text-center mb-4 text-gray-600 text-sm">Кликни по гусю чтобы тапнуть!</div>
      )}
      {currentStatus === 'finished' && (
        <div className="max-w-md mx-auto mt-6 pt-3 border-t border-gray-200">
          <div className="text-center mb-4">
            <h3 className="text-xl font-semibold">🎉 Раунд завершен!</h3>
          </div>
          <div className="mb-2">
            <strong>Общий счет:</strong> {info.totalPoints} очков
          </div>
          <div className="mb-2">
            <strong>Ваш счет:</strong> {info.myPoints} очков
          </div>
          {info.winner && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-green-500">
              <div className="text-center font-bold text-green-700">
                🏆 Победитель: {info.winner.username}
              </div>
              <div className="text-center mt-1">{info.winner.points} очков</div>
            </div>
          )}
        </div>
      )}
      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="max-w-lg mx-auto mt-6 pt-3 border-t border-gray-200">
          <h3 className="text-center mb-3 text-lg font-semibold">Рейтинг</h3>
          <div className="grid grid-cols-4 gap-2 text-sm">
            <div className="font-bold">#</div>
            <div className="font-bold">Игрок</div>
            <div className="font-bold text-right">Тапы</div>
            <div className="font-bold text-right">Очки</div>
            {leaderboard.map((r) => (
              <React.Fragment key={r.userId}>
                <div className="py-1">{r.place}</div>
                <div className="py-1">{r.username}</div>
                <div className="py-1 text-right tabular-nums">{r.taps}</div>
                <div className="py-1 text-right tabular-nums">{r.points}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
      {error && <div className="text-red-600 mt-3 text-center">{error}</div>}
    </div>
  );
}
