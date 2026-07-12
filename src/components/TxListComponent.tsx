import React, {memo, useContext} from 'react';
import {View, StyleSheet, Pressable, Image} from 'react-native';
import {SharedValue} from 'react-native-reanimated';

import TransactionList from './TransactionList';
import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';

interface TxListComponentProps {
  selectTransaction: (option: any) => void;
  setTxDetailModalOpened: (option: boolean) => void;
  foldUnfoldBottomSheet: (option: boolean) => void;
  isBottomSheetFolded: boolean;
  navigation: any;
  mainSheetsTranslationY: SharedValue<number>;
  mainSheetsTranslationYStart: SharedValue<number>;
}

const TxListComponent: React.FC<TxListComponentProps> = memo(props => {
  const {
    selectTransaction,
    setTxDetailModalOpened,
    foldUnfoldBottomSheet,
    isBottomSheetFolded,
    navigation,
    mainSheetsTranslationY,
    mainSheetsTranslationYStart,
  } = props;
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View>
      <View style={styles.txTitleContainer}>
        <TranslateText
          textKey={'latest_txs'}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.025}
          maxLengthInPixels={SCREEN_WIDTH * 0.8}
          textStyle={styles.txTitleText}
          numberOfLines={1}
        />

        <Pressable
          style={styles.txSearchBtnContainer}
          onPress={() => navigation.navigate('SearchTransaction')}>
          <View style={styles.txSearchBtn}>
            <Image
              source={require('../assets/icons/search-icon.png')}
              style={styles.txSearchIcon}
              resizeMode="contain"
            />
          </View>
        </Pressable>
      </View>
      <TransactionList
        onPress={data => {
          selectTransaction(data);
          setTxDetailModalOpened(true);
        }}
        headerBackgroundColor="#F7F7F7"
        folded={isBottomSheetFolded}
        foldUnfold={(isFolded: boolean) => foldUnfoldBottomSheet(isFolded)}
        mainSheetsTranslationY={mainSheetsTranslationY}
        mainSheetsTranslationYStart={mainSheetsTranslationYStart}
      />
    </View>
  );
});

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    txTitleContainer: {
      width: '100%',
      height: screenHeight * 0.074,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    txTitleText: {
      color: '#2E2E2E',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.025,
      fontWeight: '500',
      letterSpacing: -0.59,
      paddingLeft: screenWidth * 0.04,
    },
    txSearchBtnContainer: {
      width: screenHeight * 0.074,
      height: screenHeight * 0.074,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txSearchBtn: {
      width: screenHeight * 0.054,
      height: screenHeight * 0.054,
      borderRadius: screenHeight * 0.022,
      backgroundColor: 'white',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 3},
      shadowOpacity: 0.07,
      shadowRadius: 4,
      elevation: 3,
    },
    txSearchIcon: {
      width: screenHeight * 0.022,
      height: screenHeight * 0.022,
    },
  });

export default TxListComponent;
