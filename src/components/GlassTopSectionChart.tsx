import React, {useContext} from 'react';
import {StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import GlassChartTouch, {getGlassChartGap} from './GlassChart';
import GlassDatePicker from './GlassDatePicker';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  animatedOpacityStyle: any;
  isBottomSheetFolded: boolean;
  triggerLester: number;
}

const GlassTopSectionChart: React.FC<Props> = props => {
  const {animatedOpacityStyle, isBottomSheetFolded, triggerLester} = props;

  const {height: SCREEN_HEIGHT} = useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_HEIGHT);

  return (
    <Animated.View style={[animatedOpacityStyle, styles.container]}>
      {isBottomSheetFolded ? (
        <>
          <GlassChartTouch triggerLester={triggerLester} />
          <GlassDatePicker />
        </>
      ) : null}
    </Animated.View>
  );
};

const getStyles = (screenHeight: number) =>
  StyleSheet.create({
    container: {
      gap: getGlassChartGap(screenHeight),
    },
  });

export default GlassTopSectionChart;
