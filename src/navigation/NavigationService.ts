import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  }
}

export function reset(routes: Array<{ name: keyof RootStackParamList; params?: any }>) {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes,
    });
  }
}

export function resetToLoading() {
  reset([{ name: 'Loading' }]);
}
