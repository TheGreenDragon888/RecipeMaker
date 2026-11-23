import React from 'react';
import { AccessibilityInfo, BackHandler } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { FiltersSheet } from '../../../src/ui/components/FiltersSheet';
import { shownText } from '../../support/screen';

type SheetProps = React.ComponentProps<typeof FiltersSheet>;
const element = (props: Partial<SheetProps> = {}) => (
  <FiltersSheet open value={{}} count={8} bottomInset={0} onChange={() => {}} onClose={() => {}} {...props} />
);

const chip = (name: string) => screen.getByRole('button', { name });
const mealPrep = () => screen.getByRole('switch', { name: 'Meal Prep' });
const showButton = (name: string) => screen.getByRole('button', { name });

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('FiltersSheet', () => {
  describe('what it shows', () => {
    it('is titled Filters', async () => {
      await render(element());
      expect(shownText()).toContain('Filters');
    });

    it('shows the hands-on time section, which says it is not total time', async () => {
      await render(element());
      expect(shownText()).toEqual(expect.arrayContaining(['Hands-on cooking time', 'Active cooking only, not total time']));
    });

    it('offers the hands-on times', async () => {
      await render(element());
      expect(['15 min', '30 min', '45 min', '1 hr', 'Any'].map((name) => chip(name))).toHaveLength(5);
    });

    it('shows the number of people section', async () => {
      await render(element());
      expect(shownText()).toContain('Number of people');
    });

    it('shows the Meal Prep section with what Meal Prep means', async () => {
      await render(element());
      expect(shownText()).toEqual(expect.arrayContaining(['Meal Prep', 'Recipes that serve 4+ and keep well when made ahead.']));
    });

    it('starts with no limit, no number of people and Meal Prep off', async () => {
      await render(element());
      expect([chip('Any')]).toHaveLength(1);
      expect(shownText()).toEqual(expect.arrayContaining(['Any time', 'Any', 'Off']));
    });

    it('starts from the filters in force', async () => {
      await render(element({ value: { maxActiveMinutes: 30, people: 4, mealPrepOnly: true } }));
      expect(chip('30 min')).toBeSelected();
      expect(shownText()).toEqual(expect.arrayContaining(['30 min or less', '4 people', 'On']));
      expect(mealPrep().props.accessibilityState).toEqual({ checked: true });
    });

    it('shows nothing while closed', async () => {
      await render(element({ open: false }));
      expect(screen.queryByText('Hands-on cooking time')).toBeNull();
    });
  });

  describe('choosing', () => {
    it('reports a hands-on time', async () => {
      const onChange = jest.fn();
      await render(element({ onChange }));
      await fireEvent.press(chip('15 min'));
      expect(onChange).toHaveBeenLastCalledWith({ maxActiveMinutes: 15 });
    });

    it('selects the chosen time and says it in words', async () => {
      await render(element());
      await fireEvent.press(chip('1 hr'));
      expect(chip('1 hr')).toBeSelected();
      expect(shownText()).toContain('1 hr or less');
    });

    it('reports Any as no limit at all', async () => {
      const onChange = jest.fn();
      await render(element({ value: { maxActiveMinutes: 15 }, onChange }));
      await fireEvent.press(chip('Any'));
      expect(onChange).toHaveBeenLastCalledWith({});
    });

    it('reports a number of people', async () => {
      const onChange = jest.fn();
      await render(element({ onChange }));
      await fireEvent.press(screen.getByRole('button', { name: 'More people' }));
      expect(onChange).toHaveBeenLastCalledWith({ people: 1 });
    });

    it('reports going back to Any people as no number at all', async () => {
      const onChange = jest.fn();
      await render(element({ value: { people: 1 }, onChange }));
      await fireEvent.press(screen.getByRole('button', { name: 'Fewer people' }));
      expect(onChange).toHaveBeenLastCalledWith({});
    });

    it('reports Meal Prep switched on', async () => {
      const onChange = jest.fn();
      await render(element({ onChange }));
      await fireEvent.press(mealPrep());
      expect(onChange).toHaveBeenLastCalledWith({ mealPrepOnly: true });
    });

    it('reports Meal Prep switched off as no Meal Prep condition at all', async () => {
      const onChange = jest.fn();
      await render(element({ value: { mealPrepOnly: true }, onChange }));
      await fireEvent.press(mealPrep());
      expect(onChange).toHaveBeenLastCalledWith({});
    });

    it('keeps earlier choices when another is made', async () => {
      const onChange = jest.fn();
      await render(element({ onChange }));
      await fireEvent.press(chip('15 min'));
      await fireEvent.press(mealPrep());
      expect(onChange).toHaveBeenLastCalledWith({ maxActiveMinutes: 15, mealPrepOnly: true });
    });
  });

  describe('the button', () => {
    it('says how many recipes the choices show', async () => {
      await render(element({ count: 8 }));
      expect(showButton('Show 8 recipes')).toBeOnTheScreen();
    });

    it('does not give a number while it is being counted', async () => {
      await render(element({ count: null }));
      expect(showButton('Show recipes')).toBeOnTheScreen();
    });

    it('closes the sheet, keeping the choices', async () => {
      const onClose = jest.fn();
      await render(element({ onClose }));
      await fireEvent.press(chip('30 min'));
      await fireEvent.press(showButton('Show 8 recipes'));
      expect(onClose).toHaveBeenCalledWith({ maxActiveMinutes: 30 });
    });
  });

  describe('other ways of closing', () => {
    it('keeps the choices when the backdrop is tapped', async () => {
      const onClose = jest.fn();
      await render(element({ onClose }));
      await fireEvent.press(chip('45 min'));
      // The backdrop is drawn before the sheet, so it is the first "Close filters" and the grab bar the second.
      await fireEvent.press(screen.getAllByRole('button', { name: 'Close filters' })[0]);
      expect(onClose).toHaveBeenCalledWith({ maxActiveMinutes: 45 });
    });

    it('keeps the choices when the grab bar is tapped', async () => {
      const onClose = jest.fn();
      await render(element({ onClose }));
      await fireEvent.press(mealPrep());
      await fireEvent.press(screen.getAllByRole('button', { name: 'Close filters' })[1]);
      expect(onClose).toHaveBeenCalledWith({ mealPrepOnly: true });
    });

    it("keeps the choices when Android's back button is pressed", async () => {
      const handlers: Parameters<typeof BackHandler.addEventListener>[1][] = [];
      jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        handlers.push(handler);
        return { remove: jest.fn() };
      });
      const onClose = jest.fn();
      await render(element({ onClose }));
      await fireEvent.press(chip('30 min'));
      await act(async () => {
        handlers[handlers.length - 1]({} as Parameters<(typeof handlers)[number]>[0]);
      });
      expect(onClose).toHaveBeenCalledWith({ maxActiveMinutes: 30 });
    });
  });

  describe('Reset', () => {
    const reset = () => screen.getByRole('button', { name: 'Reset filters' });

    it('is not offered while nothing is selected', async () => {
      await render(element());
      expect(screen.queryByRole('button', { name: 'Reset filters' })).toBeNull();
    });

    it('is offered once something is selected', async () => {
      await render(element({ value: { maxActiveMinutes: 15 } }));
      expect(reset()).toBeOnTheScreen();
    });

    it('clears every choice and reports it', async () => {
      const onChange = jest.fn();
      await render(element({ value: { maxActiveMinutes: 15, people: 2, mealPrepOnly: true }, onChange }));
      await fireEvent.press(reset());
      expect(onChange).toHaveBeenLastCalledWith({});
      expect(chip('Any')).toBeSelected();
      expect(shownText()).toEqual(expect.arrayContaining(['Any time', 'Off']));
    });

    it('stays open', async () => {
      const onClose = jest.fn();
      await render(element({ value: { maxActiveMinutes: 15 }, onClose }));
      await fireEvent.press(reset());
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  it('starts from the filters in force each time it opens', async () => {
    await render(element({ value: { maxActiveMinutes: 15 } }));
    await fireEvent.press(chip('30 min'));
    await screen.rerender(element({ open: false, value: { maxActiveMinutes: 15 } }));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await screen.rerender(element({ open: true, value: { maxActiveMinutes: 60 } }));
    expect(chip('1 hr')).toBeSelected();
  });

  it('says it is over the dock as it opens, so the screen can move the dock out of the way', async () => {
    const onCoversDockChange = jest.fn();
    await render(element({ dockSpot: { bottom: 24, top: 100 }, onCoversDockChange }));
    expect(onCoversDockChange).toHaveBeenCalledWith(true);
  });
});
