// Test helper for route tests: wraps a real component so a test can see the props a route gave it.
// React Native Testing Library only sees native views, not our components' props, and a route's whole job
// is handing the right props to its screen. Use it inside jest.mock:
//
//   jest.mock('../../src/ui/screens/ResultsScreen', () => {
//     const { recordProps } = jest.requireActual('../support/recordProps');
//     const actual = jest.requireActual('../../src/ui/screens/ResultsScreen');
//     return { ResultsScreen: recordProps(actual.ResultsScreen) };
//   });
import React from 'react';

/** A mock component that renders `Actual` with the same props and records every render's props. */
export function recordProps<P extends object>(Actual: React.ComponentType<P>) {
  return jest.fn((props: P) => React.createElement(Actual, props));
}

/** The props of the most recent render of a component wrapped by recordProps. */
export function lastProps<P>(component: (props: P) => unknown): P {
  const calls = jest.mocked(component).mock.calls;
  if (calls.length === 0) throw new Error('The component has not rendered.');
  return calls[calls.length - 1][0];
}
