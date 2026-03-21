import styles from './MainPage.module.scss';
import type { Game } from "../../types/game.ts";
import GameCard from "../gameCard/gameCard.tsx";

function MainPage() {
  const games: Game[] = [
    { id: 1, title: 'Легенда', description: 'Классическая битва за территории с эльфийской магией.', minPlayers: 2, maxPlayers: 5 },
    { id: 2, title: 'Долина', description: 'Усложненные правила строительства в горах.', minPlayers: 3, maxPlayers: 6 },
    { id: 3, title: 'Холм', description: 'Быстрая партия для двоих игроков.', minPlayers: 2, maxPlayers: 2 },
  ];

  return (
    <main className={styles.mainPage}>
      <h2 className={styles.mainPage__title}>Игры</h2>

      <div className={styles.mainPage__grid}>
        {games.map((game) => (
          <GameCard {...game} key={ game.id }/>
        ))}
      </div>
    </main>
  );
}

export default MainPage