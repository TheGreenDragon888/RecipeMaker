declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  type TestNode = {
    props: Record<string, any>;
  };

  type ReactTestInstance = TestNode;

  export type ReactTestRenderer = {
    root: {
      findByProps(props: Record<string, unknown>): ReactTestInstance;
      findByType(type: unknown): ReactTestInstance;
      findAllByType(type: unknown): ReactTestInstance[];
    };
  };

  const TestRenderer: {
    create(element: ReactElement): ReactTestRenderer;
  };

  export function act(callback: () => void | Promise<void>): void;
  export default TestRenderer;
}
