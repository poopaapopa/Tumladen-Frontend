import {
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from 'react';
import { Beer, Castle, type LucideIcon } from 'lucide-react';

type RulesComponent = LazyExoticComponent<ComponentType<Record<string, never>>>;
type RulesLoader = () => Promise<{
  default: ComponentType<Record<string, never>>;
}>;

interface RulesDefinition {
  title: string;
  icon: LucideIcon;
  component: RulesComponent;
  load: RulesLoader;
}

export interface ExpansionRulesDefinition {
  title: string;
  icon: LucideIcon;
  summary: string;
  component: RulesComponent;
  load: RulesLoader;
}

interface GameRulesDefinition {
  base: RulesDefinition;
  expansions: Readonly<Record<string, ExpansionRulesDefinition>>;
}

export interface GameExpansionRules extends ExpansionRulesDefinition {
  id: string;
}

const BASE_RULES_ID = 'base';
const loadCarcassonneRules = () => import('./carcassonne/carcassonneRules');
const loadInnsAndCathedralsRules = () => (
  import('./carcassonne/expansions/innsAndCathedralsRules')
);

const gameRulesRegistry: Readonly<Record<string, GameRulesDefinition>> = {
  carcassonne: {
    base: {
      title: 'Основная игра',
      icon: Castle,
      component: lazy(loadCarcassonneRules),
      load: loadCarcassonneRules,
    },
    expansions: {
      inns_and_cathedrals: {
        title: 'Таверны и соборы',
        icon: Beer,
        summary: 'Таверны и соборы увеличивают цену завершённых дорог и городов, но обнуляют незавершённые. Большие подданные имеют двойную силу.',
        component: lazy(loadInnsAndCathedralsRules),
        load: loadInnsAndCathedralsRules,
      },
    },
  },
  // Add future games and their expansion rules here.
};

export const getGameExpansionRules = (gameType: string): GameExpansionRules[] => {
  const expansions = gameRulesRegistry[gameType]?.expansions ?? {};

  return Object.entries(expansions).map(([id, definition]) => ({
    id,
    ...definition,
  }));
};

/**
 * Warms the same dynamic import used by React.lazy without blocking the lobby.
 * Import promises are cached by the module loader, so repeated intent events are cheap.
 */
export const preloadGameRules = async (
  gameType: string,
  rulesId: string = BASE_RULES_ID,
): Promise<void> => {
  const rules = gameRulesRegistry[gameType];
  const definition = rulesId === BASE_RULES_ID
    ? rules?.base
    : rules?.expansions[rulesId];

  if (!definition) return;

  try {
    await definition.load();
  } catch {
    // Preloading is opportunistic. React.lazy will surface a real loading failure.
  }
};

export default gameRulesRegistry;
