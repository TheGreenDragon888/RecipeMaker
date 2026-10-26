import React from 'react';
import { Animated, Keyboard } from 'react-native';
import { act, fireEvent, render, screen, within } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { PantryScreen } from '../../../src/ui/screens/PantryScreen';
import { colors, dock, shadows, spacing } from '../../../src/ui/theme';
import type { PantryCatalog } from '../../../src/domain/pantryCatalog';
import type { PantryItem } from '../../../src/domain/pantry';
import type { PantryRestoreChange, RestoredPantry } from '../../../src/domain/savedPantry';
import { fadesAsOnePicture, listContentStyle, shownIcons, shownText, styleOf, tapTwiceBeforeRedraw } from '../../support/screen';

const suggestion = (ingredient: string, matchedAlias: string | null = null) => ({ ingredient, matchedAlias });

const sixPm = () => new Date(2026, 9, 10, 18, 0);

const EMPTY_CATALOG: PantryCatalog = { units: {}, seasoningGroups: [] };

/**
 * The catalog for tests that aren't about units or seasonings: still loading, so it never updates the screen
 * after the test ends. Tests about the catalog pass one that loads, and wait for it.
 */
const stillLoading = () => jest.fn(() => new Promise<PantryCatalog>(() => {}));

/** A saved pantry as loadSavedPantry returns it: empty, with nothing changed, unless given. */
const restored = (pantry: PantryItem[] = [], seasoningsOn: string[] = [], changes: PantryRestoreChange[] = []): RestoredPantry => ({
  pantry,
  seasoningsOn,
  changes,
});

/**
 * By default every typed word counts as a known ingredient (lowercased), nothing is suggested, the saved pantry
 * loads empty (before the test acts), and saving works.
 */
