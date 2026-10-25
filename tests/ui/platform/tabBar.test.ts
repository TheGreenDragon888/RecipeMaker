import { Platform } from 'react-native';
import { currentTabBar, tabBarFor } from '../../../src/ui/platform/tabBar';

describe('tabBarFor', () => {
  it("uses iOS's own tab bar on iOS", () => {
    expect(tabBarFor('ios')).toBe('native');
  });

  it('uses the floating dock on Android', () => {
    expect(tabBarFor('android')).toBe('dock');
  });

  it('uses the floating dock on any other platform', () => {
    expect(tabBarFor('web')).toBe('dock');
  });
});

describe('currentTabBar', () => {
  it("uses iOS's own tab bar when the app runs on iOS", () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    expect(currentTabBar()).toBe('native');
  });

  it('uses the floating dock when the app runs on Android', () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    expect(currentTabBar()).toBe('dock');
  });
});
