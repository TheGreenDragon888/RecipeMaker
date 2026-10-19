import React from 'react';
import Svg from 'react-native-svg';
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

  it('is hidden from screen readers, since the text or label beside it says the same', () => {
    const drawn = svg(<Icon name="link" size={22} color="#000" />);
    expect(drawn.props.accessibilityElementsHidden).toBe(true);
  });
});
