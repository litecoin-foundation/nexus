import React, {useState, useCallback} from 'react';
import {
  View,
  SectionList,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import PropTypes from 'prop-types';
import {useSelector, useDispatch} from 'react-redux';

import TransactionCell from './Cells/TransactionCell';
import {groupBy} from '../lib/utils';
import {txDetailSelector, getTransactions} from '../reducers/transaction';

const TransactionList = props => {
  const {onPress} = props;
  const dispatch = useDispatch();

  const [refreshing, setRefreshing] = useState(false);
  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupBy(transactions, 'day');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getTransactions());
    setRefreshing(false);
  }, [dispatch]);

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <Text style={styles.emptySectionListText}>
        Your transactions will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <SectionList
        sections={groupedTransactions}
        renderItem={({item}) => (
          <TransactionCell item={item} onPress={() => onPress(item)} />
        )}
        renderSectionHeader={({section}) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        keyExtractor={item => item.hash}
        initialNumToRender={7}
        ListEmptyComponent={EmptySectionList}
        ListFooterComponent={<View style={styles.emptyView} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    color: '#7C96AE',
    backgroundColor: 'rgb(238,244,249)',
    opacity: 0.9,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.28,
    paddingLeft: 15,
    paddingTop: 4,
    paddingBottom: 4,
  },
  emptySectionListContainer: {
    marginTop: 30,
  },
  emptySectionListText: {
    color: '#7C96AE',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyView: {
    height: 110,
  },
});

TransactionList.propTypes = {
  groupedTransactions: PropTypes.arrayOf(PropTypes.object),
  onPress: PropTypes.func.isRequired,
};

export default TransactionList;
