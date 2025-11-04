export interface CreateLevelInput {
  atomicNumber: number;
  name: string;
  chemicalSymbol: string;
  color: string;
  experienceRequired: number;
}
import levels from './dataLevels.json';

export function getNextLevel(atomicNumber: number) {
  return levels.find((l) => l.atomicNumber === atomicNumber);
}
