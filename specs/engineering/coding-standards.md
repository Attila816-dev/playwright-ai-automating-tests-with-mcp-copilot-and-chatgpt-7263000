# Coding Standards

- **Be simple and direct** rather than complicated and clever.
- **Resolve all errors and linter warnings** before considering a task complete.
- **Keep packages up to date** within the constraints of the stack.
- **Follow Domain Driven Design (DDD) principles** where applicable (bounded contexts, clear domain language, see `specs/product/glossary.md`).
- **Keep business logic in the service layer** and out of the frontend as much as possible; the frontend should orchestrate and display, not implement core rules.
- **Playwright UI tests must use the canonical POM patterns** in [`test-automation-patterns.md`](./test-automation-patterns.md). Keep selectors and reusable UI actions in page objects under `tests/pages/`, with one page-object class per file. Do not add long raw `page` locator/action chains to tests.
