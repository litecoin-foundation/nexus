// subunit is how we represent the unit used
// by the wallet in the settings store

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
