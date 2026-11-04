// Test helper: tells every View that asks where it is on screen (measureInWindow) that it sits at a given spot.
// Jest's stand-in for React Native's native view answers nothing by itself, so a component that measures
// itself would never learn its place.

type Frame = { x: number; y: number; width: number; height: number };

/** The prototype that holds measureInWindow on Jest's stand-in View class (React Native's jest preset). */
function measuringPrototype(): Record<string, unknown> {
  const { View } = jest.requireActual('react-native');
  let prototype = View.prototype;
  while (prototype && !Object.prototype.hasOwnProperty.call(prototype, 'measureInWindow')) {
    prototype = Object.getPrototypeOf(prototype);
  }
  if (!prototype) throw new Error('No measureInWindow on the test View; React Native changed its Jest stand-in.');
  return prototype;
}

/** Makes every View that measures itself report `frame`. Undo with jest.restoreAllMocks(). */
export function placeViewsAt({ x, y, width, height }: Frame) {
  jest
    .spyOn(measuringPrototype() as { measureInWindow: (callback: (...frame: number[]) => void) => void }, 'measureInWindow')
    .mockImplementation((callback) => callback(x, y, width, height));
}
