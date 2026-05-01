import type { RoomResponse } from './room';
import type { MatchStatePayload, PrivateState } from './match';

export interface ParticipantKickedPayload {
  reason: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export type MatchTerminationReason =
  | 'normal_completion'
  | 'player_left'
  | string;

export interface MatchFinalScore {
  actorId: string;
  score: number;
}

export interface MatchFinishedPayload {
  matchId: string;
  roomId: string;
  winners: string[];
  finalScores: MatchFinalScore[];
  terminationReason: MatchTerminationReason;
  terminatedByActorId?: string;
  terminatedAt?: string;
}

export type WebSocketMessage =
  | { type: 'room_state'; payload: RoomResponse }
  | { type: 'room_deleted'; payload?: undefined }
  | { type: 'participant_kicked'; payload: ParticipantKickedPayload }
  | { type: 'match_state'; payload: MatchStatePayload }
  | { type: 'match_private_state'; payload: PrivateState }
  | { type: 'match_finished'; payload?: MatchFinishedPayload }
  | { type: 'error'; payload: ErrorPayload };

export type WebSocketMessageType = WebSocketMessage['type'];
