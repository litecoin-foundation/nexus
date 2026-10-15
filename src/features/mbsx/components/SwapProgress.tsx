import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

import {formatExpiry} from '../format';
import {colors} from '../theme';

const STEPS = ['Offer', 'Locked', 'Redeemed', 'Complete'];

const STEP_OF: Record<string, number> = {
  SENT: 0,
  RECEIVING: 0,
  RECEIVED: 0,
  RECEIVING_ACC: 0,
  ACCEPTED: 1,
  SCRIPT_COIN_LOCKED: 1,
  NOSCRIPT_COIN_LOCKED: 1,
  SCRIPT_COIN_LOCK_RELEASED: 2,
  NOSCRIPT_COIN_LOCK_RELEASED: 2,
  SCRIPT_COIN_LOCK_REDEEMED: 2,
  NOSCRIPT_TX_REDEEMED: 2,
  NOSCRIPT_TX_RECOVERED: 2,
  COMPLETED: 3,
};

const AWAITING_OFFER = new Set(['SENT', 'RECEIVING', 'RECEIVED']);

const SwapProgress = ({
  state,
  expireAt,
}: {
  state: string;
  expireAt?: string;
}) => {
  const current = STEP_OF[state];
  if (current === undefined) {
    return null;
  }
  const complete = state === 'COMPLETED';
  const expiry =
    expireAt && AWAITING_OFFER.has(state) ? formatExpiry(expireAt) : '';
  const caption = complete
    ? 'Complete'
    : `Step ${current + 1} of ${STEPS.length} · ${STEPS[current]}`;
  return (
    <View testID="mbsx-swap-progress" style={styles.wrap}>
      <View style={styles.bar}>
        {STEPS.map((label, index) => (
          <View
            key={label}
            style={[
              styles.segment,
              index <= current ? styles.segmentOn : null,
              index === current && !complete ? styles.segmentNow : null,
            ]}
          />
        ))}
      </View>
      <View style={styles.captionRow}>
        <Text style={styles.caption}>{caption}</Text>
        {expiry.startsWith('in') ? (
          <Text style={styles.caption}>{`Offer expires ${expiry}`}</Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 14,
  },
  bar: {
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#E4E8EE',
  },
  segmentOn: {
    backgroundColor: colors.primary,
  },
  segmentNow: {
    opacity: 0.55,
  },
  captionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  caption: {
    fontFamily: 'Satoshi Variable',
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default SwapProgress;
