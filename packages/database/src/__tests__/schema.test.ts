import { describe, it, expect } from 'vitest';
import { todos, profiles } from '../schema';

describe('Database Schema', () => {
  it('should export todos table', () => {
    expect(todos).toBeDefined();
    expect(todos._.name).toBe('todos');
  });

  it('should export profiles table', () => {
    expect(profiles).toBeDefined();
    expect(profiles._.name).toBe('profiles');
  });

  it('todos table should have required columns', () => {
    const columns = Object.keys(todos);
    expect(columns).toContain('id');
    expect(columns).toContain('title');
    expect(columns).toContain('userId');
  });
});
