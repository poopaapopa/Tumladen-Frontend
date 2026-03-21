export interface Game {
  id: number,
  title: string,
  description: string,
  imageUrl?: string,
  minPlayers: number,
  maxPlayers: number,
}