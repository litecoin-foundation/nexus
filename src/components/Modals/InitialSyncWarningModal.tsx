import React, {useEffect, useContext, useMemo, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {BlurView} from 'expo-blur';
import {
  BlurMask,
  Canvas,
  Group,
  Mask,
  Rect,
  RoundedRect,
  SweepGradient,
  rect,
  rrect,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import BlueButton from '../Buttons/BlueButton';

import CustomSafeAreaView from '../../components/CustomSafeAreaView';
import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {useAppDispatch} from '../../store/hooks';
import {appWasOpened} from '../../reducers/info';

interface Props {
  isVisible: boolean;
  close: () => void;
}

// Gradient colours for the rotating glow (matches DashboardButton).
const GLOW_COLORS = [
  '#FDA4AF',
  '#FC8B97',
  '#FA7280',
  '#F85968',
  '#F74051',
  '#FF2C3E',
  '#D01A28',
  '#FF2C3E',
  '#F74051',
  '#F85968',
  '#FA7280',
  '#FC8B97',
  '#FDA4AF',
];

const GLOW_AURA_COLORS = [
  'rgba(253, 164, 175, 0.4)',
  'rgba(252, 139, 151, 0.42)',
  'rgba(250, 114, 128, 0.45)',
  'rgba(248, 89, 104, 0.47)',
  'rgba(247, 64, 81, 0.5)',
  'rgba(255, 44, 62, 0.55)',
  'rgba(208, 26, 40, 0.58)',
  'rgba(255, 44, 62, 0.55)',
  'rgba(247, 64, 81, 0.5)',
  'rgba(248, 89, 104, 0.47)',
  'rgba(250, 114, 128, 0.45)',
  'rgba(252, 139, 151, 0.42)',
  'rgba(253, 164, 175, 0.4)',
];

const GLOW_POSITIONS = [
  0, 0.083, 0.167, 0.25, 0.333, 0.417, 0.5, 0.583, 0.667, 0.75, 0.833, 0.917, 1,
];

// Higher-contrast inner glow with a bright hotspot, so the rotation is clearly
// visible as a band of light sweeping around the inside edge.
const GLOW_INNER_COLORS = [
  'rgba(208, 26, 40, 0.08)',
  'rgba(220, 32, 48, 0.16)',
  'rgba(247, 64, 81, 0.3)',
  'rgba(255, 120, 130, 0.45)',
  'rgba(255, 170, 178, 0.55)',
  'rgba(255, 120, 130, 0.45)',
  'rgba(247, 64, 81, 0.3)',
  'rgba(220, 32, 48, 0.16)',
  'rgba(208, 26, 40, 0.08)',
];

const GLOW_INNER_POSITIONS = [0, 0.12, 0.24, 0.38, 0.5, 0.62, 0.76, 0.88, 1];

// Padding around the modal rect so the soft glow can bleed outside the rect.
const GLOW_PADDING = 28;
const MODAL_RADIUS = 40;

const InitialSyncWarningModal: React.FC<Props> = props => {
  const {isVisible, close} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {showPopUp} = useContext(PopUpContext);

  const dispatch = useAppDispatch();

  const handleClose = useCallback(() => {
    dispatch(appWasOpened());
    close();
  }, [dispatch, close]);

  // Modal rect geometry within the (padded) glow canvas.
  const modalWidth = SCREEN_WIDTH * 0.9;
  const modalHeight = SCREEN_HEIGHT * 0.35;
  const rectX = GLOW_PADDING;
  const rectY = GLOW_PADDING;
  const centerX = rectX + modalWidth / 2;
  const centerY = rectY + modalHeight / 2;
  // A square large enough to cover the modal at any rotation angle.
  const glowRectSize = modalWidth + modalHeight;

  const glowCenter = useMemo(() => vec(centerX, centerY), [centerX, centerY]);
  const modalClip = useMemo(
    () =>
      rrect(
        rect(rectX, rectY, modalWidth, modalHeight),
        MODAL_RADIUS,
        MODAL_RADIUS,
      ),
    [rectX, rectY, modalWidth, modalHeight],
  );

  // Glow rotation animation
  const glowRotation = useSharedValue(0);

  useEffect(() => {
    glowRotation.value = withRepeat(
      withTiming(2 * Math.PI, {
        duration: 8000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const glowTransform = useDerivedValue(() => [
    {translateX: centerX},
    {translateY: centerY},
    {rotate: glowRotation.value},
    {translateX: -centerX},
    {translateY: -centerY},
  ]);

  const modal = useMemo(
    () =>
      isVisible ? (
        <CustomSafeAreaView styles={styles.container} edges={['top']}>
          <View style={StyleSheet.absoluteFill}>
            <BlurView
              intensity={45}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.dim} />
          </View>

          <View style={styles.modalWrapper}>
            {/* Solid white fallback so the modal is opaque before/while Skia
                renders its own white fill + glow on top. */}
            <View style={styles.modalBackground} />
            <Canvas style={styles.glowCanvas} pointerEvents="none">
              {/* Soft outer aura (bleeds outside the rect) */}
              <Mask
                mode="alpha"
                mask={
                  <RoundedRect
                    x={rectX}
                    y={rectY}
                    width={modalWidth}
                    height={modalHeight}
                    r={MODAL_RADIUS}
                    style="stroke"
                    strokeWidth={14}
                    color="white">
                    <BlurMask blur={18} style="normal" />
                  </RoundedRect>
                }>
                <Group transform={glowTransform}>
                  <Rect
                    x={centerX - glowRectSize / 2}
                    y={centerY - glowRectSize / 2}
                    width={glowRectSize}
                    height={glowRectSize}>
                    <SweepGradient
                      c={glowCenter}
                      colors={GLOW_AURA_COLORS}
                      positions={GLOW_POSITIONS}
                    />
                  </Rect>
                </Group>
              </Mask>

              {/* White modal fill */}
              <RoundedRect
                x={rectX}
                y={rectY}
                width={modalWidth}
                height={modalHeight}
                r={MODAL_RADIUS}
                color="#fff"
              />

              {/* Soft inner glow aura */}
              <Group clip={modalClip}>
                <Mask
                  mode="alpha"
                  mask={
                    <RoundedRect
                      x={rectX}
                      y={rectY}
                      width={modalWidth}
                      height={modalHeight}
                      r={MODAL_RADIUS}
                      style="stroke"
                      strokeWidth={26}
                      color="white">
                      <BlurMask blur={22} style="normal" />
                    </RoundedRect>
                  }>
                  <Group transform={glowTransform}>
                    <Rect
                      x={centerX - glowRectSize / 2}
                      y={centerY - glowRectSize / 2}
                      width={glowRectSize}
                      height={glowRectSize}>
                      <SweepGradient
                        c={glowCenter}
                        colors={GLOW_INNER_COLORS}
                        positions={GLOW_INNER_POSITIONS}
                      />
                    </Rect>
                  </Group>
                </Mask>
              </Group>

              {/* Crisp gradient border (clipped to the rect) */}
              <Group clip={modalClip}>
                <Mask
                  mode="alpha"
                  mask={
                    <RoundedRect
                      x={rectX}
                      y={rectY}
                      width={modalWidth}
                      height={modalHeight}
                      r={MODAL_RADIUS}
                      style="stroke"
                      strokeWidth={4}
                      color="white"
                    />
                  }>
                  <Group transform={glowTransform}>
                    <Rect
                      x={centerX - glowRectSize / 2}
                      y={centerY - glowRectSize / 2}
                      width={glowRectSize}
                      height={glowRectSize}>
                      <SweepGradient
                        c={glowCenter}
                        colors={GLOW_COLORS}
                        positions={GLOW_POSITIONS}
                      />
                    </Rect>
                  </Group>
                </Mask>
              </Group>
            </Canvas>

            <View style={styles.modal}>
              <View style={styles.titleContainer}>
                <TranslateText
                  textKey={'initial_sync_warning_title'}
                  domain={'modals'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.025}
                  textStyle={styles.title}
                  numberOfLines={1}
                />
              </View>
              <View style={styles.textContainer}>
                <TranslateText
                  textKey={'initial_sync_warning'}
                  domain={'modals'}
                  maxSizeInPixels={SCREEN_HEIGHT * 0.022}
                  textStyle={styles.text}
                  numberOfLines={7}
                />
              </View>
              <View style={styles.button}>
                <BlueButton
                  textKey="got_it"
                  textDomain="main"
                  onPress={handleClose}
                  rounded
                />
              </View>
            </View>
          </View>
        </CustomSafeAreaView>
      ) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVisible, handleClose, SCREEN_HEIGHT, styles],
  );

  useEffect(() => {
    showPopUp(modal, 'pop-up-modal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return <></>;
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
      ...StyleSheet.absoluteFill,
      backgroundColor: 'rgba(0, 0, 0, 0.25)',
    },
    modalWrapper: {
      width: screenWidth * 0.9 + GLOW_PADDING * 2,
      height: screenHeight * 0.35 + GLOW_PADDING * 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    glowCanvas: {
      ...StyleSheet.absoluteFill,
    },
    modalBackground: {
      position: 'absolute',
      top: GLOW_PADDING,
      left: GLOW_PADDING,
      width: screenWidth * 0.9,
      height: screenHeight * 0.35,
      borderRadius: MODAL_RADIUS,
      backgroundColor: '#fff',
    },
    modal: {
      position: 'absolute',
      top: GLOW_PADDING,
      left: GLOW_PADDING,
      width: screenWidth * 0.9,
      height: screenHeight * 0.35,
      borderRadius: MODAL_RADIUS,
      padding: 20,
    },
    titleContainer: {
      flex: 0.5,
      alignItems: 'center',
    },
    textContainer: {
      flex: 2,
    },
    title: {
      color: '#000',
      fontSize: screenHeight * 0.025,
      fontWeight: 'bold',
      letterSpacing: -0.18,
    },
    text: {
      color: '#000',
      fontSize: screenHeight * 0.022,
      letterSpacing: -0.18,
    },
    button: {
      width: screenWidth * 0.4,
      alignSelf: 'flex-end',
    },
    transparentBackground: {
      backgroundColor: 'transparent',
    },
    semiBlackBackground: {
      backgroundColor: 'rgba(100, 100, 100, 0.5)',
    },
  });

export default InitialSyncWarningModal;
