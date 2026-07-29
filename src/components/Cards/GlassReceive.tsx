import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {Pressable, StyleSheet, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Clipboard from '@react-native-clipboard/clipboard';
import Share from 'react-native-share';
import {create as createQrMatrix} from 'qrcode';
import {
  Group,
  Image,
  Paragraph,
  Path,
  Rect,
  RoundedRect,
  Skia,
  TextAlign,
  useImage,
  vec,
} from '@shopify/react-native-skia';
import type {SkParagraph, SkPath} from '@shopify/react-native-skia';
import type {SharedValue} from 'react-native-reanimated';
import {
  cancelAnimation,
  Easing,
  interpolateColor,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {useTranslation} from 'react-i18next';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {
  getAddress,
  setRegularAddressAddress,
  setMWEBAddressAddress,
} from '../../reducers/address';
import {isWalletRpcReady} from '../../reducers/lightning';
import InfoModal from '../Modals/InfoModalContent';
import {CARD_SWAP_SETTLE_MS} from '../GlassBottomSheet';
import {buildParagraph, useSatoshiFontMgr} from '../GlassBalanceGraphics';
import {useCardUnderlay} from '../cardUnderlay';
import {ScreenSizeContext} from '../../context/screenSize';

// skia version of the receive card: the graphics publish into the shared
// glass canvas, so the tab bar refracts the live card and opening the card
// mounts no canvas of its own

const SHIMMER_BASE = 'rgba(244, 244, 244, 0.6)';
const SHIMMER_PEAK = 'rgba(200, 200, 200, 0.9)';
const FRESH_ADDRESS_DELAY_MS = 250;

const buildQrPath = (value: string, size: number): SkPath => {
  const {modules} = createQrMatrix(value, {errorCorrectionLevel: 'M'});
  const cell = size / modules.size;
  // one svg string instead of ~1500 path calls over the JSI bridge
  let d = '';
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.data[row * modules.size + col]) {
        d += `M${col * cell} ${row * cell}h${cell}v${cell}h${-cell}Z`;
      }
    }
  }
  return Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
};

interface HitRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const hitStyle = (rect: HitRect) => ({
  position: 'absolute' as const,
  left: rect.x,
  top: rect.y,
  width: rect.width,
  height: rect.height,
});

// RN borders draw inside the box, so inset the stroke
const FillWithBorder: React.FC<{
  rect: HitRect;
  radius: number;
  fill: string;
  border?: string;
}> = ({rect, radius, fill, border}) => (
  <>
    <RoundedRect
      x={rect.x}
      y={rect.y}
      width={rect.width}
      height={rect.height}
      r={radius}
      color={fill}
    />
    {border ? (
      <RoundedRect
        x={rect.x + 0.5}
        y={rect.y + 0.5}
        width={rect.width - 1}
        height={rect.height - 1}
        r={radius - 0.5}
        style="stroke"
        strokeWidth={1}
        color={border}
      />
    ) : null}
  </>
);

interface Props {
  containerHeight: number;
}

