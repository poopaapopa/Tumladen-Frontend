export type Phase = 'place_tile' | 'place_meeple';
export type MatchStatus = 'waiting' | 'active' | 'finished';

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  instanceId?: string;
}

export interface MatchPlayer {
  actorId: string;
  displayName: string;
  score: number;
  meeplesLeft: number;
  seat: number;
}

export interface PlacedMeeple {
  tileInstanceId: string;
  zoneId: string;
  actorId: string;
  seat?: number;
  featureType: string;
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
  players: MatchPlayer[];
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
  gameType: string;
  isYourTurn: boolean;
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

export interface LogEntry {
  id: string;
  text: string;
  color: string;
  timestamp: Date;
  nickname: string;
  tileId?: string;
}
