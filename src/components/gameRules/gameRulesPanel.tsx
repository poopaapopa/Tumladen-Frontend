import { Suspense } from 'react';
import gameRulesRegistry from './gameRulesRegistry';
import styles from './gameRulesPanel.module.scss';

export const BASE_RULES_ID = 'base';

interface GameRulesPanelProps {
  gameType: string;
  expansions?: readonly string[];
  selectedRulesId?: string;
}

const RulesLoading = () => (
  <div
    className={styles.rulesPanel__loading}
    role="status"
    aria-live="polite"
    aria-atomic="true"
    aria-busy="true"
  >
    <span className={styles.rulesPanel__loadingLabel}>Загрузка правил…</span>

    <div className={styles.rulesPanel__skeleton} aria-hidden="true">
      <div className={styles.rulesPanel__skeletonParagraph}>
        <span className={styles.rulesPanel__skeletonLine} />
        <span className={styles.rulesPanel__skeletonLine} />
        <span
          className={`${styles.rulesPanel__skeletonLine} ${styles.rulesPanel__skeletonLine_medium}`}
        />
      </div>

      <span className={styles.rulesPanel__skeletonHeading} />

      <div className={styles.rulesPanel__skeletonParagraph}>
        <span className={styles.rulesPanel__skeletonLine} />
        <span
          className={`${styles.rulesPanel__skeletonLine} ${styles.rulesPanel__skeletonLine_short}`}
        />
      </div>

      <div className={styles.rulesPanel__skeletonTiles}>
        {[0, 1, 2].map((item) => (
          <div className={styles.rulesPanel__skeletonTile} key={item}>
            <span className={styles.rulesPanel__skeletonTileImage} />
            <span className={styles.rulesPanel__skeletonTileLabel} />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export const GameRulesPanel = ({
  gameType,
  expansions = [],
  selectedRulesId = BASE_RULES_ID,
}: GameRulesPanelProps) => {
  const rulesDefinition = gameRulesRegistry[gameType];

  if (!rulesDefinition) {
    return (
      <div className={styles.rulesPanel}>
        <p className={styles.rulesPanel__empty}>
          Правила для этой игры пока не добавлены.
        </p>
      </div>
    );
  }

  const enabledExpansionIds = new Set(expansions);
  const activeExpansionRules = Object.entries(rulesDefinition.expansions)
    .filter(([expansionId]) => enabledExpansionIds.has(expansionId))
    .map(([id, definition]) => ({ id, definition }));

  const selectedExpansion = activeExpansionRules.find(({ id }) => id === selectedRulesId);
  const activeRulesId = selectedExpansion?.id ?? BASE_RULES_ID;
  const ActiveRulesComponent = selectedExpansion?.definition.component
    ?? rulesDefinition.base.component;

  return (
    <div className={styles.rulesPanel}>
      <div className={styles.rulesPanel__content}>
        <Suspense key={activeRulesId} fallback={<RulesLoading />}>
          <div className={styles.rulesPanel__reveal}>
            <ActiveRulesComponent />
          </div>
        </Suspense>
      </div>
    </div>
  );
};
