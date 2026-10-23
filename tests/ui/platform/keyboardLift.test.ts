import { keyboardEventsFor, keyboardOverlap, liftedSheetBottom } from '../../../src/ui/platform/keyboardLift';

describe('keyboardEventsFor', () => {
  it('listens for the keyboard about to move on iOS, so the sheet can move with it', () => {
    expect(keyboardEventsFor('ios')).toEqual({ show: 'keyboardWillShow', hide: 'keyboardWillHide' });
  });

  it('listens for the keyboard having moved on Android, which has no "will" events', () => {
    expect(keyboardEventsFor('android')).toEqual({ show: 'keyboardDidShow', hide: 'keyboardDidHide' });
  });
});

describe('keyboardOverlap', () => {
  it('is the keyboard height on iOS (the keyboard reaches the bottom edge)', () => {
    expect(keyboardOverlap({ platform: 'ios', keyboardHeight: 291, bottomInset: 34 })).toBe(291);
  });

  it('adds the bottom inset on Android, whose keyboard height leaves out the navigation bar', () => {
    expect(keyboardOverlap({ platform: 'android', keyboardHeight: 300, bottomInset: 24 })).toBe(324);
  });

  it('is 0 when the keyboard is hidden', () => {
    expect(keyboardOverlap({ platform: 'android', keyboardHeight: 0, bottomInset: 24 })).toBe(0);
  });
});

describe('liftedSheetBottom', () => {
  it('leaves the sheet where it rests when there is no keyboard', () => {
    expect(liftedSheetBottom({ restingBottom: 100, overlap: 0 })).toBe(100);
  });

  it('lifts the sheet to just above the keyboard', () => {
    expect(liftedSheetBottom({ restingBottom: 100, overlap: 291 })).toBe(299);
  });

  it('never lowers the sheet below where it rests', () => {
    expect(liftedSheetBottom({ restingBottom: 100, overlap: 60 })).toBe(100);
  });
});
