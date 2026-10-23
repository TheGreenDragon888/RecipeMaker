import { AccessibilityInfo } from 'react-native';
import { act, renderHook } from '@testing-library/react-native';
import { useReduceMotion } from '../../../src/ui/motion/useReduceMotion';

/** Captures the listener the hook gives AccessibilityInfo, and the remove() it gets back. */
function spyOnChanges() {
  const remove = jest.fn();
  let listener: ((enabled: boolean) => void) | undefined;
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation(((_event: string, handler: (enabled: boolean) => void) => {
    listener = handler;
    return { remove };
  }) as typeof AccessibilityInfo.addEventListener);
  return { remove, change: (enabled: boolean) => listener?.(enabled) };
}

afterEach(() => jest.restoreAllMocks());

describe('useReduceMotion', () => {
  it('is false until the setting is known', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
    const { result } = await renderHook(() => useReduceMotion());
    expect(result.current).toBe(false);
  });

  it('is true when Reduce Motion is on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    const { result } = await renderHook(() => useReduceMotion());
    expect(result.current).toBe(true);
  });

  it('follows the setting when it changes', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const changes = spyOnChanges();
    const { result } = await renderHook(() => useReduceMotion());
    await act(async () => changes.change(true));
    expect(result.current).toBe(true);
  });

  it('stops listening when unmounted', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    const changes = spyOnChanges();
    const { unmount } = await renderHook(() => useReduceMotion());
    await unmount();
    expect(changes.remove).toHaveBeenCalledTimes(1);
  });
});
