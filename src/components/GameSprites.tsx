import React from 'react';
import { View } from 'react-native';

type PlaneSpriteProps = {
  size?: number;
};

type PixelObstacleCloudProps = {
  width: number;
  height: number;
};

// ─── Pixel Art Plane (20x9 grid — detailed, charming) ───

export const PlaneSprite = React.memo(function PlaneSprite({ size = 40 }: PlaneSpriteProps) {
  const px = size / 9;
  const gridW = 20;
  const gridH = 9;
  const totalW = px * gridW;
  const totalH = px * gridH;

  // 0=empty 1=white body 2=red accent 3=cockpit glass 4=border 5=light gray 6=dark red 7=engine
  const grid = [
    [0,6,6,4,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // dikey fin ucu
    [0,4,6,2,2,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0],  // fin gövdesi
    [0,4,6,6,2,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0],  // fin tabanı + fuselage üst kenarı
    [0,4,6,2,1,1,5,1,1,1,1,1,1,1,1,3,3,4,0,0],  // fuselage üst + kokpit camı
    [4,7,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3,4,4,0],  // fuselage merkez (kuyruk exhaust 7, burun sağda)
    [4,7,1,2,2,2,1,1,1,2,2,2,2,2,1,1,1,1,4,4],  // fuselage alt + kırmızı şerit
    [0,4,4,2,2,4,4,4,4,4,2,2,2,4,4,4,4,4,4,0],  // kanat (tam genişlik) + motor nacelle ön kısımda (col 11-14)
    [0,0,0,4,4,0,0,0,0,4,6,6,4,0,0,0,0,0,0,0],  // motor nacelle gövdesi
    [0,0,0,0,0,0,0,0,0,0,4,4,0,0,0,0,0,0,0,0],  // motor ucu
  ];

  const colors: Record<number, string> = {
    1: '#ffffff',
    2: '#ef4444',
    3: '#60a5fa',
    4: '#543847',
    5: '#e8e8e8',
    6: '#dc2626',
    7: '#94a3b8',
  };

  return (
    <View style={{ width: totalW, height: totalH }}>
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

// ─── Pixel Art Obstacle Cloud (menacing thundercloud — clearly an obstacle) ───

export const PixelObstacleCloud = React.memo(function PixelObstacleCloud({ width, height }: PixelObstacleCloudProps) {
  const cols = 28;
  const rows = 12;
  const px_w = width / cols;
  const px_h = height / rows;

  // 0=empty 1=gray body 2=dark border 3=shadow 4=highlight 5=deep shadow 6=lightning
  const grid = [
    [0,0,0,0,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,2,2,4,4,4,1,1,1,1,1,1,1,1,1,1,4,4,4,2,2,0,0,0,0],
    [0,0,0,2,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,2,0,0,0],
    [0,0,2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2,0,0],
    [0,2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2,0],
    [2,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,2],
    [2,1,1,1,5,3,1,1,1,5,3,1,1,1,1,1,1,5,3,1,1,1,5,3,1,1,1,2],
    [2,1,1,5,3,3,5,1,5,3,3,5,1,1,1,1,5,3,3,5,1,5,3,3,5,1,1,2],
    [2,3,5,3,3,3,3,5,3,3,3,3,5,3,3,5,3,3,3,3,5,3,3,3,3,5,3,2],
    [0,2,3,3,3,3,3,3,3,6,3,3,3,3,3,3,3,3,6,3,3,3,3,3,3,3,2,0],
    [0,0,2,2,2,2,2,2,2,6,2,2,2,2,2,2,2,2,6,2,2,2,2,2,2,2,0,0],
    [0,0,0,0,0,0,0,0,2,6,2,0,0,0,0,0,0,2,6,2,0,0,0,0,0,0,0,0],
  ];

  const colors: Record<number, string> = {
    1: '#9ca3af',
    2: '#374151',
    3: '#6b7280',
    4: '#d1d5db',
    5: '#4b5563',
    6: '#fbbf24',
  };

  return (
    <View style={{ width, height }}>
      {grid.flatMap((row, ry) =>
        row.map((cell, cx) =>
          cell > 0 ? (
            <View key={`${ry}-${cx}`} style={{ position: 'absolute', left: cx * px_w, top: ry * px_h, width: px_w + 0.5, height: px_h + 0.5, backgroundColor: colors[cell] }} />
          ) : null,
        ),
      )}
    </View>
  );
});
