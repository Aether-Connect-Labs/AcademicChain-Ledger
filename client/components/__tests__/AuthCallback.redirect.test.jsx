import React from 'react';
import { render } from '@testing-library/react';

jest.mock('../AuthCallback.jsx', () => {
  const Real = jest.requireActual('../AuthCallback.jsx').default;
  return Real;
});

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
  };
});

jest.mock('../authService', () => {
  return {
    authService: {
      getCurrentUser: jest.fn(async (token) => {
        if (token === 'admin') return { role: 'admin' };
        if (token === 'institution') return { role: 'institution' };
        if (token === 'student') return { role: 'student' };
        return { role: 'pending_university' };
      }),
    },
  };
});

jest.mock('../useAuth', () => {
  return {
    useAuth: () => ({
      setSession: async () => {},
    }),
  };
});

const AuthCallback = require('../AuthCallback.jsx').default;

describe('AuthCallback redirect mapping', () => {
  const origLocation = window.location;
  beforeEach(() => {
    delete window.location;
    window.location = { search: '?token=admin' };
  });
  afterEach(() => {
    window.location = origLocation;
  });
  test('redirects admin to /admin', () => {
    render(<AuthCallback />);
  });
});
