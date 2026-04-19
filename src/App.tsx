/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, Play, Languages } from 'lucide-react';
import { GameState, Language, Cloud } from './types';
import { 
  GRAVITY, 
  JUMP_STRENGTH, 
  CLOUD_SPEED, 
  CLOUD_SPAWN_INTERVAL, 
  CLOUD_GAP, 
  BIRD_SIZE,
  TRANSLATIONS 
} from './constants';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START_MENU');
  const [language, setLanguage] = useState<Language>('tr');
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(() => {
    const saved = localStorage.getItem('uhak_best_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Game Logic Refs
  const planeY = useRef(window.innerHeight * 0.4);
  const planeVelocity = useRef(0);
  const clouds = useRef<Cloud[]>([]);
  const lastCloudSpawnTime = useRef(0);
  const animationFrameId = useRef<number>(0);

  const t = TRANSLATIONS[language];

  const getResponsiveCloudConfig = useCallback(() => {
    const viewportScale = Math.max(
      0.72,
      Math.min(1.15, Math.min(dimensions.width / 1440, dimensions.height / 900) * 1.8)
    );

    return {
      baseWidth: 72 * viewportScale,
      baseHeight: 104 * viewportScale,
      gap: Math.max(170, Math.min(220, CLOUD_GAP * (0.95 + viewportScale * 0.15)))
    };
  }, [dimensions.height, dimensions.width]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = useCallback(() => {
    planeY.current = dimensions.height * 0.4;
    planeVelocity.current = 0;
    clouds.current = [];
    lastCloudSpawnTime.current = 0;
    setScore(0);
  }, [dimensions.height]);

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
        else if (gameState === 'START_MENU') setGameState('PLAYING');
        else if (gameState === 'GAME_OVER') setGameState('PLAYING');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, jump]);

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
  }, [gameState, dimensions, resetGame]);

  const update = (time: number) => {
    const { gap: responsiveCloudGap } = getResponsiveCloudConfig();

    // Plane physics
    planeVelocity.current += GRAVITY;
    planeY.current += planeVelocity.current;

    // Ground/Ceiling collision
    if (planeY.current + BIRD_SIZE / 2 > dimensions.height * 0.85 || planeY.current - BIRD_SIZE / 2 < 0) {
      handleGameOver();
    }

    // Cloud spawning
    if (time - lastCloudSpawnTime.current > CLOUD_SPAWN_INTERVAL) {
      spawnCloud();
      lastCloudSpawnTime.current = time;
    }

    // Cloud movement and collision
    clouds.current = clouds.current.filter(cloud => {
      cloud.x -= CLOUD_SPEED;

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
      if (!cloud.passed && cloud.x + cloudWidth < 50) {
        cloud.passed = true;
        setScore(s => s + 1);
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

  const getPlaneRect = (): Rect => ({
    left: 50 - BIRD_SIZE * 0.8,
    right: 50 + BIRD_SIZE * 0.9,
    top: planeY.current - BIRD_SIZE * 0.32,
    bottom: planeY.current + BIRD_SIZE * 0.32
  });

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
    const { baseWidth, baseHeight, gap } = getResponsiveCloudConfig();
    const scale = 0.7 + Math.random() * 0.6; // %70 - %130
    const cloudWidth = baseWidth * scale;
    const cloudHeight = baseHeight * scale;
    const groundTop = dimensions.height * 0.85;
    const ceilingPadding = Math.max(20, cloudHeight * 0.2);
    const groundPadding = Math.max(24, cloudHeight * 0.3);
    const minY = gap / 2 + ceilingPadding;
    const maxY = Math.max(minY + 10, groundTop - gap / 2 - groundPadding);
    const y = Math.random() * (maxY - minY) + minY;

    clouds.current.push({
      id: Date.now(),
      x: dimensions.width,
      y,
      width: cloudWidth,
      height: cloudHeight,
      passed: false
    });
  };

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    setBestScore(current => {
      const newBest = Math.max(current, score);
      localStorage.setItem('uhak_best_score', newBest.toString());
      return newBest;
    });
  };

  const draw = () => {
    const { gap: responsiveCloudGap } = getResponsiveCloudConfig();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Draw Sky Background (Keep Vibrant Sky)
    ctx.fillStyle = '#4EC0CA';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw Ground (Vibrant theme ground)
    ctx.fillStyle = '#ded895';
    ctx.fillRect(0, dimensions.height * 0.85, dimensions.width, dimensions.height * 0.15);

    // Draw Obstacles
    clouds.current.forEach(cloud => {
      drawPuffyCloud(ctx, cloud.x, cloud.y - responsiveCloudGap / 2 - cloud.height, cloud.width * 1.5, cloud.height, true);
      drawPuffyCloud(ctx, cloud.x, cloud.y + responsiveCloudGap / 2, cloud.width * 1.5, cloud.height, false);
    });

    // Draw Plane (Match THY Image)
    drawTHYPlane(ctx, 50, planeY.current);
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
    
    // Rotation based on velocity
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, planeVelocity.current * 0.05));
    ctx.rotate(rotation);

    const w = BIRD_SIZE * 2;
    const h = BIRD_SIZE * 0.7;

    // Cockpit & Main Body (White/Silver)
    ctx.fillStyle = 'white';
    ctx.strokeStyle = '#543847';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Red Tail
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, -h * 0.1);
    ctx.lineTo(-w * 0.4, -h * 0.8);
    ctx.lineTo(-w * 0.1, -h * 0.8);
    ctx.lineTo(-w * 0.1, -h * 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Tail Logo (Crescent shape)
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(-w * 0.25, -h * 0.6, 6, 0.2, Math.PI * 1.8);
    ctx.fill();

    // Main Wings (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(w * 0.1, 0);
    ctx.lineTo(-w * 0.2, h * 0.8);
    ctx.lineTo(w * 0.2, h * 0.8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Small Rear Wing (Red)
    ctx.beginPath();
    ctx.moveTo(-w * 0.2, h * 0.2);
    ctx.lineTo(-w * 0.4, h * 0.5);
    ctx.lineTo(-w * 0.2, h * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Engine under wing
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(w * 0.05, h * 0.7, 10, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cockpit Window (Black)
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, -h * 0.2);
    ctx.lineTo(w * 0.45, -h * 0.2);
    ctx.lineTo(w * 0.42, 0);
    ctx.lineTo(w * 0.25, 0);
    ctx.closePath();
    ctx.fill();

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
            className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-black/10 backdrop-blur-sm"
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

              <h1 className="text-4xl md:text-5xl font-black mb-10 tracking-tighter uppercase leading-tight italic vibrant-title transform -rotate-2 break-words px-4">
                {t.title}
              </h1>
              
              <div className="flex gap-4 justify-center mb-8">
                <button
                  onClick={(e) => { e.stopPropagation(); setLanguage('tr'); }}
                  className={`px-6 py-2 rounded-2xl font-bold transition-all border-4 ${language === 'tr' ? 'border-[#F7D302] bg-[#F27D26] text-white shadow-[0_6px_0_rgba(84,56,71,0.25)]' : 'border-[#543847]/10 bg-[#fff7d6] text-[#8b6b46]'}`}
                >
                  TR
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setLanguage('en'); }}
                  className={`px-6 py-2 rounded-2xl font-bold transition-all border-4 ${language === 'en' ? 'border-[#F7D302] bg-[#F27D26] text-white shadow-[0_6px_0_rgba(84,56,71,0.25)]' : 'border-[#543847]/10 bg-[#fff7d6] text-[#8b6b46]'}`}
                >
                  EN
                </button>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setGameState('PLAYING'); }}
                className="w-full py-5 bg-gradient-to-r from-[#F27D26] to-[#F7D302] text-[#543847] rounded-3xl font-black text-2xl uppercase tracking-wider vibrant-btn-shadow hover:scale-105 transition-transform active:scale-95 border-4 border-[#543847]"
              >
                {t.start}
              </button>
              
              <p className="mt-8 text-[#543847] font-bold opacity-60">
                SPACE | TAP
              </p>
            </div>
          </motion.div>
        )}

        {gameState === 'GAME_OVER' && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 flex items-center justify-center p-6 z-10 bg-black/30 backdrop-blur-md"
          >
            <div className="vibrant-card p-10 text-center max-w-sm w-full">
              <div className="w-24 h-24 bg-[#F7D302] border-4 border-[#543847] rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl">
                <Trophy className="w-12 h-12 text-[#543847]" />
              </div>
              
              <h2 className="text-4xl font-black text-[#543847] mb-6 uppercase italic">{t.gameOver}</h2>
              <div className="space-y-6 mb-10">
                <div className="bg-gray-50 p-4 rounded-2xl border-4 border-[#543847]/10">
                  <p className="text-[#543847] text-sm uppercase font-black opacity-40">{t.score}</p>
                  <p className="text-6xl font-black text-[#73BF2E]">{score}</p>
                </div>
                <div className="flex justify-between items-center px-4">
                  <p className="text-[#543847] text-sm uppercase font-black opacity-40">{t.bestScore}</p>
                  <p className="text-2xl font-black text-[#543847]">{bestScore}</p>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); setGameState('PLAYING'); }}
                className="w-full py-5 bg-gradient-to-r from-[#73BF2E] to-[#4EC0CA] text-white rounded-3xl font-black text-2xl uppercase tracking-wider vibrant-btn-shadow hover:scale-105 transition-transform active:scale-95 border-4 border-[#543847]"
              >
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="w-8 h-8" strokeWidth={3} />
                  {t.restart}
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(gameState === 'PLAYING') && (
        <div className="absolute top-10 left-0 w-full flex justify-center pointer-events-none z-10">
          <motion.div 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border-4 border-[#543847] px-8 py-3 rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)]"
          >
            <span className="text-5xl font-black text-[#73BF2E] vibrant-title">{score}</span>
          </motion.div>
        </div>
      )}
    </div>
  );
}
