import {deriveMainExtkey} from './mainKey';
import {getItem} from '../../../utils/keychain';

jest.mock('react-native-quick-crypto', () => ({
  pbkdf2: jest.requireActual('node:crypto').pbkdf2,
}));
jest.mock('../../../utils/keychain', () => ({getItem: jest.fn()}));

describe('deriveMainExtkey', () => {
  it('derives the same key bip39 gave for a known phrase', async () => {
    (getItem as jest.Mock).mockResolvedValue(
      [...Array(11).fill('abandon'), 'about'].join(','),
    );
    await expect(deriveMainExtkey()).resolves.toBe(
      '0342ffaef780000001ad8fa4aee8752e2d587d624ee7dba97a8df5bcd785276aadeb5757007583561200ebd5289699f17612d43da06d6007399c3cb88057eefcc7cdb33f74aaf327d621',
    );
  });
});
