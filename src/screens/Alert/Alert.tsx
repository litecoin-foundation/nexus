import React, {useState, useContext} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Header from '../../components/Header';
import AlertCell from '../../components/Cells/AlertCell';
import AlertModal from '../../components/Modals/AlertModalContent';
import {removeAlert} from '../../reducers/alerts';
import HeaderButton from '../../components/Buttons/HeaderButton';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {}

const Alert: React.FC<Props> = () => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  const dispatch = useAppDispatch();
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const {alerts} = useAppSelector(state => state.alerts);

  const handleAlertPress = (index: number) => {
    setSelectedIndex(index);
    setAlertModalVisible(true);
  };

  const EmptySectionList = (
    <View style={styles.emptySectionListContainer}>
      <TranslateText
        textKey="create_alerts_note"
        domain="alertsTab"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.emptySectionListText}
        numberOfLines={3}
      />
      <TranslateText
        textKey="alerts_appear_here"
        domain="alertsTab"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.emptySectionListText}
        numberOfLines={1}
      />
    </View>
  );

  return (
    <LinearGradient
      style={styles.container}
      colors={['#F6F9FC', 'rgb(238,244,249)']}>
      <Header />
      <FlatList
        data={alerts}
        renderItem={({item}) => (
          <AlertCell
            data={item}
            onPress={(index: number) => handleAlertPress(index)}
          />
        )}
        ListEmptyComponent={EmptySectionList}
      />
      <AlertModal
        isVisible={alertModalVisible}
        close={() => setAlertModalVisible(false)}
        onPress={() => dispatch(removeAlert(selectedIndex))}
      />
    </LinearGradient>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    headerRight: {
      paddingRight: screenWidth * 0.04,
    },
    emptySectionListContainer: {
      alignItems: 'center',
      marginTop: screenHeight * 0.03,
      paddingHorizontal: screenWidth * 0.04,
    },
    emptySectionListText: {
      color: '#7C96AE',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '500',
      textAlign: 'center',
      marginBottom: screenHeight * 0.02,
    },
    headerTitle: {
      color: '#fff',
      fontFamily: 'Satoshi Variable',
      fontSize: screenHeight * 0.02,
      fontStyle: 'normal',
      fontWeight: '700',
    },
  });

export const AlertNavigationOptions = (navigation: any) => {
  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return {
    headerTitle: () => (
      <TranslateText
        textKey="price_alerts"
        domain="alertsTab"
        maxSizeInPixels={height * 0.02}
        textStyle={styles.headerTitle}
        numberOfLines={1}
      />
    ),
    headerTitleAlign: 'left',
    headerLeft: () => (
      <HeaderButton
        onPress={() => navigation.goBack()}
        imageSource={require('../../assets/images/back-icon.png')}
      />
    ),
    headerRight: () => (
      <HeaderButton
        textKey="create_alert"
        textDomain="alertsTab"
        onPress={() => navigation.navigate('Dial')}
        rightPadding={true}
      />
    ),
  };
};

export default Alert;
