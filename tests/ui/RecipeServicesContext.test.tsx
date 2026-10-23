import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../src/createRecipeServices';
import { RecipeServicesProvider, useRecipeServices } from '../../src/ui/RecipeServicesContext';
import { shownText } from '../support/screen';

const services = { suggestIngredients: jest.fn() } as unknown as RecipeServices;

/** A child that shows whether it received the services the provider started. */
function ShowServices() {
  const provided = useRecipeServices();
  return <Text>{provided === services ? 'Services ready' : 'Wrong services'}</Text>;
}

const renderProvider = (start: () => Promise<RecipeServices>) =>
  render(
    <RecipeServicesProvider start={start}>
      <ShowServices />
    </RecipeServicesProvider>,
  );

const neverSettles = () => new Promise<RecipeServices>(() => {});

describe('RecipeServicesProvider', () => {
  it('shows a loading indicator while the services start', async () => {
    await renderProvider(neverSettles);
    expect(screen.getByLabelText('Loading recipes')).toBeOnTheScreen();
  });

  it('does not show its children while the services start', async () => {
    await renderProvider(neverSettles);
    expect(screen.queryByText(/services/i)).not.toBeOnTheScreen();
  });

  it('provides the started services to its children', async () => {
    await renderProvider(() => Promise.resolve(services));
    expect(shownText()).toContain('Services ready');
  });

  it('starts the services only once', async () => {
    const start = jest.fn().mockResolvedValue(services);
    await renderProvider(start);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('shows an error message when the services fail to start', async () => {
    await renderProvider(() => Promise.reject(new Error('no database')));
    expect(shownText()).toContain('Could not open the recipe database.');
  });
});

describe('useRecipeServices', () => {
  it('throws when used outside a RecipeServicesProvider', async () => {
    const quiet = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<ShowServices />)).rejects.toThrow('useRecipeServices must be used inside a RecipeServicesProvider');
    quiet.mockRestore();
  });
});
