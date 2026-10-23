import React from 'react';
import Svg, { Line, Path, Polyline, Rect } from 'react-native-svg';
import { Icon } from '../../../src/ui/components/Icon';
import { render } from '../../support/render';

const svg = (element: React.ReactElement) => render(element).root.findByType(Svg);

describe('Icon', () => {
  it('draws at the given size', () => {
    const drawn = svg(<Icon name="clock" size={13} color="#000" />);
    expect([drawn.props.width, drawn.props.height]).toEqual([13, 13]);
  });

  it('strokes in the given color', () => {
    expect(svg(<Icon name="search" size={18} color="#8A7A68" />).props.stroke).toBe('#8A7A68');
  });

  it('uses the given stroke width', () => {
    expect(svg(<Icon name="arrowRight" size={18} color="#000" strokeWidth={2} />).props.strokeWidth).toBe(2);
  });

  it.each([
    ['pantry', 2],
    ['recipes', 2],
    ['bookmark', 1],
  ] as const)('draws the dock\'s %s icon from the board\'s shapes', (name, paths) => {
    expect(svg(<Icon name={name} size={22} color="#000" />).findAllByType(Path)).toHaveLength(paths);
  });

  it("draws the seasoning tray's spice jar from the board's shapes (a jar, its lid and a label line)", () => {
    const drawn = svg(<Icon name="spiceJar" size={18} color="#000" />);
    expect([drawn.findAllByType(Rect).length, drawn.findAllByType(Path).length, drawn.findAllByType(Line).length]).toEqual([1, 1, 1]);
  });

  it.each([
    ['check', '5,13 10,18 19,7'],
  ] as const)("draws the %s icon from the board's points", (name, points) => {
    expect(svg(<Icon name={name} size={14} color="#000" />).findByType(Polyline).props.points).toBe(points);
  });

  it('is hidden from screen readers, since the text or label beside it says the same', () => {
    const drawn = svg(<Icon name="link" size={22} color="#000" />);
    expect(drawn.props.accessibilityElementsHidden).toBe(true);
  });
});
