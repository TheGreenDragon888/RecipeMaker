import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DockVisibilityProvider, useReportSheetShown } from '../../src/ui/DockVisibilityContext';

/** A child that says a sheet is showing when pressed, as the Pantry route does. */
function ShowsASheet() {
  const reportSheetShown = useReportSheetShown();
  return (
    <Pressable accessibilityRole="button" onPress={() => reportSheetShown(true)}>
      <Text>Open a sheet</Text>
    </Pressable>
  );
}

describe('DockVisibilityContext', () => {
  it('passes a screen saying a sheet is showing up to the tabs layout', async () => {
    const onSheetShownChange = jest.fn();
    await render(
      <DockVisibilityProvider onSheetShownChange={onSheetShownChange}>
        <ShowsASheet />
      </DockVisibilityProvider>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Open a sheet' }));
    expect(onSheetShownChange).toHaveBeenCalledWith(true);
  });

  it('lets a screen outside the tabs report a sheet without anything happening', async () => {
    await render(<ShowsASheet />);
    await fireEvent.press(screen.getByRole('button', { name: 'Open a sheet' }));
    expect(screen.getByText('Open a sheet')).toBeOnTheScreen();
  });
});
