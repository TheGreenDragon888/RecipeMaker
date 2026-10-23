// Test helper: plays a one-finger vertical drag through the responder props that PanResponder gives a view
// (onResponderGrant, onResponderMove, onResponderRelease), with the touch history PanResponder reads.
import { act } from 'react';

/** A native view with the responder props PanResponder gives it. */
type Draggable = { props: Record<string, any> };

const START_Y = 600;
const START_TIME = 1000;

function touchEvent(pageY: number, timestamp: number) {
  const touch = {
    touchActive: true,
    startPageX: 200,
    startPageY: START_Y,
    startTimeStamp: START_TIME,
    currentPageX: 200,
    currentPageY: pageY,
    currentTimeStamp: timestamp,
    previousPageX: 200,
    previousPageY: pageY,
    previousTimeStamp: timestamp,
  };
  return {
    nativeEvent: { pageX: 200, pageY, timestamp, touches: [], changedTouches: [] },
    touchHistory: { numberActiveTouches: 1, indexOfSingleActiveTouch: 0, mostRecentTimeStamp: timestamp, touchBank: [touch] },
  };
}

/**
 * Drags `view` through each distance in `path` (px from where the finger went down; negative is up), one step
 * every `msPerStep`. Lets go at the end unless `release` is false. The release speed is the last step's.
 */
export function drag(view: Draggable, path: number[], { msPerStep = 16, release = true } = {}) {
  let time = START_TIME;
  let previousY = START_Y;
  const step = (y: number) => {
    time += msPerStep;
    const event = touchEvent(y, time);
    event.touchHistory.touchBank[0].previousPageY = previousY;
    previousY = y;
    return event;
  };
  act(() => {
    view.props.onResponderGrant(touchEvent(START_Y, time));
  });
  for (const distance of path) {
    act(() => {
      view.props.onResponderMove(step(START_Y + distance));
    });
  }
  if (release) {
    act(() => {
      view.props.onResponderRelease(touchEvent(previousY, time));
    });
  }
}
