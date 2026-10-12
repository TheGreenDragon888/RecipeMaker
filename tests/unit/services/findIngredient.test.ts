import { findIngredient } from '../../../src/services/findIngredient';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository(
  [{ id: 1, ingredients: [{ ingredient: 'tomato' }, { ingredient: 'green onion' }, { ingredient: 'Parmesan cheese' }] }],
  { scallions: 'green onion' },
);

describe('findIngredient', () => {
  it('returns the name of an ingredient in the database', async () => {
    expect(await findIngredient(repo, 'tomato')).toBe('tomato');
  });

  it('returns the database name for an alias', async () => {
    expect(await findIngredient(repo, 'scallions')).toBe('green onion');
  });

  it('returns the name the way the database writes it', async () => {
    expect(await findIngredient(repo, 'parmesan cheese')).toBe('Parmesan cheese');
  });

  it('normalizes the typed text before looking it up', async () => {
    expect(await findIngredient(repo, '  Green   ONION ')).toBe('green onion');
  });

  it('returns null for part of a name', async () => {
    expect(await findIngredient(repo, 'tom')).toBeNull();
  });

  it('returns null for an ingredient not in the database', async () => {
    expect(await findIngredient(repo, 'xyz')).toBeNull();
  });

  it('returns null for blank text', async () => {
    expect(await findIngredient(repo, '   ')).toBeNull();
  });
});
