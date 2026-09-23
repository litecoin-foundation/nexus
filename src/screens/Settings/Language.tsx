import React, {useState, useContext} from 'react';
import {StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';

import OptionCell from '../../components/Cells/OptionCell';
import ScreenHeader, {
  ScreenHeaderCard,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import languages from '../../assets/languages';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setLanguage} from '../../reducers/settings';

import {ScreenSizeContext} from '../../context/screenSize';

type LangT = {
  code: string;
  tag: string;
  name: string;
};

const Language: React.FC = () => {
  const dispatch = useAppDispatch();

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout();
  const headerFadeStyle = useScreenHeaderArrival();
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT, cardHeight);

  const {languageCode} = useAppSelector(state => state.settings);
  const [selectedLang, setSelectedLang] = useState(languageCode);

  const handlePress = (code: string, tag: string): void => {
    setSelectedLang(code);
    dispatch(setLanguage(code, tag));
  };

  const renderItem = ({item}: {item: LangT}) => (
    <OptionCell
      title={`${item.name}`}
      key={item.code}
      onPress={() => handlePress(item.code, item.tag)}
      selected={selectedLang === item.code ? true : false}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <FlatList
          data={languages}
          renderItem={renderItem}
          contentContainerStyle={styles.scrollContent}
        />
        <SafeAreaView />
        <ScreenHeaderCard cardHeight={cardHeight} />
        <ScreenHeader
          rects={rects}
          paddingHorizontal={paddingHorizontal}
          titleKey="select_lang"
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
  });

export default Language;
