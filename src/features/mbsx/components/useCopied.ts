import {useCallback, useEffect, useRef, useState} from 'react';
import Clipboard from '@react-native-clipboard/clipboard';

export const useCopied = () => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = useCallback((value: string) => {
    Clipboard.setString(value);
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1600);
  }, []);
  return {copied, copy};
};
