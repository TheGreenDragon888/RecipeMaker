import { act, renderHook } from '@testing-library/react-native';
import { useFocusEffect } from 'expo-router';
import { useFocusRefreshKey } from '../../../src/ui/navigation/useFocusRefreshKey';

jest.mock('expo-router', () => ({ useFocusEffect: jest.fn() }));

/** Plays the screen coming into view, as Expo Router does by running the callback it was given. */
const focus = () => act(async () => jest.mocked(useFocusEffect).mock.lastCall![0]());

beforeEach(() => jest.clearAllMocks());

describe('useFocusRefreshKey', () => {
  it('stays the same the first time the screen comes into view, which already loads it', async () => {
    const { result } = await renderHook(() => useFocusRefreshKey());
    const first = result.current;
    await focus();
    expect(result.current).toBe(first);
  });

  it('changes when the screen comes back into view', async () => {
    const { result } = await renderHook(() => useFocusRefreshKey());
    const first = result.current;
    await focus();
    await focus();
    expect(result.current).not.toBe(first);
  });

  it('changes every time the screen comes back', async () => {
    const { result } = await renderHook(() => useFocusRefreshKey());
    await focus();
    await focus();
    const second = result.current;
    await focus();
    expect(result.current).not.toBe(second);
  });
});
