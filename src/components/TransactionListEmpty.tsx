import React, {useEffect, useContext} from 'react';
import {StyleSheet, View} from 'react-native';

import SkeletonTransactionCell from './Cells/SkeletonTransactionCell';
import {useAppSelector, useAppDispatch} from '../store/hooks';
import {
  decimalSyncedSelector,
  syncStatusSelector,
  getRecoveryInfo,
  pollRecoveryInfo,
} from '../reducers/info';

import {ScreenSizeContext} from '../context/screenSize';
import TranslateText from './TranslateText';

interface Props {}

const TransactionListEmpty: React.FC<Props> = () => {
  const progress = useAppSelector(state => decimalSyncedSelector(state));
  const synced = useAppSelector(state => syncStatusSelector(state));
  const recoveryMode = useAppSelector(state => state.info.recoveryMode);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const dispatch = useAppDispatch();

  useEffect(() => {
    if (recoveryMode) {
      dispatch(pollRecoveryInfo());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recoveryMode]);

  useEffect(() => {
    if ((progress && progress > 0.999) || synced) {
      dispatch(getRecoveryInfo());
      // TODO: poll periodically, otherwise updates too often
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, synced]);

  const emptyWallet = (
    <View style={styles.emptySectionListContainer}>
      <TranslateText
        textKey="empty_transactions"
        domain="main"
        textStyle={styles.emptySectionListText}
        maxSizeInPixels={SCREEN_HEIGHT * 0.022}
      />
    </View>
  );

  const syncingWallet = (
    <>
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
      <SkeletonTransactionCell />
    </>
  );

  return (
    <View style={styles.container}>
      {!synced || recoveryMode ? syncingWallet : emptyWallet}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      marginTop: screenHeight * 0.017,
    },
    headerContainer: {
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(214, 216, 218, 0.3)',
      paddingLeft: screenHeight * 0.02,
    },
    sectionHeaderText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      color: '#747E87',
      fontSize: screenHeight * 0.012,
    },
    emptySectionListContainer: {
      marginTop: screenHeight * 0.03,
    },
    emptySectionListText: {
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '700',
      fontSize: screenHeight * 0.012,
      color: '#747E87',
      textAlign: 'center',
    },
  });

export default TransactionListEmpty;
