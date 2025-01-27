import React, {useEffect, useContext} from 'react';
import {StyleSheet, Text, View} from 'react-native';

import ProgressBar from './ProgressBar';
import SkeletonTransactionCell from './Cells/SkeletonTransactionCell';
import {useAppSelector, useAppDispatch} from '../store/hooks';
import {
  percentSyncedSelector,
  syncStatusSelector,
  recoveryProgressSelector,
  getRecoveryInfo,
  pollRecoveryInfo,
} from '../reducers/info';

import {ScreenSizeContext} from '../context/screenSize';

interface Props {}

const TransactionListEmpty: React.FC<Props> = () => {
  const progress = useAppSelector(state => percentSyncedSelector(state));
  const synced = useAppSelector(state => syncStatusSelector(state));
  const recoveryMode = useAppSelector(state => state.info.recoveryMode);
  const recoveryProgress = useAppSelector(state =>
    recoveryProgressSelector(state),
  );

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
      <Text style={styles.emptySectionListText}>
        Your transactions will appear here.
      </Text>
    </View>
  );

  const syncingWallet = (
    <>
      <View style={styles.headerContainer}>
        <Text style={styles.sectionHeaderText}>
          {recoveryMode
            ? 'RECOVERING TRANSACTIONS...'
            : 'LOADING TRANSACTIONS...'}
        </Text>
      </View>
      {recoveryMode ? (
        <ProgressBar progress={recoveryProgress! * 100} />
      ) : (
        <ProgressBar progress={progress! * 100} />
      )}
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
