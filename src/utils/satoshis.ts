// subunit is how we represent the unit used
// by the wallet in the settings store

// NOTE: an amount of this many digits or more, decimals included, is too long
// to be set at full size across the confirm and success screens
export const LONG_AMOUNT_DIGITS = 9;

export const isLongAmount = (amount: number | string) =>
  String(amount).replace(/\D/g, '').length >= LONG_AMOUNT_DIGITS;

export const litecoinToSubunit = (amount: number, subunit: number) => {
  switch (subunit) {
    case 0: // litecoin
      return amount;
    case 1: // lites
      return amount * 1000;
    case 2: // photons
      return amount * 1000000;
    default:
      // always default litecoin
      return amount;
  }
};

export const subunitToSats = (amount: number, subunit: number) => {
  switch (subunit) {
    case 0: // litecoin
      return amount * 100000000;
    case 1: // lites
      return amount * 100000;
    case 2: // photons
      return amount * 100;
    default:
      // always default litecoin
      return amount * 100000000;
  }
};

export const satsToSubunit = (amount: number, subunit: number) => {
  switch (subunit) {
    case 0: // litecoin
      return amount / 100000000;
    case 1: // lites
      return amount / 100000;
    case 2: // photons
      return amount / 100;
    default:
      // always default litecoin
      return amount / 100000000;
  }
};
