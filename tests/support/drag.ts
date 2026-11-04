// Test helper: plays a one-finger drag through the responder props that PanResponder gives a view
// (onResponderGrant, onResponderMove, onResponderRelease), with the touch history PanResponder reads.
// Drags are vertical unless `axis: 'x'` is given.
import { act } from 'react';

/** A native view with the responder props PanResponder gives it. */
type Draggable = { props: Record<string, any> };
type Point = { x: number; y: number };

const START = { x: 200, y: 600 };
const START_TIME = 1000;

function touchEvent(start: Point, current: Point, previous: Point, timestamp: number) {
  const touch = {
    touchActive: true,
    startPageX: start.x,
    startPageY: start.y,
    startTimeStamp: START_TIME,
    currentPageX: current.x,
    currentPageY: current.y,
    currentTimeStamp: timestamp,
    previousPageX: previous.x,
    previousPageY: previous.y,
    previousTimeStamp: timestamp,
  };
  return {
    nativeEvent: { pageX: current.x, pageY: current.y, timestamp, touches: [], changedTouches: [] },
    touchHistory: { numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: timestamp, touchBank: [touch] },
  };
}

/**
 * Drags `view` through each distance in `path` (px from where the finger went down; negative is up, or left
 * with `axis: 'x'`), one step every `msPerStep`. The finger goes down at `from` (a point on screen). Lets go at
 * the end unless `release` is false. The release speed is the last step's.
 */
export function drag(
  view: Draggable,
  path: number[],
  { msPerStep = 16, release = true, axis = 'y', from = START }: { msPerStep?: number; release?: boolean; axis?: 'x' | 'y'; from?: Point } = {},
) {
  let time = START_TIME;
  let previous = from;
  const at = (distance: number) => (axis === 'x' ? { x: from.x + distance, y: from.y } : { x: from.x, y: from.y + distance });
  act(() => {
    view.props.onResponderGrant(touchEvent(from, from, from, time));
  });
  for (const distance of path) {
    time += msPerStep;
    const current = at(distance);
    const event = touchEvent(from, current, previous, time);
    previous = current;
    act(() => {
      view.props.onResponderMove(event);
    });
  }
  if (release) {
    act(() => {
      view.props.onResponderRelease(touchEvent(from, previous, previous, time));
    });
  }
}
