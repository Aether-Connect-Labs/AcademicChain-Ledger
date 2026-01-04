import React from 'react';
import { render, screen } from '@testing-library/react';

test('agents smoke', () => {
  render(<div aria-label="agents-ok">ok</div>);
  expect(screen.getByLabelText('agents-ok')).toBeInTheDocument();
});
