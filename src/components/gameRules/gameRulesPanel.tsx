import { Suspense } from 'react';
import gameRulesRegistry from './gameRulesRegistry';
import styles from './gameRulesPanel.module.scss';

interface GameRulesPanelProps {
  gameType: string;
}

export const GameRulesPanel = ({ gameType }: GameRulesPanelProps) => {
  const RulesComponent = gameRulesRegistry[gameType];

  if (!RulesComponent) {
    return (
      <div className={styles.rulesPanel}>
        <p className={styles.rulesPanel__empty}>
          Правила для этой игры пока не добавлены.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.rulesPanel}>
      <Suspense
        fallback={
          <div className={styles.rulesPanel__loading}>Загрузка правил…</div>
        }
      >
        <RulesComponent />
      </Suspense>
    </div>
  );
};