async function setup({
  suggestIngredients = jest.fn().mockResolvedValue([]),
  findIngredient = jest.fn(async (raw: string) => raw.trim().toLowerCase() || null),
  getPantryCatalog = stillLoading(),
  loadSavedPantry = jest.fn().mockResolvedValue(restored()),
  savePantry = jest.fn().mockResolvedValue(undefined),
  bottomClearance,
}: {
  suggestIngredients?: jest.Mock;
  findIngredient?: jest.Mock;
  getPantryCatalog?: jest.Mock;
  loadSavedPantry?: jest.Mock;
  savePantry?: jest.Mock;
  bottomClearance?: number;
} = {}) {
  const services = { suggestIngredients, findIngredient, getPantryCatalog, loadSavedPantry, savePantry } as unknown as RecipeServices;
  const onFindRecipes = jest.fn();
  await render(<PantryScreen services={services} onFindRecipes={onFindRecipes} now={sixPm} bottomClearance={bottomClearance} />);
  return { suggestIngredients, findIngredient, getPantryCatalog, loadSavedPantry, savePantry, onFindRecipes };
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

    it("leaves room on the tagline's right so its handwritten '?' isn't sliced off", async () => {
      await setup();
      expect(styleOf(screen.getByText("what's for dinner?")).paddingRight).toBeGreaterThanOrEqual(spacing.xs);
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

    // Android draws the holder's shadow under the whole holder, so it showed through the see-through disabled
    // button as a box. A solid fill under the button hides it.
    it("fills the find button's holder with the screen's background, so its shadow can't show through the button", async () => {
      await setup();
      expect(styleOf(findButtonHolder('Find recipes with 0 ingredients')).backgroundColor).toBe(colors.background);
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

  // Android clips a view to its parent's edges here (react-native-screens' Screen clips its children), so a
  // dropdown hanging out of the text field's area is never drawn. It floats from the screen itself instead.
  describe('where the dropdown floats', () => {
    const fieldArea = () => screen.getByTestId('add-area');
    const dropdown = () => screen.getByTestId('field-dropdown');

    /** The field's area as measured on screen: 100 px from the top, 52 px tall. */
    async function measureFieldArea() {
      await fireEvent(fieldArea(), 'layout', { nativeEvent: { layout: { x: 20, y: 100, width: 350, height: 52 } } });
    }

    it('places the suggestions just under the text field', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu')]) });
      await measureFieldArea();
      await typeText('to');
      expect(styleOf(dropdown()).top).toBe(100 + 52 + spacing.sm);
    });

    it('places a notice just under the text field', async () => {
      await setup({ suggestIngredients: jest.fn().mockRejectedValue(new Error('database busy')) });
      await measureFieldArea();
      await typeText('to');
      expect(styleOf(dropdown()).top).toBe(100 + 52 + spacing.sm);
    });

    it("keeps the suggestions outside the text field's area, which Android would clip them to", async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu')]) });
      await typeText('to');
      expect(within(fieldArea()).queryByTestId('field-dropdown')).toBeNull();
    });

    it('lifts the suggestions as high as the find button, so Android draws them over it', async () => {
      await setup({ suggestIngredients: jest.fn().mockResolvedValue([suggestion('tofu')]) });
      await typeText('to');
      expect(styleOf(dropdown()).elevation).toBeGreaterThanOrEqual(shadows.floatingButton.elevation);
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

      // The fade runs on the native animation driver, which Jest doesn't play, so this checks the view that holds
      // the fade (the notice's parent) rather than catching it halfway.
      it('fades the notice out as one picture', async () => {
        await withCatalog();
        await flush();
        await addIngredient('paprika');
        const fading = screen.getByText('Paprika is on in Seasonings.').parent!;
        expect([styleOf(fading).opacity, fadesAsOnePicture(fading)]).toEqual([1, true]);
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

    describe('amount sheet', () => {
      const UNITS_CATALOG: PantryCatalog = { ...CATALOG, units: { flour: 'cup', 'black bean': 'can' } };
      const withUnits = (props: { bottomClearance?: number } = {}) =>
        setup({ getPantryCatalog: jest.fn().mockResolvedValue(UNITS_CATALOG), ...props });
      const editFlour = () => press('Edit amount and unit for flour');
      /** What each row's amount button says it holds ("1 cup"), in order. */
      const rowAmounts = () =>
        screen.queryAllByRole('button', { name: /^Edit amount/ }).map((button) => button.props.accessibilityValue.text);
      const amountField = () => screen.getByLabelText('Amount');
      const sheets = () => screen.queryAllByTestId('bottom-sheet', everything);
      const slide = () => act(async () => { jest.advanceTimersByTime(TRAY_SLIDE_MS); });
      const pickUnit = (label: string) => fireEvent.press(screen.getByRole('radio', { name: label }));
      const save = () => fireEvent.press(screen.getByRole('button', { name: 'Save' }));
      const withFakeTimers = (test: () => Promise<void>) => async () => {
        jest.useFakeTimers();
        try {
          await test();
        } finally {
          jest.useRealTimers();
        }
      };

      async function flourInPantry(props: { bottomClearance?: number } = {}) {
        await withUnits(props);
        await flush();
        await addIngredient('flour');
      }

      it('opens from a row\'s amount, showing how much is on hand', async () => {
        await flourInPantry();
        await editFlour();
        expect([amountField().props.value, shownText()]).toEqual(['1', expect.arrayContaining(['Now 1 cup'])]);
      });

      it('saves a typed amount to the row', async () => {
        await flourInPantry();
        await editFlour();
        await fireEvent.changeText(amountField(), '2.5');
        await save();
        expect(rowAmounts()).toEqual(['2 1/2 cups']);
      });

      it('closes once saved, after sliding down', withFakeTimers(async () => {
        await flourInPantry();
        await editFlour();
        await save();
        await slide();
        expect(sheets()).toHaveLength(0);
      }));

      it('shows the row in the unit picked, converted (1 cup is 16 tbsp)', async () => {
        await flourInPantry();
        await editFlour();
        await pickUnit('tbsp');
        await save();
        expect(rowAmounts()).toEqual(['16 tbsp']);
      });

      it('then steps the row by 1 of the unit picked', async () => {
        await flourInPantry();
        await editFlour();
        await pickUnit('tbsp');
        await save();
        await press('Increase flour quantity');
        expect(rowAmounts()).toEqual(['17 tbsp']);
      });

      it('steps a row shown in mL by 1 cup, and says so', async () => {
        await flourInPantry();
        await editFlour();
        await pickUnit('mL');
        await save();
        await press('Increase flour by 1 cup');
        expect(rowAmounts()).toEqual(['473 mL']);
      });

      it('closes without saving from the backdrop', async () => {
        await flourInPantry();
        await editFlour();
        await fireEvent.changeText(amountField(), '5');
        await fireEvent.press(screen.getAllByRole('button', { name: 'Close without saving' })[0]);
        expect(rowAmounts()).toEqual(['1 cup']);
      });

      it('offers only the amount for an ingredient with one unit', async () => {
        await withUnits();
        await flush();
        await addIngredient('black bean');
        await press('Edit amount for black bean');
        expect(screen.queryAllByRole('radio')).toEqual([]);
      });

      it('closes the keyboard when it opens', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        await flourInPantry();
        await editFlour();
        expect(dismiss).toHaveBeenCalled();
        dismiss.mockRestore();
      });

      it('stands above the dock', async () => {
        await flourInPantry({ bottomClearance: 110 });
        await editFlour();
        expect(styleOf(screen.getByTestId('bottom-sheet', everything)).bottom).toBe(110);
      });

      it('closes the seasoning tray when it opens', withFakeTimers(async () => {
        await flourInPantry();
        await openTray();
        await slide();
        await editFlour();
        await act(async () => { jest.advanceTimersByTime(1500); });
        expect([trays().length, sheets().length]).toEqual([0, 1]);
      }));

      it('closes when the seasoning tray opens', withFakeTimers(async () => {
        await flourInPantry();
        await editFlour();
        await openTray();
        await act(async () => { jest.advanceTimersByTime(1500); });
        expect([trays().length, sheets().length]).toEqual([1, 0]);
      }));
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

  describe('saved pantry', () => {
    const TRAY_CATALOG: PantryCatalog = { units: { garlic: 'clove' }, seasoningGroups: [{ section: 'everyday', seasonings: ['paprika'] }] };
    const withTray = () => jest.fn().mockResolvedValue(TRAY_CATALOG);
    const loads = (value: RestoredPantry) => jest.fn().mockResolvedValue(value);
    const neverLoads = () => jest.fn(() => new Promise<RestoredPantry>(() => {}));
    const failsToLoad = () => jest.fn().mockRejectedValue(new Error('user.db'));
    const flush = () => act(async () => {});
    const loadingIndicator = () => screen.queryByLabelText('Loading your pantry');
    const trayHandles = () => screen.queryAllByLabelText('Open seasonings tray', { includeHiddenElements: true });

    it('shows the saved list once it loads', async () => {
      await setup({ loadSavedPantry: loads(restored([{ name: 'garlic', quantity: 3, unit: 'clove' }])) });
      expect([pantryNames(), pantryQuantities()]).toEqual([['garlic'], [3]]);
    });

    it('switches the saved seasonings back on', async () => {
      await setup({ loadSavedPantry: loads(restored([], ['paprika'])) });
      expect(byLabel('Find recipes with 1 ingredient')).toBeEnabled();
    });

    it('hides the loading indicator once the pantry has loaded', async () => {
      await setup();
      expect(loadingIndicator()).toBeNull();
    });

    describe('while it loads', () => {
      it('says the pantry is loading', async () => {
        await setup({ loadSavedPantry: neverLoads() });
        expect(loadingIndicator()).toBeOnTheScreen();
      });

      it('leaves out the empty-pantry hint', async () => {
        await setup({ loadSavedPantry: neverLoads() });
        expect(shownText()).not.toContain('Add the ingredients you have.');
      });

      it('keeps the add field off, so nothing is added before the saved list arrives', async () => {
        await setup({ loadSavedPantry: neverLoads() });
        expect(field()).toBeDisabled();
      });

      it('hides the seasoning tray', async () => {
        await setup({ getPantryCatalog: withTray(), loadSavedPantry: neverLoads() });
        await flush();
        expect(trayHandles()).toHaveLength(0);
      });

      it("doesn't save", async () => {
        const { savePantry } = await setup({ loadSavedPantry: neverLoads() });
        expect(savePantry).not.toHaveBeenCalled();
      });
    });

    describe('saving', () => {
      it('saves the pantry it loaded, so what fitting it to the recipe data changed is kept', async () => {
        const garlic = { name: 'garlic', quantity: 3, unit: 'clove' };
        const { savePantry } = await setup({ loadSavedPantry: loads(restored([garlic], ['paprika'])) });
        expect(savePantry).toHaveBeenLastCalledWith([garlic], ['paprika']);
      });

      it('saves the list when an ingredient is added', async () => {
        const { savePantry } = await setup();
        await addIngredient('garlic');
        expect(savePantry).toHaveBeenLastCalledWith([{ name: 'garlic', quantity: 1, unit: null }], []);
      });

      it('saves the new amount when + is pressed', async () => {
        const { savePantry } = await setup();
        await addIngredient('garlic');
        await press('Increase garlic quantity');
        expect(savePantry).toHaveBeenLastCalledWith([{ name: 'garlic', quantity: 2, unit: null }], []);
      });

      it('saves the seasonings that are on', async () => {
        const { savePantry } = await setup({ getPantryCatalog: withTray() });
        await flush();
        await addIngredient('paprika');
        expect(savePantry).toHaveBeenLastCalledWith([], ['paprika']);
      });

      it("says so when the pantry can't be saved", async () => {
        await setup({ savePantry: jest.fn().mockRejectedValue(new Error('disk full')) });
        await addIngredient('garlic');
        expect(shownText()).toContain('Couldn’t save your pantry.');
      });
    });

    describe('after fitting it to new recipe data', () => {
      const changed = () => loads(restored([], [], [{ kind: 'removed', name: 'ale' }]));

      it('says what changed', async () => {
        await setup({ loadSavedPantry: changed() });
        expect(shownText()).toContain('Updated for new recipe data: Ale removed.');
      });

      it('keeps saying it past the 3 seconds an information notice lasts, since it shows at launch', async () => {
        jest.useFakeTimers();
        try {
          await setup({ loadSavedPantry: changed() });
          await act(async () => {
            jest.advanceTimersByTime(5000);
          });
          expect(shownText()).toContain('Updated for new recipe data: Ale removed.');
        } finally {
          jest.useRealTimers();
        }
      });

      it('says nothing when nothing changed', async () => {
        await setup({ loadSavedPantry: loads(restored([{ name: 'garlic', quantity: 3, unit: 'clove' }])) });
        expect(screen.queryByTestId('field-dropdown')).toBeNull();
      });
    });

    describe("when it can't be loaded", () => {
      it('says so, and that changes won’t be saved', async () => {
        await setup({ loadSavedPantry: failsToLoad() });
        expect(shownText()).toContain('Couldn’t load your saved pantry, so changes won’t be saved this time.');
      });

      it('starts with an empty pantry', async () => {
        await setup({ loadSavedPantry: failsToLoad() });
        expect(shownText()).toContain('Add the ingredients you have.');
      });

      it('still lets the user add ingredients', async () => {
        await setup({ loadSavedPantry: failsToLoad() });
        await addIngredient('garlic');
        expect(pantryNames()).toEqual(['garlic']);
      });

      it("doesn't save, so the pantry it couldn't read isn't overwritten", async () => {
        const { savePantry } = await setup({ loadSavedPantry: failsToLoad() });
        await addIngredient('garlic');
        expect(savePantry).not.toHaveBeenCalled();
      });
    });
  });
});
