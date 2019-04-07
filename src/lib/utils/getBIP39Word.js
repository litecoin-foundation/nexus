import english from './bip39/english.json';
import { getRandomInt } from './index';

const getBIP39Word = () => {
  return english[getRandomInt(0, 2047)];
};

export default getBIP39Word;
