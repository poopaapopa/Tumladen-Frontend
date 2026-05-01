import { useCallback, useEffect, useRef, useState } from 'react';

export const useTurnTimer = (isActive: boolean) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const turnDeadlineRef = useRef<number | null>(null);

  const setTurnDeadline = useCallback((turnEndsAtIso?: string) => {
    if (!turnEndsAtIso) {
      turnDeadlineRef.current = null;
      setTimeLeft(null);
      return;
    }

    const deadline = new Date(turnEndsAtIso).getTime();
    turnDeadlineRef.current = deadline;
    setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
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

      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
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
