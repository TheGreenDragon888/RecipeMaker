import React from 'react';
import { Animated } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { PantryScreen } from '../../../src/ui/screens/PantryScreen';
import { dock } from '../../../src/ui/theme';
import type { PantryCatalog } from '../../../src/domain/pantryCatalog';
import { listContentStyle, shownIcons, shownText, styleOf, tapTwiceBeforeRedraw } from '../../support/screen';

const suggestion = (ingredient: string, matchedAlias: string | null = null) => ({ ingredient, matchedAlias });

const sixPm = () => new Date(2026, 9, 10, 18, 0);

const EMPTY_CATALOG: PantryCatalog = { units: {}, seasoningGroups: [] };

/**
 * The catalog for tests that aren't about units or seasonings: still loading, so it never updates the screen
 * after the test ends. Tests about the catalog pass one that loads, and wait for it.
 */
const stillLoading = () => jest.fn(() => new Promise<PantryCatalog>(() => {}));

/** By default every typed word counts as a known ingredient (lowercased), and nothing is suggested. */
async function setup({
  suggestIngredients = jest.fn().mockResolvedValue([]),
  findIngredient = jest.fn(async (raw: string) => raw.trim().toLowerCase() || null),
  getPantryCatalog = stillLoading(),
  bottomClearance,
}: { suggestIngredients?: jest.Mock; findIngredient?: jest.Mock; getPantryCatalog?: jest.Mock; bottomClearance?: number } = {}) {
  const services = { suggestIngredients, findIngredient, getPantryCatalog } as unknown as RecipeServices;
  const onFindRecipes = jest.fn();
  await render(<PantryScreen services={services} onFindRecipes={onFindRecipes} now={sixPm} bottomClearance={bottomClearance} />);
  return { suggestIngredients, findIngredient, getPantryCatalog, onFindRecipes };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const byLabel = (label: string) => screen.getByLabelText(label);
const field = () => byLabel('Add an ingredient');

async function typeText(text: string) {
  await fireEvent.changeText(field(), text);
}

/**
 * Presses the keyboard's Done key without waiting on the lookup it starts, so a test can keep that lookup
 * pending. (RNTL's fireEvent would wait for the whole handler, lookup included.)
 */
async function pressDone() {
  await act(async () => {
    field().props.onSubmitEditing();
  });
}

async function press(label: string) {
  await fireEvent.press(byLabel(label));
}

async function addIngredient(text: string) {
  await typeText(text);
  await pressDone();
}

/**
 * The pantry list's rows, in order. Each row's + button is labelled "Increase <name> quantity", and the row
 * around it shows the name, the quantity, and the unit (if any).
 */
function pantryRows() {
  return screen.queryAllByLabelText(/^Increase .+ quantity$/).map((increase) => {
    const label = String(increase.props.accessibilityLabel);
    const text = shownText(increase.parent!.parent!).filter((piece) => piece.trim() !== '');
    return {
      name: label.slice('Increase '.length, -' quantity'.length),
      quantity: Number(text[1]),
      unit: text[2] ?? null,
      increase,
    };
  });
}
const pantryNames = () => pantryRows().map((row) => row.name);
const pantryQuantities = () => pantryRows().map((row) => row.quantity);

/** The labels of the suggestion buttons ("Add tofu", ...) on screen. */
const suggestionButtons = () => screen.queryAllByRole('button', { name: /^Add / }).map((b) => b.props.accessibilityLabel);

/** The view the find button floats in. */
const findButtonHolder = (label: string) => byLabel(label).parent!;

describe('PantryScreen', () => {
  describe('pantry list', () => {
    it('shows the tagline for the time of day', async () => {
      await setup();
      expect(shownText()).toContain("what's for dinner?");
    });

    it('draws a search icon in the text field', async () => {
      await setup();
      expect(shownIcons()).toContain('search');
    });

    it('shows a hint when the pantry is empty', async () => {
      await setup();
      expect(shownText()).toContain('Add the ingredients you have.');
    });

    it('hides the hint once an ingredient is added', async () => {
      await setup();
      await addIngredient('tomato');
      expect(shownText()).not.toContain('Add the ingredients you have.');
    });

    it('disables the find button while the pantry is empty', async () => {
      await setup();
      expect(byLabel('Find recipes with 0 ingredients')).toBeDisabled();
    });

    it('does not show a separate add button', async () => {
      await setup();
      expect(screen.queryByLabelText('Add ingredient')).not.toBeOnTheScreen();
    });

    it('clears the text field after adding an ingredient', async () => {
      await setup();
      await addIngredient('tomato');
      expect(field()).toHaveDisplayValue('');
    });

    it('does not add an ingredient that is already in the pantry', async () => {
      await setup();
      await addIngredient('tomato');
      await addIngredient('Tomato ');
      expect(pantryNames()).toEqual(['tomato']);
    });

    it('removes an ingredient when its remove button is pressed', async () => {
      await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      await press('Remove tomato');
      expect(pantryNames()).toEqual(['egg']);
    });

    it('shows the number of ingredients on the find button', async () => {
      await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      expect(byLabel('Find recipes with 2 ingredients')).toBeOnTheScreen();
    });

    it('passes the pantry list to onFindRecipes when the find button is pressed', async () => {
      const { onFindRecipes } = await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      await press('Find recipes with 2 ingredients');
      expect(onFindRecipes).toHaveBeenCalledWith(['tomato', 'egg']);
    });
  });

  describe('room for the dock', () => {
    it('floats the find button just above the dock, as on the board', async () => {
      await setup();
      expect(styleOf(findButtonHolder('Find recipes with 0 ingredients'))).toMatchObject({
        position: 'absolute',
        bottom: dock.clearance,
      });
    });

    it('leaves room below the last ingredient for the find button and the dock', async () => {
      await setup();
      expect(listContentStyle().paddingBottom).toBeGreaterThan(dock.clearance);
    });

    it('floats the find button above a dock lifted by a home indicator', async () => {
      await setup({ bottomClearance: 110 });
      expect(styleOf(findButtonHolder('Find recipes with 0 ingredients')).bottom).toBe(110);
    });

    it('leaves room below the last ingredient for a dock lifted by a home indicator', async () => {
      await setup({ bottomClearance: 110 });
      expect(listContentStyle().paddingBottom).toBeGreaterThan(110);
    });
  });

  describe('quantities', () => {
    it('starts a new ingredient at 1', async () => {
      await setup();
      await addIngredient('tomato');
      expect(pantryQuantities()).toEqual([1]);
    });

    it('raises the quantity when + is pressed', async () => {
      await setup();
      await addIngredient('tomato');
      await press('Increase tomato quantity');
      expect(pantryQuantities()).toEqual([2]);
    });

    it('lowers the quantity when − is pressed', async () => {
      await setup();
      await addIngredient('tomato');
      await press('Increase tomato quantity');
      await press('Decrease tomato quantity');
      expect(pantryQuantities()).toEqual([1]);
    });

    it('leaves the other ingredients alone when − is pressed twice quickly on a quantity of 1', async () => {
      await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      tapTwiceBeforeRedraw(byLabel('Remove tomato'));
      expect(pantryNames()).toEqual(['egg']);
    });

    it('stops the row from increasing at 99', async () => {
      await setup();
      await addIngredient('tomato');
      for (let i = 1; i < 99; i++) await press('Increase tomato quantity');
      expect(byLabel('Increase tomato quantity')).toBeDisabled();
    });

    it('counts ingredients, not quantities, on the find button', async () => {
      await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      await press('Increase tomato quantity');
      expect(byLabel('Find recipes with 2 ingredients')).toBeOnTheScreen();
    });

    it('passes only the ingredient names to onFindRecipes', async () => {
      const { onFindRecipes } = await setup();
      await addIngredient('tomato');
      await addIngredient('egg');
      await press('Increase tomato quantity');
      await press('Find recipes with 2 ingredients');
      expect(onFindRecipes).toHaveBeenCalledWith(['tomato', 'egg']);
    });
  });

  describe('adding with the Done key', () => {
    it('adds a known ingredient', async () => {
      await setup();
      await addIngredient('egg');
      expect(pantryNames()).toEqual(['egg']);
    });

    it('looks up the typed text with findIngredient', async () => {
      const { findIngredient } = await setup();
      await addIngredient('scallions');
      expect(findIngredient).toHaveBeenCalledWith('scallions');
    });

    it('adds the database name for an alias', async () => {
      const findIngredient = jest.fn().mockResolvedValue('green onion');
      await setup({ findIngredient });
      await addIngredient('scallions');
      expect(pantryNames()).toEqual(['green onion']);
    });

    it('adds the first suggestion when the text is only part of a name', async () => {
      await setup({
        findIngredient: jest.fn().mockResolvedValue(null),
        suggestIngredients: jest.fn().mockResolvedValue([suggestion('tomato'), suggestion('tomato paste')]),
      });
      await addIngredient('tom');
      expect(pantryNames()).toEqual(['tomato']);
    });

    it('does not add text that is not a known ingredient', async () => {
      await setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient('dragonfruit');
      expect(pantryNames()).toEqual([]);
    });

    it('says when the text is not a known ingredient', async () => {
      await setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient('dragonfruit');
      expect(shownText()).toContain('“dragonfruit” isn’t in our ingredient list.');
    });

    it('keeps unknown text in the field so it can be corrected', async () => {
      await setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient('dragonfruit');
      expect(field()).toHaveDisplayValue('dragonfruit');
    });

    it('hides the not-found message once the user types again', async () => {
      await setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient('dragonfruit');
      await typeText('dragon');
      expect(shownText()).not.toContain('“dragonfruit” isn’t in our ingredient list.');
    });

    it('does nothing when the text is blank', async () => {
      const { findIngredient } = await setup();
      await addIngredient('   ');
      expect(findIngredient).not.toHaveBeenCalled();
    });

    it('says when the ingredient check fails', async () => {
      await setup({ findIngredient: jest.fn().mockRejectedValue(new Error('database busy')) });
      await addIngredient('tomato');
      expect(shownText()).toContain("Couldn't check that ingredient");
    });

    it('ignores a lookup that finishes after the user typed something else', async () => {
      const lookup = deferred<string | null>();
      await setup({ findIngredient: jest.fn().mockReturnValue(lookup.promise) });
      await addIngredient('tomato');
      await typeText('egg');
      await act(async () => lookup.resolve('tomato'));
      expect(pantryNames()).toEqual([]);
    });
  });

  describe('suggestions', () => {
    it('asks for suggestions with the typed text', async () => {
      const { suggestIngredients } = await setup();
      await typeText('to');
      expect(suggestIngredients).toHaveBeenCalledWith('to');
    });

    it('does not ask for suggestions when the text is blank', async () => {
      const { suggestIngredients } = await setup();
      await typeText('  ');
      expect(suggestIngredients).not.toHaveBeenCalled();
    });

    it('shows the suggestions for the typed text', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu'), suggestion('tomato')]) });
      await typeText('to');
      expect(suggestionButtons()).toEqual(['Add tofu', 'Add tomato']);
    });

    it('does not show the suggestion list when nothing matches', async () => {
      await setup();
      await typeText('zz');
      expect(suggestionButtons()).toEqual([]);
    });

    it('adds a suggestion when it is tapped', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu'), suggestion('tomato')]) });
      await typeText('to');
      await press('Add tomato');
      expect(pantryNames()).toEqual(['tomato']);
    });

    it('hides the suggestions after one is tapped', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu'), suggestion('tomato')]) });
      await typeText('to');
      await press('Add tomato');
      expect(suggestionButtons()).toEqual([]);
    });

    it('hides the suggestions when the text is cleared', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu')]) });
      await typeText('to');
      await typeText('');
      expect(suggestionButtons()).toEqual([]);
    });

    it('shows a message when suggestions fail to load', async () => {
      await setup({ suggestIngredients: jest.fn().mockRejectedValue(new Error('database busy')) });
      await typeText('to');
      expect(shownText()).toContain("Couldn't load suggestions");
    });

    it('hides the failure message once the user types again', async () => {
      const suggestIngredients = jest.fn().mockRejectedValueOnce(new Error('database busy')).mockResolvedValue([suggestion('tomato')]);
      await setup({ suggestIngredients });
      await typeText('to');
      await typeText('tom');
      expect(shownText()).not.toContain("Couldn't load suggestions");
    });

    it('ignores suggestions that arrive after newer text was typed', async () => {
      const forTo = deferred<{ ingredient: string; matchedAlias: string | null }[]>();
      const forTom = deferred<{ ingredient: string; matchedAlias: string | null }[]>();
      const suggestIngredients = jest.fn().mockReturnValueOnce(forTo.promise).mockReturnValueOnce(forTom.promise);
      await setup({ suggestIngredients });
      await typeText('to');
      await typeText('tom');

      await act(async () => forTom.resolve([suggestion('tomato')]));
      await act(async () => forTo.resolve([suggestion('tofu'), suggestion('tomato')]));

      expect(suggestionButtons()).toEqual(['Add tomato']);
    });
  });

  describe('units and seasonings', () => {
    const CATALOG: PantryCatalog = {
      units: { garlic: 'clove', egg: 'each' },
      seasoningGroups: [
        { section: 'everyday', seasonings: ['paprika'] },
        { section: 'spicesAndHerbs', seasonings: ['ground cumin'] },
      ],
    };
    const withCatalog = (catalog: PantryCatalog = CATALOG) => setup({ getPantryCatalog: jest.fn().mockResolvedValue(catalog) });
    const flush = () => act(async () => {});
    // The handle and the tray can be on screen while see-through (fading), so these count them either way.
    const everything = { includeHiddenElements: true };
    const handles = () => screen.queryAllByLabelText('Open seasonings tray', everything);
    const trays = () => screen.queryAllByTestId('seasoning-tray-drag-area', everything);
    const onHandShown = () => shownText(handles()[0]).find((text) => text.endsWith('on hand'));
    const openTray = () => press('Open seasonings tray');
    const chip = (label: string) => screen.getByRole('togglebutton', { name: label });
    const toggleChip = (label: string) => fireEvent.press(chip(label));

    it('loads the pantry catalog once when it opens', async () => {
      const { getPantryCatalog } = await withCatalog();
      await flush();
      expect(getPantryCatalog).toHaveBeenCalledTimes(1);
    });

    it('gives a counted ingredient its pantry unit', async () => {
      await withCatalog();
      await flush();
      await addIngredient('garlic');
      expect(pantryRows().map((row) => row.unit)).toEqual(['clove']);
    });

    it('adds an ingredient the catalog has no unit for with no unit', async () => {
      await withCatalog();
      await flush();
      await addIngredient('dragon fruit');
      expect(pantryRows().map((row) => row.unit)).toEqual([null]);
    });

    it('switches a picked seasoning on in the tray instead of adding it to the list', async () => {
      await withCatalog();
      await flush();
      await addIngredient('paprika');
      expect(pantryNames()).toEqual([]);
      expect(onHandShown()).toBe('1 on hand');
    });

    it('says a picked seasoning is on in the tray', async () => {
      await withCatalog();
      await flush();
      await addIngredient('paprika');
      expect(shownText()).toContain('Paprika is on in Seasonings.');
    });

    it('keeps a seasoning on when it is picked again', async () => {
      await withCatalog();
      await flush();
      await addIngredient('paprika');
      await addIngredient('paprika');
      expect(onHandShown()).toBe('1 on hand');
    });

    it('does not add a staple, and says recipes already assume it', async () => {
      await withCatalog();
      await flush();
      await addIngredient('olive oil');
      expect(pantryNames()).toEqual([]);
      expect(shownText()).toContain('Recipes already assume you have olive oil.');
    });

    it('shows the tray handle when there are seasonings', async () => {
      await withCatalog();
      await flush();
      expect(handles()).toHaveLength(1);
    });

    it('hides the tray handle when the catalog has no seasonings', async () => {
      await withCatalog(EMPTY_CATALOG);
      await flush();
      expect(handles()).toHaveLength(0);
    });

    it('opens the tray from the handle, in place of the handle, once it has grown', async () => {
      jest.useFakeTimers();
      try {
        await withCatalog();
        await flush();
        await openTray();
        await act(async () => { jest.advanceTimersByTime(TRAY_SLIDE_MS); });
        expect([trays().length, handles().length]).toEqual([1, 0]);
      } finally {
        jest.useRealTimers();
      }
    });

    it('starts opening the tray as soon as the handle is tapped', async () => {
      await withCatalog();
      await flush();
      await openTray();
      expect(trays()).toHaveLength(1);
    });

    it('places the closed handle above the find button', async () => {
      await setup({ getPantryCatalog: jest.fn().mockResolvedValue(CATALOG), bottomClearance: 110 });
      await flush();
      expect(styleOf(screen.getByTestId('seasoning-sheet', everything)).bottom).toBe(172);
    });

    it('closes the tray with Done, once it has slid down', async () => {
      jest.useFakeTimers();
      try {
        await withCatalog();
        await flush();
        await openTray();
        await press('Done');
        await act(async () => { jest.advanceTimersByTime(TRAY_SLIDE_MS); });
        expect(trays()).toHaveLength(0);
      } finally {
        jest.useRealTimers();
      }
    });

    it('switches a seasoning on from the tray', async () => {
      await withCatalog();
      await flush();
      await openTray();
      await toggleChip('Ground Cumin');
      expect(chip('Ground Cumin').props.accessibilityState).toEqual({ checked: true });
    });

    it('switches a seasoning off from the tray', async () => {
      await withCatalog();
      await flush();
      await addIngredient('paprika');
      await openTray();
      await toggleChip('Paprika');
      expect(chip('Paprika').props.accessibilityState).toEqual({ checked: false });
    });

    it('stops the tray above the dock', async () => {
      await setup({ getPantryCatalog: jest.fn().mockResolvedValue(CATALOG), bottomClearance: 110 });
      await flush();
      await openTray();
      expect(styleOf(screen.getByTestId('seasoning-backdrop', everything)).bottom).toBe(110);
    });

    it('counts the seasonings that are on on the find button', async () => {
      await withCatalog();
      await flush();
      await addIngredient('egg');
      await addIngredient('paprika');
      expect(byLabel('Find recipes with 2 ingredients')).toBeOnTheScreen();
    });

    it('sends the pantry ingredients, then the seasonings that are on, to onFindRecipes', async () => {
      const { onFindRecipes } = await withCatalog();
      await flush();
      await addIngredient('paprika');
      await addIngredient('egg');
      await press('Find recipes with 2 ingredients');
      expect(onFindRecipes).toHaveBeenCalledWith(['egg', 'paprika']);
    });

    it('enables the find button with only a seasoning on', async () => {
      await withCatalog();
      await flush();
      await addIngredient('paprika');
      expect(byLabel('Find recipes with 1 ingredient')).toBeEnabled();
    });

    describe('notices that hide themselves', () => {
      beforeEach(() => jest.useFakeTimers());
      afterEach(() => jest.useRealTimers());
      const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });

      it('still shows the seasoning notice just before 3 seconds', async () => {
        await withCatalog();
        await flush();
        await addIngredient('paprika');
        await wait(2700);
        expect(shownText()).toContain('Paprika is on in Seasonings.');
      });

      it('hides the seasoning notice after 3 seconds', async () => {
        await withCatalog();
        await flush();
        await addIngredient('paprika');
        await wait(3000);
        expect(shownText()).not.toContain('Paprika is on in Seasonings.');
      });

      it('hides the staple notice after 3 seconds', async () => {
        await withCatalog();
        await flush();
        await addIngredient('olive oil');
        await wait(3000);
        expect(shownText()).not.toContain('Recipes already assume you have olive oil.');
      });

      it('gives a new notice its own 3 seconds', async () => {
        await withCatalog();
        await flush();
        await addIngredient('paprika');
        await wait(2000);
        await addIngredient('ground cumin');
        await wait(2000);
        expect(shownText()).toContain('Ground Cumin is on in Seasonings.');
      });

      it('keeps an unknown-ingredient message until the user types', async () => {
        const findIngredient = jest.fn().mockResolvedValue(null);
        await setup({ findIngredient, getPantryCatalog: jest.fn().mockResolvedValue(CATALOG) });
        await flush();
        await addIngredient('zzz');
        await wait(10000);
        expect(shownText()).toContain('“zzz” isn’t in our ingredient list.');
      });

      it('does not start hiding a notice after the screen closes', async () => {
        const timing = jest.spyOn(Animated, 'timing');
        await withCatalog();
        await flush();
        await addIngredient('paprika');
        await screen.unmount();
        await act(async () => { jest.runOnlyPendingTimers(); });
        expect(timing).not.toHaveBeenCalled();
        timing.mockRestore();
      });
    });

    describe('when the catalog cannot load', () => {
      const failing = () => setup({ getPantryCatalog: jest.fn().mockRejectedValue(new Error('no db')) });

      it('still adds ingredients, with no unit', async () => {
        await failing();
        await flush();
        await addIngredient('garlic');
        expect(pantryRows().map((row) => row.unit)).toEqual([null]);
      });

      it('says units and seasonings could not load', async () => {
        await failing();
        await flush();
        expect(shownText()).toContain('Couldn’t load units and seasonings.');
      });

      it('shows no tray handle', async () => {
        await failing();
        await flush();
        expect(handles()).toHaveLength(0);
      });
    });
  });
});
