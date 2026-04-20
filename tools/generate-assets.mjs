/**
 * Generates high-quality app icons and splash images using @napi-rs/canvas.
 * Matches the in-game plane design and color palette.
 *
 * Usage: node tools/generate-assets.mjs
 */

import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = join(__dirname, '..', 'assets');

// ─── Game Color Palette ───
const COLORS = {
  skyTop: '#bdefff',
  skyBottom: '#5ec4d6',
  sun: '#f7d302',
  sunGlow: 'rgba(255,248,201,0.35)',
  planeBody: '#ffffff',
  planeTail: '#ef4444',
  planeWing: '#ef4444',
  planeCockpit: '#60a5fa',
  planeCockpitDark: '#1e293b',
  border: '#543847',
  planeHighlight: '#e8e8e8',
  planeDarkRed: '#dc2626',
  planeEngine: '#94a3b8',
  cloudFill: 'rgba(255,255,255,0.85)',
  cloudStroke: 'rgba(84,56,71,0.15)',
  ground: '#2b93bf',
  groundEdge: '#e8d8a8',
  accent: '#f27d26',
};

// ─── Drawing Helpers ───

function drawSkyGradient(ctx, w, h) {
  // Pixel art banded sky — matches in-game PixelSky
  const bands = [
    { ratio: 0.12, color: '#b0eaff' },
    { ratio: 0.18, color: '#a2e5ff' },
    { ratio: 0.22, color: '#8fe0ff' },
    { ratio: 0.22, color: '#86dbfd' },
    { ratio: 0.14, color: '#7cd5fa' },
    { ratio: 0.12, color: '#72cff5' },
  ];
  let top = 0;
  for (const b of bands) {
    const bh = Math.round(b.ratio * h);
    ctx.fillStyle = b.color;
    ctx.fillRect(0, top, w, bh + 1);
    top += bh;
  }
}

function drawSun(ctx, x, y, radius) {
  // 12x12 pixel art sun — matches in-game PixelSun
  const px = radius / 6;
  const grid = [
    [0,0,0,0,0,2,2,0,0,0,0,0],
    [0,0,2,0,0,2,2,0,0,2,0,0],
    [0,2,0,0,1,1,1,1,0,0,2,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,0,1,1,3,3,1,1,1,1,0,0],
    [2,2,1,1,3,3,1,1,1,1,2,2],
    [2,2,1,1,1,1,1,1,1,1,2,2],
    [0,0,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,1,1,1,1,1,1,0,0,0],
    [0,2,0,0,1,1,1,1,0,0,2,0],
    [0,0,2,0,0,2,2,0,0,2,0,0],
    [0,0,0,0,0,2,2,0,0,0,0,0],
  ];
  const colors = { 1: '#f7d302', 2: '#fde68a', 3: '#fffde7' };
  const ox = x - 6 * px;
  const oy = y - 6 * px;
  for (let ry = 0; ry < 12; ry++) {
    for (let cx2 = 0; cx2 < 12; cx2++) {
      const cell = grid[ry][cx2];
      if (cell > 0) {
        ctx.fillStyle = colors[cell];
        ctx.fillRect(ox + cx2 * px, oy + ry * px, px + 0.5, px + 0.5);
      }
    }
  }
}

