declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  type ReactTestInstance = {
    props: Record<string, any>;
    findByProps(props: Record<string, unknown>): ReactTestInstance;
    findByType(type: unknown): ReactTestInstance;
    findAllByType(type: unknown): ReactTestInstance[];
  };

  export type ReactTestRenderer = {
    root: ReactTestInstance;
    /** Re-renders the tree with a new root element, as when a parent passes new props. */
    update(element: ReactElement): void;
  };

  const TestRenderer: {
    create(element: ReactElement): ReactTestRenderer;
  };

  export function act(callback: () => void | Promise<void>): void;
  export default TestRenderer;
}
