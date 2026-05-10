import React, {useCallback, useMemo} from 'react';
import {StyleSheet, View, Platform, StyleProp, ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';
type IPlatform = 'ios' | 'android' | 'both';

interface Props {
  children?: React.ReactNode;
  styles?: StyleProp<ViewStyle>;
  edges?: Edge[];
  platform?: IPlatform;
}

const CustomSafeAreaView: React.FC<Props> = props => {
  const {children, styles, edges, platform} = props;

  const flatStyles = useMemo(
    () =>
      styles ? (StyleSheet.flatten(styles) as {[key: string]: any}) : undefined,
    [styles],
  );

  const EDGES = useMemo(
    () => (edges ? edges : ['top', 'bottom', 'left', 'right']),
    [edges],
  );

  const insets = useSafeAreaInsets();

  const generatePaddings = useCallback(() => {
    return platform === Platform.OS ||
      platform === 'both' ||
      platform === undefined
      ? {
          paddingTop: EDGES.includes('top')
            ? insets.top +
              (flatStyles?.paddingTop ||
                flatStyles?.paddingVertical ||
                flatStyles?.padding ||
                0)
            : 0,
          paddingBottom: EDGES.includes('bottom')
            ? insets.bottom +
              (flatStyles?.paddingBottom ||
                flatStyles?.paddingVertical ||
                flatStyles?.padding ||
                0)
            : 0,
          paddingLeft: EDGES.includes('left')
            ? insets.left +
              (flatStyles?.paddingLeft ||
                flatStyles?.paddingHorizontal ||
                flatStyles?.padding ||
                0)
            : 0,
          paddingRight: EDGES.includes('right')
            ? insets.right +
              (flatStyles?.paddingRight ||
                flatStyles?.paddingHorizontal ||
                flatStyles?.padding ||
                0)
            : 0,
        }
      : null;
  }, [flatStyles, insets, EDGES, platform]);

  return <View style={[flatStyles, generatePaddings()]}>{children}</View>;
};

export default CustomSafeAreaView;
