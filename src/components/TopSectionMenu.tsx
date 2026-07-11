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

interface Props {
  onTabPress: (tab: number) => void;
}

interface MenuTab {
  textKey: string;
  tab: number;
  colors: string[];
  imageSource: ImageSourcePropType;
}

// NOTE: Buttons shown in the TopSection "menu" page. Each maps to a Main tab:
// Sell -> 1, Buy -> 2, Shop -> 3. Each button has its own gradient background.
const MENU_TABS: MenuTab[] = [
  {
    textKey: 'sell',
    tab: 1,
    colors: ['#0e7fff', '#8f3333'],
    imageSource: require('../assets/icons/sell-icon.png'),
  },
  {
    textKey: 'shop',
    tab: 3,
    colors: ['#0e7fff', '#0744c0'],
    imageSource: require('../assets/icons/shop.png'),
  },
  {
    textKey: 'buy',
    tab: 2,
    colors: ['#0e7fff', '#0a7d4a'],
    imageSource: require('../assets/icons/buy-icon.png'),
  },
];

const TopSectionMenu: React.FC<Props> = props => {
  const {onTabPress} = props;

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  return (
    <View style={styles.container}>
      {MENU_TABS.map(({textKey, tab, colors, imageSource}) => (
        <Pressable
          key={textKey}
          style={styles.button}
          onPress={() => onTabPress(tab)}>
          <LinearGradient
            style={styles.buttonGradient}
            colors={colors}
            locations={[0, 1]}
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
              textKey={textKey}
              domain={'main'}
              maxSizeInPixels={SCREEN_HEIGHT * 0.02}
              textStyle={styles.buttonText}
              numberOfLines={1}
            />
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: screenWidth * 0.03,
      paddingTop: screenHeight * 0.04,
      paddingBottom: screenHeight * 0.05,
      paddingHorizontal: screenWidth * 0.04,
    },
    button: {
      width: screenWidth * 0.2,
      height: screenWidth * 0.15,
      borderRadius: screenHeight * 0.016,
      overflow: 'hidden',
    },
    buttonGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.7,
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
