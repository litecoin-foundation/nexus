import React, {useCallback} from 'react';
import {View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

interface Props {
  children?: React.ReactNode;
  styles?: {
    [key: string]: any;
  };
}

const EDGES = ['top', 'bottom', 'left', 'right'];

const SafeAreaView: React.FC<Props> = props => {
  const {children, styles} = props;

  const insets = useSafeAreaInsets();

  const generatePaddings = useCallback(() => {
    return {
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
    };
  }, [styles, insets]);

  return <View style={[styles, generatePaddings()]}>{children}</View>;
};

export default SafeAreaView;
