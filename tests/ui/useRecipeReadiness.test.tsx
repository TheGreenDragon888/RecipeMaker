import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../src/createRecipeServices';
import type { ReadinessStatus, RecipeReadiness } from '../../src/domain/recipeReadiness';
import { useRecipeReadiness, type RecipeReadinessState } from '../../src/ui/useRecipeReadiness';

const withStatus = (status: ReadinessStatus): RecipeReadiness => ({
  status,
  onHandCount: 1,
  neededCount: 2,
  toBuy: [],
  swaps: [],
});
const readinessOf = (...entries: [number, ReadinessStatus][]) =>
  new Map(entries.map(([id, status]): [number, RecipeReadiness] => [id, withStatus(status)]));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Lets a reply from a mocked service reach the hook. */
const settle = () => act(async () => {});

let latest: RecipeReadinessState;

function Harness({ services, ids, refreshKey }: { services: RecipeServices; ids: number[]; refreshKey: number }) {
  latest = useRecipeReadiness(services, refreshKey);
  const { watch } = latest;
  const key = ids.join(',');
  useEffect(() => watch(key ? key.split(',').map(Number) : []), [key, watch]);
  return <Text>{latest.state}</Text>;
}

async function setup(checkRecipesReadiness: jest.Mock, ids: number[] = [1, 2]) {
  const services = { checkRecipesReadiness } as unknown as RecipeServices;
  const screenFor = (shownIds: number[], refreshKey: number) => (
    <Harness services={services} ids={shownIds} refreshKey={refreshKey} />
  );
  await render(screenFor(ids, 0));
  await settle();
  return {
    show: async (shownIds: number[], refreshKey = 0) => {
      await screen.rerender(screenFor(shownIds, refreshKey));
      await settle();
    },
  };
}

