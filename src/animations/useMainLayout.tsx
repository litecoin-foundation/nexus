import {useEffect} from 'react';

interface Props {
  navigation: any;
}

export function useMainLayout(props: Props) {
  const {navigation} = props;

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
