import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { VT323_400Regular } from '@expo-google-fonts/vt323';
import React, { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { PlaneSprite, PixelObstacleCloud } from './src/components/GameSprites';
import { PixelBgCloud, PixelMountains, PixelSea, PixelSky, PixelSun } from './src/components/PixelBackground';
import { SplashScreen } from './src/components/SplashScreen';
import {
  BIRD_SIZE,
  CLOUD_SPEED,
  GRAVITY,
  JUMP_STRENGTH,
  LEVELS,
  TRANSLATIONS,
} from './src/game/constants';
import {
  createCloud,
  getCloudCollisionRects,
  getDefaultLanguage,
  getFreeModeLevel,
  getPlaneRect,
  getPlaneX,
  getResponsiveCloudConfig,
  rectIntersect,
  type BestProgress,
} from './src/game/engine';
import { loadBestProgress, loadFreeBestScore, saveBestProgress, saveFreeBestScore } from './src/game/storage';
import { Cloud, GameMode, GameState, Language, LevelConfig } from './src/game/types';

export default function App() {
  const windowSize = useWindowDimensions();
  const dimensions = useMemo(
    () => ({ width: Math.max(windowSize.width, 320), height: Math.max(windowSize.height, 640) }),
    [windowSize.height, windowSize.width],
  );

  const [gameState, setGameState] = useState<GameState>('SPLASH');
  const [language, setLanguage] = useState<Language>(getDefaultLanguage);
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [bestProgress, setBestProgress] = useState<BestProgress>({ level: 1, score: 0 });
  const [freeBestScore, setFreeBestScore] = useState(0);
  const [, setRenderTick] = useState(0);

  const dimensionsRef = useRef(dimensions);
  const planeY = useRef(dimensions.height * 0.4);
  const planeVelocity = useRef(0);
  const clouds = useRef<Cloud[]>([]);
  const lastCloudSpawnTime = useRef(0);
  const lastFrameTime = useRef<number | null>(null);
  const lastSpawnY = useRef<number | null>(null);
  const scoreRef = useRef(0);
  const isTransitioning = useRef(false);
  const animationFrameId = useRef<number>(0);
  const activeLevelRef = useRef<LevelConfig>(LEVELS[0]);

  const t = TRANSLATIONS[language];
  const activeLevel = gameMode === 'FREE' ? getFreeModeLevel(score) : (LEVELS[currentLevel] ?? LEVELS[0]);
  const responsiveConfig = useMemo(() => getResponsiveCloudConfig(dimensions, activeLevel), [activeLevel, dimensions]);
  const [fontsLoaded] = useFonts({
    VT323: VT323_400Regular,
  });

  useEffect(() => {
    dimensionsRef.current = dimensions;
  }, [dimensions]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    activeLevelRef.current = activeLevel;
  }, [activeLevel]);

  useEffect(() => {
    let mounted = true;

    const loadScores = async () => {
      const [storedProgress, storedFreeBest] = await Promise.all([
        loadBestProgress(),
        loadFreeBestScore(),
      ]);

      if (!mounted) {
        return;
      }

      setBestProgress(storedProgress);
      setFreeBestScore(storedFreeBest);
    };

    void loadScores();

    return () => {
      mounted = false;
    };
  }, []);

  const resetGame = useCallback(() => {
    const nextResponsive = getResponsiveCloudConfig(dimensionsRef.current, activeLevelRef.current);
    planeY.current = dimensionsRef.current.height * nextResponsive.planeStartRatio;
    planeVelocity.current = 0;
    clouds.current = [];
    lastCloudSpawnTime.current = -Math.max(700, activeLevelRef.current.spawnInterval * 0.55);
    lastFrameTime.current = null;
    lastSpawnY.current = null;
    scoreRef.current = 0;
    isTransitioning.current = false;
    setScore(0);
  }, []);

  const startGame = useCallback((mode: GameMode = 'NORMAL') => {
    setGameMode(mode);
    setCurrentLevel(0);
    setGameState('PLAYING');
  }, []);

  const returnToMenu = useCallback(() => {
    isTransitioning.current = false;
    setCurrentLevel(0);
    setScore(0);
    setGameState('START_MENU');
  }, []);

  const goToNextLevel = useCallback(() => {
    isTransitioning.current = false;
    setCurrentLevel((level) => Math.min(level + 1, LEVELS.length - 1));
    setGameState('PLAYING');
  }, []);

  const updateBest = useCallback((level: number, finalScore: number) => {
    setBestProgress((current) => {
      const shouldUpdate = level > current.level || (level === current.level && finalScore > current.score);
      const next = shouldUpdate ? { level, score: finalScore } : current;
      void saveBestProgress(next);
      return next;
    });
  }, []);

  const updateFreeBest = useCallback((finalScore: number) => {
    setFreeBestScore((current) => {
      const next = Math.max(current, finalScore);
      void saveFreeBestScore(next);
      return next;
    });
  }, []);

  const handleLevelComplete = useCallback((finalScore: number) => {
    if (isTransitioning.current) {
      return;
    }

    isTransitioning.current = true;
    updateBest(activeLevelRef.current.id, finalScore);

    if (currentLevel >= LEVELS.length - 1) {
      setGameState('WIN');
      return;
    }

    setGameState('LEVEL_COMPLETE');
  }, [currentLevel, updateBest]);

  const handleGameOver = useCallback(() => {
    if (isTransitioning.current) {
      return;
    }

    isTransitioning.current = true;
    setGameState('GAME_OVER');

    if (gameMode === 'FREE') {
      updateFreeBest(scoreRef.current);
      return;
    }

    updateBest(activeLevelRef.current.id, scoreRef.current);
  }, [gameMode, updateBest, updateFreeBest]);

  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      planeVelocity.current = JUMP_STRENGTH;
    }
  }, [gameState]);

  const spawnCloud = useCallback(() => {
    const currentLevelConfig = activeLevelRef.current;
    const nextResponsive = getResponsiveCloudConfig(dimensionsRef.current, currentLevelConfig);
    const { cloud, nextSpawnY } = createCloud({
      dimensions: dimensionsRef.current,
      responsiveConfig: nextResponsive,
      currentLevelConfig,
      lastSpawnY: lastSpawnY.current,
    });

    lastSpawnY.current = nextSpawnY;
    clouds.current.push(cloud);
  }, []);

  const update = useCallback((time: number) => {
    if (isTransitioning.current) {
      return;
    }

    const currentLevelConfig = activeLevelRef.current;
    const currentDimensions = dimensionsRef.current;
    const nextResponsive = getResponsiveCloudConfig(currentDimensions, currentLevelConfig);
    const deltaTime = lastFrameTime.current === null ? 1000 / 60 : Math.min(time - lastFrameTime.current, 34);
    const frameScale = deltaTime / (1000 / 60);
    lastFrameTime.current = time;

    planeVelocity.current += GRAVITY * frameScale;
    planeY.current += planeVelocity.current * frameScale;

    if (
      planeY.current + BIRD_SIZE / 2 > currentDimensions.height * nextResponsive.groundRatio ||
      planeY.current - BIRD_SIZE / 2 < 0
    ) {
      handleGameOver();
    }

    if (time - lastCloudSpawnTime.current > currentLevelConfig.spawnInterval) {
      spawnCloud();
      lastCloudSpawnTime.current = time;
    }

    const planeRect = getPlaneRect(getPlaneX(currentDimensions.width), planeY.current);

    clouds.current = clouds.current.filter((cloud) => {
      cloud.x -= CLOUD_SPEED * currentLevelConfig.speedMultiplier * frameScale;

      const cloudWidth = cloud.width * 1.5;
      const cloudHeight = cloud.height;
      const topCloudY = cloud.y - nextResponsive.gap / 2 - cloudHeight;
      const bottomCloudY = cloud.y + nextResponsive.gap / 2;
      const cloudRects = [
        ...getCloudCollisionRects(cloud.x, topCloudY, cloudWidth, cloudHeight),
        ...getCloudCollisionRects(cloud.x, bottomCloudY, cloudWidth, cloudHeight),
      ];

      if (cloudRects.some((cloudRect) => rectIntersect(planeRect, cloudRect))) {
        handleGameOver();
      }

      if (!cloud.passed && cloud.x + cloudWidth < getPlaneX(currentDimensions.width)) {
        cloud.passed = true;
        setScore((currentScore) => currentScore + 1);
      }

      return cloud.x + cloudWidth > 0;
    });
  }, [handleGameOver, spawnCloud]);

  useEffect(() => {
    if (gameState !== 'PLAYING') {
      return;
    }

    resetGame();

    const loop = (time: number) => {
      update(time);
      setRenderTick((value) => (value + 1) % 100000);
      animationFrameId.current = requestAnimationFrame(loop);
    };

    animationFrameId.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animationFrameId.current);
  }, [gameState, resetGame, update]);

  useEffect(() => {
    if (gameMode === 'NORMAL' && gameState === 'PLAYING' && !isTransitioning.current && score >= activeLevel.targetScore) {
      handleLevelComplete(score);
    }
  }, [activeLevel.targetScore, gameMode, gameState, handleLevelComplete, score]);

  if (!fontsLoaded) {
    return null;
  }

  const planeX = getPlaneX(dimensions.width);
  const planeRotation = Math.min(16, Math.max(-16, planeVelocity.current * 3));
  const groundTop = dimensions.height * responsiveConfig.groundRatio;
  const resultTitle = gameState === 'GAME_OVER' ? t.gameOver : gameState === 'LEVEL_COMPLETE' ? t.levelComplete : t.win;
  const bestScoreText = gameMode === 'FREE'
    ? `${t.bestFreeScore}: ${freeBestScore}`
    : `${t.bestScore}: ${bestProgress.level}. ${t.level} • ${bestProgress.score}`;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <Pressable style={styles.container} onPress={jump} disabled={gameState !== 'PLAYING'}>
        <View style={styles.sky}>
          {/* Pixel art sky gradient */}
          <PixelSky width={dimensions.width} height={dimensions.height} />
          {/* Pixel art sun */}
          <View style={[styles.backgroundElement, { right: dimensions.width * 0.08, top: dimensions.height * 0.06 }]} pointerEvents="none">
            <PixelSun size={56} />
          </View>

          {/* Pixel art background clouds */}
          <View style={[styles.backgroundElement, { left: dimensions.width * 0.08, top: dimensions.height * 0.12 }]} pointerEvents="none">
            <PixelBgCloud width={96} opacity={0.75} />
          </View>
          <View style={[styles.backgroundElement, { left: dimensions.width * 0.55, top: dimensions.height * 0.08 }]} pointerEvents="none">
            <PixelBgCloud width={72} opacity={0.55} />
          </View>
          <View style={[styles.backgroundElement, { left: dimensions.width * 0.25, top: dimensions.height * 0.22 }]} pointerEvents="none">
            <PixelBgCloud width={60} opacity={0.45} />
          </View>

          {clouds.current.map((cloud) => {
            const cloudWidth = cloud.width * 1.5;
            const topCloudY = cloud.y - responsiveConfig.gap / 2 - cloud.height;
            const bottomCloudY = cloud.y + responsiveConfig.gap / 2;

            return (
              <Fragment key={cloud.id}>
                <View style={[styles.cloudObstacle, { left: cloud.x, top: topCloudY, width: cloudWidth, height: cloud.height }]}>
                  <PixelObstacleCloud width={cloudWidth} height={cloud.height} />
                </View>
                <View style={[styles.cloudObstacle, { left: cloud.x, top: bottomCloudY, width: cloudWidth, height: cloud.height }]}>
                  <PixelObstacleCloud width={cloudWidth} height={cloud.height} />
                </View>
              </Fragment>
            );
          })}

          {gameState === 'PLAYING' && (
            <View
              style={[
                styles.plane,
                {
                  left: planeX - BIRD_SIZE * 0.85,
                  top: planeY.current - BIRD_SIZE * 0.55,
                  transform: [{ rotate: `${planeRotation}deg` }],
                },
              ]}
            >
              <PlaneSprite size={BIRD_SIZE} />
            </View>
          )}

          <View style={[styles.ground, { top: groundTop, height: Math.max(48, dimensions.height - groundTop) }]}>
            {/* Pixel art sea with animated waves */}
            <PixelSea width={dimensions.width} height={Math.max(48, dimensions.height - groundTop)} />
            {/* Pixel art mountains at horizon */}
            <View style={styles.mountainsWrap} pointerEvents="none">
              <PixelMountains width={dimensions.width} height={36} />
            </View>
          </View>
        </View>

        {gameState === 'PLAYING' && (
          <View style={styles.hud} pointerEvents="none">
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>{gameMode === 'FREE' ? '∞' : `${t.level} ${activeLevel.id}`}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeValue}>{score}</Text>
              {gameMode !== 'FREE' && <Text style={styles.badgeSub}>/ {activeLevel.targetScore}</Text>}
            </View>
          </View>
        )}

        {gameState === 'SPLASH' && (
          <SplashScreen language={language} onFinish={() => setGameState('START_MENU')} />
        )}

        {gameState === 'START_MENU' && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <View style={styles.heroPreview}>
                <View style={[styles.heroCloud, { left: 6, top: 14 }]}>
                  <PixelBgCloud width={58} opacity={0.85} />
                </View>
                <View style={styles.heroPlaneWrap}>
                  <PlaneSprite size={34} />
                </View>
              </View>

              <Text style={styles.title}>{t.title}</Text>

              <View style={styles.languageRow}>
                <Pressable style={[styles.langButton, language === 'en' && styles.langButtonActive]} onPress={() => setLanguage('en')}>
                  <Text style={[styles.langButtonText, language === 'en' && styles.langButtonTextActive]}>EN</Text>
                </Pressable>
                <Pressable style={[styles.langButton, language === 'tr' && styles.langButtonActive]} onPress={() => setLanguage('tr')}>
                  <Text style={[styles.langButtonText, language === 'tr' && styles.langButtonTextActive]}>TR</Text>
                </Pressable>
              </View>

              <Pressable style={[styles.primaryButton, styles.orangeButton]} onPress={() => startGame('NORMAL')}>
                <Text style={styles.primaryButtonText}>{t.normalMode}</Text>
              </Pressable>

              <Pressable style={[styles.primaryButton, styles.greenButton]} onPress={() => startGame('FREE')}>
                <Text style={styles.primaryButtonText}>{t.freeMode}</Text>
              </Pressable>

            </View>
          </View>
        )}

        {(gameState === 'GAME_OVER' || gameState === 'LEVEL_COMPLETE' || gameState === 'WIN') && (
          <View style={styles.overlay}>
            <View style={styles.card}>
              <Text style={styles.resultTitle}>{resultTitle}</Text>

              <View style={styles.scoreBox}>
                <Text style={styles.scoreLabel}>{t.score}</Text>
                <Text style={styles.scoreValue}>{score}</Text>
              </View>

              <Text style={styles.metaText}>
                {t.level}: {gameMode === 'FREE' ? '∞' : activeLevel.id}
              </Text>
              <Text style={styles.metaText}>{bestScoreText}</Text>

              <Pressable
                style={[styles.primaryButton, styles.greenButton]}
                onPress={() => {
                  if (gameState === 'LEVEL_COMPLETE') {
                    goToNextLevel();
                    return;
                  }

                  startGame(gameMode);
                }}
              >
                <Text style={styles.primaryButtonText}>
                  {gameState === 'LEVEL_COMPLETE' ? t.nextLevel : t.restart}
                </Text>
              </Pressable>

              <Pressable style={[styles.primaryButton, styles.whiteButton]} onPress={returnToMenu}>
                <Text style={styles.secondaryButtonText}>{t.backToMenu}</Text>
              </Pressable>
            </View>
          </View>
        )}
        </Pressable>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const PIXEL_FONT = 'VT323';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#8fe0ff',
  },
  container: {
    flex: 1,
    backgroundColor: '#8fe0ff',
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8fe0ff',
  },
  backgroundElement: {
    position: 'absolute',
  },
  cloudObstacle: {
    position: 'absolute',
  },
  plane: {
    position: 'absolute',
    width: 100,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'visible',
  },
  mountainsWrap: {
    position: 'absolute',
    top: -28,
    left: 0,
    right: 0,
    zIndex: 2,
    opacity: 0.78,
  },
  // ─── HUD ───
  hud: {
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff9ef',
    borderWidth: 2,
    borderColor: '#543847',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 0,
  },
  badgeLabel: {
    color: '#543847',
    fontFamily: PIXEL_FONT,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 1,
  },
  badgeValue: {
    color: '#2e9f4b',
    fontSize: 18,
    lineHeight: 22,
    fontFamily: PIXEL_FONT,
  },
  badgeSub: {
    marginLeft: 4,
    color: '#543847',
    fontFamily: PIXEL_FONT,
    fontSize: 10,
    lineHeight: 14,
  },
  // ─── Overlay & Card ───
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    zIndex: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff9ef',
    borderRadius: 0,
    padding: 22,
    borderWidth: 2,
    borderColor: '#543847',
    shadowColor: '#543847',
    shadowOpacity: 0.25,
    shadowRadius: 0,
    shadowOffset: { width: 3, height: 3 },
    elevation: 6,
    zIndex: 21,
  },
  heroPreview: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    overflow: 'hidden',
    backgroundColor: '#e0f4ff',
    borderWidth: 2,
    borderColor: '#543847',
    borderRadius: 0,
  },
  heroPlaneWrap: {
    marginTop: 4,
    transform: [{ rotate: '-6deg' }],
  },
  heroCloud: {
    position: 'absolute',
  },
  // ─── Typography ───
  title: {
    textAlign: 'center',
    color: '#543847',
    fontFamily: PIXEL_FONT,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: 2,
    marginBottom: 6,
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b5562',
    fontFamily: PIXEL_FONT,
    marginBottom: 16,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1,
  },
  // ─── Language buttons ───
  languageRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignSelf: 'flex-start',
    width: '100%',
    gap: 10,
    marginBottom: 14,
  },
  langButton: {
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#d2b89e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  langButtonActive: {
    backgroundColor: '#f27d26',
    borderColor: '#f7d302',
  },
  langButtonText: {
    fontFamily: PIXEL_FONT,
    fontSize: 14,
    lineHeight: 18,
    color: '#7c6243',
    letterSpacing: 1,
  },
  langButtonTextActive: {
    color: '#fff',
  },
  // ─── Action buttons ───
  primaryButton: {
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#543847',
  },
  orangeButton: {
    backgroundColor: '#f27d26',
  },
  greenButton: {
    backgroundColor: '#4caf50',
  },
  whiteButton: {
    backgroundColor: '#fff',
    borderColor: '#d2b89e',
  },
  primaryButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontFamily: PIXEL_FONT,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: 1,
  },
  secondaryButtonText: {
    textAlign: 'center',
    color: '#543847',
    fontFamily: PIXEL_FONT,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 1,
  },
  hint: {
    textAlign: 'center',
    marginTop: 14,
    color: '#543847',
    opacity: 0.7,
    fontFamily: PIXEL_FONT,
    fontSize: 9,
    lineHeight: 14,
    letterSpacing: 1,
  },
  // ─── Result screen ───
  resultTitle: {
    textAlign: 'center',
    color: '#543847',
    fontFamily: PIXEL_FONT,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1,
    marginBottom: 14,
  },
  scoreBox: {
    backgroundColor: '#fff',
    borderRadius: 0,
    borderWidth: 2,
    borderColor: '#d2b89e',
    padding: 16,
    marginBottom: 14,
  },
  scoreLabel: {
    textAlign: 'center',
    color: '#6b5562',
    fontFamily: PIXEL_FONT,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1,
    marginBottom: 6,
  },
  scoreValue: {
    textAlign: 'center',
    color: '#2e9f4b',
    fontFamily: PIXEL_FONT,
    fontSize: 32,
    lineHeight: 36,
  },
  metaText: {
    textAlign: 'center',
    color: '#543847',
    marginBottom: 8,
    fontFamily: PIXEL_FONT,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 1,
  },
});
