import React, {createContext, useContext, useMemo, useState} from 'react';

import LiquidGlassNavBar from '../components/LiquidGlassNavBar';

// The nav bar renders at the App root (outside the navigators) because an
// ancestor with animated opacity — e.g. navigation card/drawer wrappers —
// makes UIGlassEffect silently render as a plain transparent view.
// Main pushes its tab state up through this context instead.

export interface NavBarState {
  visible: boolean;
  activeTab: number;
  sendDisabled: boolean;
  onTabPress: (tab: number) => void;
}

const initialState: NavBarState = {
  visible: false,
  activeTab: 0,
  sendDisabled: false,
  onTabPress: () => {},
};

interface NavBarContextType {
  navBarState: NavBarState;
  setNavBarState: React.Dispatch<React.SetStateAction<NavBarState>>;
}

export const NavBarContext = createContext<NavBarContextType>({
  navBarState: initialState,
  setNavBarState: () => {},
});

interface ProviderProps {
  children: React.ReactNode;
}

export const NavBarProvider: React.FC<ProviderProps> = ({children}) => {
  const [navBarState, setNavBarState] = useState<NavBarState>(initialState);
  const value = useMemo(() => ({navBarState, setNavBarState}), [navBarState]);
  return (
    <NavBarContext.Provider value={value}>{children}</NavBarContext.Provider>
  );
};

export const MainNavBarHost: React.FC = () => {
  const {navBarState} = useContext(NavBarContext);
  const {visible, activeTab, sendDisabled, onTabPress} = navBarState;

  // mount/unmount instead of fading: animating opacity would kill the glass
  if (!visible) {
    return null;
  }

  return (
    <LiquidGlassNavBar
      activeTab={activeTab}
      onTabPress={onTabPress}
      sendDisabled={sendDisabled}
    />
  );
};
