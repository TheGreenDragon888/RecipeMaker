import { BackHandler } from 'react-native';
import { renderHook } from '@testing-library/react-native';
import { useCloseOnBack } from '../../../src/ui/platform/useCloseOnBack';

/** Captures the back-button handler the hook adds, and the remove() it gets back. */
type BackHandlerFn = Parameters<typeof BackHandler.addEventListener>[1];

function spyOnBack() {
  const remove = jest.fn();
  const handlers: BackHandlerFn[] = [];
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
    handlers.push(handler);
    return { remove };
  });
  const pressBack = () => handlers[handlers.length - 1]({} as Parameters<BackHandlerFn>[0]);
  return { remove, handlers, pressBack };
}

afterEach(() => jest.restoreAllMocks());

describe('useCloseOnBack', () => {
  it('does not listen while closed, so back works as usual', async () => {
    const back = spyOnBack();
    await renderHook(() => useCloseOnBack(false, () => {}));
    expect(back.handlers).toHaveLength(0);
  });

  it('closes on back while open', async () => {
    const back = spyOnBack();
    const onClose = jest.fn();
    await renderHook(() => useCloseOnBack(true, onClose));
    back.pressBack();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('tells Android the press was handled, so it does not also leave the screen', async () => {
    const back = spyOnBack();
    await renderHook(() => useCloseOnBack(true, () => {}));
    expect(back.pressBack()).toBe(true);
  });

  it('stops listening once closed', async () => {
    const back = spyOnBack();
    const { rerender } = await renderHook(({ open }: { open: boolean }) => useCloseOnBack(open, () => {}), {
      initialProps: { open: true },
    });
    await rerender({ open: false });
    expect(back.remove).toHaveBeenCalledTimes(1);
  });

  it('stops listening when unmounted', async () => {
    const back = spyOnBack();
    const { unmount } = await renderHook(() => useCloseOnBack(true, () => {}));
    await unmount();
    expect(back.remove).toHaveBeenCalledTimes(1);
  });

  it('calls the latest onClose', async () => {
    const back = spyOnBack();
    const first = jest.fn();
    const latest = jest.fn();
    const { rerender } = await renderHook(({ onClose }: { onClose: () => void }) => useCloseOnBack(true, onClose), {
      initialProps: { onClose: first },
    });
    await rerender({ onClose: latest });
    back.pressBack();
    expect([first.mock.calls.length, latest.mock.calls.length]).toEqual([0, 1]);
  });
});
