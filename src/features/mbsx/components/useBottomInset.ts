import {useSafeAreaInsets} from 'react-native-safe-area-context';

export const useBottomInset = (extra = 24) => {
  const {bottom} = useSafeAreaInsets();
  return extra + bottom;
};
