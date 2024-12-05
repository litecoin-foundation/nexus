import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  MutableRefObject,
  useEffect,
  useState,
} from 'react';
import {
  Dimensions,
  StyleSheet,
  Text,
  View,
  SectionList,
  SectionListRenderItem,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import TransactionCell from './Cells/TransactionCell';
import TransactionListEmpty from './TransactionListEmpty';
import {getTransactions} from '../reducers/transaction';
import {useAppDispatch, useAppSelector} from '../store/hooks';

import {txDetailSelector} from '../reducers/transaction';
import {groupTransactions} from '../lib/utils/groupTransactions';

interface Props {
  onPress(item: ItemType): void;
  onViewableItemsChanged?(): void;
  folded?: boolean;
  foldUnfold?: (isFolded: boolean) => void;
  transactionType?: string;
}

interface ITransactions {
  title: string;
  data: IData[];
}

interface IData {
  hash: string;
  blockHeight: number;
  amount: number;
  confs: number;
  day: string;
  fee: undefined;
  lightning: boolean;
  sent: boolean;
  time: Date;
  addresses: string[];
  inputTxs: string[];
  timestamp: number;
}

type ItemType = {
  time: Date;
  amount: number;
  sent: boolean;
  hash: string;
};

const UNFOLD_SHEET_POINT = Dimensions.get('screen').height * 0.24;
const FOLD_SHEET_POINT = Dimensions.get('screen').height * 0.47;

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

  const {onPress, onViewableItemsChanged, folded, foldUnfold, transactionType} =
    props;

  const transactions = useAppSelector(state => txDetailSelector(state));
  const [displayedTxs, setDisplayedTxs] = useState<any[]>([]);

  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(getTransactions());
  }, [dispatch]);

  useEffect(() => {
    setDisplayedTxs(groupTransactions(transactions));
  }, [transactions]);

  const filterTransactions = (transactionTypeProp: string | undefined) => {
    const txArray = [];

    switch (transactionTypeProp) {
      case 'Buy':
      case 'Sell':
      case 'Send':
      case 'Receive':
        txArray.push(
          ...transactions.filter((tx: any) => tx.metaLabel === transactionTypeProp),
        );
        break;
      case 'All':
      default:
        txArray.push(...transactions);
        break;
    }

    setDisplayedTxs(groupTransactions(txArray));
  };

  useEffect(() => {
    filterTransactions(transactionType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionType]);

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => <TransactionCell item={item} onPress={() => onPress(item)} />;

  // DashboardButton is 110, txTitleContainer is 70
  const scrollContainerHeight = folded
    ? Dimensions.get('screen').height - FOLD_SHEET_POINT - 110 - 70
    : Dimensions.get('screen').height - UNFOLD_SHEET_POINT - 110 - 70;

  let curFrameY = -1;

  return (
    <View style={{height: scrollContainerHeight}}>
      <SectionList
        bounces={false}
        scrollEventThrottle={1}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const direction =
            e.nativeEvent.contentOffset.y > curFrameY ? 'down' : 'up';
          const maxOffset = Math.floor(
            Number(e.nativeEvent.contentSize.height) -
              Number(e.nativeEvent.layoutMeasurement.height),
          );
          if (direction === 'up' && curFrameY === maxOffset) {
            if (typeof foldUnfold === 'function') {
              foldUnfold(false);
            }
          }
        }}
        onScrollBeginDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const maxOffset = Math.floor(
            Number(e.nativeEvent.contentSize.height) -
              Number(e.nativeEvent.layoutMeasurement.height),
          );
          if (curFrameY !== maxOffset) {
            if (typeof foldUnfold === 'function') {
              foldUnfold(true);
            }
          }
          curFrameY = e.nativeEvent.contentOffset.y;
        }}
        ref={transactionListRef}
        sections={displayedTxs}
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
        ListEmptyComponent={<TransactionListEmpty />}
        ListFooterComponent={<View style={styles.emptyView} />}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        onViewableItemsChanged={onViewableItemsChanged}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    paddingTop: 6,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(214, 216, 218, 0.3)',
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
  emptyView: {
    height: 200,
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
