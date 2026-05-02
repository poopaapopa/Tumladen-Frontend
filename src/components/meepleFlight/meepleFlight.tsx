import React, { useEffect, useState } from 'react';
import { Meeple3D } from '../matchPlayerCard/meeple.tsx';
import styles from './meepleFlight.module.scss';

export const FLIGHT_DURATION_MS = 850;
const MEEPLE_SIZE = 55;

export interface MeepleFlight {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  variant: 'standing' | 'lying';
}

interface MeepleFlightItemProps {
  flight: MeepleFlight;
}

const MeepleFlightItem: React.FC<MeepleFlightItemProps> = ({ flight }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / FLIGHT_DURATION_MS);
      setProgress(t);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [flight.id]);

  // ease-in-out для движения
  const eased = progress < 0.5
    ? 2 * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

  const x = flight.startX + (flight.endX - flight.startX) * eased;
  const y = flight.startY + (flight.endY - flight.startY) * eased;

  // дугообразное смещение по вертикали (выпуклость вверх)
  const arc = Math.sin(Math.PI * progress) * 80;

  // масштаб уменьшается от 1.1 до 0.5
  const scale = 1.1 - 0.6 * eased;

  // лёгкое вращение для динамики
  const rotation = (progress * 360) % 360 * 0.15;

  // прозрачность к самому концу
  const opacity = progress < 0.85 ? 1 : 1 - (progress - 0.85) / 0.15;

  return (
    <div
      className={styles.flight}
      style={{
        transform: `translate3d(${x - MEEPLE_SIZE / 2}px, ${y - arc - MEEPLE_SIZE / 2}px, 0) scale(${scale}) rotate(${rotation}deg)`,
        opacity,
        width: MEEPLE_SIZE,
        height: MEEPLE_SIZE,
      }}
    >
      <Meeple3D color={flight.color} size={MEEPLE_SIZE} variant={flight.variant} />
    </div>
  );
};

interface MeepleFlightLayerProps {
  flights: MeepleFlight[];
}

export const MeepleFlightLayer: React.FC<MeepleFlightLayerProps> = ({ flights }) => {
  if (flights.length === 0) return null;
  return (
    <div className={styles.flightLayer}>
      {flights.map((f) => (
        <MeepleFlightItem key={f.id} flight={f} />
      ))}
    </div>
  );
};
