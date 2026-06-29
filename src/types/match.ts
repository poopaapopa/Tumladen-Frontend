import type { ActorType, BotDifficulty } from './room';

export type Phase = 'place_tile' | 'place_meeple';
export type MatchStatus = 'waiting' | 'active' | 'finished';

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  instanceId?: string;
}

export type MeepleType = 'regular' | 'big';

export interface GamePlayer {
  actorId: string;
  displayName: string;
  score: number;
  meeplesLeft: number;
  bigMeeplesLeft?: number;
  seat: number;
}

export interface MatchPlayer {
  actorId: string;
  actorType?: ActorType;
  displayName: string;
  avatarUrl?: string | null;
  seat: number;
  botDifficulty?: BotDifficulty;
  isDisconnected?: boolean;
}

export interface PlacedMeeple {
  tileInstanceId: string;
  zoneId: string;
  actorId: string;
  seat?: number;
  featureType: string;
  meepleType?: MeepleType;
}

export interface DrawnTile {
  tileId: string;
  imageUrl: string;
}

export interface CurrentTurn {
  drawnTile: DrawnTile | null;
  placedTile?: Tile;
  turnEndsAt?: string;
}

export interface GameState {
  currentPlayerId: string;
  players: GamePlayer[];
  turnNumber: number;
  phase: Phase;
  board: {
    tiles: Tile[];
  };
  meeples: PlacedMeeple[];
  currentTurn?: CurrentTurn;
  deck?: {
    remainingCount: number;
  };
  settings?: {
    turnTimeSeconds: number;
  };
}

export interface MatchStatePayload {
  id: string;
  roomId: string;
  status: MatchStatus;
  players: MatchPlayer[];
  gameType: string;
  gameState: GameState;
}

export interface ValidPlacement {
  x: number;
  y: number;
  rotations: number[];
}

export interface ValidMeeplePlacement {
  zoneId: string;
  featureType: string;
}

export interface PrivateState {
  isYourTurn: boolean;
  phase: Phase;
  validPlacements: ValidPlacement[];
  validMeeplePlacements: ValidMeeplePlacement[];
}

/** GamePlayer enriched with identity fields from MatchPlayer (avatarUrl, actorType, botDifficulty). */
export type SidebarPlayer = GamePlayer & Pick<MatchPlayer, 'avatarUrl' | 'actorType' | 'botDifficulty'>;

export interface LogEntry {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
  nickname: string;
  tileId?: string;
}
