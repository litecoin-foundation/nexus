import React from 'react';
import { Dimensions, View } from 'react-native';
import { Canvas, LinearGradient, Rect, vec } from '@shopify/react-native-skia';

interface Props { }

const PadGrid: React.FC<Props> = () => {
  const h = [115, 210, 306];
  const v = [147, 277];
  return (
    <View>
      <Canvas
        style={{
          position: 'absolute',
          height: 410,
          width: Dimensions.get('screen').width,
        }}>
        {h.map((y, key) => (
          <Rect x={0} y={y} width={Dimensions.get('screen').width} height={1} key={'y-' + key}>
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

        {v.map((x, key) => (
          <Rect x={x} y={30} width={1} height={360} key={'x-' + key}>
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

export default PadGrid;
