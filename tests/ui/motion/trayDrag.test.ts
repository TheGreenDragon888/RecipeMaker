import { draggedOffset, settlesOpen, startsTrayDrag, trayTravel } from '../../../src/ui/motion/trayDrag';

// Offsets are how far the sheet's top edge sits below its open position: 0 is open, closedOffset is closed.
const HEIGHT = 520;

describe('trayTravel', () => {
  it('is how far the top edge moves between the closed handle and the open sheet', () => {
    expect(trayTravel({ bottom: 110, height: 520 }, { bottom: 172, height: 52 })).toBe(406);
  });
});

describe('startsTrayDrag', () => {
  it('starts a drag when the finger moves up more than a few pixels', () => {
    expect(startsTrayDrag(0, -10)).toBe(true);
  });

  it('starts a drag when the finger moves down more than a few pixels', () => {
    expect(startsTrayDrag(0, 10)).toBe(true);
  });

  it('leaves a tap that barely moves to the button under the finger', () => {
    expect(startsTrayDrag(0, 4)).toBe(false);
  });

  it('does not start a drag for a mostly sideways movement', () => {
    expect(startsTrayDrag(30, 10)).toBe(false);
  });
});

describe('draggedOffset', () => {
  it('follows the finger down from open', () => {
    expect(draggedOffset(0, 120, HEIGHT)).toBe(120);
  });

  it('follows the finger up from closed', () => {
    expect(draggedOffset(HEIGHT, -200, HEIGHT)).toBe(320);
  });

  it('stops at closed when the finger goes further down', () => {
    expect(draggedOffset(0, 700, HEIGHT)).toBe(HEIGHT);
  });

  it('moves only a fifth as far as the finger above open', () => {
    expect(draggedOffset(0, -50, HEIGHT)).toBe(-10);
  });

  it('stretches no more than 24 px above open', () => {
    expect(draggedOffset(0, -400, HEIGHT)).toBe(-24);
  });
});

describe('settlesOpen', () => {
  it('stays open after a short drag down', () => {
    expect(settlesOpen({ startedOpen: true, offset: 150, velocity: 0, closedOffset: HEIGHT })).toBe(true);
  });

  it('closes after a drag down past a third of the sheet', () => {
    expect(settlesOpen({ startedOpen: true, offset: 180, velocity: 0, closedOffset: HEIGHT })).toBe(false);
  });

  it('stays closed after a short drag up', () => {
    expect(settlesOpen({ startedOpen: false, offset: 400, velocity: 0, closedOffset: HEIGHT })).toBe(false);
  });

  it('opens after a drag up past a third of the sheet', () => {
    expect(settlesOpen({ startedOpen: false, offset: 330, velocity: 0, closedOffset: HEIGHT })).toBe(true);
  });

  it('closes after a quick flick down, however short', () => {
    expect(settlesOpen({ startedOpen: true, offset: 30, velocity: 0.8, closedOffset: HEIGHT })).toBe(false);
  });

  it('opens after a quick flick up, however short', () => {
    expect(settlesOpen({ startedOpen: false, offset: 490, velocity: -0.8, closedOffset: HEIGHT })).toBe(true);
  });

  it('goes by distance when the finger slows down before letting go', () => {
    expect(settlesOpen({ startedOpen: true, offset: 300, velocity: -0.2, closedOffset: HEIGHT })).toBe(false);
  });
});
