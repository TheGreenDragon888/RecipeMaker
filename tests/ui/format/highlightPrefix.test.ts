import { splitOnTypedPrefix } from '../../../src/ui/format/highlightPrefix';

describe('splitOnTypedPrefix', () => {
  it('splits a suggestion into the typed part and the rest', () => {
    expect(splitOnTypedPrefix('tomato paste', 'tom')).toEqual({ match: 'tom', rest: 'ato paste' });
  });

  it('matches regardless of case, keeping the suggestion as written', () => {
    expect(splitOnTypedPrefix('Parmesan cheese', 'PAR')).toEqual({ match: 'Par', rest: 'mesan cheese' });
  });

  it('ignores spaces around the typed text', () => {
    expect(splitOnTypedPrefix('tofu', '  to ')).toEqual({ match: 'to', rest: 'fu' });
  });

  it('returns null when the suggestion matched through an alias', () => {
    expect(splitOnTypedPrefix('sesame oil', 'to')).toBeNull();
  });

  it('returns null when nothing was typed', () => {
    expect(splitOnTypedPrefix('tofu', '  ')).toBeNull();
  });
});
