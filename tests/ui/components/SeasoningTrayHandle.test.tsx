import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SeasoningTrayHandle } from '../../../src/ui/components/SeasoningTrayHandle';
import { shownIcons, shownText, styleOf } from '../../support/screen';

const renderHandle = (onOpen = () => {}) => render(<SeasoningTrayHandle onCount={4} onOpen={onOpen} />);
const handle = () => screen.getByLabelText('Open seasonings tray');

describe('SeasoningTrayHandle', () => {
  it('names the tray', async () => {
    await renderHandle();
    expect(shownText()).toContain('Seasonings');
  });

  it('shows how many seasonings are on', async () => {
    await renderHandle();
    expect(shownText()).toContain('4 on hand');
  });

  it('calls onOpen when pressed', async () => {
    const onOpen = jest.fn();
    await renderHandle(onOpen);
    await fireEvent.press(handle());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('is a button for screen readers', async () => {
    await renderHandle();
    expect(screen.getByRole('button', { name: 'Open seasonings tray' })).toBeOnTheScreen();
  });

  it('draws only the spice jar, since its grab bar already says it pulls up', async () => {
    await renderHandle();
    expect(shownIcons()).toEqual(['spiceJar']);
  });

  it('stretches to fill its space when asked to', async () => {
    await render(<SeasoningTrayHandle onCount={4} onOpen={() => {}} fill />);
    expect(styleOf(handle()).flex).toBe(1);
  });

  it('keeps to its own height otherwise', async () => {
    await renderHandle();
    expect(styleOf(handle()).flex).toBeUndefined();
  });

  it('is at least 44px tall', async () => {
    await renderHandle();
    expect(styleOf(handle()).minHeight).toBeGreaterThanOrEqual(44);
  });
});
