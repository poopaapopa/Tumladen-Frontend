import styles from './gameCard.module.scss';
import { Users, Loader2, Clock3 } from 'lucide-react';
import clsx from 'clsx';
import image from '@/assets/castle.png';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  maxPlayers: number;
  minPlayers: number;
  duration: string;
  isLoading?: boolean;
  disabled?: boolean;
  onQuickPlay: () => void;
  onCreateRoom: () => void;
}

function GameCard({
  title,
  description,
  imageUrl,
  minPlayers,
  maxPlayers,
  duration,
  isLoading,
  disabled,
  onQuickPlay,
  onCreateRoom,
}: GameCardProps) {
  const isDisabled = disabled || isLoading;

  return (
    <div
      className={clsx(
        styles.gameCard,
        isDisabled && styles.gameCard_disabled,
      )}
    >
      <svg className={styles.gameCard__borderSvg}>
        <rect
          className={clsx(styles.gameCard__borderRect, styles.gameCard__borderRect_forward)}
          rx="10" width="100%" height="100%" pathLength="100"
        />
        <rect
          className={clsx(styles.gameCard__borderRect, styles.gameCard__borderRect_backward)}
          rx="10" width="100%" height="100%" pathLength="100"
        />
      </svg>

      <div className={styles.gameCard__imageWrapper}>
        <img src={imageUrl ? imageUrl : image} alt={title} className={styles.gameCard__image} />
        <div className={styles.gameCard__overlay}></div>
      </div>

      <div className={styles.gameCard__content}>
        <h3 className={styles.gameCard__title}>{title}</h3>
        <p className={styles.gameCard__description}>{description}</p>

        <div className={styles.gameCard__footer}>
          <div className={styles.gameCard__actions}>
            <button
              type="button"
              onClick={onQuickPlay}
              disabled={isDisabled}
              aria-label={`Найти быструю игру для «${title}»`}
              className={styles.gameCard__playBtn}
            >
              <span>Быстрая игра</span>
            </button>

            <button
              type="button"
              onClick={onCreateRoom}
              disabled={isDisabled}
              aria-label={`Создать комнату для игры «${title}»`}
              aria-busy={isLoading || undefined}
              className={clsx(styles.gameCard__playBtn, styles.gameCard__createBtn)}
            >
              {isLoading ? (
                <Loader2 size={18} strokeWidth={2.5} className={styles.gameCard__spinner} />
              ) : null}
              <span>{isLoading ? 'Создаём…' : 'Создать комнату'}</span>
            </button>
          </div>

          <div className={styles.gameCard__stats}>
            <div className={styles.gameCard__statItem}>
              <span>{duration}</span>
              <Clock3 size={18} strokeWidth={2.5} />
            </div>
            <div className={styles.gameCard__statItem}>
              {minPlayers === maxPlayers ? <span>{maxPlayers}</span> : <span>{minPlayers}-{maxPlayers}</span>}
              <Users size={18} strokeWidth={2.5} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameCard;
