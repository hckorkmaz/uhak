import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { PlaneSprite } from './GameSprites';
import { PixelBgCloud, PixelSun } from './PixelBackground';
import type { Language } from '../game/types';
import { TRANSLATIONS } from '../game/constants';

type SplashScreenProps = {
  language: Language;
  onFinish: () => void;
};

export function SplashScreen({ language, onFinish }: SplashScreenProps) {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const planeX = useRef(new Animated.Value(-120)).current;
  const titleScale = useRef(new Animated.Value(0.7)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const t = TRANSLATIONS[language];

  useEffect(() => {
    Animated.sequence([
      // Phase 1: Fade in background + plane flies in
      Animated.parallel([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(planeX, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Phase 2: Title scales up
      Animated.spring(titleScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
      // Phase 3: Subtitle fades in
      Animated.timing(subtitleOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      // Phase 4: Hold
      Animated.delay(800),
      // Phase 5: Fade out
      Animated.timing(fadeIn, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish();
    });
  }, [fadeIn, onFinish, planeX, subtitleOpacity, titleScale]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeIn }]}>
      <View style={styles.sky}>
        {/* Pixel Sun */}
        <View style={[styles.bgCloud, { right: '12%', top: '6%' }]}>
          <PixelSun size={56} />
        </View>

        {/* Background pixel clouds */}
        <View style={[styles.bgCloud, { left: '8%', top: '12%' }]} pointerEvents="none">
          <PixelBgCloud width={100} opacity={0.7} />
        </View>
        <View style={[styles.bgCloud, { right: '10%', top: '18%' }]} pointerEvents="none">
          <PixelBgCloud width={80} opacity={0.6} />
        </View>
        <View style={[styles.bgCloud, { left: '15%', bottom: '28%' }]} pointerEvents="none">
          <PixelBgCloud width={70} opacity={0.5} />
        </View>
        <View style={[styles.bgCloud, { right: '5%', bottom: '32%' }]} pointerEvents="none">
          <PixelBgCloud width={90} opacity={0.55} />
        </View>
      </View>

      <View style={styles.content}>
        {/* Animated plane */}
        <Animated.View style={[styles.planeWrap, { transform: [{ translateX: planeX }, { rotate: '-8deg' }] }]}>
          <PlaneSprite size={56} />
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, { transform: [{ scale: titleScale }] }]}>
          UHAK
        </Animated.Text>

        {/* Subtitle (language-dependent) */}
        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          {t.title.replace('UHAK: ', '')}
        </Animated.Text>


      </View>

      {/* Ground */}
      <View style={styles.ground} />
    </Animated.View>
  );
}

const PIXEL_FONT = 'VT323';

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  sky: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#8fe0ff',
  },
  bgCloud: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  planeWrap: {
    marginBottom: 24,
  },
  title: {
    fontSize: 36,
    fontFamily: PIXEL_FONT,
    color: '#543847',
    lineHeight: 42,
    letterSpacing: 4,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: PIXEL_FONT,
    color: '#5b6174',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
    letterSpacing: 1,
    paddingHorizontal: 20,
  },

  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '15%',
    backgroundColor: '#2b93bf',
    borderTopWidth: 4,
    borderTopColor: '#e8d8a8',
  },
});
