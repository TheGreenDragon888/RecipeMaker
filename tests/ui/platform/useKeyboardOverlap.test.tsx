import { DeviceEventEmitter } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useKeyboardOverlap } from '../../../src/ui/platform/useKeyboardOverlap';

// Jest runs as iOS, where the keyboard sends "will" events (see keyboardLift for Android).
const keyboard = (event: string, height: number, duration = 250) =>
  act(async () => {
    DeviceEventEmitter.emit(event, { endCoordinates: { height, screenX: 0, screenY: 844 - height, width: 390 }, duration });
  });

describe('useKeyboardOverlap', () => {
  it('is 0 while the keyboard is hidden', async () => {
    const { result } = await renderHook(() => useKeyboardOverlap(34));
    expect(result.current).toEqual({ overlap: 0, duration: 0 });
  });

  it('follows the keyboard as it opens, with how long it takes', async () => {
    const { result } = await renderHook(() => useKeyboardOverlap(34));
    await keyboard('keyboardWillShow', 291);
    expect(result.current).toEqual({ overlap: 291, duration: 250 });
  });

  it('goes back to 0 when the keyboard closes', async () => {
    const { result } = await renderHook(() => useKeyboardOverlap(34));
    await keyboard('keyboardWillShow', 291);
    await keyboard('keyboardWillHide', 0, 200);
    expect(result.current).toEqual({ overlap: 0, duration: 200 });
  });

  it('stops listening when unmounted', async () => {
    const { unmount } = await renderHook(() => useKeyboardOverlap(34));
    await unmount();
    expect(DeviceEventEmitter.listenerCount('keyboardWillShow')).toBe(0);
  });
});
