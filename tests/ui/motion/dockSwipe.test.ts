import { indicatorOffset } from '../../../src/ui/motion/dockSwipe';
import { dock } from '../../../src/ui/theme';

// Offsets are px from the first tab's left edge, inside the dock's padding.
describe('indicatorOffset', () => {
  it('puts the pill under the first tab at 0', () => {
    expect(indicatorOffset(0)).toBe(0);
  });

  it('puts the pill under the second tab one tab width along', () => {
    expect(indicatorOffset(1)).toBe(dock.itemWidth);
  });
});
