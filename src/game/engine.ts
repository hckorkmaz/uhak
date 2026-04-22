import { BIRD_SIZE, CLOUD_GAP, LEVELS } from './constants';
import { Cloud, Language, LevelConfig } from './types';

export interface Dimensions {
  width: number;
  height: number;
}

export interface BestProgress {
  level: number;
  score: number;
}

export interface ResponsiveCloudConfig {
  baseWidth: number;
  baseHeight: number;
  gap: number;
  groundRatio: number;
  speedFactor: number;
  spawnIntervalFactor: number;
  planeStartRatio: number;
}

export type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type Puff = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
};

export const getFreeModeLevel = (currentScore: number): LevelConfig => {
  const freeModeLevelId = Math.floor(currentScore / 5) + 1;
  const baseLevel = LEVELS[Math.min(freeModeLevelId - 1, LEVELS.length - 1)];
  const extraDifficulty = Math.max(0, freeModeLevelId - LEVELS.length);

  return {
    ...baseLevel,
    id: freeModeLevelId,
    targetScore: freeModeLevelId * 5,
    speedMultiplier: Math.min(1.8, baseLevel.speedMultiplier + extraDifficulty * 0.08),
    spawnInterval: Math.max(650, baseLevel.spawnInterval - extraDifficulty * 70),
    gapMultiplier: Math.max(0.82, baseLevel.gapMultiplier - extraDifficulty * 0.035),
    patterns: extraDifficulty > 0 ? ['gentleRise', 'gentleDip', 'zigzag', 'zigzag'] : baseLevel.patterns,
  };
};

export const getResponsiveCloudConfig = (
  dimensions: Dimensions,
  activeLevel: LevelConfig,
): ResponsiveCloudConfig => {
  const viewportScale = Math.max(
    0.72,
    Math.min(1.15, Math.min(dimensions.width / 1440, dimensions.height / 900) * 1.8),
  );

  const aspectRatio = dimensions.width / Math.max(dimensions.height, 1);
  const portraitTightness = Math.max(0, Math.min(1, (0.98 - aspectRatio) / 0.5));

  const maxGap = CLOUD_GAP * activeLevel.maxGapMultiplier;

  return {
    baseWidth: 72 * viewportScale * (1 + portraitTightness * 0.08),
    baseHeight: 104 * viewportScale,
    gap: Math.max(
      132,
      Math.min(
        maxGap,
        CLOUD_GAP * activeLevel.gapMultiplier * (0.95 + viewportScale * 0.15) * (1 - portraitTightness * 0.28),
      ),
    ),
    groundRatio: 0.85 - portraitTightness * 0.08,
    speedFactor: 1 + portraitTightness * 0.1,
    spawnIntervalFactor: 1 - portraitTightness * 0.12,
    planeStartRatio: 0.4 - portraitTightness * 0.05,
  };
};

export const getPlaneX = (width: number) => {
  return Math.max(50, Math.min(140, width * 0.1));
};

export const getPlaneRect = (planeX: number, planeY: number): Rect => {
  return {
    left: planeX - BIRD_SIZE * 0.8,
    right: planeX + BIRD_SIZE * 0.9,
    top: planeY - BIRD_SIZE * 0.32,
    bottom: planeY + BIRD_SIZE * 0.32,
  };
};

export const getCloudPuffs = (x: number, y: number, w: number, h: number): Puff[] => ([
  { cx: x + w * 0.15, cy: y + h * 0.5, rx: h * 0.45, ry: h * 0.35 },
  { cx: x + w * 0.4, cy: y + h * 0.4, rx: h * 0.6, ry: h * 0.45 },
  { cx: x + w * 0.65, cy: y + h * 0.5, rx: h * 0.55, ry: h * 0.4 },
  { cx: x + w * 0.85, cy: y + h * 0.6, rx: h * 0.4, ry: h * 0.3 },
  { cx: x + w * 0.3, cy: y + h * 0.7, rx: h * 0.4, ry: h * 0.3 },
]);

export const getCloudCollisionRects = (x: number, y: number, w: number, h: number): Rect[] => {
  const hitboxInset = 10;

  return getCloudPuffs(x, y, w, h).map(({ cx, cy, rx, ry }) => ({
    left: cx - rx + hitboxInset,
    right: cx + rx - hitboxInset,
    top: cy - ry + hitboxInset,
    bottom: cy + ry - hitboxInset,
  }));
};

export const rectIntersect = (r1: Rect, r2: Rect) => {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
};

interface CreateCloudArgs {
  dimensions: Dimensions;
  responsiveConfig: ResponsiveCloudConfig;
  currentLevelConfig: LevelConfig;
  lastSpawnY: number | null;
  random?: () => number;
}

export const createCloud = ({
  dimensions,
  responsiveConfig,
  currentLevelConfig,
  lastSpawnY,
  random = Math.random,
}: CreateCloudArgs): { cloud: Cloud; nextSpawnY: number } => {
  const { baseWidth, baseHeight, gap, groundRatio } = responsiveConfig;
  const scale = 0.7 + random() * 0.6;
  const cloudWidth = baseWidth * scale;
  const cloudHeight = baseHeight * scale;
  const groundTop = dimensions.height * groundRatio;
  const topPadding = Math.max(10, cloudHeight * 0.08);
  const minGroundClearance = dimensions.height * 0.15;
  const groundPadding = Math.max(minGroundClearance, cloudHeight * 0.3);
  // Keep the top obstacle fully inside the viewport (no overflow above y=0).
  const minY = gap / 2 + cloudHeight + topPadding;
  const maxY = Math.max(minY + 10, groundTop - gap / 2 - groundPadding);
  const centerY = (minY + maxY) / 2;
  const previousY = lastSpawnY ?? centerY;
  const range = maxY - minY;
  const pattern = currentLevelConfig.patterns[Math.floor(random() * currentLevelConfig.patterns.length)];

  let y = centerY;

  switch (pattern) {
    case 'steady':
      y = previousY + (random() - 0.5) * range * 0.18;
      break;
    case 'gentleRise':
      y = previousY - range * 0.14 + (random() - 0.5) * range * 0.08;
      break;
    case 'gentleDip':
      y = previousY + range * 0.14 + (random() - 0.5) * range * 0.08;
      break;
    case 'zigzag':
      y = previousY < centerY ? previousY + range * 0.24 : previousY - range * 0.24;
      break;
  }

  y = Math.max(minY, Math.min(maxY, y));

  return {
    cloud: {
      id: Date.now() + Math.floor(random() * 10000),
      x: dimensions.width,
      y,
      width: cloudWidth,
      height: cloudHeight,
      passed: false,
    },
    nextSpawnY: y,
  };
};

export const getDefaultLanguage = (): Language => {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale?.toLowerCase() || '';
  return locale.startsWith('tr') ? 'tr' : 'en';
};
