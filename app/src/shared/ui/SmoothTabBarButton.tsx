import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Pressable,
  Animated,
  StyleSheet,
  View,
  Easing,
  Platform,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
  PressableProps,
  AccessibilityState,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { tokens } from '@/shared/theme/tokens';
import {
  PARTICLE_CONFIGS,
  calculateParticleOffset,
  type ParticleConfig,
} from './tabParticles';

export interface SmoothTabBarButtonProps extends Omit<PressableProps, 'style' | 'onPress'> {
  to?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: (e: GestureResponderEvent) => void;
  accessibilityState?: AccessibilityState;
  testID?: string;
}

export { PARTICLE_CONFIGS, calculateParticleOffset, type ParticleConfig };

export function SmoothTabBarButton(props: SmoothTabBarButtonProps) {
  const { onPress, ...restProps } = props;

  // Use lazy state initialization to comply cleanly with React 19 ref rules
  const [animProgress] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));
  const lastBurstTimeRef = useRef<number>(0);

  const triggerBurst = useCallback(() => {
    const now = Date.now();
    // Throttle burst triggers within 250ms
    if (now - lastBurstTimeRef.current < 250) {
      return;
    }
    lastBurstTimeRef.current = now;

    // 1. Subtle tactile haptic tap on mobile
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      } catch {
        // Fallback gracefully on devices without haptic engine
      }
    }

    // 2. Playful micro-bounce (Duolingo sticker press)
    pressScale.stopAnimation();
    Animated.sequence([
      Animated.timing(pressScale, {
        toValue: 0.93,
        duration: 60,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
      Animated.spring(pressScale, {
        toValue: 1,
        friction: 5,
        tension: 160,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Smooth particle burst & delicate micro-halo expansion
    animProgress.stopAnimation();
    animProgress.setValue(0);
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 380,
      useNativeDriver: true,
      easing: Easing.bezier(0.16, 1, 0.3, 1), // ultra-smooth cubic out
    }).start();
  }, [animProgress, pressScale]);

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      triggerBurst();
      onPress?.(e);
    },
    [onPress, triggerBurst]
  );

  const isSelected = restProps.accessibilityState?.selected ?? false;
  const prevSelectedRef = useRef(isSelected);

  useEffect(() => {
    if (isSelected && !prevSelectedRef.current) {
      triggerBurst();
    }
    prevSelectedRef.current = isSelected;
  }, [isSelected, triggerBurst]);

  // Memoize interpolations for silky-smooth 60fps performance and React 19 compliance
  const { haloScale, haloOpacity, particleItems } = useMemo(() => {
    const hScale = animProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.6, 1.35],
    });
    const hOpacity = animProgress.interpolate({
      inputRange: [0, 0.18, 0.6, 1],
      outputRange: [0, 0.45, 0.18, 0],
    });

    const pItems = PARTICLE_CONFIGS.map((cfg) => {
      const { dx, dy } = calculateParticleOffset(cfg.angle, cfg.distance);
      return {
        id: cfg.id,
        size: cfg.size,
        color: cfg.color,
        translateX: animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dx],
        }),
        translateY: animProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, dy],
        }),
        scale: animProgress.interpolate({
          inputRange: [0, 0.25, 0.7, 1],
          outputRange: [0.4, 1.0, 0.7, 0.1],
        }),
        opacity: animProgress.interpolate({
          inputRange: [0, 0.15, 0.55, 1],
          outputRange: [0, 0.7, 0.45, 0],
        }),
      };
    });

    return {
      haloScale: hScale,
      haloOpacity: hOpacity,
      particleItems: pItems,
    };
  }, [animProgress]);

  return (
    <Pressable
      {...restProps}
      android_ripple={{ color: 'transparent' }} // Disables the thick dark native Android ripple
      onPress={handlePress}
      style={({ pressed }) => [
        styles.pressable,
        restProps.style as StyleProp<ViewStyle>,
      ]}
    >
      {/* Micro-particle and delicate halo layer centered at the icon level */}
      <View
        pointerEvents="none"
        style={styles.particlesContainer}
        testID="tab-particles-container"
      >
        {/* Soft, thin expanding micro-halo */}
        <Animated.View
          testID="tab-halo"
          style={[
            styles.halo,
            {
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            },
          ]}
        />

        {/* 6 smooth floating micro-particles */}
        {particleItems.map((item) => (
          <Animated.View
            key={item.id}
            testID={`tab-particle-${item.id}`}
            style={[
              styles.particle,
              {
                width: item.size,
                height: item.size,
                borderRadius: item.size / 2,
                backgroundColor: item.color,
                opacity: item.opacity,
                transform: [
                  { translateX: item.translateX },
                  { translateY: item.translateY },
                  { scale: item.scale },
                ],
              },
            ]}
          />
        ))}
      </View>

      {/* Tab content (icon and label) with micro-bounce spring */}
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: pressScale }],
          },
        ]}
      >
        {restProps.children}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesContainer: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  halo: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(88, 204, 2, 0.35)',
    backgroundColor: 'rgba(88, 204, 2, 0.06)',
  },
  particle: {
    position: 'absolute',
    shadowColor: tokens.colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
});
