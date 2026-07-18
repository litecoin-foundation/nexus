import React, {useContext} from 'react';
import {
  View,
  Image,
  StyleSheet,
  Pressable,
  ImageSourcePropType,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import TranslateText from './TranslateText';
import {ScreenSizeContext} from '../context/screenSize';
import {TopSectionState} from './TopSection';

interface Props {
  onTabPress: (tab: number) => void;
  onOpenChart: () => void;
  activeTab: number;
  topSectionState: TopSectionState;
}

interface MenuTab {
  textKey: string;
  tab: number;
  colors: string[];
  imageSource: ImageSourcePropType;
}

// NOTE: Buttons shown in the TopSection "menu" page. Each maps to a Main tab:
// Sell -> 1, Buy -> 2, Shop -> 3.
const MENU_TABS: MenuTab[] = [
  // {
  //   textKey: 'sell',
  //   tab: 1,
  //   colors: ['#0e7fff', '#8f3333'],
  //   imageSource: require('../assets/icons/sell-icon.png'),
  // },
  {
    textKey: 'shop',
    tab: 3,
    colors: ['#0e7fff', '#0744c0'],
    imageSource: require('../assets/icons/shop.png'),
  },
  // {
  //   textKey: 'buy',
  //   tab: 2,
  //   colors: ['#0e7fff', '#0a7d4a'],
  //   imageSource: require('../assets/icons/buy-icon.png'),
  // },
];

const TopSectionMenu: React.FC<Props> = props => {
  const {onTabPress, onOpenChart, activeTab, topSectionState} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const renderButton = (
    key: string,
    colors: string[],
    imageSource: ImageSourcePropType,
    onPress: () => void,
    label: {textKey?: string; textValue?: string},
    selected: boolean,
  ) => (
    <Pressable
      key={key}
      style={[styles.button, selected ? styles.buttonSelected : null]}
      onPress={onPress}>
      <LinearGradient
        style={[
          styles.buttonGradient,
          selected ? styles.buttonGradientSelected : null,
        ]}
        colors={selected ? [...colors, '#ffffff', '#ffffff'] : colors}
        locations={selected ? [0, 0.98, 0.98, 1] : [0, 1]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
      />
      <View style={styles.buttonContent}>
        <Image
          source={imageSource}
          style={styles.icon}
          tintColor="white"
          resizeMode="contain"
        />
        <TranslateText
          textKey={label.textKey}
          textValue={label.textValue}
          domain={'main'}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={styles.buttonText}
          numberOfLines={1}
        />
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {renderButton(
        'some',
        ['#0e7fff', '#0744c0'],
        require('../assets/icons/share-icon.png'),
        onOpenChart,
        {textValue: 'Some'},
        topSectionState === 'some',
      )}
      {renderButton(
        'chart',
        ['#0e7fff', '#0744c0'],
        require('../assets/icons/charts-icon.png'),
        onOpenChart,
        {textValue: 'Chart'},
        topSectionState === 'chart',
      )}
      {MENU_TABS.map(({textKey, tab, colors, imageSource}) =>
        renderButton(
          textKey,
          colors,
          imageSource,
          () => onTabPress(tab),
          {textKey},
          activeTab === tab,
        ),
      )}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      maxHeight: screenHeight * 0.12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: screenWidth * 0.03,
      paddingVertical: screenHeight * 0.02,
      paddingHorizontal: screenWidth * 0.04,
    },
    button: {
      width: screenWidth * 0.22,
      height: screenHeight * 0.08,
      borderRadius: screenHeight * 0.022,
      opacity: 0.9,
    },
    buttonSelected: {
      opacity: 1,
    },
    buttonGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: screenHeight * 0.022,
      opacity: 0.7,
    },
    buttonGradientSelected: {
      opacity: 1,
    },
    buttonContent: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: screenHeight * 0.006,
    },
    icon: {
      width: screenWidth * 0.05,
      height: screenWidth * 0.05,
    },
    buttonText: {
      color: 'white',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.016,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export default TopSectionMenu;
