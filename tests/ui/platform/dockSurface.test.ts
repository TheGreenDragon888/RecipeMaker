import { Platform } from 'react-native';
import { currentDockSurface, dockSurfaceFor } from '../../../src/ui/platform/dockSurface';

describe('dockSurfaceFor', () => {
  it('uses a blur on iOS', () => {
    expect(dockSurfaceFor({ os: 'ios', version: '26.0' })).toBe('blur');
  });

  it('uses the Android blur on Android 12 (API 31)', () => {
    expect(dockSurfaceFor({ os: 'android', version: 31 })).toBe('androidBlur');
  });

  it('uses the Android blur on Android versions newer than 12', () => {
    expect(dockSurfaceFor({ os: 'android', version: 35 })).toBe('androidBlur');
  });

  it('uses a plain translucent bar on Android 11 (API 30) and older', () => {
    expect(dockSurfaceFor({ os: 'android', version: 30 })).toBe('translucent');
  });

  it('uses a plain translucent bar on any other platform', () => {
    expect(dockSurfaceFor({ os: 'web', version: '' })).toBe('translucent');
  });
});

describe('currentDockSurface', () => {
  it('uses a blur on iOS', () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(currentDockSurface()).toBe('blur');
  });

  it('uses the Android blur on Android 12', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(31);
    expect(currentDockSurface()).toBe('androidBlur');
  });

  it('uses a plain translucent bar on Android 11', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    jest.spyOn(Platform, 'Version', 'get').mockReturnValue(30);
    expect(currentDockSurface()).toBe('translucent');
  });
});
