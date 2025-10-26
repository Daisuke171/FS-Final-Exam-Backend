import { GamesService } from 'src/modules/games/games.service';
import { UserService } from '@modules/user/user.service';

export abstract class GameState {
  abstract handleJoin(playerId: string, game: Game): void;
  abstract handleDisconnect(playerId: string, game: Game): void;
  abstract onEnter(game: Game): void;
  onExit?: (game: Game) => void;
}

export interface Player {
  id: string;
  socketId: string;
  nickname: string;
  score: number;
  guesses: OpponentType[];
}

export enum OpponentType {
  HUMAN = 'HUMAN',
  AI = 'AI',
}

export interface ChatMessage {
  sender: string;
  message: string;
  timestamp: number;
  isAI?: boolean;
}

export interface RoundResult {
  roundNumber: number;
  opponentType: OpponentType;
  player1Guess: OpponentType | null;
  player2Guess: OpponentType | null;
  player1Correct: boolean;
  player2Correct: boolean;
  player1Score: number;
  player2Score: number;
}

export interface RoomConfig {
  name: string;
  isPrivate: boolean;
  password?: string;
  totalRounds: number;
  chatDuration: number; // in seconds
  votingDuration: number; // in seconds
}

export interface GameResult {
  winner?: string | null;
  finalScores: Record<string, number>;
  roundResults: RoundResult[];
}

export class Game {
  private state: GameState;
  public players: Map<string, Player> = new Map();
  public roomId: string;
  public roomConfig: RoomConfig;

  // Turing Detective specific
  public currentRound: number = 0;
  public chatMessages: ChatMessage[] = [];
  public roundResults: RoundResult[] = [];
  public currentOpponentType: OpponentType | null = null;
  public playerGuesses: Map<string, OpponentType> = new Map();

  // Kept for compatibility
  public result?: GameResult;
  public ready: Map<string, boolean> = new Map();
  public playerUserIds: Map<string, string> = new Map();
  public startTime: number = Date.now();
  public history: RoundResult[] = [];

  private emitCallback?: (event: string, data: any) => void;
  private onRoomEmpty?: (roomId: string) => void;
  private cleanupTimer?: NodeJS.Timeout;
  private roundTimer?: NodeJS.Timeout;

  constructor(
    roomId: string,
    roomConfig: RoomConfig,
    initialState: GameState,
    private readonly _gamesApiService: GamesService,
    private readonly _usersService: UserService,
  ) {
    this.roomId = roomId;
    this.roomConfig = roomConfig;
    this.state = initialState;
    this.state.onEnter?.(this);
  }

  // Wiring helpers
  setOnRoomEmptyCallback(callback: (roomId: string) => void) {
    this.onRoomEmpty = callback;
  }
  setEmitCallback(cb: (event: string, data: any) => void) {
    this.emitCallback = cb;
  }
  emit(event: string, data: any) {
    this.emitCallback?.(event, data);
  }
  getGamesApiService(): GamesService {
    return this._gamesApiService;
  }
  getUsersService(): UserService {
    return this._usersService;
  }
  cleanup() {
    this.cancelCleanupTimer();
    this.cancelRoundTimer();
  }

  // Join/leave
  join(playerId: string) {
    this.cancelCleanupTimer();
    this.state.handleJoin(playerId, this);
  }
  disconnect(playerId: string) {
    this.state.handleDisconnect(playerId, this);
    if (this.players.size === 0) this.startCleanupTimer();
  }

  // Ready system
  setReady(playerId: string, isReady: boolean) {
    this.ready.set(playerId, isReady);
  }
  clearReady(playerId: string) {
    this.ready.delete(playerId);
  }
  isAllReady(): boolean {
    if (this.players.size < 2) return false;
    for (const id of this.players.keys()) if (!this.ready.get(id)) return false;
    return true;
  }
  resetAllReady() {
    this.ready.clear();
  }

  // Turing Detective game logic
  startNewRound() {
    this.currentRound++;
    this.chatMessages = [];
    this.playerGuesses.clear();
    this.currentOpponentType =
      Math.random() < 0.5 ? OpponentType.HUMAN : OpponentType.AI;
    this.resetAllReady();
  }

