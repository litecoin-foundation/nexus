import {StyleSheet, FlatList} from 'react-native';
import React, {useState} from 'react';
import LinearGradient from 'react-native-linear-gradient';

import OptionCell from '../../components/Cells/OptionCell';
import Header from '../../components/Header';
import languages from '../../assets/languages';
import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {setLanguage} from '../../reducers/settings';
import HeaderButton from '../../components/Buttons/HeaderButton';
import TranslateText from '../../components/TranslateText';

type LangT = {
  code: string;
  name: string;
};

const Language: React.FC = () => {
  const dispatch = useAppDispatch();
  const {languageCode} = useAppSelector(state => state.settings);
  const [selectedLang, setSelectedLang] = useState(languageCode);

  const handlePress = (code: string): void => {
    setSelectedLang(code);
    dispatch(setLanguage(code));
  };

  const renderItem = ({item}: {item: LangT}) => (
    <OptionCell
      title={`${item.name}`}
      key={item.code}
      onPress={() => handlePress(item.code)}
      selected={selectedLang === item.code ? true : false}
    />
  );

  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={['#F2F8FD', '#d2e1ef00']}>
        <Header />
        zR
        <FlatList data={languages} renderItem={renderItem} />
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerTitle: {
    fontFamily: 'Satoshi Variable',
    fontStyle: 'normal',
    fontWeight: '700',
    color: 'white',
    fontSize: 17,
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

export const LanguageNavigationOptions = (navigation: any) => {
  return {
    headerTitle: () => (
      <TranslateText
        textKey="select_lang"
        domain="settingsTab"
        textStyle={styles.headerTitle}
      />
    ),
    headerTitleAlign: 'left',
    headerTransparent: true,
    headerTintColor: 'white',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
  };
};

export default Language;
