import React, {useEffect, useMemo} from 'react';

interface Props {
  navigation: any;
  // the shop screen owns the shared nav bar past its hand-off point; while it
  // does, this must leave the route's header options alone
  shopOwnsHeader: boolean;
}

// The wallet screen draws its own header (see components/MainHeader) — the
// navigator's header for this route stays mounted only because the shop takes
// it over while it owns the nav bar. This keeps that header blank whenever the
// shop is not using it, and holds the focus fix the transparent header needs.
export function useMainLayout(props: Props) {
  const {navigation, shopOwnsHeader} = props;

  const emptyFragment = useMemo(() => <></>, []);

  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) return;
    // while the shop is presented it applies its own header to this route;
    // the moment its close starts this re-runs and blanks the bar again
    if (shopOwnsHeader) return;

    parentNavigation.setOptions({
      headerTitle: () => emptyFragment,
      headerLeft: () => emptyFragment,
      headerRight: () => emptyFragment,
    });
  }, [navigation, shopOwnsHeader, emptyFragment]);

  // NOTE: fixes header disappearing when navigating back from screens with headerTransparent: true
  // like ConfirmBuy, ConfirmSell, WebPage, etc. Listens on the Main ROUTE's
  // focus, not this screen's: the shop presenting/closing inside the Main
  // stack must not blink the header.
  useEffect(() => {
    const parentNavigation = navigation.getParent();
    if (!parentNavigation) return;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = parentNavigation.addListener('focus', () => {
      // Small delay to ensure the screen is fully focused before applying header fix
      timeoutId = setTimeout(() => {
        parentNavigation.setOptions({
          headerShown: false,
        });

        setTimeout(() => {
          parentNavigation.setOptions({
            headerShown: true,
          });
        }, 10);
      }, 50);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [navigation]);
}
