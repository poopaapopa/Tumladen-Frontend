import tavern from '@/assets/achievements/tavern.webp';
import castle from '@/assets/achievements/castle.webp';
import crown from '@/assets/achievements/crown.webp';

export const ACHIEVEMENT_IMAGES: Record<string, string> = {
  first_game_any: tavern,
  carcassonne_first_game: castle,
  carcassonne_first_win: crown,
};

export function getAchievementImage(code: string): string | undefined {
  return ACHIEVEMENT_IMAGES[code];
}
