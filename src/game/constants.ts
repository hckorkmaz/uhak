import { LevelConfig, Translations } from './types';

export const GRAVITY = 0.225;
export const JUMP_STRENGTH = -8;
export const CLOUD_SPEED = 3.5;
export const CLOUD_SPAWN_INTERVAL = 1500;
export const CLOUD_GAP = 216;
export const BIRD_SIZE = 40;

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    targetScore: 5,
    speedMultiplier: 0.82,
    spawnInterval: CLOUD_SPAWN_INTERVAL + 350,
    gapMultiplier: 1.05,
    patterns: ['steady', 'steady', 'gentleRise', 'gentleDip'],
  },
  {
    id: 2,
    targetScore: 9,
    speedMultiplier: 0.95,
    spawnInterval: CLOUD_SPAWN_INTERVAL + 100,
    gapMultiplier: 0.92,
    patterns: ['steady', 'gentleRise', 'gentleDip', 'zigzag'],
  },
  {
    id: 3,
    targetScore: 14,
    speedMultiplier: 1.08,
    spawnInterval: CLOUD_SPAWN_INTERVAL - 100,
    gapMultiplier: 0.78,
    patterns: ['gentleRise', 'gentleDip', 'zigzag', 'zigzag'],
  },
];

export const TRANSLATIONS: Record<'tr' | 'en', Translations> = {
  tr: {
    title: 'UHAK: Bulutların Ötesinde',
    subtitle: 'Tam React Native sürümü',
    start: 'Uçuşu Başlat',
    gameOver: 'Bu Kez Olmadı, Tekrar Dene!',
    score: 'Skor',
    bestScore: 'En Yüksek Seviye / Skor',
    bestFreeScore: 'Serbest Mod Rekoru',
    restart: 'Baştan Başla',
    backToMenu: 'Ana Menüye Dön',
    level: 'Seviye',
    target: 'Hedef',
    levelComplete: 'Tebrikler! Seviye Tamamlandı',
    nextLevel: 'Sonraki Seviyeye Geç',
    win: 'Harika! Tüm Seviyeler Bitti',
    normalMode: 'Seviyeli Mod',
    freeMode: 'Serbest Mod',
    freeModeHint: 'Sonsuz uçuş, otomatik seviye artışı',
    tapToFly: 'Uçmak için dokun',
  },
  en: {
    title: 'UHAK: Beyond the Clouds',
    subtitle: 'Full React Native edition',
    start: 'Start Flight',
    gameOver: 'Nice Try, Let’s Go Again!',
    score: 'Score',
    bestScore: 'Highest Level / Score',
    bestFreeScore: 'Free Mode Record',
    restart: 'Play Again',
    backToMenu: 'Back To Menu',
    level: 'Level',
    target: 'Target',
    levelComplete: 'Great Job! Level Complete',
    nextLevel: 'Go To Next Level',
    win: 'Amazing! All Levels Done',
    normalMode: 'Level Mode',
    freeMode: 'Free Mode',
    freeModeHint: 'Endless flight with auto level-up',
    tapToFly: 'Tap to fly',
  },
};
