import React from 'react';

import HeaderButton from '../../../components/Buttons/HeaderButton';
import {useAppSelector} from '../../../store/hooks';

// The swap core outlives the section that started it, so this is the only thing
// outside it that says a swap is still in flight.
const RUNNING_COLOUR = '#34C759';

interface Props {
  onPress: () => void;
}

/**
 * Its own component so that `running` is subscribed to here rather than in
 * useMainLayout. There it would be a dependency of the memo behind
 * `headerLeft`, and that memo feeds the effect which re-applies every header
 * option - so the flag flipping on the way out of the section re-applied the
 * whole header and made it flash.
 */
const MbsxHeaderButton: React.FC<Props> = ({onPress}) => {
  const running = useAppSelector((state: any) => state.mbsx.running);

  return (
    <HeaderButton
      testID="mbsx-entry"
      onPress={onPress}
      title="Swap"
      imageSource={require('../../../assets/icons/converttx.png')}
      tintColor="#ffffff"
      backgroundColorSpecified={running ? RUNNING_COLOUR : undefined}
    />
  );
};

export default MbsxHeaderButton;
