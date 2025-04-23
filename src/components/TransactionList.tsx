import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  MutableRefObject,
  useLayoutEffect,
  useEffect,
  useState,
  useContext,
  memo,
  useMemo,
} from 'react';
import {
  StyleSheet,
  View,
  SectionList,
  SectionListRenderItem,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

import TransactionCell from './Cells/TransactionCell';
import TransactionListEmpty from './TransactionListEmpty';

import {useAppDispatch, useAppSelector} from '../store/hooks';
import {getTransactions, IDisplayedTx} from '../reducers/transaction';
import {txDetailSelector} from '../reducers/transaction';
import {groupTransactions} from '../lib/utils/groupTransactions';
import {DisplayedMetadataType} from '../utils/txMetadata';

import TranslateText from '../components/TranslateText';
import {ScreenSizeContext} from '../context/screenSize';
import ProgressBar from './ProgressBar';
import {
  percentSyncedSelector,
  recoveryProgressSelector,
} from '../reducers/info';

import {v4 as uuidv4} from 'uuid';

interface Props {
  onPress(item: ItemType): void;
  onViewableItemsChanged?(): void;
  folded?: boolean;
  foldUnfold?: (isFolded: boolean) => void;
  transactionType?: string;
  searchFilter?: string;
  mwebFilter?: boolean;
  txPrivacyTypeFilter?: string;
  headerBackgroundColor: string;
}

interface ITransactions {
  title: string;
  data: IDisplayedTx[];
}

type ItemType = {
  hash: string;
  time: Date;
  amount: number;
  label: string;
  metaLabel: string;
  priceOnDate: number;
  confs: number;
  providerMeta: DisplayedMetadataType;
};

interface TransactionCellItemProps {
  item: any;
  onPress: (item: any) => void;
}

const TransactionCellMemo = memo(function TransactionCellItem(
  props: TransactionCellItemProps,
) {
  const {item, onPress} = props;
  return (
    <TransactionCell key={uuidv4()} item={item} onPress={() => onPress(item)} />
  );
});

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

  const {
    onPress,
    onViewableItemsChanged,
    folded,
    foldUnfold,
    transactionType,
    searchFilter,
    mwebFilter,
    txPrivacyTypeFilter,
    headerBackgroundColor,
  } = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  // NOTE: when parent causes TransactionList to rerender, styles get a new ref each time, this in turn
  // leads to TransactionCell flickering, use useMemo or React.memo and never put styles in the deps to avoid this
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const UNFOLD_SHEET_POINT = SCREEN_HEIGHT * 0.24;
  // We never scroll folded list, therefore no need to set that height
  // const FOLD_SHEET_POINT = SCREEN_HEIGHT * 0.47;

  const {recoveryMode, syncedToChain} = useAppSelector(state => state.info);
  const progress = useAppSelector(state => percentSyncedSelector(state));
  const recoveryProgress = useAppSelector(state =>
    recoveryProgressSelector(state),
  );
  const transactions = useAppSelector(state => txDetailSelector(state));
  const [displayedTxs, setDisplayedTxs] = useState<any[]>([]);

  const dispatch = useAppDispatch();
  useLayoutEffect(() => {
    dispatch(getTransactions());
  }, [dispatch]);

  const filterTransactions = () => {
    const txArray = [];

    switch (transactionType) {
      case 'Buy':
      case 'Sell':
      case 'Send':
      case 'Receive':
        txArray.push(
          ...transactions.filter((tx: any) => tx.metaLabel === transactionType),
        );
        break;
      case 'All':
      default:
        txArray.push(...transactions);
        break;
    }

    let txArrayFiltered = txArray;

    if (searchFilter) {
      txArrayFiltered = txArrayFiltered.filter(
        (tx: any) => tx.label.indexOf(searchFilter) > -1,
      );
    }

    if (mwebFilter === undefined) {
    } else if (mwebFilter) {
      txArrayFiltered = txArrayFiltered.filter((tx: any) => tx.isMweb);
    } else {
      txArrayFiltered = txArrayFiltered.filter((tx: any) => !tx.isMweb);
    }

    switch (txPrivacyTypeFilter) {
      case 'All':
        break;
      case 'Regular':
        txArrayFiltered = txArrayFiltered.filter((tx: any) => !tx.isMweb);
        break;
      case 'MWEB':
        txArrayFiltered = txArrayFiltered.filter((tx: any) => tx.isMweb);
        break;
      default:
        break;
    }

    setDisplayedTxs(groupTransactions(txArrayFiltered));
  };

  useEffect(() => {
    filterTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    transactions,
    transactionType,
    searchFilter,
    mwebFilter,
    txPrivacyTypeFilter,
  ]);

  const renderItem: SectionListRenderItem<ItemType, ITransactions> = ({
    item,
  }) => (
    // TODO: unique tx id
    <TransactionCellMemo item={item} onPress={() => onPress(item)} />
  );

  // DashboardButton is 110, txTitleContainer is screenHeight * 0.07 in Main component
  // Gap in SearchTransaction component is 200 + 30 padding
  const [scrollContainerHeight, setScrollContainerHeight] = useState(
    SCREEN_HEIGHT - 230,
  );
  // Wait until scroll height is set then render the list
  const [renderTxs, setRenderTxs] = useState(false);

  useLayoutEffect(() => {
    if (folded !== undefined) {
      setScrollContainerHeight(
        SCREEN_HEIGHT - UNFOLD_SHEET_POINT - 110 - SCREEN_HEIGHT * 0.07,
      );
    }
    setRenderTxs(true);
  }, [folded, SCREEN_HEIGHT, UNFOLD_SHEET_POINT]);

  const SyncProgressIndicator = (
    <>
      <View style={styles.headerContainer}>
        <TranslateText
          textKey={recoveryMode ? 'recover_txs' : 'load_txs'}
          domain="main"
          maxSizeInPixels={SCREEN_HEIGHT * 0.025}
          textStyle={styles.sectionHeaderText}
          numberOfLines={1}
        />
      </View>
      {recoveryMode ? (
        <ProgressBar progress={recoveryProgress! * 100} />
      ) : (
        <ProgressBar progress={progress! * 100} />
      )}
    </>
  );

  const curFrameY = useRef(-1);

  const txSignature = displayedTxs
    .map(section =>
      section.data.map((tx: any) => `${tx.hash}-${tx.confs}`).join(','),
    )
    .join('|');

  const SectionListMemo = useMemo(
    () => (
      <SectionList
        bounces={false}
        scrollEventThrottle={1}
        onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const direction =
            e.nativeEvent.contentOffset.y > curFrameY.current ? 'down' : 'up';
          const maxOffset = Math.floor(
            Number(e.nativeEvent.contentSize.height) -
              Number(e.nativeEvent.layoutMeasurement.height),
          );
          if (direction === 'up' && curFrameY.current === maxOffset) {
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
          if (curFrameY.current !== maxOffset) {
            if (typeof foldUnfold === 'function') {
              foldUnfold(true);
            }
          }
          curFrameY.current = e.nativeEvent.contentOffset.y;
        }}
        ref={transactionListRef}
        sections={displayedTxs}
        stickySectionHeadersEnabled={true}
        renderItem={renderItem}
        viewabilityConfig={{viewAreaCoveragePercentThreshold: 80}}
        renderSectionHeader={({section}) => (
          <View
            style={[
              styles.sectionHeaderContainer,
              {backgroundColor: headerBackgroundColor},
            ]}>
            <TranslateText
              textValue={section.title}
              maxSizeInPixels={SCREEN_HEIGHT * 0.017}
              textStyle={styles.sectionHeaderText}
              numberOfLines={1}
            />
          </View>
        )}
        // TODO: unique tx id
        // keyExtractor={item => item.hash}
        keyExtractor={() => uuidv4()}
        initialNumToRender={9}
        ListEmptyComponent={<TransactionListEmpty />}
        ListFooterComponent={<View style={styles.emptyView} />}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        onViewableItemsChanged={onViewableItemsChanged}
      />
    ),
    // Extract a unique signature from the transactions to detect changes
    /* eslint-disable react-hooks/exhaustive-deps */
    [curFrameY, displayedTxs.length, txSignature],
  );

  return renderTxs ? (
    <View style={{height: scrollContainerHeight}}>
      {!syncedToChain ? SyncProgressIndicator : <></>}
      {SectionListMemo}
    </View>
  ) : (
    <></>
  );
});

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    sectionHeaderContainer: {
      paddingVertical: screenHeight * 0.006,
      borderBottomWidth: 0.5,
      borderBottomColor: 'rgba(214, 216, 218, 0.3)',
      paddingLeft: screenHeight * 0.02,
    },
    sectionHeaderText: {
      color: '#747E87',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.014,
      fontStyle: 'normal',
      fontWeight: '700',
      letterSpacing: -0.28,
    },
    emptyView: {
      height: screenHeight * 0.2,
    },
    item: {
      backgroundColor: '#f9c2ff',
      padding: screenHeight * 0.02,
      marginVertical: screenHeight * 0.008,
    },
    header: {
      fontSize: screenHeight * 0.032,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: screenHeight * 0.024,
    },
    headerContainer: {
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(214, 216, 218, 0.3)',
      paddingLeft: screenHeight * 0.02,
    },
  });

export default TransactionList;
