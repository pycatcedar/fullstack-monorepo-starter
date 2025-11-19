# Testing Setup Guide

This guide explains the testing infrastructure in the monorepo and how to use it.

## Overview

The template includes three types of testing:

1. **Unit Tests** - Test individual functions and components
2. **Integration Tests** - Test multiple units working together
3. **E2E Tests** - Test the entire application flow

## Testing Stack

- **Vitest** - Unit and integration testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end testing framework
- **V8** - Code coverage provider

## Project Structure

```
├── apps/
│   ├── web/
│   │   ├── src/
│   │   │   └── components/
│   │   │       └── __tests__/          # Component tests
│   │   ├── test/
│   │   │   └── setup.ts                # Test setup
│   │   └── e2e/                        # E2E tests
│   ├── mobile/
│   │   └── src/
│   │       └── __tests__/              # Mobile tests
│   └── extension/
│       └── src/
│           └── __tests__/              # Extension tests
├── packages/
│   ├── api/
│   │   └── src/
│   │       └── __tests__/              # API tests
│   └── database/
│       └── src/
│           └── __tests__/              # Database tests
├── vitest.workspace.ts                 # Vitest config
└── playwright.config.ts                # Playwright config
```

## Running Tests

### All Tests

```bash
pnpm test              # Run all tests
pnpm test:unit         # Run unit/integration tests only
pnpm test:e2e          # Run E2E tests only
```

### Specific Workspace

```bash
# Test a specific app/package
pnpm --filter @repo/web test
pnpm --filter @repo/api test
pnpm --filter @repo/database test
```

### Watch Mode

```bash
# Run tests in watch mode
pnpm test -- --watch

# Watch specific package
pnpm --filter @repo/web test -- --watch
```

### Coverage

```bash
# Generate coverage report
pnpm test -- --coverage

# View HTML coverage report
open coverage/index.html
```

## Unit Testing with Vitest

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it('should handle edge cases', () => {
    expect(myFunction(null)).toBeUndefined();
  });
});
```

### Testing Async Code

```typescript
import { describe, it, expect } from 'vitest';

describe('async function', () => {
  it('should resolve with data', async () => {
    const data = await fetchData();
    expect(data).toHaveProperty('id');
  });

  it('should reject on error', async () => {
    await expect(fetchData('invalid')).rejects.toThrow();
  });
});
```

### Mocking

```typescript
import { describe, it, expect, vi } from 'vitest';

// Mock a module
vi.mock('../api', () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: 'Test' }))
}));

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on function
const spy = vi.spyOn(object, 'method');
expect(spy).toHaveBeenCalledWith(arg);
```

## Component Testing with React Testing Library

### Basic Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('handles form submission', async () => {
  const user = userEvent.setup();
  const handleSubmit = vi.fn();

  render(<LoginForm onSubmit={handleSubmit} />);

  await user.type(screen.getByLabelText(/email/i), 'test@example.com');
  await user.type(screen.getByLabelText(/password/i), 'password123');
  await user.click(screen.getByRole('button', { name: /submit/i }));

  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'test@example.com',
    password: 'password123'
  });
});
```

### Testing Async Components

```typescript
import { render, screen, waitFor } from '@testing-library/react';

it('loads and displays data', async () => {
  render(<UserProfile userId="1" />);

  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  // Check if data is displayed
  expect(screen.getByText('John Doe')).toBeInTheDocument();
});
```

## E2E Testing with Playwright

### Basic E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/My App/);
  await expect(page.locator('h1')).toBeVisible();
});
```

### Testing User Flows

```typescript
test('user can sign up', async ({ page }) => {
  await page.goto('/signup');

  // Fill form
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123!');
  await page.fill('[name="confirmPassword"]', 'SecurePass123!');

  // Submit
  await page.click('button[type="submit"]');

  // Verify redirect
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

### Testing with Fixtures

```typescript
import { test as base } from '@playwright/test';

type Fixtures = {
  authenticatedPage: Page;
};

const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Login
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    await use(page);
  },
});

test('authenticated user can access dashboard', async ({ authenticatedPage }) => {
  await expect(authenticatedPage.locator('h1')).toContainText('Dashboard');
});
```

## Testing Best Practices

See [BEST_PRACTICES.md](./BEST_PRACTICES.md) for detailed testing guidelines.

## Configuration

### Vitest Configuration

Located in `vitest.workspace.ts`:

```typescript
export default defineWorkspace([
  {
    test: {
      name: 'web',
      root: './apps/web',
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  },
  // ... other workspaces
]);
```

### Playwright Configuration

Located in `playwright.config.ts`:

```typescript
export default defineConfig({
  testDir: './apps/web/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## CI Integration

Tests run automatically in CI:

- **On Pull Request**: All tests
- **On Push to Main**: All tests + coverage
- **Nightly**: Full E2E test suite

See `.github/workflows/test.yml` for configuration.

## Debugging Tests

### Vitest UI

```bash
pnpm test -- --ui
```

Opens a browser-based UI for debugging tests.

### Playwright Inspector

```bash
PWDEBUG=1 pnpm test:e2e
```

Opens Playwright Inspector for step-by-step debugging.

### VS Code

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Current Test",
  "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
  "args": ["run", "${file}"],
  "console": "integratedTerminal"
}
```

## Common Issues

### Tests timeout

Increase timeout in test:
```typescript
test('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Module not found

Ensure TypeScript paths are configured in `vitest.config.ts`:
```typescript
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
},
```

### Flaky E2E tests

Use auto-waiting and assertions:
```typescript
// Good - waits automatically
await expect(page.locator('.item')).toBeVisible();

// Bad - can be flaky
await page.waitForTimeout(1000);
```

## Next Steps

- Read [BEST_PRACTICES.md](./BEST_PRACTICES.md)
- Check example tests in `__tests__` directories
- Review [Testing Library docs](https://testing-library.com)
- Review [Playwright docs](https://playwright.dev)
