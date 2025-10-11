import { Moves } from '../states/rps.states';

export function getRandomMove(): Moves {
  const moves: Moves[] = [Moves.ROCK, Moves.PAPER, Moves.SCISSORS];
  return moves[Math.floor(Math.random() * moves.length)];
}
