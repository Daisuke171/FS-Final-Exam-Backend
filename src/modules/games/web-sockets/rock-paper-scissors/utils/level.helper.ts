import { Level, User } from '@prisma/client';
import { getNextLevel } from './getNextLevel';

export type UserWithLevel = User & { level: Level };

export interface LevelProgressData {
  xpGained: number;
  leveledUp: boolean;
  oldLevel: number;
  newLevel: number;
  unlockedSkins: any[];

  // Progress antes
  xpInCurrentLevelBefore: number;
  xpNeededForLevelBefore?: number;
  progressBefore: number;

  // Progress después
  xpInCurrentLevelAfter: number;
  xpNeededForLevelAfter?: number;
  progressAfter: number;

  // Info de niveles
  oldLevelName: string;
  oldLevelSymbol: string;
  oldLevelColor: string;
  newLevelName: string;
  newLevelSymbol: string;
  newLevelColor: string;
}

export interface AddExperienceResult {
  user: UserWithLevel;
  leveledUp: boolean;
  previousLevel: number;
  newLevel: number;
  unlockedSkins: any[];
}

export function calculateLevelData(
  userBefore: UserWithLevel,
  xpResult: AddExperienceResult,
  xpGained: number,
) {
  const currentLevelXpRequired = userBefore.level.experienceRequired;
  const experienceBefore = userBefore.experience;
  const experienceAfter = xpResult.user.experience;

  const xpInCurrentLevelBefore = experienceBefore - currentLevelXpRequired;

  const nextLevel = getNextLevel(userBefore.level.atomicNumber + 1);
  const nextLevelXpRequired = nextLevel?.experienceRequired || 99999;

  const xpNeededForLevel = nextLevelXpRequired - currentLevelXpRequired;
  const progressBefore = (xpInCurrentLevelBefore / xpNeededForLevel) * 100;

  if (xpResult.leveledUp) {
    const newLevelXpRequired = xpResult.user.level.experienceRequired;
    const xpInNewLevel = experienceAfter - newLevelXpRequired;
    const nextNextLevel = getNextLevel(xpResult.newLevel + 1);
    const xpNeededForNewLevel =
      (nextNextLevel?.experienceRequired || 99999) - newLevelXpRequired;
    const progressAfter = (xpInNewLevel / xpNeededForNewLevel) * 100;

    return {
      xpGained,
      leveledUp: true,
      oldLevel: xpResult.previousLevel,
      newLevel: xpResult.newLevel,
      unlockedSkins: xpResult.unlockedSkins || [],

      xpInCurrentLevelBefore,
      xpNeededForLevelBefore: xpNeededForLevel,
      progressBefore,

      xpInCurrentLevelAfter: xpInNewLevel,
      xpNeededForLevelAfter: xpNeededForNewLevel,
      progressAfter,

      oldLevelName: userBefore.level.name,
      oldLevelSymbol: userBefore.level.chemicalSymbol,
      oldLevelColor: userBefore.level.color,

      newLevelName: xpResult.user.level.name,
      newLevelSymbol: xpResult.user.level.chemicalSymbol,
      newLevelColor: xpResult.user.level.color,
    };
  } else {
    const xpInCurrentLevelAfter = experienceAfter - currentLevelXpRequired;
    const progressAfter = (xpInCurrentLevelAfter / xpNeededForLevel) * 100;

    return {
      xpGained,
      leveledUp: false,
      oldLevel: xpResult.newLevel,
      newLevel: xpResult.newLevel,
      unlockedSkins: [],

      xpInCurrentLevelBefore,
      xpInCurrentLevelAfter,
      xpNeededForLevel,
      progressBefore,
      progressAfter,

      oldLevelName: userBefore.level.name,
      oldLevelSymbol: userBefore.level.chemicalSymbol,
      oldLevelColor: userBefore.level.color,
      newLevelName: userBefore.level.name,
      newLevelSymbol: userBefore.level.chemicalSymbol,
      newLevelColor: userBefore.level.color,
    };
  }
}
