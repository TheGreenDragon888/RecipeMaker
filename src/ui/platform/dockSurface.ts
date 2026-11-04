// PRESENTATION LAYER: picks how the bottom dock's background is drawn on this device.
import { Platform } from 'react-native';

/**
 * - `blur`: iOS (BlurView).
 * - `androidBlur`: Android 12+ blur of the screen behind the dock (BlurView with a blurTarget).
 * - `translucent`: a plain see-through bar, for older Android and anything else.
 */
export type DockSurface = 'blur' | 'androidBlur' | 'translucent';

export type DockDevice = {
  os: string;
  /** Platform.Version: a string such as "26.0" on iOS, the API level number on Android. */
  version: string | number;
};

/** Android 12 is API level 31, the first with the fast RenderNode blur. */
const ANDROID_BLUR_MIN_API = 31;

export function dockSurfaceFor(device: DockDevice): DockSurface {
  if (device.os === 'ios') return 'blur';
  if (device.os === 'android' && Number(device.version) >= ANDROID_BLUR_MIN_API) return 'androidBlur';
  return 'translucent';
}

/** The surface for the device the app is running on. */
export function currentDockSurface(): DockSurface {
  return dockSurfaceFor({ os: Platform.OS, version: Platform.Version });
}
