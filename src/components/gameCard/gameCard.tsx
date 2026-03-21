import styles from './GameCard.module.scss';
import { Users } from 'lucide-react';
import type { Game } from "../../types/game.ts";
import image from '../../assets/castle.png';

function gameCard({ id, title, description, imageUrl, minPlayers, maxPlayers }: Game) {
  return (
    <div className={styles.gameCard}>
      <svg className={styles.gameCard__borderSvg}>
        <rect
          className={styles.gameCard__borderRect}
          rx="10"
          width="100%"
          height="100%"
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
          <button className={styles.gameCard__playBtn} onClick={() => onJoin(id)}>
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

const onJoin = (gameId: number) => {
  console.log("Присоединение к игре с ID:", gameId);
};

export default gameCard