function drawCloud(ctx, x, y, w, h, opacity = 0.85) {
  // 10x5 pixel art cloud — matches in-game PixelBgCloud
  ctx.save();
  ctx.globalAlpha = opacity;
  const px_w = w / 10;
  const px_h = h / 5;
  const grid = [
    [0,0,0,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,2,1,1,1,1,1,0],
    [1,1,1,2,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
  ];
  const colors = { 1: '#ffffff', 2: '#f0f4ff' };
  for (let ry = 0; ry < 5; ry++) {
    for (let cx2 = 0; cx2 < 10; cx2++) {
      const cell = grid[ry][cx2];
      if (cell > 0) {
        ctx.fillStyle = colors[cell];
        ctx.fillRect(x + cx2 * px_w, y + ry * px_h, px_w + 0.5, px_h + 0.5);
      }
    }
  }
  ctx.restore();
}

function drawPlane(ctx, cx, cy, size, rotation = -10) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotation * Math.PI) / 180);

  // 20x9 pixel art plane — matches in-game PlaneSprite grid exactly
  const gridW = 20;
  const gridH = 9;
  const px = size / 4.5; // pixel unit
  const totalW = px * gridW;
  const totalH = px * gridH;

  // 0=empty 1=white body 2=red 3=cockpit glass 4=border 5=light gray 6=dark red 7=engine
  const grid = [
    [0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,4,2,2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,4,6,2,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0],
    [0,4,6,2,1,1,5,1,1,1,1,1,1,1,1,3,3,4,0,0],
    [4,7,4,1,1,1,1,1,1,1,1,1,1,1,1,3,3,4,4,0],
    [4,7,4,1,1,2,2,2,2,1,1,1,1,1,1,5,1,1,4,4],
    [0,4,4,4,4,6,2,2,6,4,4,4,4,4,4,4,4,4,4,0],
    [0,0,0,0,0,4,6,6,4,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  const colors = {
    1: COLORS.planeBody,
    2: COLORS.planeTail,
    3: COLORS.planeCockpit,
    4: COLORS.border,
    5: COLORS.planeHighlight,
    6: COLORS.planeDarkRed,
    7: COLORS.planeEngine,
  };

  const startX = -totalW / 2;
  const startY = -totalH / 2;

  for (let ry = 0; ry < gridH; ry++) {
    for (let cx2 = 0; cx2 < gridW; cx2++) {
      const cell = grid[ry][cx2];
      if (cell > 0) {
        ctx.fillStyle = colors[cell];
        ctx.fillRect(startX + cx2 * px, startY + ry * px, px + 0.5, px + 0.5);
      }
    }
  }

  ctx.restore();
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMountains(ctx, w, groundY) {
  // Matches in-game softer background mountain palette/style
  const mtnH = Math.round(groundY * 0.075);
  const peakCount = 5;
  const segW = w / peakCount;
  const colors = ['#85a7b6', '#7b9baa', '#7190a0'];
  const snowColor = '#dcecf5';

  for (let i = 0; i < peakCount; i++) {
    const peakX = segW * i + segW * 0.5;
    const baseY = groundY;
    const peakScale = [0.42, 0.62, 0.5, 0.58, 0.46][i] ?? 0.45;
    const topY = groundY - mtnH * peakScale;
    const halfW = segW * (i % 2 === 0 ? 0.7 : 0.82);

    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(peakX - halfW, baseY);
    ctx.lineTo(peakX, topY);
    ctx.lineTo(peakX + halfW, baseY);
    ctx.closePath();
    ctx.fill();

    if (peakScale > 0.5) {
      const snowH = Math.max(2, (baseY - topY) * 0.12);
      ctx.fillStyle = snowColor;
      ctx.beginPath();
      ctx.moveTo(peakX - halfW * 0.15, topY + snowH);
      ctx.lineTo(peakX, topY);
      ctx.lineTo(peakX + halfW * 0.15, topY + snowH);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function drawGround(ctx, w, h, groundY) {
  // Mountains
  drawMountains(ctx, w, groundY);

  // Ground edge (sand)
  ctx.fillStyle = COLORS.groundEdge;
  ctx.fillRect(0, groundY - 2, w, 5);

  // Sea — flat banded pixel art
  const seaH = h - groundY;
  const bands = [
    { ratio: 0.35, color: '#2b93bf' },
    { ratio: 0.35, color: '#2589b3' },
    { ratio: 0.30, color: '#1f7fa7' },
  ];
  let top = groundY;
  for (const b of bands) {
    const bh = Math.round(b.ratio * seaH);
    ctx.fillStyle = b.color;
    ctx.fillRect(0, top, w, bh + 1);
    top += bh;
  }
}

function drawIconBackground(ctx, w, h, cornerRadius = 0) {
  if (cornerRadius > 0) {
    ctx.beginPath();
    drawRoundedRect(ctx, 0, 0, w, h, cornerRadius);
    ctx.clip();
  }
  drawSkyGradient(ctx, w, h);
  drawGround(ctx, w, h, h * 0.82);
}

// ─── Icon Generation (1024x1024) ───

function generateIcon(size = 1024) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background with rounded corners feel
  drawIconBackground(ctx, size, size, size * 0.18);

  // Sun
  drawSun(ctx, size * 0.78, size * 0.15, size * 0.065);

  // Background clouds
  drawCloud(ctx, size * 0.03, size * 0.12, size * 0.25, size * 0.08, 0.5);
  drawCloud(ctx, size * 0.55, size * 0.06, size * 0.2, size * 0.06, 0.4);
  drawCloud(ctx, size * 0.05, size * 0.55, size * 0.18, size * 0.06, 0.3);
  drawCloud(ctx, size * 0.72, size * 0.5, size * 0.22, size * 0.07, 0.35);

  // Main plane (centered, slightly tilted up)
  drawPlane(ctx, size * 0.5, size * 0.42, size * 0.2, -12);

  // Foreground clouds (partially covering bottom)
  drawCloud(ctx, -size * 0.05, size * 0.65, size * 0.35, size * 0.12, 0.7);
  drawCloud(ctx, size * 0.6, size * 0.68, size * 0.45, size * 0.14, 0.65);

  return canvas;
}

// ─── Adaptive Icon Foreground (1024x1024, transparent) ───

function generateAdaptiveIcon(size = 1024) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background - only the plane and some decorative elements
  // Android safe zone is ~66% centered, so plane should fit in that area

  // Small decorative clouds
  drawCloud(ctx, size * 0.08, size * 0.22, size * 0.18, size * 0.06, 0.5);
  drawCloud(ctx, size * 0.7, size * 0.2, size * 0.15, size * 0.05, 0.4);
  drawCloud(ctx, size * 0.1, size * 0.6, size * 0.14, size * 0.05, 0.35);
  drawCloud(ctx, size * 0.72, size * 0.62, size * 0.16, size * 0.05, 0.4);

  // Main plane
  drawPlane(ctx, size * 0.5, size * 0.45, size * 0.18, -10);

  // Small exhaust trail
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 4; i++) {
    const trailX = size * 0.28 - i * size * 0.06;
    const trailY = size * 0.48 + i * size * 0.015;
    const trailR = size * 0.015 + i * size * 0.008;
    ctx.beginPath();
    ctx.arc(trailX, trailY, trailR, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  return canvas;
}

// ─── Favicon (256x256) ───

function generateFavicon(size = 256) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Simple, recognizable at small sizes
  drawIconBackground(ctx, size, size, size * 0.2);

  // Small sun
  drawSun(ctx, size * 0.8, size * 0.15, size * 0.05);

  // One cloud
  drawCloud(ctx, size * 0.05, size * 0.15, size * 0.3, size * 0.1, 0.5);

  // Plane (bigger relative to canvas for recognizability)
  drawPlane(ctx, size * 0.48, size * 0.42, size * 0.22, -10);

  return canvas;
}

// ─── Splash Icon (512x512, centered plane logo) ───

function generateSplashIcon(size = 512) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Transparent background - just the plane as a logo
  // Decorative elements
  drawCloud(ctx, size * 0.02, size * 0.3, size * 0.2, size * 0.07, 0.45);
  drawCloud(ctx, size * 0.75, size * 0.28, size * 0.18, size * 0.06, 0.4);
  drawCloud(ctx, size * 0.15, size * 0.62, size * 0.16, size * 0.05, 0.35);
  drawCloud(ctx, size * 0.68, size * 0.65, size * 0.2, size * 0.06, 0.4);

  // Plane centered
  drawPlane(ctx, size * 0.5, size * 0.46, size * 0.22, -8);

  return canvas;
}

// ─── Save All Assets ───

function saveCanvas(canvas, filename) {
  const buffer = canvas.toBuffer('image/png');
  const path = join(ASSETS_DIR, filename);
  writeFileSync(path, buffer);
  console.log(`  ✓ ${filename} (${canvas.width}x${canvas.height})`);
}

console.log('Generating UHAK game assets...\n');

saveCanvas(generateIcon(), 'icon.png');
saveCanvas(generateAdaptiveIcon(), 'adaptive-icon.png');
saveCanvas(generateFavicon(), 'favicon.png');
saveCanvas(generateSplashIcon(), 'splash-icon.png');

console.log('\nAll assets generated successfully!');
