import { lazy, type ComponentType } from 'react';

type RulesComponent = ComponentType<Record<string, never>>;

const gameRulesRegistry: Record<string, React.LazyExoticComponent<RulesComponent>> = {
  carcassonne: lazy(() => import('./carcassonne/carcassonneRules')),
  // Add future game rules here:
  // dominoes: lazy(() => import('./dominoes/dominoesRules')),
};

export default gameRulesRegistry;
