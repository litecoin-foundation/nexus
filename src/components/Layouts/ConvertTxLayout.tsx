import React, {useContext, Fragment} from 'react';
import {ScrollView, View, StyleSheet, Image} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import Share from 'react-native-share';

import TableCell from '../Cells/TableCell';
import BlueButton from '../Buttons/BlueButton';
import ChangeAddress from '../ChangeAddress';

import {useAppSelector} from '../../store/hooks';
import {satsToSubunitSelector} from '../../reducers/settings';

import TranslateText from '../TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface ConvertLayoutProps {
  conversionType: 'regular' | 'private';
  destinationAddress: string;
  targetAmount: number;
  selectedUtxos: Array<{
    address?: string;
    amountSat: number;
    addressType: number;
  }>;
  myOutputAddrs: string[];
  otherOutputAddrs: string[];
  outputDetails: Array<{
    address: string;
    amount: number;
    isOurAddress: boolean;
  }>;
  txId: string;
  dateString: string;
  amountSymbol: string;
  currentExplorer: string;
  blockchainFee: number | 'unknown';
}

const ConvertTxLayout: React.FC<ConvertLayoutProps> = props => {
  const {
    // conversionType,
    destinationAddress,
    targetAmount,
    selectedUtxos,
    // myOutputAddrs,
    // otherOutputAddrs,
    outputDetails,
    txId,
    dateString,
    amountSymbol,
    currentExplorer,
    // blockchainFee,
  } = props;

  const navigation = useNavigation<any>();
  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} =
    useContext(ScreenSizeContext);
  const styles = getStyles(SCREEN_WIDTH, SCREEN_HEIGHT);

  const convertToSubunit = useAppSelector(state =>
    satsToSubunitSelector(state),
  );
  const targetAmountFormatted = convertToSubunit(targetAmount)
    .toFixed(4)
    .replace(/\.?0+$/, '');

  // Find change addresses and their amounts from actual output details
  // In MWEB, the same address can be both input and output - this is normal!
  const changeOutputs = outputDetails.filter(output => {
    // Must be our address and not the destination
    if (!output.isOurAddress || output.address === destinationAddress) {
      return false;
    }

    // Include all our non-destination addresses as potential change
    // Even if they were also used as inputs (normal in MWEB)
    return true;
  });

  // Map change addresses to their amounts
  const changeAddrsWithAmounts = changeOutputs.map(output => ({
    address: output.address,
    amount: output.amount,
    formattedAmount: convertToSubunit(output.amount)
      .toFixed(4)
      .replace(/\.?0+$/, ''),
  }));

  // Keep legacy changeAddrs for compatibility with existing code
  const changeAddrs = changeAddrsWithAmounts.map(item => item.address);

  // Format UTXO amounts
  const formattedUtxos = selectedUtxos.map(utxo => ({
    ...utxo,
    formattedAmount: convertToSubunit(utxo.amountSat)
      .toFixed(4)
      .replace(/\.?0+$/, ''),
  }));

  const handleShare = (message: string) => {
    if (message) {
      Share.open({message: message});
    }
  };

  // Calculate address sizes
  const calculateAddressSize = (
    addresses: string[],
    defaultSize: number,
    singleThreshold: number,
    multiThreshold: number,
  ) => {
    if (addresses.length > 1) {
      return multiThreshold;
    } else if (addresses.length === 1 && addresses[0].length > 75) {
      return singleThreshold;
    }
    return defaultSize;
  };

  let fromAddressSize = calculateAddressSize(
    formattedUtxos.map(u => u.address || ''),
    SCREEN_HEIGHT * 0.025,
    SCREEN_HEIGHT * 0.019,
    SCREEN_HEIGHT * 0.017,
  );

  let toAddressSize = calculateAddressSize(
    [destinationAddress, ...changeAddrs],
    SCREEN_HEIGHT * 0.025,
    SCREEN_HEIGHT * 0.019,
    SCREEN_HEIGHT * 0.017,
  );

  if (fromAddressSize >= toAddressSize) {
    fromAddressSize = toAddressSize;
  } else {
    toAddressSize = fromAddressSize;
  }

  function renderInputs() {
    if (formattedUtxos.length > 0) {
      return formattedUtxos.map((utxo, index) => (
        <TranslateText
          key={`input-${index}`}
          textValue={`${utxo.address || 'Unknown'} (${utxo.formattedAmount}${amountSymbol})`}
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}
          numberOfLines={4}
          onPress={() => handleShare(utxo.address || '')}
        />
      ));
    } else {
      return (
        <TranslateText
          textValue="Unknown"
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.fromAddressTitle,
            fontSize: fromAddressSize,
          }}
          numberOfLines={1}
        />
      );
    }
  }

  function renderOutputs() {
    return (
      <Fragment>
        <TranslateText
          textValue={
            destinationAddress
              ? `${destinationAddress} (${targetAmountFormatted}${amountSymbol})`
              : `Unknown destination (${targetAmountFormatted}${amountSymbol})`
          }
          maxSizeInPixels={SCREEN_HEIGHT * 0.02}
          textStyle={{
            ...styles.toAddressTitle,
            fontSize: toAddressSize,
          }}
          numberOfLines={0}
          onPress={() => handleShare(destinationAddress)}
        />
        {changeAddrsWithAmounts.length > 0 && (
          <ChangeAddress>
            {changeAddrsWithAmounts.map((changeOutput, index) => (
              <TranslateText
                key={`change-${index}`}
                textValue={`${changeOutput.address} (${changeOutput.formattedAmount}${amountSymbol})`}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={{
                  color: '#747e87',
                  fontSize: fromAddressSize,
                  fontWeight: '700',
                  fontFamily: 'Satoshi Variable',
                }}
                numberOfLines={0}
                onPress={() => handleShare(changeOutput.address)}
              />
            ))}
          </ChangeAddress>
        )}
      </Fragment>
    );
  }

  return (
    <Fragment>
      <View style={styles.topContainer}>
        <ScrollView
          style={{maxHeight: SCREEN_HEIGHT * 0.4}}
          contentContainerStyle={styles.fromToContainer}>
          <View style={styles.fromContainer}>
            <View style={styles.fromAndToIconContainer}>
              <View style={styles.fromAndToIcon}>
                <Image
                  style={styles.fromAndToIconImage}
                  source={require('../../assets/icons/send-icon.png')}
                />
              </View>
              <View style={styles.sentLine} />
            </View>
            <View style={styles.fromAndToTitlesContainer}>
              <TranslateText
                textKey={'from'}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={styles.fromAndToTitle}
                numberOfLines={1}
              />
              {renderInputs()}
              <View style={{paddingBottom: 10}} />
            </View>
          </View>
          <View style={styles.toContainer}>
            <View style={styles.fromAndToIconContainer}>
              <View style={styles.fromAndToIcon}>
                <Image
                  style={styles.fromAndToIconImage}
                  source={require('../../assets/icons/receive-icon.png')}
                />
              </View>
            </View>
            <View style={styles.fromAndToTitlesContainer}>
              <TranslateText
                textKey={'to'}
                domain={'main'}
                maxSizeInPixels={SCREEN_HEIGHT * 0.02}
                textStyle={styles.fromAndToTitle}
                numberOfLines={1}
              />
              {renderOutputs()}
            </View>
          </View>
        </ScrollView>

        <TableCell
          titleTextKey="tx_id"
          titleTextDomain="main"
          value={txId}
          copyable
          valueStyle={{paddingLeft: 20}}
        />

        <TableCell
          titleTextKey="time_date"
          titleTextDomain="main"
          value={dateString}
        />
      </View>
      <View style={styles.bottomContainer}>
        <View style={styles.buttonContainer}>
          <BlueButton
            textKey="view_on_blockchain"
            textDomain="main"
            onPress={() => {
              navigation.navigate('WebPage', {
                uri: currentExplorer,
              });
            }}
          />
        </View>
        <View style={styles.paginationStrip} />
      </View>
    </Fragment>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    paginationStrip: {
      height: screenHeight * 0.06,
      width: '100%',
    },
    fromToContainer: {
      width: '100%',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      paddingHorizontal: screenHeight * 0.03,
      paddingVertical: screenHeight * 0.02,
    },
    fromContainer: {
      flexShrink: 0,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    toContainer: {
      flex: 1,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'flex-start',
    },
    fromAndToIconContainer: {
      height: '100%',
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: screenHeight * 0.03,
    },
    fromAndToIcon: {
      height: screenHeight * 0.035,
      width: screenHeight * 0.035,
      borderRadius: screenHeight * 0.005,
      backgroundColor: '#EAEBED',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden',
    },
    fromAndToIconImage: {
      width: '50%',
      height: '50%',
      objectFit: 'contain',
    },
    sentLine: {
      flex: 1,
      width: 1,
      backgroundColor: '#EAEBED',
      margin: screenHeight * 0.01,
    },
    fromAndToTitlesContainer: {
      height: '100%',
      flex: 1,
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    fromAndToTitle: {
      color: '#3b3b3b',
      fontSize: screenHeight * 0.02,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    fromAddressTitle: {
      color: '#2c72ff',
      fontSize: screenHeight * 0.025,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    toAddressTitle: {
      color: '#1ebc73',
      fontSize: screenHeight * 0.025,
      fontWeight: '700',
      fontFamily: 'Satoshi Variable',
    },
    topContainer: {
      flex: 1,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    bottomContainer: {
      flexDirection: 'column',
      paddingHorizontal: screenWidth * 0.05,
    },
    buttonContainer: {
      width: '100%',
      justifyContent: 'center',
      alignSelf: 'center',
    },
  });

export default ConvertTxLayout;