  addChatMessage(sender: string, message: string, isAI = false) {
    this.chatMessages.push({
      sender,
      message,
      timestamp: Date.now(),
      isAI,
    });
  }

  submitGuess(playerId: string, guess: OpponentType) {
    this.playerGuesses.set(playerId, guess);
  }

  calculateRoundScores() {
    const players = Array.from(this.players.values());
    if (players.length !== 2) return;

    const [player1, player2] = players;
    const guess1 = this.playerGuesses.get(player1.id);
    const guess2 = this.playerGuesses.get(player2.id);

    const correct1 = guess1 === this.currentOpponentType;
    const correct2 = guess2 === this.currentOpponentType;

    const roundScore = 100;

    if (correct1) player1.score += roundScore;
    if (correct2) player2.score += roundScore;

    const result: RoundResult = {
      roundNumber: this.currentRound,
      opponentType: this.currentOpponentType!,
      player1Guess: guess1 || null,
      player2Guess: guess2 || null,
      player1Correct: correct1,
      player2Correct: correct2,
      player1Score: player1.score,
      player2Score: player2.score,
    };

    this.roundResults.push(result);
    this.history = this.roundResults;
    return result;
  }

  isGameFinished(): boolean {
    return this.currentRound >= this.roomConfig.totalRounds;
  }

  getWinner(): string | null {
    const players = Array.from(this.players.values());
    if (players.length !== 2) return null;

    const [player1, player2] = players;
    if (player1.score > player2.score) return player1.id;
    if (player2.score > player1.score) return player2.id;
    return null; // Draw
  }

  // State handling
  getCurrentState(): string {
    return this.state.constructor.name;
  }
  setState(newState: GameState) {
    this.state.onExit?.(this);
    this.state = newState;
    newState.onEnter(this);
    this.emitFullGameState();
  }

  private emitFullGameState() {
    const stateData = {
      state: this.getCurrentState(),
      players: Array.from(this.players.values()).map((p) => ({
        id: p.id,
        nickname: p.nickname,
        score: p.score,
      })),
      playerCount: this.players.size,
      currentRound: this.currentRound,
      totalRounds: this.roomConfig.totalRounds,
      chatMessages: this.chatMessages,
      roundResults: this.roundResults,
      ready: Object.fromEntries(this.ready.entries()),
      roomInfo: {
        id: this.roomId,
        name: this.roomConfig.name,
        maxPlayers: 2,
        currentPlayers: this.players.size,
        isPrivate: this.roomConfig.isPrivate,
      },
      result: this.result,
    };
    this.emit('gameState', stateData);
  }

  // Timers
  private cancelCleanupTimer() {
    if (this.cleanupTimer) {
      clearTimeout(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }
  private startCleanupTimer() {
    this.cancelCleanupTimer();
    this.cleanupTimer = setTimeout(() => {
      if (this.players.size === 0) this.onRoomEmpty?.(this.roomId);
    }, 5000);
  }
  private cancelRoundTimer() {
    if (this.roundTimer) {
      clearTimeout(this.roundTimer);
      this.roundTimer = undefined;
    }
  }
  setRoundTimer(callback: () => void, duration: number) {
    this.cancelRoundTimer();
    this.roundTimer = setTimeout(callback, duration);
  }
}

export class WaitingState extends GameState {
  onEnter(game: Game): void {
    game.resetAllReady();
  }
  handleJoin(playerId: string, game: Game): void {
    game.players.set(playerId, {
      id: playerId,
      socketId: playerId,
      nickname: '',
      score: 0,
      guesses: [],
    });
  }
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
  }
}

export class StartingState extends GameState {
  private timerId: NodeJS.Timeout | null = null;
  onEnter(game: Game): void {
    game.resetAllReady();
    game.startNewRound();
    let countdown = 3;
    const tick = () => {
      game.emit('countDown', countdown);
      countdown--;
      if (countdown >= 0) this.timerId = setTimeout(tick, 1000);
      else game.setState(new ChattingState());
    };
    tick();
  }
  handleJoin(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    game.clearReady(playerId);
  }
  onExit = () => {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  };
}

export class ChattingState extends GameState {
  onEnter(game: Game): void {
    console.log(`[ChattingState] Round ${game.currentRound} started`);

    game.emit('roundStarted', {
      roundNumber: game.currentRound,
      chatDuration: game.roomConfig.chatDuration,
    });

    // Start chat timer
    game.setRoundTimer(() => {
      game.setState(new VotingState());
    }, game.roomConfig.chatDuration * 1000);
  }

