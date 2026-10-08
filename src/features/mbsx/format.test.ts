import {typedAmount} from './format';

describe('typedAmount', () => {
  it('reads a comma as the decimal point', () => {
    expect(typedAmount('0,5')).toBe('0.5');
    expect(typedAmount('0,05')).toBe('0.05');
    expect(typedAmount('12.5')).toBe('12.5');
  });

  it('refuses a second separator rather than dropping it', () => {
    expect(typedAmount('1.2.3')).toBeNull();
    expect(typedAmount('1.234,5')).toBeNull();
  });

  it('keeps only digits and the separator', () => {
    expect(typedAmount(' 1a2')).toBe('12');
    expect(typedAmount('')).toBe('');
  });
});
