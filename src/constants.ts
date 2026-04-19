import { Translations } from './types';

export const GRAVITY = 0.225;
export const JUMP_STRENGTH = -8;
export const CLOUD_SPEED = 3.5;
export const CLOUD_SPAWN_INTERVAL = 1500; // ms
export const CLOUD_GAP = 180;
export const BIRD_SIZE = 40;

export const TRANSLATIONS: Record<'tr' | 'en', Translations> = {
  tr: {
    title: 'UHAK: Bulutların Ötesinde',
    start: 'Uçuşu Başlat',
    gameOver: 'Uçuş Tamamlandı',
    score: 'Skor',
    bestScore: 'En İyi Skor',
    restart: 'Tekrar Dene'
  },
  en: {
    title: 'UHAK: Beyond the Clouds',
    start: 'Start Flight',
    gameOver: 'Flight Ended',
    score: 'Score',
    bestScore: 'Best Score',
    restart: 'Try Again'
  }
};
