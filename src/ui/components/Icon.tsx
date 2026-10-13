// PRESENTATION LAYER: the mockup's line icons, drawn with the same 24×24 shapes as the design board.
// Icons are decoration next to text or inside a labelled button, so screen readers skip them.
import React from 'react';
import Svg, { Circle, Line, Path, Polyline } from 'react-native-svg';

const shapes = {
  search: (
    <>
      <Circle cx="10" cy="10" r="6" />
      <Line x1="14.5" y1="14.5" x2="20" y2="20" />
    </>
  ),
  arrowRight: (
    <>
      <Line x1="4" y1="12" x2="18" y2="12" />
      <Polyline points="12,6 18,12 12,18" />
    </>
  ),
  chevronLeft: <Polyline points="15,6 9,12 15,18" />,
  close: (
    <>
      <Line x1="6" y1="6" x2="18" y2="18" />
      <Line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  clock: (
    <>
      <Circle cx="12" cy="12" r="8" />
      <Polyline points="12,7 12,12 16,14" />
    </>
  ),
  people: (
    <>
      <Circle cx="9" cy="9" r="3" />
      <Circle cx="17" cy="10" r="2.5" />
      <Path d="M3 20c.7-3.3 3-5 6-5s5.3 1.7 6 5" />
      <Path d="M14.5 15.3c2 .3 3.5 1.7 4 4.7" />
    </>
  ),
  link: (
    <>
      <Path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
      <Path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
    </>
  ),
  externalLink: (
    <>
      <Path d="M14 4h6v6" />
      <Line x1="20" y1="4" x2="11" y2="13" />
      <Path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </>
  ),
  utensils: (
    <>
      <Path d="M4 3v8a4 4 0 0 0 8 0V3" />
      <Path d="M8 3v8" />
      <Path d="M4 3v3" />
      <Path d="M17 3c-1.6 0-2.7 1.6-2.7 4.2s1.1 5.3 2.7 5.3 2.7-2.7 2.7-5.3S18.6 3 17 3Z" />
      <Line x1="17" y1="12.5" x2="17" y2="21" />
      <Line x1="8" y1="11" x2="8" y2="21" />
    </>
  ),
};

export type IconName = keyof typeof shapes;

type Props = {
  name: IconName;
  size: number;
  color: string;
  /** In the 24×24 grid; the board uses 1.75 for most icons and 2 for arrows and buttons. */
  strokeWidth?: number;
};

export function Icon({ name, size, color, strokeWidth = 1.75 }: Props) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {shapes[name]}
    </Svg>
  );
}
