import React, {useCallback, useMemo} from 'react';
import {View, Platform} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

type Edge = 'top' | 'bottom' | 'left' | 'right';
type IPlatform = 'ios' | 'android' | 'both';

interface Props {
  children?: React.ReactNode;
  styles?: {
    [key: string]: any;
  };
  edges?: Edge[];
  platform?: IPlatform;
}

const CustomSafeAreaView: React.FC<Props> = props => {
  const {children, styles, edges, platform} = props;

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
              (styles?.paddingTop ||
                styles?.paddingVertical ||
                styles?.padding ||
                0)
            : 0,
          paddingBottom: EDGES.includes('bottom')
            ? insets.bottom +
              (styles?.paddingBottom ||
                styles?.paddingVertical ||
                styles?.padding ||
                0)
            : 0,
          paddingLeft: EDGES.includes('left')
            ? insets.left +
              (styles?.paddingLeft ||
                styles?.paddingHorizontal ||
                styles?.padding ||
                0)
            : 0,
          paddingRight: EDGES.includes('right')
            ? insets.right +
              (styles?.paddingRight ||
                styles?.paddingHorizontal ||
                styles?.padding ||
                0)
            : 0,
        }
      : null;
  }, [styles, insets, EDGES, platform]);

  return <View style={[styles, generatePaddings()]}>{children}</View>;
};

export default CustomSafeAreaView;
