import React, {useEffect, useState, useRef, useMemo, useCallback} from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
  ReduceMotion,
  runOnJS,
} from 'react-native-reanimated';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import {store, pStore} from '../../../src/store';

import Header from './Header';
import PlasmaModal from '../../../src/components/Modals/PlasmaModal';
import PinModalContent from '../../../src/components/Modals/PinModalContent';
import PinModal from '../../../src/components/Modals/PinModal';

interface Props {
  activeComponent: number,
}

const Screens: React.FC<Props> = props => {

  const [activeScreen, setActiveScreen] = useState(props.activeComponent || 0);
  const [isModalClosed, setIsModalClosed] = useState(false);

  const cardTranslateAnim = useAnimatedStyle(() => {
    return {
      transform: [
        {translateX: 0},
        {translateY: 0},
      ],
    };
  });
  
  const screenList = [
    <Header />,
    <PinModal
      isVisible={!isModalClosed}
      close={() => setIsModalClosed(true)}
      handleValidationFailure={() => {}}
      handleValidationSuccess={() => {}}
    />,
    <PlasmaModal
      isOpened={!isModalClosed}
      close={() => setIsModalClosed(true)}
      isFromBottomToTop={true}
      animDuration={250}
      gapInPixels={0}
      backSpecifiedStyle={{backgroundColor: 'rgba(19,58,138, 0.6)'}}
      renderBody={(
        _,
        __,
        ___,
        ____,
        cardTranslateAnim: any,
      ) => (
        <PinModalContent
          cardTranslateAnim={cardTranslateAnim}
          close={() => {}}
          handleValidationFailure={() => {}}
          handleValidationSuccess={() => {}}
        />
      )}
    />
  ];

  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={pStore}>
        <GestureHandlerRootView style={{flex: 1}}>
          {screenList[activeScreen]}
        </GestureHandlerRootView>
      </PersistGate>
    </Provider>
  )
};

const styles = StyleSheet.create({
  container: {

  },
  text: { color: 'white' },
});

export default Screens;