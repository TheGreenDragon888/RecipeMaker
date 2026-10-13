import React from 'react';
import { Text } from 'react-native';
import { useFonts } from 'expo-font';
import { AppFontsGate } from '../../src/ui/AppFontsGate';
import { fonts } from '../../src/ui/theme';
import { render, shownText } from '../support/render';

jest.mock('expo-font', () => ({ useFonts: jest.fn() }));

const mockedUseFonts = useFonts as jest.MockedFunction<typeof useFonts>;

const renderGate = () =>
  render(
    <AppFontsGate>
      <Text>App</Text>
    </AppFontsGate>,
  );

describe('AppFontsGate', () => {
  it('shows nothing while the fonts load', () => {
    mockedUseFonts.mockReturnValue([false, null]);
    expect(shownText(renderGate())).toEqual([]);
  });

  it('shows its children once the fonts have loaded', () => {
    mockedUseFonts.mockReturnValue([true, null]);
    expect(shownText(renderGate())).toEqual(['App']);
  });

  it('shows its children with system fonts when the fonts fail to load', () => {
    mockedUseFonts.mockReturnValue([false, new Error('no font')]);
    expect(shownText(renderGate())).toEqual(['App']);
  });

  it('loads every font family the theme names', () => {
    mockedUseFonts.mockReturnValue([true, null]);
    renderGate();
    const loaded = Object.keys(mockedUseFonts.mock.calls[0][0] as Record<string, unknown>);
    expect(loaded.sort()).toEqual([...new Set(Object.values(fonts))].sort());
  });
});
