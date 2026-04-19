export type Language = 'tr' | 'en';

export type GameState = 'START_MENU' | 'PLAYING' | 'GAME_OVER';

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

export interface Translations {
  title: string;
  start: string;
  gameOver: string;
  score: string;
  bestScore: string;
  restart: string;
}
