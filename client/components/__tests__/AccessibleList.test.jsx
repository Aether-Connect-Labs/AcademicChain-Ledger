import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccessibleList from '../AccessibleList.jsx';

test('renderiza título y elementos', () => {
  render(<AccessibleList title="Lista" items={[{ id: 1, label: 'A' }, { id: 2, label: 'B' }]} />);
  expect(screen.getByText('Lista')).toBeInTheDocument();
  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('B')).toBeInTheDocument();
});

test('dispara onSelect', () => {
  const onSelect = jest.fn();
  render(<AccessibleList title="Lista" items={[{ id: 1, label: 'A' }]} onSelect={onSelect} />);
  fireEvent.click(screen.getByRole('button', { name: /seleccionar a/i }));
  expect(onSelect).toHaveBeenCalledWith(1);
});
