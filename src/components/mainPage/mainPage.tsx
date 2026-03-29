import styles from './MainPage.module.scss';
import GameCard from "../gameCard/gameCard.tsx";

interface MainPageProps {
  isSelecting: boolean;
  setIsSelecting: (val: boolean) => void;
  onPlayClick: () => void;
}

interface Game {
  id: number,
  title: string,
  description: string,
  imageUrl?: string,
  minPlayers: number,
  maxPlayers: number,
}

function MainPage({ isSelecting, setIsSelecting, onPlayClick }: MainPageProps) {
  const games: Game[] = [
    { id: 1, title: 'Легенда', description: 'Классическая битва за территории с эльфийской магией.', minPlayers: 2, maxPlayers: 5 },
    { id: 2, title: 'Долина', description: 'Усложненные правила строительства в горах.', minPlayers: 3, maxPlayers: 6 },
    { id: 3, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
  ];

  return (
      <div className={styles.mainPage}>
        {isSelecting && (
          <div className={styles.selectionModal}>
            <p>Выберите игру для создания комнаты</p>
            <button onClick={() => setIsSelecting(false)} className={styles.cancelBtn}>
              Отмена
            </button>
          </div>
        )}

        <h2 className={styles.mainPage__title}>Игры</h2>

        <div className={styles.mainPage__grid}>
          {games.map((game) => (
            <GameCard {...game} key={ game.id } isHighlight={isSelecting} onJoin={onPlayClick}/>
          ))}
        </div>
      </div>
  );
}

export default MainPage