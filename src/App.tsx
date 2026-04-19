/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw } from 'lucide-react';
import { GameState, Language, Cloud, GameMode, LevelConfig } from './types';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  CLOUD_SPEED, 
  CLOUD_GAP, 
  BIRD_SIZE,
  TRANSLATIONS,
  LEVELS 
} from './constants';

export default function App() {
  const getDefaultLanguage = (): Language => {
    if (typeof navigator === 'undefined') return 'en';

    const locale = (navigator.language || '').toLowerCase();
    return locale.startsWith('tr') ? 'tr' : 'en';
  };

  const [gameState, setGameState] = useState<GameState>('START_MENU');
  const [language, setLanguage] = useState<Language>(getDefaultLanguage);
  const [gameMode, setGameMode] = useState<GameMode>('NORMAL');
  const [currentLevel, setCurrentLevel] = useState(0);
  const [score, setScore] = useState(0);
  const [bestProgress, setBestProgress] = useState(() => {
    const saved = localStorage.getItem('uhak_best_progress');

    if (!saved) {
      return { level: 1, score: 0 };
    }

    try {
      const parsed = JSON.parse(saved);
      return {
        level: Number(parsed.level) || 1,
        score: Number(parsed.score) || 0,
      };
    } catch {
      return { level: 1, score: 0 };
    }
  });
  const [freeBestScore, setFreeBestScore] = useState(() => {
    const saved = localStorage.getItem('uhak_free_best_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
  const dimensionsRef = useRef({ width: window.innerWidth, height: window.innerHeight });

  // Game Logic Refs
  const planeY = useRef(window.innerHeight * 0.4);
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

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const localizedDescription = language === 'tr'
      ? 'UHAK - Bulutların Ötesinde, mobil ve masaüstünde çalışan eğlenceli bir uçak arcade oyunu.'
      : 'UHAK - Beyond the Clouds, a fun airplane arcade game for mobile and desktop.';

    document.title = t.title;
    document.documentElement.lang = language;

    const setMetaContent = (selector: string, content: string) => {
      const element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    setMetaContent('meta[name="description"]', localizedDescription);
    setMetaContent('meta[property="og:title"]', t.title);
    setMetaContent('meta[property="og:description"]', localizedDescription);
    setMetaContent('meta[name="twitter:title"]', t.title);
    setMetaContent('meta[name="twitter:description"]', localizedDescription);
  }, [language, t.title]);

  const getFreeModeLevel = useCallback((currentScore: number): LevelConfig => {
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
  }, []);

  const activeLevel = gameMode === 'FREE'
    ? getFreeModeLevel(score)
    : (LEVELS[currentLevel] ?? LEVELS[0]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    activeLevelRef.current = activeLevel;
  }, [activeLevel]);

  const getResponsiveCloudConfig = useCallback(() => {
    const currentDimensions = dimensionsRef.current;
    const viewportScale = Math.max(
      0.72,
      Math.min(1.15, Math.min(currentDimensions.width / 1440, currentDimensions.height / 900) * 1.8)
    );

    const currentLevelConfig = activeLevelRef.current;

    return {
      baseWidth: 72 * viewportScale,
      baseHeight: 104 * viewportScale,
      gap: Math.max(170, Math.min(220, CLOUD_GAP * currentLevelConfig.gapMultiplier * (0.95 + viewportScale * 0.15)))
    };
  }, []);

  const getPlaneX = useCallback(() => {
    const { width } = dimensionsRef.current;
    return Math.max(50, Math.min(140, width * 0.1));
  }, []);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      const nextDimensions = { width: window.innerWidth, height: window.innerHeight };
      dimensionsRef.current = nextDimensions;
      setDimensions(nextDimensions);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = useCallback(() => {
    planeY.current = dimensionsRef.current.height * 0.4;
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
    setCurrentLevel(level => Math.min(level + 1, LEVELS.length - 1));
    setGameState('PLAYING');
  }, []);

  const updateBestProgress = useCallback((level: number, finalScore: number) => {
    setBestProgress(current => {
      const shouldUpdate = level > current.level || (level === current.level && finalScore > current.score);
      const next = shouldUpdate ? { level, score: finalScore } : current;
      localStorage.setItem('uhak_best_progress', JSON.stringify(next));
      return next;
    });
  }, []);

  const updateFreeBestScore = useCallback((finalScore: number) => {
    setFreeBestScore(current => {
      const next = Math.max(current, finalScore);
      localStorage.setItem('uhak_free_best_score', next.toString());
      return next;
    });
  }, []);

  const jump = useCallback(() => {
    if (gameState === 'PLAYING') {
      planeVelocity.current = JUMP_STRENGTH;
    }
  }, [gameState]);

  // Input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (gameState === 'PLAYING') jump();
        else if (gameState === 'LEVEL_COMPLETE') goToNextLevel();
        else if (gameState === 'GAME_OVER' || gameState === 'WIN') startGame(gameMode);
        else startGame('NORMAL');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameMode, gameState, goToNextLevel, jump, startGame]);

  useEffect(() => {
    if (gameState === 'PLAYING') {
      resetGame();
      const loop = (time: number) => {
        update(time);
        draw();
        animationFrameId.current = requestAnimationFrame(loop);
      };
      animationFrameId.current = requestAnimationFrame(loop);
      return () => cancelAnimationFrame(animationFrameId.current);
    }
  }, [gameState, resetGame]);

  useEffect(() => {
    if (gameMode === 'NORMAL' && gameState === 'PLAYING' && !isTransitioning.current && score >= activeLevel.targetScore) {
      handleLevelComplete(score);
    }
  }, [activeLevel.targetScore, gameMode, gameState, score]);

  const update = (time: number) => {
    if (isTransitioning.current) return;

    const currentLevelConfig = activeLevelRef.current;
    const currentDimensions = dimensionsRef.current;
    const { gap: responsiveCloudGap } = getResponsiveCloudConfig();
    const deltaTime = lastFrameTime.current === null ? 1000 / 60 : Math.min(time - lastFrameTime.current, 34);
    const frameScale = deltaTime / (1000 / 60);
    lastFrameTime.current = time;

    // Plane physics
    planeVelocity.current += GRAVITY * frameScale;
    planeY.current += planeVelocity.current * frameScale;

    // Ground/Ceiling collision
    if (planeY.current + BIRD_SIZE / 2 > currentDimensions.height * 0.85 || planeY.current - BIRD_SIZE / 2 < 0) {
      handleGameOver();
    }

    // Cloud spawning
    if (time - lastCloudSpawnTime.current > currentLevelConfig.spawnInterval) {
      spawnCloud();
      lastCloudSpawnTime.current = time;
    }

    // Cloud movement and collision
    clouds.current = clouds.current.filter(cloud => {
      cloud.x -= CLOUD_SPEED * currentLevelConfig.speedMultiplier * frameScale;

      const planeRect = getPlaneRect();
      const cloudWidth = cloud.width * 1.5;
      const cloudHeight = cloud.height;
      const topCloudY = cloud.y - responsiveCloudGap / 2 - cloudHeight;
      const bottomCloudY = cloud.y + responsiveCloudGap / 2;
      const cloudRects = [
        ...getCloudCollisionRects(cloud.x, topCloudY, cloudWidth, cloudHeight),
        ...getCloudCollisionRects(cloud.x, bottomCloudY, cloudWidth, cloudHeight)
      ];

      if (cloudRects.some(cloudRect => rectIntersect(planeRect, cloudRect))) {
        handleGameOver();
      }

      // Scoring
      if (!cloud.passed && cloud.x + cloudWidth < getPlaneX()) {
        cloud.passed = true;
        setScore(currentScore => currentScore + 1);
      }

      return cloud.x + cloudWidth > 0;
    });
  };

  type Rect = {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };

  type Puff = {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
  };

  const getPlaneRect = (): Rect => {
    const planeX = getPlaneX();

    return {
      left: planeX - BIRD_SIZE * 0.8,
      right: planeX + BIRD_SIZE * 0.9,
      top: planeY.current - BIRD_SIZE * 0.32,
      bottom: planeY.current + BIRD_SIZE * 0.32
    };
  };

  const getCloudPuffs = (x: number, y: number, w: number, h: number): Puff[] => ([
    { cx: x + w * 0.15, cy: y + h * 0.5, rx: h * 0.45, ry: h * 0.35 },
    { cx: x + w * 0.4, cy: y + h * 0.4, rx: h * 0.6, ry: h * 0.45 },
    { cx: x + w * 0.65, cy: y + h * 0.5, rx: h * 0.55, ry: h * 0.4 },
    { cx: x + w * 0.85, cy: y + h * 0.6, rx: h * 0.4, ry: h * 0.3 },
    { cx: x + w * 0.3, cy: y + h * 0.7, rx: h * 0.4, ry: h * 0.3 }
  ]);

  const getCloudCollisionRects = (x: number, y: number, w: number, h: number): Rect[] => {
    const hitboxInset = 10;

    return getCloudPuffs(x, y, w, h).map(({ cx, cy, rx, ry }) => ({
      left: cx - rx + hitboxInset,
      right: cx + rx - hitboxInset,
      top: cy - ry + hitboxInset,
      bottom: cy + ry - hitboxInset
    }));
  };

  const rectIntersect = (r1: Rect, r2: Rect) => {
    return !(r2.left > r1.right || 
             r2.right < r1.left || 
             r2.top > r1.bottom ||
             r2.bottom < r1.top);
  };

  const spawnCloud = () => {
    const currentLevelConfig = activeLevelRef.current;
    const { baseWidth, baseHeight, gap } = getResponsiveCloudConfig();
    const scale = 0.7 + Math.random() * 0.6;
    const cloudWidth = baseWidth * scale;
    const cloudHeight = baseHeight * scale;
    const groundTop = dimensionsRef.current.height * 0.85;
    const ceilingPadding = Math.max(20, cloudHeight * 0.2);
    const groundPadding = Math.max(24, cloudHeight * 0.3);
    const minY = gap / 2 + ceilingPadding;
    const maxY = Math.max(minY + 10, groundTop - gap / 2 - groundPadding);
    const centerY = (minY + maxY) / 2;
    const previousY = lastSpawnY.current ?? centerY;
    const range = maxY - minY;
    const pattern = currentLevelConfig.patterns[Math.floor(Math.random() * currentLevelConfig.patterns.length)];

    let y = centerY;

    switch (pattern) {
      case 'steady':
        y = previousY + (Math.random() - 0.5) * range * 0.18;
        break;
      case 'gentleRise':
        y = previousY - range * 0.14 + (Math.random() - 0.5) * range * 0.08;
        break;
      case 'gentleDip':
        y = previousY + range * 0.14 + (Math.random() - 0.5) * range * 0.08;
        break;
      case 'zigzag':
        y = previousY < centerY ? previousY + range * 0.24 : previousY - range * 0.24;
        break;
    }

    y = Math.max(minY, Math.min(maxY, y));
    lastSpawnY.current = y;

    clouds.current.push({
      id: Date.now(),
      x: dimensionsRef.current.width,
      y,
      width: cloudWidth,
      height: cloudHeight,
      passed: false
    });
  };

  const handleLevelComplete = (finalScore: number) => {
    if (isTransitioning.current) return;

    isTransitioning.current = true;
    updateBestProgress(activeLevel.id, finalScore);

    if (currentLevel >= LEVELS.length - 1) {
      setGameState('WIN');
      return;
    }

    setGameState('LEVEL_COMPLETE');
  };

  const handleGameOver = () => {
    if (isTransitioning.current) return;

    isTransitioning.current = true;
    setGameState('GAME_OVER');

    if (gameMode === 'FREE') {
      updateFreeBestScore(scoreRef.current);
      return;
    }

    updateBestProgress(activeLevel.id, scoreRef.current);
  };

  const draw = () => {
    const { gap: responsiveCloudGap } = getResponsiveCloudConfig();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const currentDimensions = dimensionsRef.current;

    ctx.clearRect(0, 0, currentDimensions.width, currentDimensions.height);
    drawSkyBackdrop(ctx, currentDimensions.width, currentDimensions.height);
    drawGroundBackdrop(ctx, currentDimensions.width, currentDimensions.height);

    // Draw Obstacles
    clouds.current.forEach(cloud => {
      drawPuffyCloud(ctx, cloud.x, cloud.y - responsiveCloudGap / 2 - cloud.height, cloud.width * 1.5, cloud.height, true);
      drawPuffyCloud(ctx, cloud.x, cloud.y + responsiveCloudGap / 2, cloud.width * 1.5, cloud.height, false);
    });

    // Draw Plane (Match THY Image)
    drawTHYPlane(ctx, getPlaneX(), planeY.current);
  };

  const drawSkyBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const horizonY = height * 0.85;
    const skyGradient = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGradient.addColorStop(0, '#BDEFFF');
    skyGradient.addColorStop(0.28, '#8FE0FF');
    skyGradient.addColorStop(0.6, '#63CBEF');
    skyGradient.addColorStop(1, '#3FA8D4');

    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, width, horizonY);

    const sunSize = Math.max(40, Math.min(68, width * 0.06));
    const sunX = width * 0.76;
    const sunY = height * 0.11;
    const sunRadius = sunSize / 2;

    ctx.fillStyle = 'rgba(255,248,201,0.25)';
    ctx.beginPath();
    ctx.arc(sunX + sunRadius, sunY + sunRadius, sunRadius + 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F7D302';
    ctx.beginPath();
    ctx.arc(sunX + sunRadius, sunY + sunRadius, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    const softClouds = [
      { x: width * 0.12, y: height * 0.16, w: 86, h: 20 },
      { x: width * 0.42, y: height * 0.22, w: 68, h: 16 },
      { x: width * 0.7, y: height * 0.17, w: 78, h: 18 }
    ];

    softClouds.forEach(({ x, y, w, h }) => {
      ctx.fillStyle = 'rgba(255,255,255,0.32)';
      ctx.fillRect(x, y, w, h);
      ctx.fillRect(x + 10, y - 6, w * 0.55, h);
    });
  };

  const drawGroundBackdrop = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const groundTop = height * 0.85;
    const groundHeight = height - groundTop;

    const seaGradient = ctx.createLinearGradient(0, groundTop, 0, height);
    seaGradient.addColorStop(0, '#3FAFD8');
    seaGradient.addColorStop(0.45, '#2B93BF');
    seaGradient.addColorStop(1, '#17698F');

    ctx.fillStyle = seaGradient;
    ctx.fillRect(0, groundTop, width, groundHeight);

    ctx.fillStyle = 'rgba(255,255,255,0.34)';
    for (let y = groundTop + 10; y < height - 8; y += 14) {
      for (let x = ((y * 7) % 40); x < width; x += 54) {
        ctx.fillRect(x, y, 16, 3);
        if ((x / 54) % 2 === 0) {
          ctx.fillRect(x + 20, y + 5, 10, 2);
        }
      }
    }

    ctx.fillStyle = '#E8D8A8';
    ctx.fillRect(0, groundTop, width, 5);
  };

  const drawPuffyCloud = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, isTop: boolean) => {
    ctx.save();
    ctx.fillStyle = '#cbd5e1';
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 3;
    
    const drawPuff = (cx: number, cy: number, rx: number, ry: number) => {
      ctx.beginPath();
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.4, cy + ry * 0.2);
      ctx.quadraticCurveTo(cx, cy + ry * 0.5, cx + rx * 0.4, cy + ry * 0.2);
      ctx.strokeStyle = '#94a3b8';
      ctx.stroke();
      ctx.strokeStyle = '#543847';
    };

    getCloudPuffs(x, y, w, h).forEach(({ cx, cy, rx, ry }) => drawPuff(cx, cy, rx, ry));

    ctx.restore();
  };

  const drawTHYPlane = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save();
    ctx.translate(x, y);

    const rotation = Math.min(Math.PI / 9, Math.max(-Math.PI / 9, planeVelocity.current * 0.03));
    ctx.rotate(rotation);

    const w = BIRD_SIZE * 1.95;
    const h = BIRD_SIZE * 0.72;

    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 3.5;

    // Menu-style white body
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.roundRect(-w * 0.5, -h * 0.4, w, h * 0.8, h * 0.4);
    ctx.fill();
    ctx.stroke();

    // Cockpit on the top-right
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(w * 0.17, -h * 0.16, w * 0.16, h * 0.3, 4);
    ctx.fill();

    // Red tail matching menu preview
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -h * 0.08);
    ctx.lineTo(-w * 0.42, -h * 1.02);
    ctx.lineTo(-w * 0.14, -h * 1.02);
    ctx.lineTo(-w * 0.06, -h * 0.08);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Main red wing under the body
    ctx.beginPath();
    ctx.ellipse(0, h * 0.48, w * 0.18, h * 0.22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none" onPointerDown={jump}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 z-0"
      />

      <AnimatePresence>
        {gameState === 'START_MENU' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_rgba(78,192,202,0.28),_rgba(242,125,38,0.18))] backdrop-blur-sm"
          >
            <div className="vibrant-card p-6 md:p-10 text-center max-w-lg w-full">
              {/* Plane Preview (Replaced bird/duck) */}
              <div className="flex justify-center mb-10 overflow-visible">
                <motion.div 
                  animate={{ y: [-15, 15, -15], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                  className="relative w-32 h-12"
                >
                  {/* Plane Body */}
                  <div className="absolute inset-0 bg-white border-4 border-[#543847] rounded-full" />
                  {/* Cockpit */}
                  <div className="absolute top-2 right-4 w-6 h-4 bg-[#1e293b] rounded-md" />
                  {/* Red Tail */}
                  <div className="absolute top-[-20px] left-2 w-8 h-10 bg-[#ef4444] border-4 border-[#543847] rounded-tr-lg transform -skew-x-12" />
                  {/* Plane Wing */}
                  <div className="absolute bottom-[-10px] left-10 w-12 h-6 bg-[#ef4444] border-4 border-[#543847] rounded-full" />
                </motion.div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-8 tracking-tight uppercase leading-[1.05] vibrant-title md:-rotate-2 break-words px-2 sm:px-4">
                {t.title}
              </h1>
              
              <div className="flex gap-3 justify-center mb-6 flex-wrap">
                <button
                  onClick={(e) => { e.stopPropagation(); setLanguage('tr'); }}
                  className={`ui-pill min-w-18 px-5 py-2 font-bold transition-all border-4 text-sm sm:text-base ${language === 'tr' ? 'border-[#F7D302] bg-[#F27D26] text-white' : 'border-[#543847]/10 bg-[#fff7d6] text-[#8b6b46]'}`}
                >
                  TR
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
                  className={`ui-pill min-w-18 px-5 py-2 font-bold transition-all border-4 text-sm sm:text-base ${language === 'en' ? 'border-[#F7D302] bg-[#F27D26] text-white' : 'border-[#543847]/10 bg-[#fff7d6] text-[#8b6b46]'}`}
                >
                  EN
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={(e) => { e.stopPropagation(); startGame('NORMAL'); }}
                  className="ui-pill w-full min-h-14 sm:min-h-16 px-4 py-4 bg-gradient-to-r from-[#F27D26] to-[#F7D302] text-[#543847] font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wide leading-none vibrant-btn-shadow hover:scale-[1.02] transition-transform active:scale-95 border-4 border-[#543847]"
                >
                  {t.normalMode}
                </button>

                <button
                  onClick={(e) => { e.stopPropagation(); startGame('FREE'); }}
                  className="ui-pill w-full min-h-14 sm:min-h-16 px-4 py-4 bg-gradient-to-r from-[#4EC0CA] to-[#73BF2E] text-white font-black text-lg sm:text-xl md:text-2xl uppercase tracking-wide leading-none vibrant-btn-shadow hover:scale-[1.02] transition-transform active:scale-95 border-4 border-[#543847]"
                >
                  {t.freeMode}
                </button>
              </div>

              <p className="mt-6 text-[#543847] font-bold opacity-60">
                SPACE | TAP
              </p>
            </div>
          </motion.div>
        )}

        {(gameState === 'GAME_OVER' || gameState === 'LEVEL_COMPLETE' || gameState === 'WIN') && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 z-10 bg-black/30 backdrop-blur-md"
          >
            <div className="vibrant-card p-6 sm:p-8 md:p-10 text-center max-w-sm w-full">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 border-4 border-[#543847] rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 shadow-xl ${gameState === 'GAME_OVER' ? 'bg-[#F7D302]' : 'bg-[#73BF2E]'}`}>
                <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-[#543847]" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#543847] mb-3 sm:mb-4 uppercase leading-tight">
                {gameState === 'GAME_OVER' ? t.gameOver : gameState === 'LEVEL_COMPLETE' ? t.levelComplete : t.win}
              </h2>

              {gameState === 'LEVEL_COMPLETE' && (
                <p className="text-[#543847] font-semibold opacity-80 mb-5 sm:mb-6 text-sm sm:text-base">
                  Hedef skora ulaştın. Yeni seviyeye hazırsın.
                </p>
              )}

              <div className="space-y-4 sm:space-y-5 mb-8 sm:mb-10">
                <div className="bg-gray-50 p-4 rounded-2xl border-4 border-[#543847]/10">
                  <p className="text-[#543847] text-xs sm:text-sm uppercase font-black opacity-40">{t.score}</p>
                  <p className="text-4xl sm:text-5xl md:text-6xl font-black text-[#73BF2E]">{score}</p>
                </div>
                <div className="flex justify-between items-center px-2 sm:px-4 gap-4">
                  <p className="text-[#543847] text-xs sm:text-sm uppercase font-black opacity-40">{t.level}</p>
                  <p className="text-xl sm:text-2xl font-black text-[#543847]">{gameMode === 'FREE' ? '∞' : activeLevel.id}</p>
                </div>
                <div className="flex justify-between items-center px-2 sm:px-4 gap-4">
                  <p className="text-[#543847] text-xs sm:text-sm uppercase font-black opacity-40">
                    {gameMode === 'FREE' ? t.bestFreeScore : t.bestScore}
                  </p>
                  <p className="text-right text-sm sm:text-lg font-black text-[#543847]">
                    {gameMode === 'FREE'
                      ? freeBestScore
                      : `${bestProgress.level}. ${t.level} • ${bestProgress.score}`}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (gameState === 'LEVEL_COMPLETE') goToNextLevel();
                    else startGame(gameMode);
                  }}
                  className="ui-pill-btn w-full px-4 py-4 bg-gradient-to-r from-[#73BF2E] to-[#4EC0CA] text-white font-black text-base sm:text-xl uppercase tracking-wide leading-none vibrant-btn-shadow hover:scale-[1.02] transition-transform active:scale-95 border-4 border-[#543847]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={3} />
                    {gameState === 'LEVEL_COMPLETE' ? t.nextLevel : t.restart}
                  </div>
                </button>

                {gameState === 'GAME_OVER' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      returnToMenu();
                    }}
                    className="ui-pill-btn w-full px-4 py-4 bg-white text-[#543847] font-black text-sm sm:text-base uppercase tracking-wide leading-none border-4 border-[#543847] hover:scale-[1.02] transition-transform active:scale-95"
                  >
                    {t.backToMenu}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(gameState === 'PLAYING') && (
        <div className="absolute top-4 sm:top-6 left-0 w-full flex justify-center pointer-events-none z-10 px-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="ui-pill-badge bg-white border-4 border-[#543847] px-4 sm:px-5 py-2 shadow-[0_6px_0_rgba(0,0,0,0.1)]"
            >
              <span className="text-sm sm:text-lg font-black text-[#543847] whitespace-nowrap">
                {gameMode === 'FREE' ? `∞ ${t.freeMode}` : `${t.level} ${activeLevel.id}`}
              </span>
            </motion.div>
            <motion.div 
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="ui-pill-badge bg-white border-4 border-[#543847] px-4 sm:px-6 py-2 shadow-[0_6px_0_rgba(0,0,0,0.1)]"
            >
              <span className="text-2xl sm:text-3xl font-black text-[#73BF2E] vibrant-title">{score}</span>
              {gameMode !== 'FREE' && (
                <span className="ml-2 text-xs sm:text-sm font-black text-[#543847] opacity-70 whitespace-nowrap">/ {activeLevel.targetScore}</span>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
