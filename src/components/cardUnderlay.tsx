import React, {createContext, useContext, useEffect, useState} from 'react';

// cards publish their skia element tree here; the glass canvas draws it
// positioned by the sheet translation, so the tab bar refracts live card
// pixels instead of a snapshot

// coversCard: the elements repaint the whole card, so the band may lay an
// opaque card-background rect behind them; partial underlays (a lone button)
// must leave the band transparent or they'd cover the native card
type Underlay = {node: React.ReactNode; coversCard: boolean} | null;

const ValueContext = createContext<Underlay>(null);
const SetterContext = createContext<(underlay: Underlay) => void>(() => {});

export const CardUnderlayProvider: React.FC<{children: React.ReactNode}> = ({
  children,
}) => {
  const [underlay, setUnderlay] = useState<Underlay>(null);
  return (
    <SetterContext.Provider value={setUnderlay}>
      <ValueContext.Provider value={underlay}>{children}</ValueContext.Provider>
    </SetterContext.Provider>
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
