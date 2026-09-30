import NitroBSX from 'react-native-nitro-bsx';

import {start, validateAddress} from './index';

jest.mock('react-native-nitro-bsx', () => ({
  __esModule: true,
  default: {isRunning: jest.fn(() => true), validateAddress: jest.fn()},
}));
jest.mock('@dr.pogodin/react-native-fs', () => ({}));
jest.mock('react-native-nitro-lndltc', () => ({}));
jest.mock('../../../store', () => ({pStore: {}, store: {}}));
jest.mock('../../../utils/tor', () => ({}));
jest.mock('./mainKey', () => ({}));
jest.mock('./notify', () => ({}));
jest.mock('./wake', () => ({}));

const nativeValidate = NitroBSX.validateAddress as jest.Mock;

describe('validateAddress', () => {
  beforeAll(() => start());

  it('passes through what native decides', () => {
    nativeValidate.mockReturnValueOnce(true).mockReturnValueOnce(false);
    expect(validateAddress('LTC', 'ltc1good')).toBe(true);
    expect(validateAddress('LTC', 'ltc1bad')).toBe(false);
  });

  it('is false for a coin native has no interface for', () => {
    nativeValidate.mockImplementationOnce(() => {
      throw new Error("Unable to get coin interface for 'FIRO'");
    });
    expect(validateAddress('FIRO', 'a-firo-address')).toBe(false);
  });
});
