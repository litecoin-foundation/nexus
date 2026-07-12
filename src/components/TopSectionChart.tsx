import React, {useContext} from 'react';
import {StyleSheet} from 'react-native';
import Animated from 'react-native-reanimated';

import LineChart from './Chart/Chart';
import DatePicker from './DatePicker';
import {ScreenSizeContext} from '../context/screenSize';

interface Props {
  animatedOpacityStyle: any;
  isBottomSheetFolded: boolean;
  triggerLester: number;
}

const TopSectionChart: React.FC<Props> = props => {
  const {animatedOpacityStyle, isBottomSheetFolded, triggerLester} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <Animated.View style={[animatedOpacityStyle, styles.container]}>
      {isBottomSheetFolded ? (
        <>
          <LineChart triggerLester={triggerLester} />
          <DatePicker />
        </>
      ) : null}
    </Animated.View>
  );
};

const getStyles = (_screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      paddingTop:
        screenHeight < 701 ? screenHeight * 0.03 : screenHeight * 0.04,
      gap: screenHeight < 701 ? screenHeight * 0.035 : screenHeight * 0.05,
    },
  });

export default TopSectionChart;
