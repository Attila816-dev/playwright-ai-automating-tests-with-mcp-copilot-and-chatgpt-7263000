# Test Automation Patterns

This is the canonical, project-wide context for Playwright test automation in BuggyBoard. All new and refactored BuggyBoard UI tests must follow these patterns. When another document or example conflicts with this guide, use this guide and update the conflicting example when it is in scope.

The patterns follow [Playwright's Page Object Model guidance](https://playwright.dev/docs/pom), adapted to this repository's fixtures, routes, and test-data conventions.

## Core principles

- Tests describe one user-visible behavior using Arrange–Act–Assert. Keep them atomic, independent, and safe to run in parallel.
- Use a Page Object Model (POM) for every BuggyBoard UI interaction. Tests must not build long chains of raw `page.locator()`, `getByRole()`, or `getByLabel()` calls.
- Keep selectors and reusable UI actions/queries in page objects. Tests may assert against semantic locators exposed by those objects with Playwright's `expect`.
- Create uniquely identifiable test data and remove only data created by that test, including when setup or assertions fail.
- Prefer accessible role, label, and text locators. Use CSS selectors only when the application has no suitable accessible locator.
- Use Playwright's auto-waiting assertions and locator actions. Avoid fixed sleeps and arbitrary waits.

## Page object structure

Page object classes live under `tests/pages/`, with exactly one class per file. Use the existing PascalCase filenames and class names. Every page object receives a Playwright `Page` in its constructor, stores the locators it owns, and offers meaningful navigation, action, and query methods.

```text
tests/
  fixtures/
    pages.ts
  pages/
    LoginPage.ts
    BoardPage.ts
    CreateBugModal.ts
    EditBugModal.ts
```

BuggyBoard currently has two route-level pages: `/login` (`LoginPage`) and `/board` (`BoardPage`). Create and edit dialogs are overlays, represented by `CreateBugModal` and `EditBugModal`; they are not separate routes. Shared board header controls belong to `BoardPage`, not to a separate page object. Add a new route-level page object when the application gains a route, and keep each class in its own file.

Page objects should:

- Encapsulate selectors and browser details so UI changes have a single update point.
- Expose stable, semantic locators for meaningful assertions.
- Provide reusable user actions and queries with domain-oriented names.
- Avoid test-specific assertions, test-data creation, and unrelated application/business logic.
- Avoid broad catches, silent fallbacks, and arbitrary timeouts.

Prefer locator properties for assertions and methods for reusable interactions:

```ts
// tests/pages/LoginPage.ts
import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(private readonly page: Page) {
    this.usernameInput = page.getByLabel('Username');
    this.passwordInput = page.getByLabel('Password');
    this.loginButton = page.getByRole('button', { name: 'Login' });
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

Use the most user-facing locator available:

1. `getByRole` with an accessible name
2. `getByLabel`
3. `getByPlaceholder` or `getByText`
4. `getByTestId`
5. CSS selectors as a last resort

Scope locators to their owning dialog, form, or region when practical. Keep brittle structural selectors private to the page object.

## Fixtures

Use the shared `test` and `expect` exports from `tests/fixtures/pages.ts`. Its test-scoped fixtures provide `loginPage`, `boardPage`, `createBugModal`, and `editBugModal` for the current Playwright `page`. Do not repeatedly construct these objects in test bodies.

```ts
import { test, expect } from '../fixtures/pages';

test('user can log in with valid credentials', async ({ loginPage, boardPage }) => {
  // Arrange
  await loginPage.goto();

  // Act
  await loginPage.login('user', 'password');

  // Assert
  await expect(boardPage.logoutButton).toBeVisible();
});
```

Fixtures construct page objects; they do not automatically authenticate or create application data unless that behavior is explicitly part of a named fixture. Keep authentication, test data, and UI state explicit in each test or in a narrowly scoped test fixture.

If a specialized test needs a separate `Page` (for example, to record a video), use the same page object classes with that page. Keep object construction in a dedicated fixture rather than adding raw UI locator chains to the test.

## Test structure and assertions

Tests should focus on a single behavior and follow Arrange–Act–Assert. Setup may contain several prerequisite actions, but avoid chaining unrelated user flows into one test.

Use page-object locators and queries in assertions. Do not locate or interact with application controls directly in the test. Playwright test APIs used for infrastructure—such as API requests for setup/cleanup, route mocking, browser context configuration, screenshots, and tracing—may remain in tests because they are not UI locator/action chains.

Avoid grand-tour tests that perform several independently meaningful behaviors. Split broad search matches, subset filtering, no results, and clearing a search into separate tests, for example.

## Test data and isolation

- Give every test's data a unique, recognizable identifier (for example, a UUID suffix).
- Create data through the UI when the behavior under test is creation; API setup is appropriate when creation is only a prerequisite for another behavior.
- Track the IDs of records created by the test and clean them up in `finally` or a test-scoped fixture teardown.
- Check setup and cleanup responses explicitly. Do not silently ignore failures.
- Do not share mutable test data across tests or depend on execution order.
- Ensure a test can run alone and in parallel with its suite.

## Existing tests and examples

When modifying an existing BuggyBoard UI test, bring its UI interaction onto the page objects and fixtures. Raw Playwright APIs are appropriate for browser/test infrastructure, not as a substitute for a page object. API-only tests do not need UI page objects. Tests for external demonstration sites are outside the BuggyBoard POM requirement unless they exercise BuggyBoard UI.

When adding a reusable interaction or assertion query, check the existing objects under `tests/pages/` first and extend the appropriate class instead of duplicating selectors or adding multiple page-object classes to one file.
