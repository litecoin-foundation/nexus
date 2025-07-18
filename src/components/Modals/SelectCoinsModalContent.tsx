import React, {useContext, Fragment, useMemo} from 'react';
import {ScrollView, View, StyleSheet, Platform} from 'react-native';
import Animated from 'react-native-reanimated';
import {v4 as uuidv4} from 'uuid';

import GreyRoundButton from '../Buttons/GreyRoundButton';
import TableTitle from '../Cells/TableTitle';
import TableCheckbox from '../Cells/TableCheckbox';
import BlueButton from '../Buttons/BlueButton';

// import {useAppDispatch, useAppSelector} from '../../store/hooks';
// import {
//   satsToSubunitSelector,
// } from '../../reducers/settings';

import TranslateText from '../../components/TranslateText';
import ProgressBar from '../../components/ProgressBar';

import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  close: () => void;
  cardTranslateAnim: any;
}

type PublicCoin = {
  title: string;
  balance: number;
  checked: boolean;
  check: (select: boolean) => void;
};

type PrivateCoin = {
  title: string;
  balance: number;
  checked: boolean;
  check: (select: boolean) => void;
};

interface SelectCoinsLayoutProps {
  publicCoins: PublicCoin[];
  privateCoins: PrivateCoin[];
}

export default function SelectCoinsModalContent(props: Props) {
  const {close, cardTranslateAnim} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  // const dispatch = useAppDispatch();

  // const convertToSubunit = useAppSelector(state =>
  //   satsToSubunitSelector(state),
  // );
  // const cryptoAmount = convertToSubunit(transaction.amount);
  // let cryptoAmountFormatted = cryptoAmount.toFixed(4);
  // if (cryptoAmountFormatted.match(/\./)) {
  //   cryptoAmountFormatted = cryptoAmountFormatted.replace(/\.?0+$/, '');
  // }

  const publicCoins: PublicCoin[] = [
    {title: 'Coin 1', balance: 100, checked: true, check: () => {}},
    {title: 'Coin 2', balance: 100, checked: false, check: () => {}},
    {title: 'Coin 3', balance: 100, checked: false, check: () => {}},
    {title: 'Coin 4', balance: 100, checked: false, check: () => {}},
    {title: 'Coin 5', balance: 100, checked: false, check: () => {}},
  ];
  const privateCoins: PrivateCoin[] = [
    {title: 'Coin 1', balance: 100, checked: true, check: () => {}},
    {title: 'Coin 2', balance: 100, checked: false, check: () => {}},
  ];

  return (
    <Animated.View style={[styles.container, cardTranslateAnim]}>
      <View style={styles.body}>
        <View style={styles.headerContainer}>
          <TranslateText
            textKey={'select_coins'}
            domain={'sendTab'}
            maxSizeInPixels={SCREEN_HEIGHT * 0.027}
            textStyle={styles.headerTitle}
            numberOfLines={1}
          />
          <GreyRoundButton onPress={() => close()} />
        </View>
        <View style={styles.modalContentContainer}>
          <SelectCoinsLayout
            publicCoins={publicCoins}
            privateCoins={privateCoins}
          />
        </View>
      </View>
    </Animated.View>
  );
}

const SelectCoinsLayout: React.FC<SelectCoinsLayoutProps> = props => {
  const {publicCoins, privateCoins} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const confirmSelection = () => {};

  const renderPublicCoins = useMemo(
    () =>
      publicCoins.map(publicCoin => (
        <TableCheckbox
          title={publicCoin.title}
          value={`LTC ${publicCoin.balance}`}
          callback={publicCoin.check}
          initialState={publicCoin.checked}
          noBorder
          bgColor={'#f7f7f7'}
          key={uuidv4()}
        />
      )),
    [publicCoins],
  );

  const renderPrivateCoins = useMemo(
    () =>
      privateCoins.map(privateCoin => (
        <TableCheckbox
          title={privateCoin.title}
          value={`LTC ${privateCoin.balance}`}
          callback={privateCoin.check}
          initialState={privateCoin.checked}
          noBorder
          bgColor={'#f7f7f7'}
          key={uuidv4()}
        />
      )),
    [privateCoins],
  );

  return (
    <Fragment>
      <View style={styles.topContainer}>
        <TableTitle
          titleTextKey="private_coins"
          titleTextDomain="sendTab"
          color="#7c97ad"
          rightTitleTextKey="low_privacy_risk"
          rightTitleTextDomain="sendTab"
          rightColor="#20BB74"
          thick
          noBorder
          bgColor={'#f7f7f7'}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderPublicCoins}
        </ScrollView>
        <TableTitle
          titleTextKey="public_coins"
          titleTextDomain="sendTab"
          color="#7c97ad"
          rightTitleTextKey="high_privacy_risk"
          rightTitleTextDomain="sendTab"
          rightColor="#bb2038"
          thick
          noBorder
          bgColor={'#f7f7f7'}
        />
        <ScrollView contentContainerStyle={styles.scroll}>
          {renderPrivateCoins}
        </ScrollView>
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.requiredVsSelected}>
          <View style={styles.requiredVsSelectedTitleContainer}>
            <TableTitle
              titleTextKey="required"
              titleTextDomain="sendTab"
              titleInterpolationObj={{amount: 100}}
              titleFontSize={SCREEN_HEIGHT * 0.017}
              rightTitleTextKey="selected"
              rightTitleTextDomain="sendTab"
              rightTitleInterpolationObj={{amount: 100}}
              rightTitleFontSize={SCREEN_HEIGHT * 0.017}
              rightColor="#2C72FF"
              thick
              noBorder
            />
          </View>
          <View style={styles.progressBarContainer}>
            <ProgressBar
              percentageProgress={10}
              color={'#d8d8d8'}
              height={SCREEN_HEIGHT * 0.005}
              rounded
            />
          </View>
          <View style={styles.progressBarContainer}>
            <ProgressBar
              percentageProgress={80}
              color={'#2C72FF'}
              height={SCREEN_HEIGHT * 0.005}
              rounded
            />
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <BlueButton
            textKey="confirm_selection"
            textDomain="sendTab"
            onPress={confirmSelection}
            rounded
          />
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      bottom: 0,
      height: '100%',
      width: '100%',
    },
    body: {
      height: '100%',
      width: '100%',
      borderRadius: Platform.OS === 'ios' ? screenHeight * 0.04 : 0,
      backgroundColor: '#fff',
      overflow: 'hidden',
    },
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    headerContainer: {
      width: '100%',
      backgroundColor: '#f7f7f7',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: screenHeight * 0.015,
      paddingHorizontal: screenHeight * 0.025,
    },
    headerTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.028,
      fontWeight: '700',
      flexDirection: 'row',
      fontFamily: 'Satoshi Variable',
    },
    modalContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    topContainer: {
      flex: 1,
      backgroundColor: '#f7f7f7',
      flexDirection: 'column',
      overflow: 'hidden',
    },
    scroll: {
      flexBasis: '50%',
    },
    bottomContainer: {
      flexDirection: 'column',
      paddingHorizontal: screenWidth * 0.05,
    },
    requiredVsSelected: {
      gap: 5,
      paddingBottom: screenHeight * 0.02,
    },
    // offset padding in bottomContainer
    requiredVsSelectedTitleContainer: {
      width: screenWidth,
      left: screenWidth * 0.05 * -1,
    },
    progressBarContainer: {
      width: '100%',
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
    },
  });
