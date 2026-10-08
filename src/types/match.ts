import type { ActorType, BotDifficulty } from './room';

export type Phase = 'place_tile' | 'place_meeple';
export type MatchStatus = 'waiting' | 'active' | 'finished';

export interface Tile {
  tileId: string;
  x: number;
  y: number;
  rotation: number;
  instanceId?: string;
  placedBy?: string;
  turnNumber?: number;
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
  version: number;
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

export interface MatchEvent {
  id: string;
  type: string;
  payload: unknown;
}

export type MatchActivityType =
  | 'tile_placed'
  | 'meeple_placed';

export interface MatchActivityPayload extends Record<string, unknown> {
  tileId?: string;
  tileInstanceId?: string;
  x?: number;
  y?: number;
  rotation?: number;
  zoneId?: string;
  featureType?: string;
  meepleType?: MeepleType;
}

/** A durable, server-authored entry in the match activity log. */
export interface MatchActivity {
  id: string;
  stateVersion: number;
  turnNumber: number;
  actorId: string;
  type: MatchActivityType;
  payload: MatchActivityPayload;
  createdAt: string;
}

export interface FeatureScoreContribution {
  tileInstanceId: string;
  zoneId: string;
  points: number;
}

export interface FeatureScoreAward {
  actorId: string;
  points: number;
}

export type ScoringPhase = 'turn' | 'final';

export interface FeatureScoreMarker {
  actorId: string;
  tileInstanceId: string;
  zoneId: string;
  points: number;
}

export interface FeatureScoreContributingCity {
  anchorTileInstanceId: string;
  anchorZoneId: string;
  tileInstanceIds: string[];
  /** Exact city zones, used to select the contour on tiles with multiple cities. */
  zones?: Array<{
    tileInstanceId: string;
    zoneId: string;
  }>;
}

export interface FeatureScoredEvent extends MatchEvent {
  type: 'feature_scored';
  payload: {
    turnNumber: number;
    featureType: 'road' | 'city' | 'monastery' | 'field';
    /** Missing on events produced by older backend versions; those are turn events. */
    scoringPhase?: ScoringPhase;
    anchorTileInstanceId: string;
    contributions: FeatureScoreContribution[];
    totalPoints: number;
    awards: FeatureScoreAward[];
    returnedMeeples?: PlacedMeeple[];
    /** Explicit on-board positions for scores that cannot be attached to contributions. */
    scoreMarkers?: FeatureScoreMarker[];
    /** Completed cities used by a field score. Used only for board highlighting. */
    contributingCities?: FeatureScoreContributingCity[];
  };
}

export interface MatchStatePayload {
  id: string;
  roomId: string;
  status: MatchStatus;
  serverTime?: string;
  createdAt: string;
  updatedAt: string;
  result?: {
    winners: string[];
    finalScores: Array<{
      actorId: string;
      score: number;
    }>;
  };
  terminationReason?: string;
  terminatedByActorId?: string;
  terminatedAt?: string;
  players: MatchPlayer[];
  gameType: string;
  gameState: GameState;
  events?: MatchEvent[];
  recentActions?: MatchActivity[];
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
  matchId: string;
  version: number;
  turnNumber: number;
  isYourTurn: boolean;
  phase: Phase;
  validPlacements: ValidPlacement[];
  validMeeplePlacements: ValidMeeplePlacement[];
}

/** GamePlayer enriched with identity fields from MatchPlayer (avatarUrl, actorType, botDifficulty). */
export type SidebarPlayer = GamePlayer & Pick<MatchPlayer, 'avatarUrl' | 'actorType' | 'botDifficulty'>;
