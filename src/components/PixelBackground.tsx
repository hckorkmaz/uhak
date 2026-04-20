import React, { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const PX = 4; // base pixel size

// ─── Pixel Sky (subtle banded gradient + sparse dither dots) ───

type PixelSkyProps = { width: number; height: number };

export const PixelSky = React.memo(function PixelSky({ width, height }: PixelSkyProps) {
  const bands = [
    { ratio: 0.12, color: '#b0eaff' },
    { ratio: 0.18, color: '#a2e5ff' },
    { ratio: 0.22, color: '#8fe0ff' },
    { ratio: 0.22, color: '#86dbfd' },
    { ratio: 0.14, color: '#7cd5fa' },
    { ratio: 0.12, color: '#72cff5' },
  ];
  let top = 0;
  return (
    <View style={{ position: 'absolute', width, height }}>
      {bands.map((b, i) => {
        const h = Math.round(b.ratio * height);
        const el = (
          <View key={i} style={{ position: 'absolute', left: 0, top, width, height: h + 1, backgroundColor: b.color }} />
        );
        top += h;
        return el;
      })}
    </View>
  );
});

// ─── Pixel Art Sun (small grid, ~60 Views — fine) ───

type PixelSunProps = { size?: number };

export const PixelSun = React.memo(function PixelSun({ size = 48 }: PixelSunProps) {
  const px = size / 12;
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
  const colors: Record<number, string> = { 1: '#f7d302', 2: '#fde68a', 3: '#fffde7' };

  return (
    <View style={{ width: size, height: size }}>
      {grid.flatMap((row, ry) =>
        row.map((cell, cx) =>
          cell > 0 ? (
            <View key={`${ry}-${cx}`} style={{ position: 'absolute', left: cx * px, top: ry * px, width: px, height: px, backgroundColor: colors[cell] }} />
          ) : null,
        ),
      )}
    </View>
  );
});

// ─── Pixel Art Background Cloud (~30 Views — fine) ───

type PixelCloudProps = { width?: number; opacity?: number };

export const PixelBgCloud = React.memo(function PixelBgCloud({ width = 80, opacity = 0.7 }: PixelCloudProps) {
  const px = width / 10;
  const h = px * 5;
  const grid = [
    [0,0,0,1,1,1,0,0,0,0],
    [0,0,1,1,1,1,1,1,0,0],
    [0,1,1,2,1,1,1,1,1,0],
    [1,1,1,2,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,0],
  ];
  const colors: Record<number, string> = { 1: '#ffffff', 2: '#e8f4ff' };

  return (
    <View style={{ width, height: h, opacity }}>
      {grid.flatMap((row, ry) =>
        row.map((cell, cx) =>
          cell > 0 ? (
            <View key={`${ry}-${cx}`} style={{ position: 'absolute', left: cx * px, top: ry * px, width: px + 0.5, height: px + 0.5, backgroundColor: colors[cell] }} />
          ) : null,
        ),
      )}
    </View>
  );
});

// ─── Pixel Art Mountains (smaller, softer, clearly background) ───

type PixelMountainsProps = { width: number; height?: number };

export const PixelMountains = React.memo(function PixelMountains({ width, height = 36 }: PixelMountainsProps) {
  const columns = useMemo(() => {
    const step = PX;
    const cols = Math.ceil(width / step);
    const peaks = [
      { center: 0.10, h: 0.42, w: 0.13 },
      { center: 0.26, h: 0.62, w: 0.16 },
      { center: 0.45, h: 0.50, w: 0.14 },
      { center: 0.66, h: 0.58, w: 0.16 },
      { center: 0.84, h: 0.46, w: 0.13 },
    ];

    const result: { x: number; colH: number; color: string; snowH: number }[] = [];
    for (let c = 0; c < cols; c++) {
      const nx = c / cols;
      let maxH = 0.06;
      for (const peak of peaks) {
        const dist = Math.abs(nx - peak.center) / peak.w;
        if (dist < 1) maxH = Math.max(maxH, peak.h * (1 - dist));
      }
      const colH = Math.max(step * 2, Math.floor(maxH * height));
      const snowH = maxH > 0.5 ? step : 0;
      let color: string;
      if (maxH > 0.5) color = '#85a7b6';
      else if (maxH > 0.35) color = '#7b9baa';
      else color = '#7190a0';
      result.push({ x: c * step, colH, color, snowH });
    }
    return result;
  }, [width, height]);

  return (
    <View style={{ width, height, overflow: 'hidden', opacity: 0.82 }}>
      {columns.map((col, i) => (
        <React.Fragment key={i}>
          <View style={{ position: 'absolute', left: col.x, bottom: 0, width: PX + 0.5, height: col.colH, backgroundColor: col.color }} />
          {col.snowH > 0 && (
            <View style={{ position: 'absolute', left: col.x, top: height - col.colH, width: PX + 0.5, height: col.snowH, backgroundColor: '#dcecf5' }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
});

// ─── Pixel Sea (CSS-only wave, no Animated API) ───

type PixelSeaProps = { width: number; height: number };

export const PixelSea = React.memo(function PixelSea({ width, height }: PixelSeaProps) {
  const waveHeight = PX * 3;
  const wavePeriodPx = PX * 8;

  // Build wave crest pattern
  const waveCols = useMemo(() => {
    // Build enough columns to cover width + one extra period for seamless scroll
    const totalW = width + wavePeriodPx;
    const cols = Math.ceil(totalW / PX);
    const elements: React.ReactNode[] = [];
    for (let c = 0; c < cols; c++) {
      const phase = c % 8;
      const isUp = phase < 4;
      const isFoam = phase >= 1 && phase <= 3;
      if (isUp) {
        elements.push(<View key={`c0-${c}`} style={{ position: 'absolute', left: c * PX, top: 0, width: PX + 0.5, height: PX + 0.5, backgroundColor: isFoam ? '#e0f4ff' : '#5ec8e6' }} />);
      }
      elements.push(<View key={`c1-${c}`} style={{ position: 'absolute', left: c * PX, top: PX, width: PX + 0.5, height: PX + 0.5, backgroundColor: '#4bbbd9' }} />);
      elements.push(<View key={`c2-${c}`} style={{ position: 'absolute', left: c * PX, top: PX * 2, width: PX + 0.5, height: PX + 0.5, backgroundColor: '#3ba8d4' }} />);
    }
    return elements;
  }, [width, wavePeriodPx]);

  // CSS animation for web (pure GPU, no JS), static for native
  const waveAnimStyle = Platform.OS === 'web'
    ? {
        animationName: `waveScroll`,
        animationDuration: '2.4s',
        animationTimingFunction: 'linear',
        animationIterationCount: 'infinite',
      } as unknown as Record<string, unknown>
    : {};

  return (
    <View style={{ width, height, overflow: 'hidden' }}>
      {/* Inject CSS keyframes on web */}
      {Platform.OS === 'web' && (
        <style dangerouslySetInnerHTML={{ __html: `@keyframes waveScroll { from { transform: translateX(0); } to { transform: translateX(-${wavePeriodPx}px); } }` }} />
      )}
      {/* Sea body — 3 flat bands */}
      <View style={{ position: 'absolute', left: 0, top: waveHeight, width, height: (height - waveHeight) * 0.4, backgroundColor: '#3ba8d4' }} />
      <View style={{ position: 'absolute', left: 0, top: waveHeight + (height - waveHeight) * 0.4, width, height: (height - waveHeight) * 0.3, backgroundColor: '#2b93bf' }} />
      <View style={{ position: 'absolute', left: 0, top: waveHeight + (height - waveHeight) * 0.7, width, height: (height - waveHeight) * 0.3 + 1, backgroundColor: '#2085ad' }} />
      {/* Wave crest strip */}
      {/* @ts-ignore — web-only CSS animation props */}
      <View style={[{ position: 'absolute', top: 0, left: 0, width: width + wavePeriodPx, height: waveHeight }, waveAnimStyle as any]}>
        {waveCols}
      </View>
    </View>
  );
});
