import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthButton } from '../AuthButton';

// Mock the auth context
vi.mock('../../lib/auth', () => ({
  useAuth: () => ({
    user: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('AuthButton', () => {
  it('renders sign in button when user is not authenticated', () => {
    render(<AuthButton />);
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('has correct button styling', () => {
    render(<AuthButton />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('px-4', 'py-2');
  });
});
