import React, {
  useCallback,
  useState,
  forwardRef,
  useRef,
  useImperativeHandle,
  MutableRefObject,
} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SectionList,
  RefreshControl,
  SectionListRenderItem,
} from 'react-native';

import {useAppDispatch} from '../store/hooks';
import {getTransactions} from '../reducers/transaction';
import TransactionCell from './Cells/TransactionCell';

interface Props {
  onPress(item: ItemType): void;
  transactions: ITransactions[];
  onViewableItemsChanged(): void;
}

interface ITransactions {
  title: string;
  data: IData[];
}

interface IData {
  hash: string;
  amount: number;
  confs: number;
  day: string;
  fee: undefined;
  lightning: boolean;
  sent: boolean;
  time: Date;
  addresses: string[];
  timestamp: number;
}

type ItemType = {
  time: Date;
  amount: number;
  sent: boolean;
  hash: string;
};

const TransactionList = forwardRef((props: Props, ref) => {
  const transactionListRef = useRef() as MutableRefObject<
    SectionList<any, ITransactions>
  >;

  useImperativeHandle(ref, () => ({
    scrollToLocation: (sectionIndex: number) => {
      transactionListRef.current?.scrollToLocation({
        animated: true,
        sectionIndex: sectionIndex,
        itemIndex: 0,
        viewPosition: 0,
      });
    },
  }));

  const {onPress, transactions, onViewableItemsChanged} = props;
  const dispatch = useAppDispatch();

  const [refreshing, setRefreshing] = useState<boolean>(false);

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

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => <TransactionCell item={item} onPress={() => onPress(item)} />;

  return (
    <View style={styles.container}>
      <SectionList
        ref={transactionListRef}
        sections={transactions}
        stickySectionHeadersEnabled={true}
        renderItem={renderItem}
        viewabilityConfig={{viewAreaCoveragePercentThreshold: 80}}
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
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </View>
  );
});

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
    height: 350,
  },
});

export default TransactionList;
