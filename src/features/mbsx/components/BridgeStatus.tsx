import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {useAppSelector} from '../../../store/hooks';
import {colors} from '../theme';

/** Says when the swap server cannot be reached, on every mbsx screen. */
const BridgeStatus: React.FC = () => {
  const running = useAppSelector(state => state.mbsx.running);
  const connected = useAppSelector(state => state.mbsx.connected);

  // A stopped core is an idle section, not a server that is unreachable.
  if (!running || connected) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>Not connected to the swap server</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  text: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default BridgeStatus;
