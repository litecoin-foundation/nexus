import React, {useContext} from 'react';
import {View, StyleSheet, TouchableOpacity} from 'react-native';

import {useAppDispatch} from '../store/hooks';
import {changeGraphPeriod} from '../reducers/chart';
import {ScreenSizeContext} from '../context/screenSize';
import {
  getDatePickerSlots,
  DATE_PICKER_HEIGHT_RATIO,
} from './GlassBalanceGraphics';

// Invisible touch targets aligned with the Skia-rendered labels .

interface Props {}

const GlassDatePicker: React.FC<Props> = () => {
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();
  const slots = getDatePickerSlots(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {slots.map(slot => (
        <TouchableOpacity
          key={slot.value}
          style={[styles.slot, {left: slot.left, width: slot.width}]}
          onPress={() => dispatch(changeGraphPeriod(slot.value))}
        />
      ))}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      width: '100%',
      height: screenHeight * DATE_PICKER_HEIGHT_RATIO,
    },
    slot: {
      position: 'absolute',
      top: 0,
      height: '100%',
    },
  });

export default GlassDatePicker;