  handleJoin(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    if (game.players.size < 2) {
      game.setState(new WaitingState());
    }
  }
}

export class VotingState extends GameState {
  onEnter(game: Game): void {
    console.log(`[VotingState] Voting phase for round ${game.currentRound}`);

    game.emit('votingStarted', {
      roundNumber: game.currentRound,
      votingDuration: game.roomConfig.votingDuration,
    });

    // Start voting timer
    game.setRoundTimer(() => {
      game.setState(new RevealingState());
    }, game.roomConfig.votingDuration * 1000);
  }

  handleJoin(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    if (game.players.size < 2) {
      game.setState(new WaitingState());
    }
  }
}

export class RevealingState extends GameState {
  onEnter(game: Game): void {
    console.log(
      `[RevealingState] Revealing results for round ${game.currentRound}`,
    );

    const result = game.calculateRoundScores();

    game.emit('roundResult', result);

    // Wait 5 seconds before moving to next round or finishing
    game.setRoundTimer(() => {
      if (game.isGameFinished()) {
        game.setState(new FinishedState());
      } else {
        game.startNewRound();
        game.setState(new ChattingState());
      }
    }, 5000);
  }

  handleJoin(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
    if (game.players.size < 2) {
      game.setState(new WaitingState());
    }
  }
}

export class FinishedState extends GameState {
  async onEnter(game: Game) {
    console.log(`[FinishedState] Game ${game.roomId} finished`);

    const winner = game.getWinner();
    const players = Array.from(game.players.values());

    // Build final scores
    const finalScores: Record<string, number> = {};
    players.forEach((p) => {
      finalScores[p.id] = p.score;
    });

    game.result = {
      winner,
      finalScores,
      roundResults: game.roundResults,
    };

    // Save game results
    try {
      const gamesApiService = game.getGamesApiService();
      const tdGame = await gamesApiService.findByName('Turing Detective');
      const gameId = tdGame.id;

      for (const player of players) {
        const userId = game.playerUserIds.get(player.id);
        if (!userId) continue;

        const state =
          player.id === winner ? 'won' : winner === null ? 'draw' : 'lost';

        await gamesApiService.saveGameResult(
          {
            gameId,
            duration:
              game.roomConfig.chatDuration * game.roomConfig.totalRounds,
            state: state as any,
            score: player.score,
            totalDamage: 0,
          },
          userId,
        );

        // Add XP based on correct guesses
        const correctGuesses = game.roundResults.filter((round, idx) => {
          const playerGuess = player.guesses[idx];
          return playerGuess === round.opponentType;
        }).length;

        const accuracy = correctGuesses / game.roomConfig.totalRounds;
        const xp = this.calculateXpFromAccuracy(accuracy, state === 'won');

        const usersService = game.getUsersService();
        await usersService.addExperience(userId, xp);
      }
    } catch (err) {
      console.error('Error saving Turing Detective result:', err);
    }

    game.emit('gameFinished', {
      winner,
      finalScores,
      roundResults: game.roundResults,
    });

    // Reset for next game
    setTimeout(() => {
      // Reset scores
      game.players.forEach((p) => {
        p.score = 0;
        p.guesses = [];
      });
      game.currentRound = 0;
      game.roundResults = [];
      game.chatMessages = [];
      game.setState(new WaitingState());
    }, 1500);
  }

  private calculateXpFromAccuracy(accuracy: number, won: boolean): number {
    const baseXp = 10;
    const accuracyXp = Math.floor(accuracy * 50); // Up to 50 XP for 100% accuracy
    const winBonus = won ? 20 : 0;
    const completionBonus = 5;
    const total = baseXp + accuracyXp + winBonus + completionBonus;
    return Math.max(10, Math.min(85, total));
  }

  handleJoin(): void {}
  handleDisconnect(playerId: string, game: Game): void {
    game.players.delete(playerId);
  }
}
