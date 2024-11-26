import React from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {Canvas, LinearGradient, Rect, vec} from '@shopify/react-native-skia';
import {v4 as uuidv4} from 'uuid';

interface Props {}

const thirdOfWidth = Math.ceil(Dimensions.get('screen').width / 3);
const twoThirdOfWidth = thirdOfWidth * 2;

const PadGrid: React.FC<Props> = () => {
  console.log();
  const h = [115, 210, 306];
  const v = [thirdOfWidth, twoThirdOfWidth];
  return (
    <View>
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    height: 410,
    width: Dimensions.get('screen').width,
  },
});

export default PadGrid;
