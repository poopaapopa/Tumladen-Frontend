import styles from './gameCard.module.scss';
import { Users } from 'lucide-react';
import clsx from 'clsx';
import image from '../../assets/castle.png';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  maxPlayers: number;
  minPlayers: number;
  isHighlight?: boolean;
  onJoin: () => void;
}

function gameCard({ title, description, imageUrl, minPlayers, maxPlayers, isHighlight, onJoin }: GameCardProps) {
  return (
    <div className={clsx(
      styles.gameCard,
      isHighlight && styles.gameCard_highlighted
    )}>
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
          <button onClick={onJoin} className={styles.gameCard__playBtn}>
            Играть
          </button>

          <div className={styles.gameCard__stats}>
            { minPlayers === maxPlayers ? <span>{maxPlayers}</span> : <span>{minPlayers}-{maxPlayers}</span> }
            <Users size={18} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default gameCard