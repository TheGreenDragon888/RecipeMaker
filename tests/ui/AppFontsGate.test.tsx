import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { useFonts } from 'expo-font';
import { AppFontsGate } from '../../src/ui/AppFontsGate';
import { fonts } from '../../src/ui/theme';
import { shownText } from '../support/screen';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

const mockedUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;

const renderGate = () =>
  render(
    <AppFontsGate>
      <Text>App</Text>
    </AppFontsGate>,
  );

describe('AppFontsGate', () => {
  it('shows nothing while the fonts load', async () => {
    mockedUseFonts.mockReturnValue([false, null]);
    await renderGate();
    expect(shownText()).toEqual([]);
  });

  it('shows its children once the fonts have loaded', async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    await renderGate();
    expect(shownText()).toEqual(['App']);
  });

  it('shows its children with system fonts when the fonts fail to load', async () => {
    mockedUseFonts.mockReturnValue([false, new Error('no font')]);
    await renderGate();
    expect(shownText()).toEqual(['App']);
  });

  it('reports the loading error in the console when the fonts fail to load', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('no font');
    mockedUseFonts.mockReturnValue([false, error]);
    await renderGate();
    expect(warn).toHaveBeenCalledWith('Fonts failed to load; using the system font.', error);
    warn.mockRestore();
  });

  it('loads every font family the theme names', async () => {
    mockedUseFonts.mockReturnValue([true, null]);
    await renderGate();
    const loaded = Object.keys(mockedUseFonts.mock.calls[0][0] as Record<string, unknown>);
    expect(loaded.sort()).toEqual([...new Set(Object.values(fonts))].sort());
  });
});
