import { Buffer } from 'buffer';

const toBuffer = str => {
  if (typeof str !== 'string') {
    throw new Error('Invalid input!');
  }
  return Buffer.from(str, 'utf8');
};

export default toBuffer;
