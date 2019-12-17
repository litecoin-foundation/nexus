import React from 'react';
import {View, SectionList, Text, StyleSheet} from 'react-native';
import PropTypes from 'prop-types';
import {useSelector} from 'react-redux';

import TransactionCell from './Cells/TransactionCell';
import {groupBy} from '../lib/utils';
import {txDetailSelector} from '../reducers/transaction';

const TransactionList = props => {
  const {onPress} = props;

  const transactions = useSelector(state => txDetailSelector(state));
  const groupedTransactions = groupBy(transactions, 'day');

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
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 450,
  },
  sectionHeader: {
    color: '#7C96AE',
    backgroundColor: 'white',
    opacity: 0.9,
    fontSize: 11,
    letterSpacing: -0.28,
    paddingLeft: 10,
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
