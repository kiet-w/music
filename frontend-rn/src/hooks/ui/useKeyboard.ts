import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';

export function useKeyboard() {
  const [isVisible, setIsVisible] = useState(false);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setIsVisible(true);
      setHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setIsVisible(false);
      setHeight(0);
    });
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  return { isVisible, height };
}
