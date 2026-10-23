import React from 'react';
import { act } from 'react-test-renderer';
import type { SeasoningGroup } from '../../../src/domain/seasonings';
import { SeasoningChip } from '../../../src/ui/components/SeasoningChip';
import { SeasoningTray } from '../../../src/ui/components/SeasoningTray';
import { render, shownText } from '../../support/render';

const groups: SeasoningGroup[] = [
  { section: 'everyday', seasonings: ['paprika'] },
  { section: 'spicesAndHerbs', seasonings: ['basil', 'dried basil'] },
];

type TrayProps = React.ComponentProps<typeof SeasoningTray>;

const renderTray = (props: Partial<TrayProps> = {}) =>
  render(<SeasoningTray groups={groups} on={['Dried Basil']} onToggle={() => {}} onClose={() => {}} {...props} />);
const chips = (renderer: ReturnType<typeof render>) => renderer.root.findAllByType(SeasoningChip);
const chipLabelled = (renderer: ReturnType<typeof render>, label: string) =>
  chips(renderer).find((c) => c.props.label === label)!;

describe('SeasoningTray', () => {
  it('shows its title and what to do', () => {
    expect(shownText(renderTray())).toEqual(expect.arrayContaining(['Seasonings', 'Tap what’s in your spice rack']));
  });

  it('shows the section headings in tray order', () => {
    const text = shownText(renderTray());
    expect(text.indexOf('Everyday')).toBeLessThan(text.indexOf('Spices & herbs'));
  });

  it('shows a chip for every seasoning, a fresh herb marked "Fresh" beside its dried version', () => {
    expect(chips(renderTray()).map((c) => c.props.label)).toEqual(['Paprika', 'Fresh Basil', 'Dried Basil']);
  });

  it('shows a chip as on when its seasoning is on, whatever the case', () => {
    expect(chipLabelled(renderTray(), 'Dried Basil').props.on).toBe(true);
  });

  it('shows a chip as off when its seasoning is not on', () => {
    expect(chipLabelled(renderTray(), 'Paprika').props.on).toBe(false);
  });

  it('calls onToggle with the seasoning name when a chip is pressed', () => {
    const onToggle = jest.fn();
    const renderer = renderTray({ onToggle });
    act(() => chipLabelled(renderer, 'Fresh Basil').props.onToggle());
    expect(onToggle).toHaveBeenCalledWith('basil');
  });

  it('counts how many of the tray are on', () => {
    expect(shownText(renderTray())).toContain('1 of 3');
  });

  it('calls onClose from Done', () => {
    const onClose = jest.fn();
    const renderer = renderTray({ onClose });
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Done' }).props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose from the grab bar', () => {
    const onClose = jest.fn();
    const renderer = renderTray({ onClose });
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Close seasonings tray' }).props.onPress());
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('has no backdrop of its own (the drawer draws it)', () => {
    expect(renderTray().root.findAll((n) => n.props.testID === 'seasoning-backdrop')).toHaveLength(0);
  });

  it('lets the grab bar and header be dragged with dragHandlers', () => {
    const onResponderGrant = jest.fn();
    const area = renderTray({ dragHandlers: { onResponderGrant } }).root.findByProps({ testID: 'seasoning-tray-drag-area' });
    expect(area.props.onResponderGrant).toBe(onResponderGrant);
  });
});
