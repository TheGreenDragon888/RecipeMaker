import { currentDockSurface, dockSurfaceFor } from '../../../src/ui/platform/dockSurface';
import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';

jest.mock('expo-glass-effect', () => ({
  isLiquidGlassAvailable: jest.fn(),
  isGlassEffectAPIAvailable: jest.fn(),
}));

describe('dockSurfaceFor', () => {
  it('uses Liquid Glass on iOS when the system offers it', () => {
    expect(dockSurfaceFor({ os: 'ios', version: '26.0', liquidGlassAvailable: true })).toBe('liquidGlass');
  });

  it('uses a blur on iOS when Liquid Glass is not available', () => {
    expect(dockSurfaceFor({ os: 'ios', version: '18.5', liquidGlassAvailable: false })).toBe('blur');
  });

  it('uses the Android blur on Android 12 (API 31)', () => {
    expect(dockSurfaceFor({ os: 'android', version: 31, liquidGlassAvailable: false })).toBe('androidBlur');
  });

  it('uses the Android blur on Android versions newer than 12', () => {
    expect(dockSurfaceFor({ os: 'android', version: 35, liquidGlassAvailable: false })).toBe('androidBlur');
  });

  it('uses a plain translucent bar on Android 11 (API 30) and older', () => {
    expect(dockSurfaceFor({ os: 'android', version: 30, liquidGlassAvailable: false })).toBe('translucent');
  });

  it('uses a plain translucent bar on any other platform', () => {
    expect(dockSurfaceFor({ os: 'web', version: '', liquidGlassAvailable: false })).toBe('translucent');
  });
});

describe('currentDockSurface', () => {
  // jest-expo runs tests as iOS.
  it('uses Liquid Glass when the glass effect and its API are both available', () => {
    jest.mocked(isLiquidGlassAvailable).mockReturnValue(true);
    jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(true);
    expect(currentDockSurface()).toBe('liquidGlass');
  });

  it('falls back to a blur when the glass effect API is missing', () => {
    // Early iOS 26 betas report Liquid Glass but crash when the API is used.
    jest.mocked(isLiquidGlassAvailable).mockReturnValue(true);
    jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(false);
    expect(currentDockSurface()).toBe('blur');
  });

  it('falls back to a blur when Liquid Glass is unavailable', () => {
    jest.mocked(isLiquidGlassAvailable).mockReturnValue(false);
    jest.mocked(isGlassEffectAPIAvailable).mockReturnValue(true);
    expect(currentDockSurface()).toBe('blur');
  });
});
