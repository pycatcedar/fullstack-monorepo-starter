import { describe, it, expect } from 'vitest';
import { appRouter } from '../router';

describe('appRouter', () => {
  it('should have todo procedures', () => {
    expect(appRouter.todo).toBeDefined();
    expect(appRouter.todo.list).toBeDefined();
  });

  it('should have profile procedures', () => {
    expect(appRouter.profile).toBeDefined();
    expect(appRouter.profile.get).toBeDefined();
  });
});
