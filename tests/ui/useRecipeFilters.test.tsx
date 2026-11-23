import React from 'react';
import { Keyboard, Text } from 'react-native';
import { act, render } from '@testing-library/react-native';
import type { RecipeFilter } from '../../src/domain/recipeFilter';
import { useRecipeFilters, type RecipeFiltersState } from '../../src/ui/useRecipeFilters';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const settle = () => act(async () => {});

let latest: RecipeFiltersState;

function Harness({ countFor }: { countFor: (draft: RecipeFilter) => Promise<number> }) {
  latest = useRecipeFilters(countFor);
  return <Text>{latest.open ? 'open' : 'closed'}</Text>;
}

describe('useRecipeFilters', () => {
  afterEach(() => jest.restoreAllMocks());

  it('starts closed with nothing selected and no count', async () => {
    await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
    expect([latest.open, latest.applied, latest.activeCount, latest.count]).toEqual([false, undefined, 0, null]);
  });

  it('opens when shown', async () => {
    await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
    await act(async () => latest.show());
    expect(latest.open).toBe(true);
  });

  it('closes the keyboard when shown, since the sheet covers where it was', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
    await act(async () => latest.show());
    expect(dismiss).toHaveBeenCalled();
  });

  it('counts the filters in force when shown', async () => {
    const countFor = jest.fn().mockResolvedValue(7);
    await render(<Harness countFor={countFor} />);
    await act(async () => latest.show());
    expect(countFor).toHaveBeenCalledWith({});
    expect(latest.count).toBe(7);
  });

  it('has no count while a recount is on its way', async () => {
    const reply = deferred<number>();
    await render(<Harness countFor={jest.fn().mockReturnValue(reply.promise)} />);
    await act(async () => latest.show());
    expect(latest.count).toBeNull();
  });

  it('counts again for each change to the choices', async () => {
    const countFor = jest.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(2);
    await render(<Harness countFor={countFor} />);
    await act(async () => latest.show());
    await act(async () => latest.onChange({ maxActiveMinutes: 15 }));
    expect(countFor).toHaveBeenLastCalledWith({ maxActiveMinutes: 15 });
    expect(latest.count).toBe(2);
  });

  it('ignores a count for choices that have since changed', async () => {
    const first = deferred<number>();
    const second = deferred<number>();
    const countFor = jest.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    await render(<Harness countFor={countFor} />);
    await act(async () => latest.onChange({ maxActiveMinutes: 15 }));
    await act(async () => latest.onChange({ maxActiveMinutes: 30 }));
    await act(async () => second.resolve(4));
    await act(async () => first.resolve(99));
    expect(latest.count).toBe(4);
  });

  it('shows no count when counting fails', async () => {
    await render(<Harness countFor={jest.fn().mockRejectedValue(new Error('busy'))} />);
    await act(async () => latest.show());
    await settle();
    expect(latest.count).toBeNull();
  });

  it('counts with the newest countFor, since the screen makes a new one as its search text changes', async () => {
    const older = jest.fn().mockResolvedValue(1);
    const newer = jest.fn().mockResolvedValue(2);
    const view = await render(<Harness countFor={older} />);
    await view.rerender(<Harness countFor={newer} />);
    await act(async () => latest.onChange({ mealPrepOnly: true }));
    expect([older.mock.calls.length, newer.mock.calls.length]).toEqual([0, 1]);
  });

  describe('closing', () => {
    it('applies the choices', async () => {
      await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
      await act(async () => latest.show());
      await act(async () => latest.onClose({ maxActiveMinutes: 15, mealPrepOnly: true }));
      expect(latest.applied).toEqual({ maxActiveMinutes: 15, mealPrepOnly: true });
      expect(latest.activeCount).toBe(2);
    });

    it('closes', async () => {
      await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
      await act(async () => latest.show());
      await act(async () => latest.onClose({}));
      expect(latest.open).toBe(false);
    });

    it('applies nothing for empty choices, so a screen that watches the filters does not search again', async () => {
      await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
      await act(async () => latest.show());
      await act(async () => latest.onClose({}));
      expect(latest.applied).toBeUndefined();
    });

    it('takes the filters off when the choices were reset', async () => {
      await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
      await act(async () => latest.onClose({ people: 2 }));
      await act(async () => latest.onClose({}));
      expect(latest.applied).toBeUndefined();
    });

    it('keeps the same object for the same choices, so a screen is not made to search again', async () => {
      await render(<Harness countFor={jest.fn().mockResolvedValue(3)} />);
      await act(async () => latest.onClose({ people: 2 }));
      const before = latest.applied;
      await act(async () => latest.show());
      await act(async () => latest.onClose({ people: 2 }));
      expect(latest.applied).toBe(before);
    });

    it('starts the next count from the filters now in force', async () => {
      const countFor = jest.fn().mockResolvedValue(3);
      await render(<Harness countFor={countFor} />);
      await act(async () => latest.onClose({ people: 2 }));
      await act(async () => latest.show());
      expect(countFor).toHaveBeenLastCalledWith({ people: 2 });
    });

    it('ignores a count that arrives after the sheet has closed', async () => {
      const reply = deferred<number>();
      await render(<Harness countFor={jest.fn().mockReturnValue(reply.promise)} />);
      await act(async () => latest.show());
      await act(async () => latest.onClose({}));
      await act(async () => reply.resolve(9));
      expect(latest.count).toBeNull();
    });
  });
});