const GlassReceive: React.FC<Props> = ({containerHeight}) => {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const {t} = useTranslation('receiveTab');
  const {address, regularAddress, mwebAddress} = useAppSelector(
    state => state.address!,
  );
  const walletState = useAppSelector(state => state.lightning!.walletState);
  const rpcReady = isWalletRpcReady(walletState);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const fontMgr = useSatoshiFontMgr();
  const shareIcon = useImage(require('../../assets/icons/share-icon.png'));

  const [regularAddressState, setRegularAddressState] =
    useState(regularAddress);
  const [mwebAddressState, setMwebAddressState] = useState(mwebAddress);
  const [isMwebAddress, setIsMwebAddress] = useState(false);
  const [uri, setURI] = useState('');
  const [isInfoModalVisible, setInfoModalVisible] = useState(false);
  const [loading, setLoading] = useState(!(regularAddress && mwebAddress));

  const shownAddress = isMwebAddress ? mwebAddressState : regularAddressState;

  // mount the copied toast after the open animation, it pushes a modal
  // into the root pop-up context
  const [toastMounted, setToastMounted] = useState(false);
  useEffect(() => {
    const timeout = setTimeout(
      () => setToastMounted(true),
      CARD_SWAP_SETTLE_MS,
    );
    return () => clearTimeout(timeout);
  }, []);

  // generate fresh new address on launch, once the wallet RPC is ready;
  // delayed so the QR swap lands after the open animation
  useEffect(() => {
    if (!rpcReady) {
      setLoading(true);
      return;
    }
    const timeout = setTimeout(
      () => dispatch(getAddress()),
      FRESH_ADDRESS_DELAY_MS,
    );
    return () => clearTimeout(timeout);
  }, [rpcReady, dispatch]);

  // update qr code when address changes
  useEffect(() => {
    if (isMwebAddress && address.includes('ltcmweb')) {
      setMwebAddressState(address);
      dispatch(setMWEBAddressAddress(address));
      setURI(address);
    } else if (!isMwebAddress && !address.includes('ltcmweb')) {
      setRegularAddressState(address);
      dispatch(setRegularAddressAddress(address));
      setURI(address);
    }
  }, [address, isMwebAddress, dispatch]);

  // handle loading indicator
  useEffect(() => {
    if (!shownAddress) {
      setLoading(true);
    }
    const timeout = setTimeout(() => setLoading(!shownAddress), 500);
    return () => clearTimeout(timeout);
  }, [shownAddress]);

  // copy/share the shown address, redux may briefly hold the other type
  const handleCopy = () => {
    setInfoModalVisible(true);
    Clipboard.setString(shownAddress);
  };

  const handleShare = () => {
    Share.open({message: shownAddress});
  };

  const selectAddressType = (mweb: boolean) => {
    dispatch(getAddress(mweb));
    setIsMwebAddress(mweb);
  };

  const qrSize =
    (isMwebAddress ? SCREEN_HEIGHT * 0.22 : SCREEN_HEIGHT * 0.27) -
    insets.bottom;
  const qrPath = useMemo(
    () => (uri ? buildQrPath(uri, qrSize) : null),
    [uri, qrSize],
  );

  // layout mirrors the original RN card
  const layout = useMemo(() => {
    if (!fontMgr) {
      return null;
    }
    const W = SCREEN_WIDTH;
    const H = SCREEN_HEIGHT;
    const padX = W * 0.06;
    const innerW = W - padX * 2;
    const radius = H * 0.012;

    const title = buildParagraph(
      fontMgr,
      t('receive_ltc'),
      H * 0.025,
      700,
      '#2E2E2E',
      innerW,
    );

    const pillH = H * 0.044;
    const pillTop = title.getHeight() + H * 0.019;
    const makePill = (
      id: string,
      label: string,
      active: boolean,
      x: number,
    ) => {
      const text = buildParagraph(
        fontMgr,
        label,
        H * 0.017,
        500,
        active ? '#FFFFFF' : '#2E2E2E',
        innerW,
      );
      // inactive pills include their 1px borders in the width
      const width = Math.max(
        H * 0.15,
        text.getLongestLine() + W * 0.02 * 2 + (active ? 0 : 2),
      );
      return {
        id,
        text,
        active,
        rect: {x, y: pillTop, width, height: pillH},
        textX: x + (width - text.getLongestLine()) / 2,
        textY: pillTop + (pillH - text.getHeight()) / 2,
        cx: x + width / 2,
        cy: pillTop + pillH / 2,
      };
    };
    const pill1 = makePill('ltc', 'Litecoin', !isMwebAddress, padX);
    const pill2 = makePill(
      'mweb',
      t('receive_privately'),
      isMwebAddress,
      padX + pill1.rect.width + 8,
    );

    const subtitleY = pillTop + pillH + H * 0.022;
    const subtitle = buildParagraph(
      fontMgr,
      t('my_ltc_address'),
      H * 0.017,
      700,
      '#747E87',
      innerW,
    );
    const addressTop = subtitleY + subtitle.getHeight();

    const lineH = H * 0.022;
    const lineGap = H * 0.01;
    let addressBottom = addressTop;
    let addressRow: {
      paragraph: SkParagraph;
      paraX: number;
      paraY: number;
      paraW: number;
      copyRect: HitRect;
      share: {
        rect: HitRect;
        cx: number;
        cy: number;
        iconX: number;
        iconY: number;
      };
    } | null = null;
    let skeletonLines: (HitRect & {short: boolean})[] | null = null;
    if (loading) {
      skeletonLines = [];
      const fullLines = isMwebAddress ? 3 : 1;
      for (let i = 0; i <= fullLines; i++) {
        const short = i === fullLines;
        skeletonLines.push({
          x: padX,
          y: addressTop + lineGap * (i + 1) + lineH * i,
          width: short ? innerW * 0.7 : innerW,
          height: lineH,
          short,
        });
      }
      addressBottom = addressTop + (lineGap + lineH) * (fullLines + 1);
    } else {
      const paragraph = buildParagraph(
        fontMgr,
        shownAddress,
        H * 0.021,
        700,
        '#20BB74',
        innerW * 0.8,
        {},
      );
      const btnW = H * 0.067;
      const btnH = H * 0.055;
      const rowTop = addressTop + H * 0.007;
      const rowH = Math.max(paragraph.getHeight(), btnH);
      const btn = {
        x: padX + innerW - btnW,
        y: rowTop + (rowH - btnH) / 2,
        width: btnW,
        height: btnH,
      };
      addressRow = {
        paragraph,
        paraX: padX,
        paraY: rowTop + (rowH - paragraph.getHeight()) / 2,
        paraW: innerW * 0.8,
        copyRect: {x: padX, y: rowTop, width: innerW * 0.8, height: rowH},
        share: {
          rect: btn,
          cx: btn.x + btnW / 2,
          cy: btn.y + btnH / 2,
          // share icon renders at its intrinsic 26x24
          iconX: btn.x + (btnW - 26) / 2,
          iconY: btn.y + (btnH - 24) / 2,
        },
      };
      addressBottom = rowTop + rowH;
    }

    const qrPadY = H * 0.02;
    const qrCard = {
      x: padX,
      y: addressBottom + W * 0.06,
      width: innerW,
      height: qrSize + qrPadY * 2 + 2,
    };
    const qr = {x: (W - qrSize) / 2, y: qrCard.y + 1 + qrPadY};
    const spinnerBox = H * 0.1;
    const spinner = {
      x: padX + (innerW - spinnerBox) / 2,
      y: qrCard.y + (qrCard.height - spinnerBox) / 2,
      size: spinnerBox,
      cx: padX + innerW / 2,
      cy: qrCard.y + qrCard.height / 2,
    };

    let note: {
      paragraph: SkParagraph;
      x: number;
      y: number;
      width: number;
    } | null = null;
    if (isMwebAddress) {
      const noteW = innerW - W * 0.3;
      note = {
        paragraph: buildParagraph(
          fontMgr,
          t('receive_mweb_description'),
          H * 0.012,
          700,
          '#747E87',
          noteW,
          {align: TextAlign.Center, maxLines: 3, ellipsis: '…'},
        ),
        x: padX + W * 0.15,
        y: qrCard.y + qrCard.height + W * 0.03,
        width: noteW,
      };
    }

    return {
      radius,
      title,
      titleX: padX,
      innerW,
      pill1,
      pill2,
      subtitle,
      subtitleY,
      addressRow,
      skeletonLines,
      qrCard,
      qr,
      spinner,
      note,
      contentBottom: note
        ? note.y + note.paragraph.getHeight()
        : qrCard.y + qrCard.height,
    };
  }, [
    fontMgr,
    t,
    loading,
    isMwebAddress,
    shownAddress,
    qrSize,
    SCREEN_WIDTH,
    SCREEN_HEIGHT,
  ]);

  // press feedback, same springs as NewBlueButton / NewButton
  const pill1Scale = useSharedValue(1);
  const pill2Scale = useSharedValue(1);
  const shareScale = useSharedValue(1);
  const pill1Transform = useDerivedValue(() => [{scale: pill1Scale.value}]);
  const pill2Transform = useDerivedValue(() => [{scale: pill2Scale.value}]);
  const shareTransform = useDerivedValue(() => [{scale: shareScale.value}]);
  const pressHandlers = (scale: SharedValue<number>, pressedScale: number) => ({
    onPressIn: () => {
      scale.value = withSpring(pressedScale, {mass: 1});
    },
    onPressOut: () => {
      scale.value = withSpring(1, {mass: 0.7});
    },
  });

  // skeleton shimmer + spinner, same look as SkeletonLines / LoadingIndicator
  const shimmerFull = useSharedValue(0);
  const shimmerShort = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    if (!loading) {
      cancelAnimation(shimmerFull);
      cancelAnimation(shimmerShort);
      cancelAnimation(spin);
      return;
    }
    const sweep = () =>
      withDelay(
        500,
        withTiming(1, {duration: 1000, easing: Easing.inOut(Easing.ease)}),
      );
    shimmerFull.value = 0;
    shimmerShort.value = 0;
    shimmerFull.value = withRepeat(sweep(), -1, false);
    shimmerShort.value = withDelay(500, withRepeat(sweep(), -1, false));
    spin.value = 0;
    spin.value = withRepeat(
      withTiming(2 * Math.PI, {duration: 900, easing: Easing.linear}),
      -1,
      false,
    );
  }, [loading, shimmerFull, shimmerShort, spin]);
  const shimmerFullTransform = useDerivedValue(() => [
    {translateX: shimmerFull.value * SCREEN_WIDTH},
  ]);
  const shimmerShortTransform = useDerivedValue(() => [
    {translateX: shimmerShort.value * SCREEN_WIDTH * 0.7},
  ]);
  const shimmerFullColor = useDerivedValue(() =>
    interpolateColor(shimmerFull.value, [0, 1], [SHIMMER_BASE, SHIMMER_PEAK]),
  );
  const shimmerShortColor = useDerivedValue(() =>
    interpolateColor(shimmerShort.value, [0, 1], [SHIMMER_BASE, SHIMMER_PEAK]),
  );
  const spinTransform = useDerivedValue(() => [{rotate: spin.value}]);
  const spinnerArc = useMemo(() => {
    const r = SCREEN_HEIGHT * 0.028;
    const path = Skia.Path.Make();
    path.addArc(Skia.XYWHRect(-r, -r, r * 2, r * 2), 0, 270);
    return path;
  }, [SCREEN_HEIGHT]);

  const closeInfoModal = useCallback(() => setInfoModalVisible(false), []);

  const styles = useMemo(() => getStyles(containerHeight), [containerHeight]);

  const graphics = layout ? (
    <>
      <Paragraph
        paragraph={layout.title}
        x={layout.titleX}
        y={0}
        width={layout.innerW}
      />
      {[
        {pill: layout.pill1, transform: pill1Transform},
        {pill: layout.pill2, transform: pill2Transform},
      ].map(({pill, transform}) => (
        <Group
          key={pill.id}
          origin={vec(pill.cx, pill.cy)}
          transform={transform}>
          <FillWithBorder
            rect={pill.rect}
            radius={layout.radius}
            fill={pill.active ? '#2C72FF' : '#FEFEFE'}
            border={pill.active ? undefined : 'rgb(216, 210, 210)'}
          />
          <Paragraph
            paragraph={pill.text}
            x={pill.textX}
            y={pill.textY}
            width={layout.innerW}
          />
        </Group>
      ))}
      <Paragraph
        paragraph={layout.subtitle}
        x={layout.titleX}
        y={layout.subtitleY}
        width={layout.innerW}
      />
      {layout.skeletonLines?.map((line, index) => (
        <Group
          key={index}
          clip={Skia.RRectXY(
            Skia.XYWHRect(line.x, line.y, line.width, line.height),
            3,
            3,
          )}>
          <Rect
            x={line.x}
            y={line.y}
            width={line.width}
            height={line.height}
            color="#F4F4F4"
          />
          <Rect
            x={line.x}
            y={line.y}
            width={line.width}
            height={line.height}
            color={line.short ? shimmerShortColor : shimmerFullColor}
            transform={
              line.short ? shimmerShortTransform : shimmerFullTransform
            }
          />
        </Group>
      ))}
      {layout.addressRow ? (
        <>
          <Paragraph
            paragraph={layout.addressRow.paragraph}
            x={layout.addressRow.paraX}
            y={layout.addressRow.paraY}
            width={layout.addressRow.paraW}
          />
          <Group
            origin={vec(layout.addressRow.share.cx, layout.addressRow.share.cy)}
            transform={shareTransform}>
            <FillWithBorder
              rect={layout.addressRow.share.rect}
              radius={layout.radius}
              fill="#FEFEFE"
              border="rgba(216, 210, 210, 0.75)"
            />
            <Image
              image={shareIcon}
              fit="contain"
              x={layout.addressRow.share.iconX}
              y={layout.addressRow.share.iconY}
              width={26}
              height={24}
            />
          </Group>
        </>
      ) : null}
      <FillWithBorder
        rect={layout.qrCard}
        radius={layout.radius}
        fill="#FEFEFE"
        border="rgba(217, 217, 217, 0.45)"
      />
      {!loading && qrPath ? (
        <>
          <Rect
            x={layout.qr.x}
            y={layout.qr.y}
            width={qrSize}
            height={qrSize}
            color="#FFFFFF"
          />
          <Group
            transform={[{translateX: layout.qr.x}, {translateY: layout.qr.y}]}>
            <Path path={qrPath} color="#000000" />
          </Group>
        </>
      ) : null}
      {loading ? (
        <>
          <RoundedRect
            x={layout.spinner.x}
            y={layout.spinner.y}
            width={layout.spinner.size}
            height={layout.spinner.size}
            r={SCREEN_HEIGHT * 0.015}
            color="rgba(19, 58, 138, 0.8)"
          />
          <Group
            transform={[
              {translateX: layout.spinner.cx},
              {translateY: layout.spinner.cy},
            ]}>
            <Group transform={spinTransform}>
              <Path
                path={spinnerArc}
                style="stroke"
                strokeWidth={SCREEN_HEIGHT * 0.008}
                strokeCap="round"
                color="#FFFFFF"
              />
            </Group>
          </Group>
        </>
      ) : null}
      {layout.note ? (
        <Paragraph
          paragraph={layout.note.paragraph}
          x={layout.note.x}
          y={layout.note.y}
          width={layout.note.width}
        />
      ) : null}
    </>
  ) : null;
  useCardUnderlay(graphics, true);

  return (
    <>
      <View style={styles.container}>
        {layout ? (
          <>
            <Pressable
              style={hitStyle(layout.pill1.rect)}
              {...pressHandlers(pill1Scale, 0.93)}
              onPress={() => selectAddressType(false)}
            />
            <Pressable
              style={hitStyle(layout.pill2.rect)}
              {...pressHandlers(pill2Scale, 0.93)}
              onPress={() => selectAddressType(true)}
            />
            {layout.addressRow ? (
              <>
                <Pressable
                  style={hitStyle(layout.addressRow.copyRect)}
                  onPress={handleCopy}
                />
                <Pressable
                  style={hitStyle(layout.addressRow.share.rect)}
                  {...pressHandlers(shareScale, 0.9)}
                  onPress={handleShare}
                />
              </>
            ) : null}
          </>
        ) : null}
      </View>

      {toastMounted ? (
        <InfoModal
          isVisible={isInfoModalVisible}
          close={closeInfoModal}
          textColor="green"
          textKey="copied"
          textDomain="main"
          disableBlur={true}
        />
      ) : null}
    </>
  );
};

const getStyles = (height: number) =>
  StyleSheet.create({
    container: {
      height,
      backgroundColor: '#f7f7f7',
    },
  });

export default GlassReceive;
