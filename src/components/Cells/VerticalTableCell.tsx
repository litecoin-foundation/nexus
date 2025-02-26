import React, {useContext} from 'react';
import {View, StyleSheet} from 'react-native';

import TranslateText from '../../components/TranslateText';
import {ScreenSizeContext} from '../../context/screenSize';

interface Props {
  title: string;
  children: React.ReactElement;
}

const VerticalTableCell: React.FC<Props> = props => {
  const {title, children} = props;

  const {width, height} = useContext(ScreenSizeContext);
  const styles = getStyles(width, height);

  return (
    <View style={styles.container}>
      <TranslateText
        textValue={title}
        maxSizeInPixels={height * 0.017}
        textStyle={styles.title}
      />
      {children}
    </View>
  );
};

const getStyles = (screenWidth: number, screenHeight: number) =>
  StyleSheet.create({
    container: {
      paddingTop: 15,
      paddingLeft: 22,
      paddingRight: 25,
      paddingBottom: 15,
      borderTopWidth: 1,
      borderTopColor: 'rgba(151,151,151,0.3)',
      backgroundColor: 'white',
    },
    title: {
      color: '#747e87',
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'Satoshi Variable',
      fontStyle: 'normal',
      paddingBottom: 2,
    },
  });

export default VerticalTableCell;
