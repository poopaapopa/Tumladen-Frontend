import { useCallback, useEffect, useRef, useState } from 'react';

export const useTurnTimer = (isActive: boolean) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnDeadlineRef = useRef<number | null>(null);

  const setTurnDeadline = useCallback((turnEndsAtIso?: string, serverTimeIso?: string) => {
    if (!turnEndsAtIso) {
      turnDeadlineRef.current = null;
      setTimeLeft(null);
      return;
    }

    const serverDeadline = Date.parse(turnEndsAtIso);
    const serverNow = serverTimeIso ? Date.parse(serverTimeIso) : Number.NaN;

    if (!Number.isFinite(serverDeadline)) {
      turnDeadlineRef.current = null;
      setTimeLeft(null);
      return;
    }

    // Абсолютные часы браузера и сервера могут расходиться. Преобразуем
    // серверный дедлайн в локальный монотонный дедлайн в момент получения
    // состояния, чтобы таймер не зависел от часового пояса и настройки часов.
    const remainingMs = Number.isFinite(serverNow)
      ? serverDeadline - serverNow
      : serverDeadline - Date.now();
    const localDeadline = performance.now() + Math.max(0, remainingMs);

    turnDeadlineRef.current = localDeadline;
    setTimeLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
  }, []);

  const resetTurnDeadline = useCallback(() => {
    turnDeadlineRef.current = null;
    setTimeLeft(null);
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (!isActive) {
      return;
    }

    const tick = () => {
      const deadline = turnDeadlineRef.current;
      if (deadline == null) {
        setTimeLeft(null);
        return;
      }

      setTimeLeft(Math.max(0, Math.ceil((deadline - performance.now()) / 1000)));
    };

    tick();
    timerRef.current = setInterval(tick, 250);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  return {
    timeLeft,
    setTurnDeadline,
    resetTurnDeadline,
  };
};
