import {NativeModules, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';

// the radius of the display's own rounded corners, in points, for UI floating
// near the screen's edges to run concentric with them
const IOS_RADII: {[deviceId: string]: number} = {
  'iPhone10,3': 39, // X
  'iPhone10,6': 39, // X
  'iPhone11,2': 39, // XS
  'iPhone11,4': 39, // XS Max
  'iPhone11,6': 39, // XS Max
  'iPhone11,8': 41.5, // XR
  'iPhone12,1': 41.5, // 11
  'iPhone12,3': 39, // 11 Pro
  'iPhone12,5': 39, // 11 Pro Max
  'iPhone13,1': 44, // 12 mini
  'iPhone13,2': 47.33, // 12
  'iPhone13,3': 47.33, // 12 Pro
  'iPhone13,4': 53.33, // 12 Pro Max
  'iPhone14,4': 44, // 13 mini
  'iPhone14,5': 47.33, // 13
  'iPhone14,2': 47.33, // 13 Pro
  'iPhone14,3': 53.33, // 13 Pro Max
  'iPhone14,7': 47.33, // 14
  'iPhone14,8': 53.33, // 14 Plus
  'iPhone15,2': 55, // 14 Pro
  'iPhone15,3': 55, // 14 Pro Max
  'iPhone15,4': 55, // 15
  'iPhone15,5': 55, // 15 Plus
  'iPhone16,1': 55, // 15 Pro
  'iPhone16,2': 55, // 15 Pro Max
  'iPhone17,3': 55, // 16
  'iPhone17,4': 55, // 16 Plus
  'iPhone17,1': 62, // 16 Pro
  'iPhone17,2': 62, // 16 Pro Max
  'iPhone17,5': 47.33, // 16e
  'iPhone18,3': 62, // 17
  'iPhone18,1': 62, // 17 Pro
  'iPhone18,2': 62, // 17 Pro Max
  'iPhone18,4': 62, // Air
};

const readScreenCornerRadius = (): number | null => {
  switch (Platform.OS) {
    case 'ios':
      return IOS_RADII[DeviceInfo.getDeviceId()] ?? null;
    case 'android':
      // android 12+ reports it natively, see ScreenCornerRadiusModule.kt
      return NativeModules.ScreenCornerRadius?.radius || null;
    default:
      return null;
  }
};

export const SCREEN_CORNER_RADIUS = readScreenCornerRadius();
