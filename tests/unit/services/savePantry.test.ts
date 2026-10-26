import { savePantry } from '../../../src/services/savePantry';
import { InMemoryPantryRepository } from '../../fakes/InMemoryPantryRepository';

describe('savePantry', () => {
  it('hands the list and the seasonings that are on to the repository', async () => {
    const repo = new InMemoryPantryRepository();
    const pantry = [{ name: 'milk', quantity: 2, unit: 'cup', shownUnit: 'tbsp' }];

    await savePantry(repo, pantry, ['paprika']);

    expect(repo.saved).toEqual({ items: pantry, seasoningsOn: ['paprika'] });
  });
});
