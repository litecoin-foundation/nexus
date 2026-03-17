import React, {useEffect, useContext, useMemo} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';

import Plasma2Modal from './Plasma2Modal';
import OptionCell from '../Cells/OptionCell';

import {ScreenSizeContext} from '../../context/screenSize';
import {PopUpContext} from '../../context/popUpContext';
import {TILLO_CATEGORIES, TilloCategory} from '../../services/giftcards';

interface Props {
  isVisible: boolean;
  close: () => void;
  selectedCategory: TilloCategory | null;
  onSelect: (category: TilloCategory | null) => void;
}

export const formatCategoryLabel = (category: string): string => {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const CategoryPickerModal: React.FC<Props> = props => {
  const {isVisible, close, selectedCategory, onSelect} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = useMemo(
    () => getStyles(SCREEN_WIDTH, SCREEN_HEIGHT),
    [SCREEN_WIDTH, SCREEN_HEIGHT],
  );

  const {showPopUp} = useContext(PopUpContext);

  const handleSelect = (category: TilloCategory | null) => {
    onSelect(category);
    close();
  };

  const modal = useMemo(
    () => (
      <Plasma2Modal
        isOpened={isVisible}
        close={close}
        originX={SCREEN_WIDTH * 0.85}
        originY={SCREEN_HEIGHT * 0.2}
        gapHorizontal={SCREEN_WIDTH * 0.3}
        gapVertical={SCREEN_WIDTH * 0.15}
        growDirection="top-right"
        animDuration={250}
        backSpecifiedStyle={styles.blueTintedBg}
        animatedRectSpecifiedStyle={styles.rectContainer}
        contentBodySpecifiedStyle={styles.contentBody}
        renderBody={() => (
          <View style={styles.modal}>
            <FlatList
              data={[null, ...TILLO_CATEGORIES] as (TilloCategory | null)[]}
              keyExtractor={item => item ?? 'all'}
              renderItem={({item}) => (
                <OptionCell
                  key={item ?? 'all'}
                  title={item ? formatCategoryLabel(item) : 'All'}
                  onPress={() => handleSelect(item)}
                  selected={selectedCategory === item}
                />
              )}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isVisible, close, selectedCategory, SCREEN_WIDTH, SCREEN_HEIGHT, styles],
  );

  useEffect(() => {
    showPopUp(modal, 'category-picker-modal');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, selectedCategory]);

  return <></>;
};

const getStyles = (_screenWidth: number, screenHeight: number) => {
  const radius = screenHeight * 0.024;
  return StyleSheet.create({
    modal: {
      flex: 1,
      backgroundColor: '#FFFFFF',
      borderRadius: radius,
      overflow: 'hidden',
    },
    rectContainer: {
      borderRadius: radius,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
    },
    contentBody: {
      backgroundColor: '#FFFFFF',
      borderRadius: radius,
    },
    listContainer: {
      paddingTop: screenHeight * 0.008,
      paddingBottom: screenHeight * 0.012,
    },
    blueTintedBg: {
      backgroundColor: 'rgba(80, 80, 80, 0.45)',
    },
  });
};

export default CategoryPickerModal;
