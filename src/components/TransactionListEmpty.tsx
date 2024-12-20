import React from 'react';
import {Platform, StyleSheet, Text, View} from 'react-native';

import ProgressBar from './ProgressBar';
import SkeletonTransactionCell from './Cells/SkeletonTransactionCell';
import {useAppSelector} from '../store/hooks';
import {percentSyncedSelector, syncStatusSelector} from '../reducers/info';

interface Props {}

const TransactionListEmpty: React.FC<Props> = () => {
  const progress = useAppSelector(state => percentSyncedSelector(state));
  const synced = useAppSelector(state => syncStatusSelector(state));

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
        <Text style={styles.sectionHeaderText}>LOADING TRANSACTIONS...</Text>
      </View>
      <ProgressBar progress={progress! * 100} />
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
      {/* check if sync has finished */}
      {!synced ? syncingWallet : emptyWallet}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 17,
  },
  headerContainer: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
    paddingLeft: 20,
  },
  sectionHeaderText: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
  },
  emptySectionListContainer: {
    marginTop: 30,
  },
  emptySectionListText: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'center',
  },
});

export default TransactionListEmpty;
