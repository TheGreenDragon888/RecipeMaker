import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { NoticeBar } from '../../../src/ui/components/NoticeBar';
import { colors } from '../../../src/ui/theme';
import { shownText, styleOf } from '../../support/screen';

const undo = { label: 'Undo', accessibilityLabel: 'Undo removing Chili', onPress: jest.fn() };
const bar = () => screen.getByRole('alert').parent!;

describe('NoticeBar', () => {
  it('shows its message', async () => {
    await render(<NoticeBar message="Removed Chili" bottom={100} />);
    expect(shownText()).toEqual(['Removed Chili']);
  });

  it('is announced when it appears', async () => {
    await render(<NoticeBar message="Removed Chili" bottom={100} />);
    expect(screen.getByRole('alert')).toBeOnTheScreen();
  });

  it('sits the given distance from the bottom', async () => {
    await render(<NoticeBar message="Removed Chili" bottom={100} />);
    expect(styleOf(bar()).bottom).toBe(100);
  });

  it("uses the board's dark bar", async () => {
    await render(<NoticeBar message="Removed Chili" bottom={100} />);
    expect(styleOf(bar()).backgroundColor).toBe(colors.text);
  });

  it('has no button without an action', async () => {
    await render(<NoticeBar message="Couldn't update your bookmark." bottom={100} />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows its action under the label for screen readers', async () => {
    await render(<NoticeBar message="Removed Chili" bottom={100} action={undo} />);
    expect(screen.getByRole('button', { name: 'Undo removing Chili' })).toHaveTextContent('Undo');
  });

  it('runs its action when tapped', async () => {
    const onPress = jest.fn();
    await render(<NoticeBar message="Removed Chili" bottom={100} action={{ ...undo, onPress }} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
