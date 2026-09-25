import { filterRecipes } from '../../../src/services/filterRecipes';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('filterRecipes', () => {
  it('keeps recipes whose active time is at most the limit', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Exactly 15', activeTimeMinutes: 15 },
      { id: 2, name: 'Too Long', activeTimeMinutes: 16 },
    ]);
    expect(names(await filterRecipes(repo, { maxActiveMinutes: 15, people: 1 }))).toEqual(['Exactly 15']);
  });

  it('keeps recipes whose serving range reaches the number of people', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Serves 2', servingsMin: 2, servingsMax: 2 },
      { id: 2, name: 'Serves 4 to 6', servingsMin: 4, servingsMax: 6 },
      { id: 3, name: 'Serves 3 to 4', servingsMin: 3, servingsMax: 4 },
    ]);
    expect(names(await filterRecipes(repo, { maxActiveMinutes: 60, people: 4 }))).toEqual([
      'Serves 3 to 4',
      'Serves 4 to 6',
    ]);
  });

  it('orders results by active time, then by name', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'B', activeTimeMinutes: 10 },
      { id: 2, name: 'C', activeTimeMinutes: 5 },
      { id: 3, name: 'A', activeTimeMinutes: 10 },
    ]);
    expect(names(await filterRecipes(repo, { maxActiveMinutes: 60, people: 1 }))).toEqual(['C', 'A', 'B']);
  });
});
