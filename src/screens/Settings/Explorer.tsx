import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import ScreenHeader, {
  ScreenHeaderCard,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import explorers from '../../assets/explorers';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setExplorer} from '../../reducers/settings';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

type ExplorerType = {
  name: string;
  key: string;
};

const Explorer: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, cardHeight);

  const {defaultExplorer} = useAppSelector(state => state.settings);
  const [selectedExplorer, setSelectedExplorer] = useState(defaultExplorer);

  const handlePress = (explorerKey: string): void => {
    setSelectedExplorer(explorerKey);
    dispatch(setExplorer(explorerKey));
  };

  const renderItem = ({item}: {item: ExplorerType}) => (
    <OptionCell
      title={`${item.name}`}
      key={item.key}
      onPress={() => handlePress(item.key)}
      selected={selectedExplorer === item.key ? true : false}
    />
  );

  const ListHeader = (
    <TranslateText
      textKey="select_block_explorer_note"
      domain="settingsTab"
      textStyle={styles.headerText}
      maxSizeInPixels={SCREEN_HEIGHT * 0.017}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <FlatList
          data={explorers}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.scrollContent}
        />
        <ScreenHeaderCard cardHeight={cardHeight} />
        <ScreenHeader
          rects={rects}
          paddingHorizontal={paddingHorizontal}
          titleKey="select_block_explorer"
          titleDomain="settingsTab"
          fadeStyle={headerFadeStyle}
        />
      </LinearGradient>
    </>
  );
};

const getStyles = (
  _screenWidth: number,
  _screenHeight: number,
  cardHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F7F7F7',
    },
    scrollContent: {
      paddingTop: cardHeight,
    },
    headerText: {
      color: '#484859',
      paddingTop: 10,
      paddingBottom: 10,
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      fontWeight: '600',
      fontSize: 14,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
  });

export default Explorer;
