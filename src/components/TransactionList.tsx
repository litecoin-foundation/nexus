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
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import {SharedValue} from 'react-native-reanimated';

import {useAppDispatch} from '../store/hooks';
import {getTransactions} from '../reducers/transaction';
import TransactionCell from './Cells/TransactionCell';

interface Props {
  onPress(item: ItemType): void;
  transactions: ITransactions[];
  onViewableItemsChanged(): void;
  scrollOffset: SharedValue<number>;
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

  const {onPress, transactions, onViewableItemsChanged, scrollOffset} = props;
  const dispatch = useAppDispatch();

  const [refreshing, setRefreshing] = useState<boolean>(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    dispatch(getTransactions());
    setRefreshing(false);
  }, [dispatch]);

  const EmptySectionList = (
    <View style={{marginTop: 17}}>
      <View
        style={{
          paddingBottom: 6,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(214, 216, 218, 0.3)',
          paddingLeft: 20,
        }}>
        <Text style={styles.sectionHeaderText}>LOADING TRANSACTIONS...</Text>
      </View>
      {/* <View style={styles.emptySectionListContainer}>
        <Text style={styles.emptySectionListText}>
          Your transactions will appear here.
        </Text>
      </View> */}
    </View>
  );

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => <TransactionCell item={item} onPress={() => onPress(item)} />;

  return (
    <SectionList
      bounces={false}
      scrollEventThrottle={1}
      onScrollBeginDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.value = e.nativeEvent.contentOffset.y;
      }}
      ref={transactionListRef}
      sections={transactions}
      stickySectionHeadersEnabled={true}
      renderItem={renderItem}
      viewabilityConfig={{viewAreaCoveragePercentThreshold: 80}}
      renderSectionHeader={({section}) => (
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionHeaderText}>{section.title}</Text>
        </View>
      )}
      keyExtractor={item => item.hash}
      initialNumToRender={9}
      ListEmptyComponent={EmptySectionList}
      ListFooterComponent={<View style={styles.emptyView} />}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      onViewableItemsChanged={onViewableItemsChanged}
    />
  );
});

const styles = StyleSheet.create({
  container: {
    height: 400,
  },
  sectionHeaderContainer: {
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
    backgroundColor: 'white',
    paddingLeft: 20,
  },
  sectionHeaderText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 12,
  },
  emptySectionListContainer: {
    marginTop: 30,
  },
  emptySectionListText: {
    fontFamily:
      Platform.OS === 'ios'
        ? 'Satoshi Variable'
        : 'SatoshiVariable-Regular.ttf',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 12,
    color: '#747E87',
    textAlign: 'center',
  },
  emptyView: {
    height: 350,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
  },
});

export default TransactionList;
