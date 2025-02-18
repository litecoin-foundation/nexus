import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import TableCell from '../../components/Cells/TableCell';
import VerticalTableCell from '../../components/Cells/VerticalTableCell';

import {useAppDispatch, useAppSelector} from '../../store/hooks';
import {getRecoveryInfo} from '../../reducers/info';
import HeaderButton from '../../components/Buttons/HeaderButton';
import Card from '../../components/Card';
import {useTranslation} from 'react-i18next';

interface Props {}

const About: React.FC<Props> = () => {
  const {t} = useTranslation('settingsTab');
  const {
    syncedToChain,
    syncedToGraph,
    blockHeight,
    blockHash,
    bestHeaderTimestamp,
    version,
  } = useAppSelector(state => state.info);
  const {lndActive} = useAppSelector(state => state.lightning);
  const onboarding = useAppSelector(state => state.onboarding.onboarding);
  const isOnboarded = useAppSelector(state => state.onboarding.isOnboarded);

  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(getRecoveryInfo());
  }, []);

  return (
    <LinearGradient colors={['#1162E6', '#0F55C7']} style={styles.container}>
      <SafeAreaView />
      <ScrollView>
        <View style={styles.creditsContainer}>
          <Card
            descriptionText={t('foundation_preamble')}
            imageSource={require('../../assets/images/collab.png')}
            largeImg={true}
          />
        </View>

        <Text style={styles.titleText}>DEBUG INFO</Text>
        <TableCell title="onboarding" value={`${onboarding}`} />
        <TableCell title="isOnboarded" value={`${isOnboarded}`} />
        <TableCell
          title="LND Active"
          value={`${lndActive === true ? 'true' : 'false'}`}
        />
        <TableCell
          title="Synced to Chain?"
          value={`${syncedToChain === true ? 'true' : 'false'}`}
        />
        <TableCell title="Synced to Graph?" value={`${syncedToGraph}`} />
        <TableCell title="Block Height" value={String(blockHeight)} />
        <VerticalTableCell title="Blockhash">
          <Text style={styles.text}>{blockHash}</Text>
        </VerticalTableCell>
        <VerticalTableCell title="bestHeaderTimestamp">
          <Text style={styles.text}>{`${new Date(
            Number(bestHeaderTimestamp) * 1000,
          )}`}</Text>
        </VerticalTableCell>

        <VerticalTableCell title="LND version">
          <Text style={styles.text}>{version}</Text>
        </VerticalTableCell>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(238,244,249)',
  },
  titleText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    paddingLeft: 10,
    paddingTop: 15,
    paddingBottom: 5,
  },
  text: {
    color: '#4A4A4A',
    fontSize: 14,
    fontWeight: 'bold',
  },
  creditsContainer: {
    height: Dimensions.get('screen').height,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export const AboutNavigationOptions = navigation => {
  return {
    headerTitle: '',
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

export default About;
