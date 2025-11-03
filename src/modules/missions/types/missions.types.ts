import { Mission, UserMissionProgress } from '@prisma/client';

// ============================================
// EVENT DATA TYPES
// ============================================

export interface GamePlayedEvent {
  gameId: string;
}

export interface GameWonEvent {
  gameId: string;
}

export interface WinStreakEvent {
  gameId?: string;
  currentStreak: number;
}

export interface PerfectWinEvent {
  gameId: string;
  damageTaken: number;
}

export interface TotalScoreEvent {
  gameId?: string;
  score: number;
}

export interface PlayBothGamesEvent {
  gameId: string;
}

export type MissionEventData =
  | GamePlayedEvent
  | GameWonEvent
  | WinStreakEvent
  | PerfectWinEvent
  | TotalScoreEvent
  | PlayBothGamesEvent;

// ============================================
// MISSION TARGET TYPES
// ============================================

export enum MissionTargetType {
  GAME_PLAYED = 'game_played',
  GAME_WON = 'game_won',
  WIN_STREAK = 'win_streak',
  PERFECT_WIN = 'perfect_win',
  TOTAL_SCORE = 'total_score',
  PLAY_BOTH_GAMES = 'play_both_games',
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface MissionProgressUpdate {
  mission: Mission;
  progress: UserMissionProgress;
}

export interface ClaimRewardResponse {
  user: any; // UserWithLevel
  progress: UserMissionProgress & { mission: Mission };
  rewards: {
    xp: number;
    coins: number;
  };
}

export type MissionWithProgress = Mission & {
  progress: UserMissionProgress[];
};

export type UserMissionResponse = Omit<Mission, 'progress'> & {
  progress?: never;
  userProgress: UserMissionProgress | null;
};

// ============================================
// HELPER TYPES
// ============================================

export interface MissionStats {
  total: number;
  completed: number;
  claimed: number;
  pending: number;
  completionRate: number;
}

export interface DailyMissionReset {
  userId: string;
  missionsReset: number;
  nextResetAt: Date;
}

// ============================================
// TYPE GUARDS
// ============================================

export function isGamePlayedEvent(
  data: MissionEventData,
): data is GamePlayedEvent {
  return (
    'gameId' in data &&
    !('damageTaken' in data) &&
    !('currentStreak' in data) &&
    !('score' in data)
  );
}

export function isGameWonEvent(data: MissionEventData): data is GameWonEvent {
  return (
    'gameId' in data &&
    !('damageTaken' in data) &&
    !('currentStreak' in data) &&
    !('score' in data)
  );
}

export function isWinStreakEvent(
  data: MissionEventData,
): data is WinStreakEvent {
  return 'currentStreak' in data;
}

export function isPerfectWinEvent(
  data: MissionEventData,
): data is PerfectWinEvent {
  return 'damageTaken' in data && 'gameId' in data;
}

export function isTotalScoreEvent(
  data: MissionEventData,
): data is TotalScoreEvent {
  return 'score' in data;
}

export function isPlayBothGamesEvent(
  data: MissionEventData,
): data is PlayBothGamesEvent {
  return 'gameId' in data;
}
