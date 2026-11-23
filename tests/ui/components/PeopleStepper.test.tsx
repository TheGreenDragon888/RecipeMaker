import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PeopleStepper } from '../../../src/ui/components/PeopleStepper';

const fewer = () => screen.getByRole('button', { name: 'Fewer people' });
const more = () => screen.getByRole('button', { name: 'More people' });

describe('PeopleStepper', () => {
  it('says Any when no number is chosen', async () => {
    await render(<PeopleStepper value={undefined} onChange={() => {}} />);
    expect(screen.getByText('Any')).toBeOnTheScreen();
  });

  it('says one person', async () => {
    await render(<PeopleStepper value={1} onChange={() => {}} />);
    expect(screen.getByText('1 person')).toBeOnTheScreen();
  });

  it('says several people', async () => {
    await render(<PeopleStepper value={4} onChange={() => {}} />);
    expect(screen.getByText('4 people')).toBeOnTheScreen();
  });

  it('starts at 1 person when more is tapped on Any', async () => {
    const onChange = jest.fn();
    await render(<PeopleStepper value={undefined} onChange={onChange} />);
    await fireEvent.press(more());
    expect(onChange).toHaveBeenCalledWith(1);
  });

  it('adds one person', async () => {
    const onChange = jest.fn();
    await render(<PeopleStepper value={2} onChange={onChange} />);
    await fireEvent.press(more());
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it('takes one person off', async () => {
    const onChange = jest.fn();
    await render(<PeopleStepper value={3} onChange={onChange} />);
    await fireEvent.press(fewer());
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it('goes back to Any from 1 person', async () => {
    const onChange = jest.fn();
    await render(<PeopleStepper value={1} onChange={onChange} />);
    await fireEvent.press(fewer());
    expect(onChange).toHaveBeenCalledWith(undefined);
  });

  it('cannot go below Any', async () => {
    await render(<PeopleStepper value={undefined} onChange={() => {}} />);
    expect(fewer()).toBeDisabled();
  });

  it('stops at 12 people, as the board does', async () => {
    const onChange = jest.fn();
    await render(<PeopleStepper value={12} onChange={onChange} />);
    expect(more()).toBeDisabled();
  });

  it('can still add people below 12', async () => {
    await render(<PeopleStepper value={11} onChange={() => {}} />);
    expect(more()).toBeEnabled();
  });
});
