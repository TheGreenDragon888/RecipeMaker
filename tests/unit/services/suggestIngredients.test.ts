import { suggestIngredients } from '../../../src/services/suggestIngredients';
import { InMemoryRecipeRepository, type FakeRecipe } from '../../fakes/InMemoryRecipeRepository';

/** A repository whose recipes use these ingredients, with these aliases (alias -> ingredient). */
const repoWith = (ingredients: string[], aliases: Record<string, string> = {}) =>
  new InMemoryRecipeRepository([{ id: 1, ingredients: ingredients.map((ingredient) => ({ ingredient })) }], aliases);

describe('suggestIngredients', () => {
  it('ranks direct names before alias matches and includes the matching alias', async () => {
    const repo = repoWith(['garlic', 'black pepper'], { 'ground black pepper': 'black pepper' });
    expect(await suggestIngredients(repo, 'g')).toEqual([
      { ingredient: 'garlic', matchedAlias: null },
      { ingredient: 'black pepper', matchedAlias: 'ground black pepper' },
    ]);
  });

  describe('where the text is found', () => {
    it('suggests a name that contains the text', async () => {
      const repo = repoWith(['asparagus']);
      expect(await suggestIngredients(repo, 'par')).toEqual([{ ingredient: 'asparagus', matchedAlias: null }]);
    });

    it('suggests an ingredient whose alias contains the text', async () => {
      const repo = repoWith(['marinara sauce'], { 'prepared marinara sauce': 'marinara sauce' });
      expect(await suggestIngredients(repo, 'par')).toEqual([
        { ingredient: 'marinara sauce', matchedAlias: 'prepared marinara sauce' },
      ]);
    });

    it('puts an alias that starts with the text before a name that only contains it', async () => {
      const repo = repoWith(['asparagus', 'black pepper'], { 'paragon pepper': 'black pepper' });
      expect(await suggestIngredients(repo, 'para')).toEqual([
        { ingredient: 'black pepper', matchedAlias: 'paragon pepper' },
        { ingredient: 'asparagus', matchedAlias: null },
      ]);
    });

    it('puts a name that contains the text before an alias that only contains it', async () => {
      const repo = repoWith(['brown gravy', 'asparagus'], { 'prepared brown gravy': 'brown gravy' });
      expect(await suggestIngredients(repo, 'par')).toEqual([
        { ingredient: 'asparagus', matchedAlias: null },
        { ingredient: 'brown gravy', matchedAlias: 'prepared brown gravy' },
      ]);
    });
  });

  describe('each ingredient once', () => {
    it('shows an ingredient by its name when its alias matches too', async () => {
      const repo = repoWith(['parsley'], { 'fresh parsley': 'parsley', parsleys: 'parsley' });
      expect(await suggestIngredients(repo, 'pars')).toEqual([{ ingredient: 'parsley', matchedAlias: null }]);
    });

    it('shows an ingredient by its best match when a starting alias beats its name', async () => {
      // "black pepper" only contains "pepper", but the alias "pepper, ground" starts with it.
      const repo = repoWith(['black pepper'], { 'cracked pepper': 'black pepper', 'pepper, ground': 'black pepper' });
      expect(await suggestIngredients(repo, 'pepper')).toEqual([
        { ingredient: 'black pepper', matchedAlias: 'pepper, ground' },
      ]);
    });

    it('counts each ingredient once toward the 10', async () => {
      const aliases = Object.fromEntries(Array.from({ length: 12 }, (_, i) => [`prepared cheese ${i}`, 'Parmesan cheese']));
      const repo = repoWith(['Parmesan cheese', 'marinara sauce'], { ...aliases, 'prepared marinara sauce': 'marinara sauce' });
      expect(await suggestIngredients(repo, 'prepared')).toEqual([
        { ingredient: 'marinara sauce', matchedAlias: 'prepared marinara sauce' },
        { ingredient: 'Parmesan cheese', matchedAlias: 'prepared cheese 0' },
      ]);
    });
  });

  it('sorts suggestions found the same way A to Z, ignoring capitals', async () => {
    const repo = repoWith(['parsley', 'Parmesan cheese', 'parsnip']);
    expect((await suggestIngredients(repo, 'par')).map((s) => s.ingredient)).toEqual(['Parmesan cheese', 'parsley', 'parsnip']);
  });

  it('normalizes the prefix before searching', async () => {
    const repo = repoWith(['parsley']);
    expect(await suggestIngredients(repo, '  PAR')).toEqual([{ ingredient: 'parsley', matchedAlias: null }]);
  });

  it('returns an empty list for a blank prefix', async () => {
    const repo = repoWith(['parsley']);
    expect(await suggestIngredients(repo, ' ')).toEqual([]);
  });

  it('returns at most 10 suggestions', async () => {
    const recipes: FakeRecipe[] = [
      { id: 1, ingredients: Array.from({ length: 15 }, (_, i) => ({ ingredient: `pa${String(i).padStart(2, '0')}` })) },
    ];
    expect(await suggestIngredients(new InMemoryRecipeRepository(recipes), 'pa')).toHaveLength(10);
  });
});
