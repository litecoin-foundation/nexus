import React from 'react';
import {BlurView} from 'expo-blur';
import {Platform, StyleSheet, View, type ViewProps} from 'react-native';

/**
 * Real backdrop blur: UIVisualEffectView on iOS, RenderNode on Android 12+.
 * Below that there is no cheap real-time blur, so the tint carries the weight.
 */
const CAN_BLUR = Platform.OS === 'ios' || Number(Platform.Version) >= 31;

interface GlassProps extends ViewProps {
  /** Must match the corner radius of whatever this surface sits in. */
  radius: number;
  /** 0 disables the blur entirely and leans on the tint alone. */
  intensity: number;
  scheme: 'light' | 'dark';
}

/**
 * Cross-platform glass surface. The blur is a progressive enhancement — the
 * tint and the specular edge do the work, and those render identically on iOS
 * and Android, so the component still reads as glass with intensity={0}.
 *
 * Note: `borderCurve: 'continuous'` (squircle corners) is honoured on iOS only;
 * Android falls back to circular corners.
 */
export function Glass({
  radius,
  intensity,
  scheme,
  style,
  children,
  ...rest
}: GlassProps) {
  const light = scheme === 'light';
  const blurred = CAN_BLUR && intensity > 0;
  const fill = light
    ? `rgba(255,255,255,${blurred ? 0.18 : 0.45})`
    : `rgba(18,18,20,${blurred ? 0.28 : 0.55})`;

  return (
    <View
      {...rest}
      style={[
        {
          borderRadius: radius,
          borderCurve: 'continuous',
          boxShadow: [
            {offsetX: 0, offsetY: 2, blurRadius: 8, color: 'rgba(0,0,0,0.14)'},
          ],
        },
        style,
      ]}>
      {/* Backdrop, clipped to the radius. */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {borderRadius: radius, borderCurve: 'continuous', overflow: 'hidden'},
        ]}>
        {blurred && (
          <BlurView
            intensity={intensity}
            tint={light ? 'light' : 'dark'}
            experimentalBlurMethod="dimezisBlurView"
            blurReductionFactor={8}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* Committed scrim. Legibility over unpredictable photos, not
            decoration: a neutral panel is readable over neither white nor
            black imagery. */}
        <View style={[StyleSheet.absoluteFill, {backgroundColor: fill}]} />
      </View>

      {children}

      {/* Specular edge — the layer that actually reads as glass. Drawn last so
          it sits over the content. */}
      <View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          borderRadius: radius,
          borderCurve: 'continuous',
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: `rgba(255,255,255,${light ? 0.45 : 0.22})`,
          boxShadow: [
            {
              offsetX: 0,
              offsetY: 1,
              blurRadius: 0,
              color: 'rgba(255,255,255,0.4)',
              inset: true,
            },
            {
              offsetX: 0,
              offsetY: -1,
              blurRadius: 0,
              color: 'rgba(255,255,255,0.14)',
              inset: true,
            },
          ],
        }}
      />
    </View>
  );
}

export default Glass;
