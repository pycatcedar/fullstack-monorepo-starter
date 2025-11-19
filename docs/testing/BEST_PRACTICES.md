# Testing Best Practices

Guidelines for writing effective tests in the monorepo.

## General Principles

### 1. Write Tests That Resemble How Users Interact

**Good:**
```typescript
// Test user behavior
const button = screen.getByRole('button', { name: /submit/i });
await userEvent.click(button);
expect(screen.getByText(/success/i)).toBeInTheDocument();
```

**Bad:**
```typescript
// Test implementation details
expect(component.state.isSubmitting).toBe(false);
expect(component.handleSubmit).toHaveBeenCalled();
```

### 2. Test Behavior, Not Implementation

Focus on what the code does, not how it does it.

**Good:**
```typescript
it('displays error message when submission fails', async () => {
  render(<LoginForm />);
  // ... submit with invalid data
  expect(screen.getByText(/invalid credentials/i)).toBeVisible();
});
```

**Bad:**
```typescript
it('sets error state when submission fails', async () => {
  const { rerender } = render(<LoginForm />);
  // ... submit with invalid data
  expect(wrapper.find('.error-message').exists()).toBe(true);
});
```

### 3. Keep Tests Simple and Focused

One test should verify one behavior.

**Good:**
```typescript
it('displays username after login', async () => {
  // Single behavior test
});

it('redirects to dashboard after login', async () => {
  // Different behavior test
});
```

**Bad:**
```typescript
it('handles complete login flow', async () => {
  // Tests multiple things
  // Hard to debug when it fails
});
```

## Unit Testing Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('calculates total price correctly', () => {
  // Arrange
  const items = [{ price: 10 }, { price: 20 }];
  const tax = 0.1;

  // Act
  const total = calculateTotal(items, tax);

  // Assert
  expect(total).toBe(33); // (10 + 20) * 1.1
});
```

### Use Descriptive Test Names

```typescript
// Good
it('throws error when email is invalid')
it('returns empty array when no results found')
it('disables submit button while loading')

// Bad
it('works')
it('test1')
it('should work correctly')
```

### Avoid Test Interdependence

Each test should be independent and runnable in any order.

**Good:**
```typescript
describe('UserService', () => {
  beforeEach(() => {
    // Fresh setup for each test
    database.clear();
  });

  it('creates user', () => { /* ... */ });
  it('updates user', () => { /* ... */ });
});
```

**Bad:**
```typescript
describe('UserService', () => {
  let userId;

  it('creates user', () => {
    userId = createUser(); // Next test depends on this
  });

  it('updates user', () => {
    updateUser(userId); // Breaks if first test fails
  });
});
```

### Mock External Dependencies

```typescript
// Mock API calls
vi.mock('../api/client', () => ({
  fetchUser: vi.fn(() => Promise.resolve(mockUser)),
}));

// Mock timers for time-dependent code
vi.useFakeTimers();
vi.advanceTimersByTime(1000);

// Mock random values for predictable tests
vi.spyOn(Math, 'random').mockReturnValue(0.5);
```

## Component Testing Best Practices

### Use Semantic Queries

Prefer queries that reflect how users interact:

```typescript
// Good - accessible and user-focused
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/welcome/i)
screen.getByPlaceholderText(/search/i)

