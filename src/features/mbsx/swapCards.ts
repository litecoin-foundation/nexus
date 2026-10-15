import {StyleSheet} from 'react-native';

export const COIN_ICONS: Record<string, number> = {
  LTC: require('../../assets/images/coins/ltc.png'),
  BTC: require('../../assets/images/coins/btc.png'),
  PART: require('../../assets/images/coins/part.png'),
  XMR: require('../../assets/images/coins/xmr.png'),
  FIRO: require('../../assets/images/coins/firo.png'),
  BCH: require('../../assets/images/coins/bch.png'),
  DASH: require('../../assets/images/coins/dash.png'),
  DCR: require('../../assets/images/coins/dcr.png'),
  DOGE: require('../../assets/images/coins/doge.png'),
  PIVX: require('../../assets/images/coins/pivx.png'),
  WOW: require('../../assets/images/coins/wow.png'),
};

export const coinPlate = (ticker?: string) => {
  if (!ticker) {
    return '#F4F7FB';
  }
  // These files already include their own badge, so a plate shows around them.
  if (ticker === 'PART' || (COIN_ICONS[ticker] && !COIN_COLORS[ticker])) {
    return 'transparent';
  }
  return COIN_COLORS[ticker] ?? '#C5C5CE';
};

export const COIN_COLORS: Record<string, string> = {
  LTC: '#345D9D',
  BTC: '#F7931A',
  PART: '#43B35D',
  XMR: '#FF6600',
  FIRO: '#9B1C2E',
};

export const swapCards = StyleSheet.create({
  section: {
    fontFamily: 'Satoshi Variable',
    fontSize: 14,
    fontWeight: '700',
    color: '#747E87',
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  amount: {
    flex: 1,
    fontSize: 36,
    color: '#484859',
    paddingVertical: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyMid: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 15,
  },
  historySub: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 12,
  },
  historyAmounts: {
    alignItems: 'flex-end',
    marginLeft: 8,
    flexShrink: 1,
  },
  historyIn: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#1162E6',
    fontSize: 13,
  },
  historyOut: {
    marginTop: 2,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 13,
  },
  pair: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  pairText: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 16,
  },
  coinLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
    borderRadius: 16,
  },
  coinLogoEnd: {
    width: 32,
    height: 32,
    marginLeft: 8,
    borderRadius: 16,
  },
  coinPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  coinPillText: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  status: {
    marginTop: 8,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#484859',
    fontSize: 14,
  },
  meta: {
    marginTop: 6,
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
  },
  fromLine: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    paddingTop: 12,
    fontFamily: 'Satoshi Variable',
    color: '#484859',
    fontSize: 14,
  },
  note: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 14,
  },
  id: {
    fontFamily: 'Satoshi Variable',
    color: '#747E87',
    fontSize: 12,
    marginTop: 8,
  },
  link: {
    marginTop: 8,
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#2C72FF',
    fontSize: 14,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  advancedLabel: {
    fontFamily: 'Satoshi Variable',
    fontWeight: '700',
    color: '#747E87',
    fontSize: 13,
  },
  chevron: {
    width: 10,
    height: 10,
    tintColor: '#747E87',
    transform: [{rotate: '90deg'}],
  },
  chevronOpen: {
    transform: [{rotate: '270deg'}],
  },
  flipWrap: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  flipLine: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: 1,
    backgroundColor: '#E4E8EE',
  },
  flip: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E4E8EE',
  },
  flipIcon: {
    width: 18,
    height: 18,
    tintColor: '#8B93A7',
    transform: [{rotate: '90deg'}],
  },
});
