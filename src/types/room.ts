export type ActorType = 'guest' | 'user' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotConfig {
  difficulty: BotDifficulty;
}

export interface ParticipantResponse {
  actorId: string;
  actorType: ActorType;
  displayName: string;
  botDifficulty?: BotDifficulty;
  joinedAt: string;
}

export type SettingValue = string | number | boolean | BotConfig[];
export type RoomStatus = 'waiting' | 'playing' | 'finished';

export interface Settings {
  [key: string]: SettingValue;
}

export interface RoomResponse {
  settings: Settings;
  id: string;
  name: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerActorId: string;
  status: RoomStatus;
  gameType: string;
  maxPlayers: number;
  canStart: boolean;
  playersCount: number;
  participants?: ParticipantResponse[];
  createdAt: string;
  updatedAt: string;
  currentTurnActorId?: string;
}

export interface ListPublicRoomsResponse {
  rooms: RoomResponse[];
}

export interface GetRoomByInviteCodeResponse {
  room: RoomResponse;
}

export interface UpdateRoomSettingsPayload {
  name: string;
  roomId: string;
  gameType: string;
  maxPlayers: number;
  settings: Settings;
  isPrivate: boolean;
}
