export interface MatchPlayer {
  actorId: string;
  actorType: 'user' | 'guest';
  displayName: string;
  seat: number;
  score: number;
  rank: number;
  isWinner: boolean;
}

export interface MatchResult {
  hasResult: boolean;
  winners: string[];
}

export interface MatchHistoryEntry {
  id: string;
  roomId: string;
  gameType: string;
  status: string;
  terminationReason: string;
  terminatedByActorId: string | null;
  terminatedAt: string;
  result: MatchResult;
  players: MatchPlayer[];
  createdAt: string;
  updatedAt: string;
}

export interface OverallStats {
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  winRate: number;
  totalScore: number;
  averageScore: number;
  bestScore: number;
}

export interface GameStats extends OverallStats {
  gameType: string;
}

export interface UserStats {
  overall: OverallStats;
  byGame: GameStats[];
}

/** Profile visible to everyone — no email */
export interface PublicUserProfile {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  matchHistory: MatchHistoryEntry[];
  stats: UserStats;
}

/** Own profile — includes email */
export interface OwnUserProfile extends PublicUserProfile {
  email: string;
}

export type UserProfile = PublicUserProfile | OwnUserProfile;

export function isOwnProfile(profile: UserProfile): profile is OwnUserProfile {
  return 'email' in profile;
}

export const GAME_TYPE_LABELS: Record<string, string> = {
  carcassonne: 'Fortresses & Roads',
};