describe('useRecipeReadiness', () => {
  it('checks the recipes a screen is showing', async () => {
    const check = jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'swap']));
    await setup(check);
    expect(check).toHaveBeenCalledWith([1, 2]);
  });

  it('gives each recipe its result', async () => {
    await setup(jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'swap'])));
    expect(latest.readiness.get(2)?.status).toBe('swap');
  });

  it('says the check is done once results arrive', async () => {
    await setup(jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'swap'])));
    expect(latest.state).toBe('done');
  });

  it('is still checking until the first reply arrives', async () => {
    await setup(jest.fn().mockReturnValue(new Promise(() => {})));
    expect(latest.state).toBe('checking');
  });

  it('asks for nothing when no recipes are shown', async () => {
    const check = jest.fn();
    await setup(check, []);
    expect(check).not.toHaveBeenCalled();
  });

  it('does not check a recipe twice', async () => {
    const check = jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'ready']));
    const { show } = await setup(check);
    await show([2, 1]);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('runs one check at a time', async () => {
    const first = deferred<Map<number, RecipeReadiness>>();
    const check = jest.fn().mockReturnValue(first.promise);
    const { show } = await setup(check, [1]);
    await show([1, 2]);
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('checks recipes that arrived during a check once it finishes', async () => {
    const first = deferred<Map<number, RecipeReadiness>>();
    const check = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValue(readinessOf([2, 'swap']));
    const { show } = await setup(check, [1]);
    await show([1, 2]);
    first.resolve(readinessOf([1, 'ready']));
    await settle();
    expect(check).toHaveBeenLastCalledWith([2]);
  });

  it('skips a recipe no longer shown when its turn comes', async () => {
    const first = deferred<Map<number, RecipeReadiness>>();
    const check = jest.fn().mockReturnValueOnce(first.promise).mockResolvedValue(new Map());
    const { show } = await setup(check, [1]);
    await show([1, 2]);
    await show([1]);
    first.resolve(readinessOf([1, 'ready']));
    await settle();
    expect(check).toHaveBeenCalledTimes(1);
  });

  it('remembers a result after its recipe leaves the screen', async () => {
    const { show } = await setup(jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'ready'])));
    await show([2]);
    expect(latest.readiness.get(1)?.status).toBe('ready');
  });

  it('checks the shown recipes again when the screen comes back', async () => {
    const check = jest.fn().mockResolvedValue(readinessOf([1, 'ready'], [2, 'ready']));
    const { show } = await setup(check);
    await show([1, 2], 1);
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('shows a changed result after coming back', async () => {
    const check = jest.fn().mockResolvedValueOnce(readinessOf([1, 'almost'])).mockResolvedValue(readinessOf([1, 'ready']));
    const { show } = await setup(check, [1]);
    await show([1], 1);
    expect(latest.readiness.get(1)?.status).toBe('ready');
  });

  it('keeps the same result object when nothing changed', async () => {
    const check = jest.fn().mockImplementation(async () => readinessOf([1, 'ready']));
    const { show } = await setup(check, [1]);
    const before = latest.readiness.get(1);
    await show([1], 1);
    expect(latest.readiness.get(1)).toBe(before);
  });

  it('keeps the same map when nothing changed', async () => {
    const check = jest.fn().mockImplementation(async () => readinessOf([1, 'ready']));
    const { show } = await setup(check, [1]);
    const before = latest.readiness;
    await show([1], 1);
    expect(latest.readiness).toBe(before);
  });

  it('checks a recipe that scrolls back into view after coming back', async () => {
    const check = jest.fn().mockImplementation(async (ids: number[]) => readinessOf(...ids.map((id): [number, ReadinessStatus] => [id, 'ready'])));
    const { show } = await setup(check, [1, 2]);
    await show([2]);
    await show([2], 1);
    await show([1, 2], 1);
    expect(check).toHaveBeenLastCalledWith([1]);
  });

  it('ignores a reply from before the screen came back', async () => {
    const old = deferred<Map<number, RecipeReadiness>>();
    const check = jest.fn().mockReturnValueOnce(old.promise).mockResolvedValue(readinessOf([1, 'ready']));
    const { show } = await setup(check, [1]);
    await show([1], 1);
    old.resolve(readinessOf([1, 'almost']));
    await settle();
    expect(latest.readiness.get(1)?.status).toBe('ready');
  });

  describe('with no pantry', () => {
    it('says so', async () => {
      await setup(jest.fn().mockResolvedValue(null));
      expect(latest.state).toBe('noPantry');
    });

    it('drops earlier results', async () => {
      const check = jest.fn().mockResolvedValueOnce(readinessOf([1, 'ready'])).mockResolvedValue(null);
      const { show } = await setup(check, [1]);
      await show([1], 1);
      expect(latest.readiness.size).toBe(0);
    });

    it('does not ask again for recipes shown later', async () => {
      const check = jest.fn().mockResolvedValue(null);
      const { show } = await setup(check, [1]);
      await show([1, 2]);
      expect(check).toHaveBeenCalledTimes(1);
    });

    it('asks again when the screen comes back', async () => {
      const check = jest.fn().mockResolvedValueOnce(null).mockResolvedValue(readinessOf([1, 'ready']));
      const { show } = await setup(check, [1]);
      await show([1], 1);
      expect(latest.state).toBe('done');
    });
  });

  describe('when the check fails', () => {
    it('says so', async () => {
      await setup(jest.fn().mockRejectedValue(new Error('corrupt')));
      expect(latest.state).toBe('failed');
    });

    it('drops earlier results', async () => {
      const check = jest.fn().mockResolvedValueOnce(readinessOf([1, 'ready'])).mockRejectedValue(new Error('corrupt'));
      const { show } = await setup(check, [1]);
      await show([1], 1);
      expect(latest.readiness.size).toBe(0);
    });

    it('recovers when a later check works', async () => {
      const check = jest.fn().mockRejectedValueOnce(new Error('busy')).mockResolvedValue(readinessOf([1, 'ready']));
      const { show } = await setup(check, [1]);
      await show([1], 1);
      expect(latest.state).toBe('done');
    });
  });

  it('keeps the same watch function between redraws', async () => {
    const { show } = await setup(jest.fn().mockResolvedValue(new Map()), [1]);
    const before = latest.watch;
    await show([1], 1);
    expect(latest.watch).toBe(before);
  });
});
