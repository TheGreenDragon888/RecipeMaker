// PRESENTATION LAYER: how the seasoning tray follows a finger and where it settles when let go.
// An offset is how far the sheet's top edge sits below its open position: 0 is open, closedOffset (the
// trayTravel between the open sheet and the handle) is closed. Velocities are in px per ms, as
// PanResponder reports them; positive is down.

/** How long the tray slides when opened or closed with a tap. */
export const TRAY_SLIDE_MS = 280;

/** A finger must move this far up or down before a touch becomes a drag, so taps still reach buttons. */
const DRAG_START_PX = 6;
/** Above open, the sheet moves this fraction of the finger's distance... */
const OVERDRAG_RESISTANCE = 0.2;
/** ...and never more than this far. */
const MAX_OVERDRAG_PX = 24;
/** A release faster than this goes the way the finger was moving, however short the drag. */
const FLICK_VELOCITY = 0.5;

/** A box on screen, measured up from the screen's bottom edge. */
export type VerticalFrame = { bottom: number; height: number };

/** How far the sheet's top edge moves between the open sheet and the closed handle. */
export function trayTravel(open: VerticalFrame, closed: VerticalFrame): number {
  return open.bottom + open.height - (closed.bottom + closed.height);
}

/** Whether a touch that has moved (dx, dy) is a drag of the tray: mostly vertical and past a few pixels. */
export function startsTrayDrag(dx: number, dy: number): boolean {
  return Math.abs(dy) > DRAG_START_PX && Math.abs(dy) > Math.abs(dx);
}

/** The sheet's offset after the finger moved dy from where the drag started. */
export function draggedOffset(startOffset: number, dy: number, closedOffset: number): number {
  const offset = startOffset + dy;
  if (offset < 0) return Math.max(offset * OVERDRAG_RESISTANCE, -MAX_OVERDRAG_PX);
  return Math.min(offset, closedOffset);
}

/**
 * Whether a released sheet settles open. A flick goes the way it was moving; otherwise the sheet
 * switches state only when dragged more than a third of the way.
 */
export function settlesOpen({
  startedOpen,
  offset,
  velocity,
  closedOffset,
}: {
  startedOpen: boolean;
  offset: number;
  velocity: number;
  closedOffset: number;
}): boolean {
  if (Math.abs(velocity) >= FLICK_VELOCITY) return velocity < 0;
  const moved = startedOpen ? offset : closedOffset - offset;
  const switched = moved > closedOffset / 3;
  return startedOpen ? !switched : switched;
}