// Bad - brittle and implementation-focused
screen.getByClassName('submit-button')
screen.getByTestId('email-input')
wrapper.find('.welcome-message')
```

### Query Priority (in order of preference)

1. `getByRole` - Most accessible
2. `getByLabelText` - Forms
3. `getByPlaceholderText` - Forms (last resort)
4. `getByText` - Non-interactive content
5. `getByTestId` - Last resort

### Test Accessibility

```typescript
it('is accessible', async () => {
  const { container } = render(<LoginForm />);

  // Check for proper labels
  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();

  // Check for proper ARIA attributes
  const button = screen.getByRole('button');
  expect(button).not.toHaveAttribute('aria-disabled', 'true');

  // Can use axe for comprehensive checks
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Test Loading States

```typescript
it('shows loading spinner while fetching', async () => {
  render(<UserProfile userId="1" />);

  // Should show loading
  expect(screen.getByRole('status')).toBeInTheDocument();

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  // Should show content
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

### Test Error States

```typescript
it('displays error message on failure', async () => {
  server.use(
    rest.get('/api/user', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(<UserProfile userId="1" />);

  await waitFor(() => {
    expect(screen.getByText(/error loading/i)).toBeVisible();
  });
});
```

## E2E Testing Best Practices

### Use Page Object Pattern

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}

// test
test('user can login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');

  await expect(page).toHaveURL('/dashboard');
});
```

### Use Auto-Waiting

Playwright auto-waits for elements. Don't add manual waits.

**Good:**
```typescript
// Auto-waits for element to be visible and actionable
await page.click('button');
await expect(page.locator('.message')).toBeVisible();
```

**Bad:**
```typescript
// Manual waiting - brittle and slow
await page.waitForTimeout(1000);
await page.click('button');
```

### Test Critical User Paths

Focus E2E tests on important flows:

```typescript
// Critical paths
test('user can complete signup')
test('user can make a purchase')
test('user can reset password')

// Not critical for E2E (use unit tests instead)
// - Form validation
// - Button hover states
// - Typography changes
```

### Use Test Fixtures for Common Setup

```typescript
// fixtures.ts
export const test = base.extend({
  loggedInPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  },
});

// Use in tests
test('can access settings', async ({ loggedInPage }) => {
  await loggedInPage.click('a[href="/settings"]');
  // ...
});
```

## Testing Async Code

### Use async/await

```typescript
// Good
it('fetches data successfully', async () => {
  const data = await fetchData();
  expect(data).toHaveProperty('id');
});

// Bad
it('fetches data successfully', (done) => {
  fetchData().then(data => {
    expect(data).toHaveProperty('id');
    done();
  });
});
```

### Use waitFor for Async Updates

```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});

// Wait for element to disappear
await waitFor(() => {
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

// Custom condition
await waitFor(() => {
  expect(callbackFn).toHaveBeenCalledTimes(3);
}, { timeout: 3000 });
```

## Test Organization

### Group Related Tests

```typescript
describe('UserService', () => {
  describe('create', () => {
    it('creates user with valid data');
    it('throws error with invalid email');
    it('throws error with duplicate email');
  });

  describe('update', () => {
    it('updates user successfully');
    it('throws error when user not found');
  });
});
```

### Use beforeEach/afterEach Wisely

```typescript
describe('Database tests', () => {
  beforeEach(async () => {
    // Runs before each test
    await database.clear();
    await database.seed();
  });

  afterEach(async () => {
    // Runs after each test
    await database.clear();
  });

  it('test 1', () => { /* ... */ });
  it('test 2', () => { /* ... */ });
});
```

## Coverage Guidelines

### Aim for Meaningful Coverage

Don't chase 100% coverage. Focus on:

- Business logic
- Edge cases
- Error handling
- Critical user paths

### What to Skip

- Types/interfaces (TypeScript handles this)
- Third-party library code
- Configuration files
- Trivial getters/setters

### Coverage Thresholds

```json
{
  "coverage": {
    "branches": 80,
    "functions": 80,
    "lines": 80,
    "statements": 80
  }
}
```

## Common Pitfalls

### ❌ Testing Implementation Details

```typescript
// Bad
expect(component.state.count).toBe(0);

// Good
expect(screen.getByText(/count: 0/i)).toBeInTheDocument();
```

### ❌ Not Cleaning Up After Tests

```typescript
// Bad
afterEach(() => {
  // Forgot to cleanup
});

// Good
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  server.resetHandlers();
});
```

### ❌ Overmocking

```typescript
// Bad - mocks too much
vi.mock('entire-library');

// Good - mocks only what's needed
vi.mock('library', () => ({
  ...vi.importActual('library'),
  specificFunction: vi.fn(),
}));
```

### ❌ Brittle Selectors

```typescript
// Bad - breaks when className changes
screen.getByClassName('mt-4 px-2 bg-blue-500');

// Good - semantic and stable
screen.getByRole('button', { name: /submit/i });
```

## Performance Tips

### Run Tests in Parallel

```json
{
  "test": {
    "pool": "threads",
    "poolOptions": {
      "threads": {
        "maxThreads": 4
      }
    }
  }
}
```

### Use Test Isolation

```typescript
// Fast - tests can run in parallel
it('test 1', () => { /* independent */ });
it('test 2', () => { /* independent */ });

// Slow - tests must run sequentially
let sharedState;
it('test 1', () => { sharedState = 'value'; });
it('test 2', () => { expect(sharedState).toBe('value'); });
```

### Skip Slow Tests in Watch Mode

```typescript
it.skipIf(process.env.WATCH)('slow E2E test', async () => {
  // Long-running test
});
```

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Docs](https://testing-library.com)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Kent C. Dodds - Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details)
- [Martin Fowler - Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html)

## Summary

✅ **Do:**
- Test user behavior
- Use semantic queries
- Keep tests simple
- Make tests independent
- Test critical paths
- Write descriptive names

❌ **Don't:**
- Test implementation details
- Use brittle selectors
- Add manual waits
- Create test interdependencies
- Chase 100% coverage blindly
- Overmock
