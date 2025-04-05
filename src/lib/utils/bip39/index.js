import getRandomInt from '../getRandomInt';

import wordlist from './english.json';
import wordlistZH from './chinese_simplified.json';
import wordlistCN from './chinese_traditional.json';
import wordlistCS from './czech.json';
import wordlistFR from './french.json';
import wordlistIT from './italian.json';
import wordlistJA from './japanese.json';
import wordlistKO from './korean.json';
import wordlistPT from './portuguese.json';
import wordlistES from './spanish.json';

const wordlists = [
  wordlist,
  wordlistZH,
  wordlistCN,
  wordlistCS,
  wordlistFR,
  wordlistIT,
  wordlistJA,
  wordlistKO,
  wordlistPT,
  wordlistES,
];

export const getBIP39Word = () => {
  return wordlist[getRandomInt(0, 2047)];
};

export const checkBIP39Word = word => {
  return wordlist.includes(word);
};

export const checkLitewalletBIP39Word = word => {
  return wordlists.some(list => list.includes(word.normalize('NFD')));
};

export const getBIP39Index = word => {
  return wordlist.indexOf(word);
};
