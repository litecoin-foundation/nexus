import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {View, StyleSheet, StatusBar} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {BlurView} from 'expo-blur';

import TranslateText from '../TranslateText';
import ProgressBar from '../ProgressBar';
import BlueButton from '../Buttons/BlueButton';
import {ScreenSizeContext} from '../../context/screenSize';

type MigrationStatusKey =
  | 'preparing'
  | 'cleaning_neutrino'
  | 'cleaning_wallet'
  | 'switching_backend'
  | 'complete';

interface Props {
  isVisible: boolean;
  progress: number;
  statusKey: MigrationStatusKey | null;
  onAcknowledge: () => void;
}

const FADE_DURATION_MS = 250;
const STEP_DURATION_MS = 280;
const STEP_SLIDE_PX = 18;

// Non-dismissible full-screen modal mirroring the PopUpModal card style.
// We don't use PlasmaModal because its swipe-to-dismiss gesture would drag
// the card off-screen even with a no-op close handler.
const MigrationModal: React.FC<Props> = props => {
  const {isVisible, progress, statusKey, onAcknowledge} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(40);
  const stepProgress = useSharedValue(0);
  const [completeStep, setCompleteStep] = useState<1 | 2>(1);

  useEffect(() => {
    if (isVisible) {
      const config = {
        duration: FADE_DURATION_MS,
        easing: Easing.out(Easing.cubic),
      };
      opacity.value = withTiming(1, config);
      translateY.value = withTiming(0, config);
    }
  }, [isVisible, opacity, translateY]);

  const advanceToHeadsUp = useCallback(() => {
    setCompleteStep(2);
    stepProgress.value = withTiming(1, {
      duration: STEP_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [stepProgress]);

  const backdropStyle = useAnimatedStyle(() => ({opacity: opacity.value}));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{translateY: translateY.value}],
  }));
  const step1Style = useAnimatedStyle(() => ({
    opacity: 1 - stepProgress.value,
    transform: [{translateX: -STEP_SLIDE_PX * stepProgress.value}],
  }));
  const step2Style = useAnimatedStyle(() => ({
    opacity: stepProgress.value,
    transform: [{translateX: STEP_SLIDE_PX * (1 - stepProgress.value)}],
  }));

  if (!isVisible) {
    return null;
  }

  const isComplete = statusKey === 'complete';

  return (
    <View style={styles.container} pointerEvents="auto">
      <StatusBar barStyle="light-content" />
      <Animated.View style={[StyleSheet.absoluteFillObject, backdropStyle]}>
        <BlurView
          intensity={45}
          tint="dark"
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.dim} />
      </Animated.View>

      <Animated.View
        style={[styles.card, isComplete && styles.cardComplete, cardStyle]}>
        {isComplete ? (
          <View style={styles.completeStack}>
            <Animated.View
              style={[styles.stepAbsolute, step1Style]}
              pointerEvents={completeStep === 1 ? 'auto' : 'none'}>
              <View>
                <TranslateText
                  textKey="done_title"
                  domain="migration"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.028}
                  textStyle={styles.title}
                  numberOfLines={1}
                />
                <View style={styles.bodySpacer} />
                <TranslateText
                  textKey="done_body"
                  domain="migration"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.description}
                  numberOfLines={6}
                />
              </View>
              <View style={styles.buttonRow}>
                <BlueButton
                  textKey="done_button"
                  textDomain="migration"
                  onPress={advanceToHeadsUp}
                  rounded
                />
              </View>
            </Animated.View>

            <Animated.View
              style={[styles.stepAbsolute, step2Style]}
              pointerEvents={completeStep === 2 ? 'auto' : 'none'}>
              <View>
                <TranslateText
                  textKey="heads_up_title"
                  domain="migration"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.028}
                  textStyle={styles.title}
                  numberOfLines={1}
                />
                <View style={styles.bodySpacer} />
                <TranslateText
                  textKey="heads_up_body"
                  domain="migration"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                  textStyle={styles.description}
                  numberOfLines={4}
                />
                <View style={styles.warningContainer}>
                  <TranslateText
                    textKey="heads_up_warning"
                    domain="migration"
                    maxSizeInPixels={SCREEN_HEIGHT * 0.018}
                    textStyle={styles.warning}
                    numberOfLines={3}
                  />
                </View>
              </View>
              <View style={styles.buttonRow}>
                <BlueButton
                  textKey="heads_up_button"
                  textDomain="migration"
                  onPress={onAcknowledge}
                  rounded
                />
              </View>
            </Animated.View>
          </View>
        ) : (
          <View style={styles.progressContent}>
            <TranslateText
              textKey="title"
              domain="migration"
              maxSizeInPixels={SCREEN_HEIGHT * 0.028}
              textStyle={styles.title}
              numberOfLines={1}
            />
            <View style={styles.bodySpacer} />
            <TranslateText
              textKey="description"
              domain="migration"
              maxSizeInPixels={SCREEN_HEIGHT * 0.018}
              textStyle={styles.description}
              numberOfLines={2}
            />
            <View style={styles.progressTrack}>
              <ProgressBar
                percentageProgress={progress}
                color="#1162E6"
                height={6}
                rounded
              />
            </View>
            <View style={styles.statusContainer}>
              {statusKey ? (
                <TranslateText
                  textKey={`step_${statusKey}`}
                  domain="migration"
                  maxSizeInPixels={SCREEN_HEIGHT * 0.017}
                  textStyle={styles.status}
                  numberOfLines={1}
                />
              ) : null}
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: screenWidth,
      height: screenHeight,
      zIndex: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dim: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    card: {
      width: screenWidth * 0.9,
      backgroundColor: '#fff',
      borderRadius: 40,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.07,
      shadowRadius: 3,
      elevation: 4,
    },
    cardComplete: {
      height: screenHeight * 0.36,
    },
    completeStack: {
      flex: 1,
    },
    stepAbsolute: {
      ...StyleSheet.absoluteFillObject,
      padding: 24,
      justifyContent: 'space-between',
    },
    progressContent: {
      padding: 24,
    },
    bodySpacer: {
      height: screenHeight * 0.012,
    },
    warningContainer: {
      marginTop: screenHeight * 0.018,
      paddingVertical: screenHeight * 0.014,
      paddingHorizontal: 14,
      backgroundColor: 'rgba(243, 111, 86, 0.10)',
      borderRadius: 16,
    },
    progressTrack: {
      width: '100%',
      height: 6,
      borderRadius: 3,
      backgroundColor: 'rgba(17, 98, 230, 0.15)',
      overflow: 'hidden',
      marginTop: screenHeight * 0.025,
    },
    statusContainer: {
      paddingTop: screenHeight * 0.018,
      minHeight: screenHeight * 0.04,
    },
    title: {
      color: '#000',
      fontSize: screenHeight * 0.024,
      fontWeight: 'bold',
      letterSpacing: -0.18,
    },
    description: {
      color: '#2E2E2E',
      fontSize: screenHeight * 0.018,
      letterSpacing: -0.18,
    },
    warning: {
      color: '#C03B22',
      fontSize: screenHeight * 0.018,
      fontWeight: '600',
      letterSpacing: -0.18,
      textAlign: 'center',
    },
    status: {
      color: '#4A4A4A',
      fontSize: screenHeight * 0.017,
      fontWeight: '500',
      letterSpacing: -0.18,
    },
    buttonRow: {
      alignItems: 'center',
    },
  });

export default MigrationModal;
