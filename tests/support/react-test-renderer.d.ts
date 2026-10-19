declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export type ReactTestInstance = {
    props: Record<string, any>;
    /** The instance this one sits in; null at the root. */
    parent: ReactTestInstance | null;
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
