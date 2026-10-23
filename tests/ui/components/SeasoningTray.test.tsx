import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { SeasoningGroup } from '../../../src/domain/seasonings';
import { SeasoningTray } from '../../../src/ui/components/SeasoningTray';
import { shownText } from '../../support/screen';

const groups: SeasoningGroup[] = [
  { section: 'everyday', seasonings: ['paprika'] },
  { section: 'spicesAndHerbs', seasonings: ['basil', 'dried basil'] },
];

type TrayProps = React.ComponentProps<typeof SeasoningTray>;

const renderTray = (props: Partial<TrayProps> = {}) =>
  render(<SeasoningTray groups={groups} on={['Dried Basil']} onToggle={() => {}} onClose={() => {}} {...props} />);
const chips = () => screen.getAllByRole('togglebutton');
const chipLabelled = (label: string) => screen.getByRole('togglebutton', { name: label });

describe('SeasoningTray', () => {
  it('shows its title and what to do', async () => {
    await renderTray();
    expect(shownText()).toEqual(expect.arrayContaining(['Seasonings', 'Tap what’s in your spice rack']));
  });

  it('shows the section headings in tray order', async () => {
    await renderTray();
    const text = shownText();
    expect(text.indexOf('Everyday')).toBeLessThan(text.indexOf('Spices & herbs'));
  });

  it('shows a chip for every seasoning, a fresh herb marked "Fresh" beside its dried version', async () => {
    await renderTray();
    expect(chips().map((chip) => shownText(chip).join(''))).toEqual(['Paprika', 'Fresh Basil', 'Dried Basil']);
  });

  it('shows a chip as on when its seasoning is on, whatever the case', async () => {
    await renderTray();
    expect(chipLabelled('Dried Basil').props.accessibilityState).toEqual({ checked: true });
  });

  it('shows a chip as off when its seasoning is not on', async () => {
    await renderTray();
    expect(chipLabelled('Paprika').props.accessibilityState).toEqual({ checked: false });
  });

  it('calls onToggle with the seasoning name when a chip is pressed', async () => {
    const onToggle = jest.fn();
    await renderTray({ onToggle });
    await fireEvent.press(chipLabelled('Fresh Basil'));
    expect(onToggle).toHaveBeenCalledWith('basil');
  });

  it('counts how many of the tray are on', async () => {
    await renderTray();
    expect(shownText()).toContain('1 of 3');
  });

  it('calls onClose from Done', async () => {
    const onClose = jest.fn();
    await renderTray({ onClose });
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the grab bar', async () => {
    const onClose = jest.fn();
    await renderTray({ onClose });
    await fireEvent.press(screen.getByRole('button', { name: 'Close seasonings tray' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no backdrop of its own (the drawer draws it)', async () => {
    await renderTray();
    expect(screen.queryByTestId('seasoning-backdrop')).not.toBeOnTheScreen();
  });

  it('lets the grab bar and header be dragged with dragHandlers', async () => {
    const onResponderGrant = jest.fn();
    await renderTray({ dragHandlers: { onResponderGrant } });
    expect(screen.getByTestId('seasoning-tray-drag-area').props.onResponderGrant).toBe(onResponderGrant);
  });
});
