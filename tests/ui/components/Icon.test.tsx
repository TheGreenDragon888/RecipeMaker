import React from 'react';
import { render } from '@testing-library/react-native';
import { Icon } from '../../../src/ui/components/Icon';
import { shownOfType } from '../../support/screen';

/** The icon's drawing (react-native-svg's native view). */
const drawing = () => shownOfType('RNSVGSvgView')[0];

describe('Icon', () => {
  it('draws at the given size', async () => {
    await render(<Icon name="clock" size={13} color="#000" />);
    expect([drawing().props.width, drawing().props.height]).toEqual([13, 13]);
  });

  it('strokes in the given color', async () => {
    await render(<Icon name="search" size={18} color="#8A7A68" />);
    expect(drawing().props.stroke).toBe('#8A7A68');
  });

  it('uses the given stroke width', async () => {
    await render(<Icon name="arrowRight" size={18} color="#000" strokeWidth={2} />);
    expect(drawing().props.strokeWidth).toBe(2);
  });

  it.each([
    ['pantry', 2],
    ['recipes', 2],
    ['bookmark', 1],
  ] as const)("draws the dock's %s icon from the board's shapes", async (name, paths) => {
    await render(<Icon name={name} size={22} color="#000" />);
    expect(shownOfType('RNSVGPath')).toHaveLength(paths);
  });

  it("draws the seasoning tray's spice jar from the board's shapes (a jar, its lid and a label line)", async () => {
    await render(<Icon name="spiceJar" size={18} color="#000" />);
    expect([shownOfType('RNSVGRect').length, shownOfType('RNSVGPath').length, shownOfType('RNSVGLine').length]).toEqual([1, 1, 1]);
  });

  // react-native-svg draws a Polyline as a path through the same points.
  it.each([
    ['check', 'M5 13 10 18 19 7'],
  ] as const)("draws the %s icon from the board's points", async (name, path) => {
    await render(<Icon name={name} size={14} color="#000" />);
    expect(shownOfType('RNSVGPath')[0].props.d).toBe(path);
  });

  it("draws the swap icon from the board's two arrows", async () => {
    await render(<Icon name="swap" size={12} color="#000" />);
    expect(shownOfType('RNSVGPath').map((path) => path.props.d)).toEqual(['M7 7h11l-3-3', 'M17 17H6l3 3']);
  });

  it('is hidden from screen readers, since the text or label beside it says the same', async () => {
    await render(<Icon name="link" size={22} color="#000" />);
    expect(drawing().props.accessibilityElementsHidden).toBe(true);
  });

  it('names its drawing after the icon, so tests can tell icons apart', async () => {
    await render(<Icon name="link" size={22} color="#000" />);
    expect(drawing().props.testID).toBe('icon-link');
  });
});
