export type Language = 'tr' | 'en';
export type GameMode = 'NORMAL' | 'FREE';

export type GameState = 'START_MENU' | 'PLAYING' | 'LEVEL_COMPLETE' | 'WIN' | 'GAME_OVER';
export type CloudPattern = 'steady' | 'gentleRise' | 'gentleDip' | 'zigzag';

export interface Point {
  x: number;
  y: number;
}

export interface Cloud {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
}

export interface LevelConfig {
  id: number;
  targetScore: number;
  speedMultiplier: number;
  spawnInterval: number;
  gapMultiplier: number;
  patterns: CloudPattern[];
}

export interface Translations {
  title: string;
  start: string;
  gameOver: string;
  score: string;
  bestScore: string;
  bestFreeScore: string;
  restart: string;
  backToMenu: string;
  level: string;
  target: string;
  levelComplete: string;
  nextLevel: string;
  win: string;
  normalMode: string;
  freeMode: string;
  freeModeHint: string;
}
