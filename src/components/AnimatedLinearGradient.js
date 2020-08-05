import React from 'react';
import LinearGradient from 'react-native-linear-gradient';
import {useSpring, animated, config} from 'react-spring/native';

const AnimatedLinearGradient = (props) => {
  const {style, children, colors} = props;
  const AnimatedLinearGradientComponent = animated(LinearGradient);

  const styles = useSpring({
    config: config.molasses,
    from: {backgroundColor: colors[0]},
    to: async (next) => {
      while (1) {
        await next({backgroundColor: colors[1]});
        await next({backgroundColor: colors[0]});
      }
    },
  });

  return (
    <AnimatedLinearGradientComponent
      useAngle={true}
      angle={36}
      angleCenter={{x: -2, y: 0}}
      style={[style, styles]}
      colors={[`${colors[0]}99`, `${colors[1]}99`]}>
      {children}
    </AnimatedLinearGradientComponent>
  );
};

export default AnimatedLinearGradient;
