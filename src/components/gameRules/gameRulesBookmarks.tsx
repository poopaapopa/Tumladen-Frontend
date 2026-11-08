import clsx from 'clsx';
import gameRulesRegistry, { preloadGameRules } from './gameRulesRegistry';
import { BASE_RULES_ID } from './gameRulesPanel';
import styles from './gameRulesBookmarks.module.scss';

interface GameRulesBookmarksProps {
  gameType: string;
  expansions?: readonly string[];
  selectedRulesId: string;
  onSelect: (rulesId: string) => void;
  className?: string;
  variant?: 'edge' | 'compact';
}

export const GameRulesBookmarks = ({
  gameType,
  expansions = [],
  selectedRulesId,
  onSelect,
  className,
  variant = 'edge',
}: GameRulesBookmarksProps) => {
  const rulesDefinition = gameRulesRegistry[gameType];

  if (!rulesDefinition) return null;

  const enabledExpansionIds = new Set(expansions);
  const activeExpansionRules = Object.entries(rulesDefinition.expansions)
    .filter(([expansionId]) => enabledExpansionIds.has(expansionId))
    .map(([id, definition]) => ({ id, definition }));

  if (activeExpansionRules.length === 0) return null;

  const hasSelectedExpansion = activeExpansionRules.some(({ id }) => id === selectedRulesId);
  const activeRulesId = hasSelectedExpansion ? selectedRulesId : BASE_RULES_ID;
  const BaseIcon = rulesDefinition.base.icon;
  const warmRules = (rulesId: string) => {
    void preloadGameRules(gameType, rulesId);
  };

  const selectRules = (rulesId: string) => {
    warmRules(rulesId);
    onSelect(rulesId);
  };

  return (
    <nav
      className={clsx(
        styles.bookmarks,
        variant === 'compact' && styles.bookmarks_compact,
        className,
      )}
      aria-label="Наборы правил"
    >
      <button
        type="button"
        className={clsx(
          styles.bookmarks__button,
          activeRulesId === BASE_RULES_ID && styles.bookmarks__button_active,
        )}
        onClick={() => selectRules(BASE_RULES_ID)}
        onPointerEnter={() => warmRules(BASE_RULES_ID)}
        onPointerDown={() => warmRules(BASE_RULES_ID)}
        onFocus={() => warmRules(BASE_RULES_ID)}
        aria-label={rulesDefinition.base.title}
        aria-pressed={activeRulesId === BASE_RULES_ID}
      >
        <BaseIcon size={19} strokeWidth={2.2} aria-hidden="true" />
        <span className={styles.bookmarks__label}>{rulesDefinition.base.title}</span>
      </button>

      {activeExpansionRules.map(({ id, definition }) => {
        const ExpansionIcon = definition.icon;

        return (
          <button
            type="button"
            className={clsx(
              styles.bookmarks__button,
              activeRulesId === id && styles.bookmarks__button_active,
            )}
            onClick={() => selectRules(id)}
            onPointerEnter={() => warmRules(id)}
            onPointerDown={() => warmRules(id)}
            onFocus={() => warmRules(id)}
            aria-label={definition.title}
            aria-pressed={activeRulesId === id}
            key={id}
          >
            <ExpansionIcon size={19} strokeWidth={2.2} aria-hidden="true" />
            <span className={styles.bookmarks__label}>{definition.title}</span>
          </button>
        );
      })}
    </nav>
  );
};
