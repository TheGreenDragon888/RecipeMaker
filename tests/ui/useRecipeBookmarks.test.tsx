import { act, renderHook } from '@testing-library/react-native';
import type { RecipeServices } from '../../src/createRecipeServices';
import { BOOKMARK_NOTICE_MS, useRecipeBookmarks } from '../../src/ui/useRecipeBookmarks';

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function makeServices(overrides: Partial<Record<'listBookmarkIds' | 'addBookmark' | 'removeBookmark', jest.Mock>> = {}) {
  return {
    listBookmarkIds: jest.fn().mockResolvedValue([1]),
    addBookmark: jest.fn().mockResolvedValue(undefined),
    removeBookmark: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as RecipeServices & Record<'listBookmarkIds' | 'addBookmark' | 'removeBookmark', jest.Mock>;
}

const setup = (services: RecipeServices, refreshKey = 0) =>
  renderHook((props: { refreshKey: number }) => useRecipeBookmarks(services, props.refreshKey), {
    initialProps: { refreshKey },
  });

describe('useRecipeBookmarks', () => {
  it('has no saved ids until they load', async () => {
    const load = deferred<number[]>();
    const { result } = await setup(makeServices({ listBookmarkIds: jest.fn(() => load.promise) }));
    expect(result.current.savedIds).toBeNull();
  });

  it('gives the saved ids once they load', async () => {
    const { result } = await setup(makeServices());
    expect([...result.current.savedIds!]).toEqual([1]);
  });

  it('stays without saved ids when they cannot load', async () => {
    const { result } = await setup(makeServices({ listBookmarkIds: jest.fn().mockRejectedValue(new Error('corrupt')) }));
    expect(result.current.savedIds).toBeNull();
  });

  it('saves a recipe that is not saved', async () => {
    const services = makeServices();
    const { result } = await setup(services);
    await act(async () => result.current.toggle(2));
    expect([services.addBookmark.mock.calls, [...result.current.savedIds!]]).toEqual([[[2]], [1, 2]]);
  });

  it('removes a recipe that is saved', async () => {
    const services = makeServices();
    const { result } = await setup(services);
    await act(async () => result.current.toggle(1));
    expect([services.removeBookmark.mock.calls, [...result.current.savedIds!]]).toEqual([[[1]], []]);
  });

  it('shows the change before the save finishes', async () => {
    const save = deferred();
    const { result } = await setup(makeServices({ addBookmark: jest.fn(() => save.promise) }));
    await act(async () => result.current.toggle(2));
    expect(result.current.savedIds!.has(2)).toBe(true);
  });

  it('goes back to not saved when saving fails', async () => {
    const { result } = await setup(makeServices({ addBookmark: jest.fn().mockRejectedValue(new Error('full')) }));
    await act(async () => result.current.toggle(2));
    expect(result.current.savedIds!.has(2)).toBe(false);
  });

  it('goes back to saved when removing fails', async () => {
    const { result } = await setup(makeServices({ removeBookmark: jest.fn().mockRejectedValue(new Error('full')) }));
    await act(async () => result.current.toggle(1));
    expect(result.current.savedIds!.has(1)).toBe(true);
  });

  it('reports a failed save', async () => {
    const { result } = await setup(makeServices({ addBookmark: jest.fn().mockRejectedValue(new Error('full')) }));
    await act(async () => result.current.toggle(2));
    expect(result.current.saveFailed).toBe(true);
  });

  it('stops reporting a failed save after a few seconds', async () => {
    jest.useFakeTimers();
    try {
      const { result } = await setup(makeServices({ addBookmark: jest.fn().mockRejectedValue(new Error('full')) }));
      await act(async () => result.current.toggle(2));
      await act(async () => {
        jest.advanceTimersByTime(BOOKMARK_NOTICE_MS);
      });
      expect(result.current.saveFailed).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });

  describe('two quick taps', () => {
    it('ends where the second tap left it', async () => {
      const services = makeServices();
      const { result } = await setup(services);
      await act(async () => {
        result.current.toggle(2);
        result.current.toggle(2);
      });
      expect([services.addBookmark.mock.calls.length, services.removeBookmark.mock.calls.length, result.current.savedIds!.has(2)]).toEqual([
        1,
        1,
        false,
      ]);
    });

    it('ignores the failure of the first when the second has replaced it', async () => {
      const add = deferred();
      const { result } = await setup(makeServices({ addBookmark: jest.fn(() => add.promise) }));
      await act(async () => {
        result.current.toggle(2);
        result.current.toggle(2);
      });
      await act(async () => add.reject(new Error('full')));
      expect([result.current.savedIds!.has(2), result.current.saveFailed]).toEqual([false, false]);
    });
  });

  describe('when the refresh key changes', () => {
    it('loads the saved ids again', async () => {
      const services = makeServices();
      const { result, rerender } = await setup(services);
      services.listBookmarkIds.mockResolvedValue([1, 5]);
      await rerender({ refreshKey: 1 });
      expect([...result.current.savedIds!]).toEqual([1, 5]);
    });

    it('keeps the same set when nothing changed, so lists do not redraw', async () => {
      const { result, rerender } = await setup(makeServices());
      const before = result.current.savedIds;
      await rerender({ refreshKey: 1 });
      expect(result.current.savedIds).toBe(before);
    });

    it('keeps the known ids when the reload fails', async () => {
      const services = makeServices();
      const { result, rerender } = await setup(services);
      services.listBookmarkIds.mockRejectedValue(new Error('corrupt'));
      await rerender({ refreshKey: 1 });
      expect([...result.current.savedIds!]).toEqual([1]);
    });

    it('does not let a reload started before a tap undo the tap', async () => {
      const services = makeServices();
      const { result, rerender } = await setup(services);
      const reload = deferred<number[]>();
      services.listBookmarkIds.mockReturnValue(reload.promise);
      await rerender({ refreshKey: 1 });
      await act(async () => result.current.toggle(2));
      await act(async () => reload.resolve([1]));
      expect(result.current.savedIds!.has(2)).toBe(true);
    });
  });

  it('keeps the same toggle between redraws, so list rows do not redraw', async () => {
    const { result, rerender } = await setup(makeServices());
    const before = result.current.toggle;
    await rerender({ refreshKey: 0 });
    expect(result.current.toggle).toBe(before);
  });
});
