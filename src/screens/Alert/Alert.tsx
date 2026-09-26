import React, {useState, useContext, useCallback} from 'react';
import {View, StyleSheet, FlatList} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import AlertCell from '../../components/Cells/AlertCell';
import AlertModal, {
  SelectedAlert,
} from '../../components/Modals/AlertModalContent';
import ScreenHeader, {
  ScreenHeaderCard,
  useScreenHeaderArrival,
  useScreenHeaderLayout,
} from '../../components/ScreenHeader';
import {removeAlert} from '../../reducers/alerts';
import {useAppDispatch, useAppSelector} from '../../store/hooks';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  navigation: any;
}

const Alert: React.FC<Props> = props => {
  const {navigation} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const {cardHeight, rects, paddingHorizontal} = useScreenHeaderLayout();
  const styles = getStyles(width, height, cardHeight);
  const headerFadeStyle = useScreenHeaderArrival();

  const dispatch = useAppDispatch();
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<SelectedAlert | null>(
    null,
  );
  const {alerts} = useAppSelector(state => state.alerts);

  const handleAlertPress = (index: number) => {
    setSelectedAlert(
      alerts.find((alert: SelectedAlert) => alert.index === index) ?? null,
    );
    setAlertModalVisible(true);
  };

  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const openDial = useCallback(() => navigation.navigate('Dial'), [navigation]);

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
      <FlatList
        data={alerts}
        renderItem={({item}) => (
          <AlertCell
            data={item}
            onPress={(index: number) => handleAlertPress(index)}
          />
        )}
        ListEmptyComponent={EmptySectionList}
        contentContainerStyle={styles.scrollContent}
      />
      <ScreenHeaderCard cardHeight={cardHeight} />
      <ScreenHeader
        rects={rects}
        paddingHorizontal={paddingHorizontal}
        titleKey="price_alerts"
        titleDomain="alertsTab"
        onBack={goBack}
        rightTextKey="create_alert"
        rightTextDomain="alertsTab"
        onRightPress={openDial}
        fadeStyle={headerFadeStyle}
        interactive={!alertModalVisible}
      />
      <AlertModal
        isVisible={alertModalVisible}
        alert={selectedAlert}
        close={() => setAlertModalVisible(false)}
        onPress={() => {
          if (selectedAlert) {
            dispatch(removeAlert(selectedAlert.index));
          }
        }}
      />
    </LinearGradient>
  );
};

const getStyles = (
  screenWidth: number,
  screenHeight: number,
  cardHeight: number,
) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    scrollContent: {
      paddingTop: cardHeight,
      paddingBottom: screenWidth * 0.02,
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
  });

export default Alert;
