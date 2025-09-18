import React, {useContext} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {Canvas, LinearGradient, Rect, vec} from '@shopify/react-native-skia';
import {v4 as uuidv4} from 'uuid';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  small?: boolean;
}

const PadGrid: React.FC<Props> = props => {
  const {small} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, small || false);

  const thirdOfWidth = Math.ceil(SCREEN_WIDTH / 3);
  const twoThirdOfWidth = thirdOfWidth * 2;

  const h = small
    ? [SCREEN_HEIGHT * 0.09, SCREEN_HEIGHT * 0.18, SCREEN_HEIGHT * 0.27]
    : [SCREEN_HEIGHT * 0.1, SCREEN_HEIGHT * 0.2, SCREEN_HEIGHT * 0.3];
  const v = [thirdOfWidth, twoThirdOfWidth];

  return (
    <View pointerEvents="none">
      <Canvas style={styles.container}>
        {h.map(y => (
          <Rect
            key={uuidv4()}
            x={0}
            y={y}
            width={Dimensions.get('screen').width}
            height={1}>
            <LinearGradient
              start={vec(0, 0)}
              end={vec(Dimensions.get('screen').width, 1)}
              colors={[
                'rgba(223,223,223,0)',
                '#E0E0E0',
                '#E1E1E1',
                'rgba(219,219,219,0)',
              ]}
            />
          </Rect>
        ))}

        {v.map(x => (
          <Rect key={uuidv4()} x={x} y={30} width={1} height={360}>
            <LinearGradient
              start={vec(30, 0)}
              end={vec(0, 380)}
              colors={[
                'rgba(223,223,223,0)',
                '#E0E0E0',
                '#E1E1E1',
                'rgba(219,219,219,0)',
              ]}
            />
          </Rect>
        ))}
      </Canvas>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number, small: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      width: screenWidth,
      height: small ? screenHeight * 0.36 : screenHeight * 0.4,
    },
  });

export default PadGrid;
