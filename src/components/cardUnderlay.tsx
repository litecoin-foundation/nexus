import React, {createContext, useContext, useEffect, useState} from 'react';
import {SharedValue, useSharedValue} from 'react-native-reanimated';
import type {PreparedCardBackdrop} from './nativeCardBackdropTexture';

// Skia cards publish drawable elements; native cards publish prepared textures.
// The glass canvas positions both with the sheet's translation.

// coversCard: the elements repaint the whole card, so the band may lay an
// opaque card-background rect behind them; partial underlays (a lone button)
// must leave the band transparent or they'd cover the native card
type Underlay = {node: React.ReactNode; coversCard: boolean} | null;

const ValueContext = createContext<Underlay>(null);
const SetterContext = createContext<(underlay: Underlay) => void>(() => {});

const NativeBackdropContext =
  createContext<SharedValue<PreparedCardBackdrop | null> | null>(null);

export const CardUnderlayProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [underlay, setUnderlay] = useState<Underlay>(null);
  const nativeBackdrop = useSharedValue<PreparedCardBackdrop | null>(null);
  return (
    <NativeBackdropContext.Provider value={nativeBackdrop}>
      <SetterContext.Provider value={setUnderlay}>
        <ValueContext.Provider value={underlay}>
          {children}
        </ValueContext.Provider>
      </SetterContext.Provider>
    </NativeBackdropContext.Provider>
  );
};

// publish on every render so state-driven redraws flow through, clear on
// unmount
export const useCardUnderlay = (
  elements: React.ReactNode,
  coversCard = false,
) => {
  const setUnderlay = useContext(SetterContext);
  useEffect(() => {
    setUnderlay({node: elements, coversCard});
  });
  useEffect(() => () => setUnderlay(null), [setUnderlay]);
};

export const useCardUnderlayValue = () => useContext(ValueContext);

export const useNativeCardBackdrop = () => {
  const backdrop = useContext(NativeBackdropContext);
  if (!backdrop) {
    throw new Error('Native card backdrops require CardUnderlayProvider');
  }
  return backdrop;
};
