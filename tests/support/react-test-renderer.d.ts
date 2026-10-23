declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export type ReactTestInstance = {
    props: Record<string, any>;
    /** What a ref to this element would hold (e.g. a mounted View), or null. */
    instance: any;
    /** The instance this one sits in; null at the root. */
    parent: ReactTestInstance | null;
    type: unknown;
    find(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance;
    findAll(predicate: (node: ReactTestInstance) => boolean): ReactTestInstance[];
    findByProps(props: Record<string, unknown>): ReactTestInstance;
    findByType(type: unknown): ReactTestInstance;
    findAllByType(type: unknown): ReactTestInstance[];
    findAllByProps(props: Record<string, unknown>): ReactTestInstance[];
  };

  export type ReactTestRenderer = {
    root: ReactTestInstance;
    /** Re-renders the tree with a new root element, as when a parent passes new props. */
    update(element: ReactElement): void;
    /** Unmounts the tree, running every effect's cleanup, as when the screen closes. */
    unmount(): void;
  };

  const TestRenderer: {
    create(element: ReactElement): ReactTestRenderer;
  };

  export function act(callback: () => void | Promise<void>): void;
  export default TestRenderer;
}
