import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import elfGameImage from '@/assets/elf-game.png';
import type { RoomSocketStatus } from '@/api/ws';
import styles from './gameLoadingScreen.module.scss';

export type GameLoadingStage = 'interface' | 'room' | 'match' | 'assets';

interface GameLoadingScreenProps {
  stage?: GameLoadingStage;
  connectionStatus?: RoomSocketStatus;
  onRetry?: () => void;
  onBack?: () => void;
}

const STAGE_COPY: Record<GameLoadingStage, string> = {
  interface: 'Загружаем интерфейс…',
  room: 'Получаем данные комнаты…',
  match: 'Подключаемся к игре',
  assets: 'Подготавливаем игровое поле…',
};

const LONG_WAIT_TIMEOUT_MS = 12_000;

export const GameLoadingScreen = ({
  stage = 'interface',
  connectionStatus = 'idle',
  onRetry,
  onBack,
}: GameLoadingScreenProps) => {
  const [isTakingLong, setIsTakingLong] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsTakingLong(true), LONG_WAIT_TIMEOUT_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  const isReconnecting = connectionStatus === 'reconnecting';
  const isDisconnected = connectionStatus === 'disconnected';
  const status = isDisconnected
    ? 'Не удалось подключиться к серверу'
    : isReconnecting
      ? 'Восстанавливаем соединение…'
      : STAGE_COPY[stage];
  const shouldShowRecovery = (isTakingLong || isDisconnected) && (onRetry || onBack);

  return (
    <main className={styles.loadingScreen} aria-busy={!isDisconnected}>
      <section className={styles.loadingScreen__content} aria-label="Загрузка игры">
        <img
          src={elfGameImage}
          alt=""
          className={styles.loadingScreen__illustration}
          decoding="async"
          fetchPriority="high"
        />

        <p
          className={styles.loadingScreen__status}
          role={isDisconnected ? 'alert' : 'status'}
          aria-live={isDisconnected ? 'assertive' : 'polite'}
          aria-atomic="true"
        >
          {status}
        </p>

        {!isDisconnected && (
          <div className={styles.loadingScreen__progress}>
            <div
              className={styles.loadingScreen__progressTrack}
              role="progressbar"
              aria-label="Загрузка игры"
            >
              <span className={styles.loadingScreen__progressValue} />
            </div>
          </div>
        )}

        {shouldShowRecovery && (
          <div className={styles.loadingScreen__recovery}>
            {!isDisconnected && <p>Загрузка занимает больше времени, чем обычно.</p>}
            <div className={styles.loadingScreen__actions}>
              {onRetry && (
                <button type="button" onClick={onRetry} className={styles.loadingScreen__primaryAction}>
                  <RefreshCw size={17} aria-hidden="true" />
                  Повторить
                </button>
              )}
              {onBack && (
                <button type="button" onClick={onBack} className={styles.loadingScreen__secondaryAction}>
                  <ArrowLeft size={17} aria-hidden="true" />
                  В комнату
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};
