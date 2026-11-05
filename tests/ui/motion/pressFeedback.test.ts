import { pressedScale } from '../../../src/ui/motion/pressFeedback';

describe('pressedScale', () => {
  it('shrinks a card a little while pressed', () => {
    expect(pressedScale('card', false)).toBe(0.97);
  });

  it('shrinks a button a bit more', () => {
    expect(pressedScale('button', false)).toBe(0.95);
  });

  it('shrinks a small control, like a chip or a round button, the most', () => {
    expect(pressedScale('small', false)).toBe(0.9);
  });

  it('does not shrink anything with Reduce Motion on', () => {
    expect(['card', 'button', 'small'].map((size) => pressedScale(size as 'card', true))).toEqual([1, 1, 1]);
  });
});
