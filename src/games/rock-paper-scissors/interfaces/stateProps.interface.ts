import { Moves } from '../states/rps.states';

export interface StateProps {
  state: string;
  players: string[];
  playerCount: number;
  result?: unknown;
  history?: unknown;
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  currentMoves: Record<string, Moves>;
  roomInfo: {
    id: string;
    name: string;
    maxPlayers: number;
    currentPlayers: number;
    isPrivate: boolean;
  };
}
