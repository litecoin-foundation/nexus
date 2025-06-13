import React, {createContext, useState, useEffect} from 'react';
import {Dimensions, useWindowDimensions} from 'react-native';
// import {useHeaderHeight} from '@react-navigation/elements';

interface Props {
  children: React.ReactElement;
  specifiedWidth?: number;
  specifiedHeight?: number;
  deviceName?: string;
}

const ScreenSizeContext = createContext({
  width: Dimensions.get('screen').width,
  height: Dimensions.get('screen').height,
  isDeviceRotated: false,
  testDeviceHeaderHeight: 103,
});

const ScreenSizeProvider: React.FC<Props> = props => {
  const {width: deviceWidth, height: deviceHeight} = useWindowDimensions();

  // const originalDeviceHeaderHeight = useHeaderHeight();
  // iphone 15 Pro Max header size
  const originalDeviceHeaderHeight = 103;

  const {specifiedWidth, specifiedHeight, deviceName} = props;

  const [width, setWidth] = useState(specifiedWidth || deviceWidth);
  const [height, setHeight] = useState(specifiedHeight || deviceHeight);
  const [isDeviceRotated, setIsDeviceRotated] = useState(false);
  const [testDeviceHeaderHeight, setTestDeviceHeaderHeight] = useState(
    originalDeviceHeaderHeight,
  );

  function setHeaderHeight(screenHeight: number) {
    const testDeviceCropFactor = Dimensions.get('screen').height / screenHeight;
    const newHeaderHeight = parseInt(
      String(originalDeviceHeaderHeight / testDeviceCropFactor),
      10,
    );
    setTestDeviceHeaderHeight(newHeaderHeight);
  }

  function getOrientation(deviceNameProp: string | undefined) {
    const shouldRotate = deviceWidth > deviceHeight;

    if (isDeviceRotated !== shouldRotate) {
      setIsDeviceRotated(shouldRotate);

      // Set dimensions based on whether a device name is provided and rotation state
      if (deviceNameProp) {
        setWidth(height);
        setHeight(width);
        setHeaderHeight(width);
      } else {
        setWidth(specifiedHeight || deviceWidth);
        setHeight(specifiedWidth || deviceHeight);
        setHeaderHeight(specifiedWidth || deviceHeight);
      }
    } else {
      // If no rotation needed, just set dimensions
      setWidth(specifiedWidth || deviceWidth);
      setHeight(specifiedHeight || deviceHeight);
      setHeaderHeight(specifiedHeight || deviceHeight);
    }
  }

  function setLayout(deviceNameProp: string | undefined) {
    const newScreenLayout = getDeviceScreenLayout(deviceNameProp);
    setWidth(newScreenLayout.width);
    setHeight(newScreenLayout.height);
    setHeaderHeight(newScreenLayout.height);
    setIsDeviceRotated(false);
  }

  useEffect(() => {
    getOrientation(deviceName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceWidth]);

  useEffect(() => {
    if (deviceName) {
      setLayout(deviceName);
    } else {
      getOrientation(deviceName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceName]);

  return (
    <ScreenSizeContext.Provider
      value={{
        width: width,
        height: height,
        isDeviceRotated: isDeviceRotated,
        testDeviceHeaderHeight: testDeviceHeaderHeight,
      }}
      {...props}
    />
  );
};

export {ScreenSizeProvider, ScreenSizeContext};

function getDeviceScreenLayout(deviceName: string | undefined) {
  let width = 0,
    height = 0;

  // iphone sizes are in CGSize format
  switch (deviceName) {
    case 'thin':
      width = 330;
      height = 750;
      break;
    case 'thick':
      width = 430;
      height = 750;
      break;
    case '500x800':
      width = 500;
      height = 800;
      break;
    case 'pixel 9 pro':
      width = 427;
      height = 952;
      break;
    case 'iphone 7':
    case 'iphone 8':
    case 'iphone SE':
      width = 375;
      height = 667;
      break;
    case 'iphone 7 Plus':
    case 'iphone 8 Plus':
      width = 414;
      height = 736;
      break;
    case 'iphone X':
    case 'iphone XS':
    case 'iphone 11 Pro':
      width = 375;
      height = 812;
      break;
    case 'iphone XS Max':
    case 'iphone 11 Pro Max':
    case 'iphone XR':
    case 'iphone 11':
      width = 414;
      height = 896;
      break;
    case 'iphone 12 Mini':
    case 'iphone 13 Mini':
      width = 360;
      height = 780;
      break;
    case 'iphone 12':
    case 'iphone 12 Pro':
    case 'iphone 13':
    case 'iphone 13 Pro':
    case 'iphone 14':
    case 'iphone 15':
      width = 390;
      height = 844;
      break;
    case 'iphone 12 Pro Max':
    case 'iphone 13 Pro Max':
    case 'iphone 14 Plus':
    case 'iphone 14 Pro Max':
    case 'iphone 15 Plus':
    case 'iphone 15 Pro Max':
      width = 430;
      height = 932;
      break;
    case 'iphone 14 Pro':
    case 'iphone 15 Pro':
      width = 393;
      height = 852;
      break;
    default:
      width = Dimensions.get('screen').width;
      height = Dimensions.get('screen').height;
      break;
  }

  return {width: width, height: height};
}

export const deviceList = [
  'original',
  'thin',
  'thick',
  '500x800',
  'pixel 9 pro',
  'iphone 7',
  // 'iphone 8',
  // 'iphone SE',
  'iphone 7 Plus',
  // 'iphone 8 Plus',
  'iphone X',
  // 'iphone XS',
  // 'iphone 11 Pro',
  'iphone XS Max',
  // 'iphone 11 Pro Max',
  // 'iphone XR',
  // 'iphone 11',
  'iphone 12 Mini',
  // 'iphone 13 Mini',
  'iphone 12',
  // 'iphone 12 Pro',
  // 'iphone 13',
  // 'iphone 13 Pro',
  // 'iphone 14',
  // 'iphone 15',
  'iphone 12 Pro Max',
  // 'iphone 13 Pro Max',
  // 'iphone 14 Plus',
  // 'iphone 14 Pro Max',
  // 'iphone 15 Plus',
  // 'iphone 15 Pro Max',
  'iphone 14 Pro',
  // 'iphone 15 Pro',
];
