import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';
import type { RecipeServices } from '../../src/createRecipeServices';
import { RecipeServicesProvider, useRecipeServices } from '../../src/ui/RecipeServicesContext';

const services = { suggestIngredients: jest.fn() } as unknown as RecipeServices;

/** A child that shows whether it received the services the provider started. */
function ShowServices() {
  const provided = useRecipeServices();
  return <Text>{provided === services ? 'Services ready' : 'Wrong services'}</Text>;
}

async function renderProvider(start: () => Promise<RecipeServices>) {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <RecipeServicesProvider start={start}>
        <ShowServices />
      </RecipeServicesProvider>,
    );
  });
  return renderer;
}

const shownText = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(Text).map((node) => node.props.children);

const neverSettles = () => new Promise<RecipeServices>(() => {});

describe('RecipeServicesProvider', () => {
  it('shows a loading indicator while the services start', async () => {
    const renderer = await renderProvider(neverSettles);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Loading recipes' })).toBeTruthy();
  });

  it('does not show its children while the services start', async () => {
    const renderer = await renderProvider(neverSettles);
    expect(renderer.root.findAllByType(ShowServices)).toHaveLength(0);
  });

  it('provides the started services to its children', async () => {
    const renderer = await renderProvider(() => Promise.resolve(services));
    expect(shownText(renderer)).toContain('Services ready');
  });

  it('starts the services only once', async () => {
    const start = jest.fn().mockResolvedValue(services);
    await renderProvider(start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the services fail to start', async () => {
    const renderer = await renderProvider(() => Promise.reject(new Error('no database')));
    expect(shownText(renderer)).toContain('Could not open the recipe database.');
  });
});

describe('useRecipeServices', () => {
  it('throws when used outside a RecipeServicesProvider', () => {
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => act(() => { TestRenderer.create(<ShowServices />); })).toThrow(
      'useRecipeServices must be used inside a RecipeServicesProvider',
    );
    quiet.mockRestore();
  });
});
