import React, {createContext, useState, useEffect} from 'react';
import {Dimensions, useWindowDimensions} from 'react-native';

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
});

const ScreenSizeProvider: React.FC<Props> = props => {
  const { width: deviceWidth, height: deviceHeight } = useWindowDimensions();

  const { specifiedWidth, specifiedHeight, deviceName } = props;

  const [width, setWidth] = useState(specifiedWidth || deviceWidth);
  const [height, setHeight] = useState(specifiedHeight || deviceHeight);
  const [isDeviceRotated, setIsDeviceRotated] = useState(false);

  function getOrientation(deviceNameProp: string | undefined) {
    const shouldRotate = deviceWidth > deviceHeight;

    if (isDeviceRotated !== shouldRotate) {
      setIsDeviceRotated(shouldRotate);

      // Set dimensions based on whether a device name is provided and rotation state
      if (deviceNameProp) {
        setWidth(height);
        setHeight(width);
      } else {
        setWidth(specifiedHeight || deviceWidth);
        setHeight(specifiedWidth || deviceHeight);
      }
    } else {
      // If no rotation needed, just set dimensions
      setWidth(specifiedWidth || deviceWidth);
      setHeight(specifiedHeight || deviceHeight);
    }
  }

  function setLayout(deviceNameProp: string | undefined) {
    const newScreenLayout = getDeviceScreenLayout(deviceNameProp);
    setWidth(newScreenLayout.width);
    setHeight(newScreenLayout.height);
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
      }}
      {...props}
    />
  );
};

export { ScreenSizeProvider, ScreenSizeContext };

function getDeviceScreenLayout(deviceName: string | undefined) {
  let width = 0, height = 0;

  // iphone sizes are in CGSize format
  switch (deviceName) {
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
