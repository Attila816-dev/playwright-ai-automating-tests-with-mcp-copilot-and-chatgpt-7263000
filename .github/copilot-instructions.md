# BuggyBoard: Use Specs as Context

When working on the **BuggyBoard** web app (bug tracker SUT for the Playwright course):

1. **Read the constitution** (`specs/constitution.md`) and the specs under `specs/` before implementing. Use at least:
   - `specs/product/vision.md` – what we're building
   - `specs/design/theme.md` – color theme and UI/UX design rules
   - `specs/engineering/tech-stack.md` – stack and constraints
   - `specs/engineering/coding-standards.md` – style and architecture
   - `specs/engineering/development-process.md` – spec-first, feature-by-feature, pause for review
   - `specs/engineering/test-automation-patterns.md` – Page Object Model (POM) and test structure
2. **For a feature**, use the corresponding spec in `specs/features/` (e.g. `specs/features/01-login.md`).
3. **Update** `specs/PROGRESS.md` when a feature or step is completed.
4. **Pause for review** after each feature; do not start the next feature until the user directs.
5. **Ask the user** when a decision is unclear instead of assuming.
6. **Write atomic tests with page objects** – every test focuses on one behavior and uses page object classes.
   - Do not generate "grand tour" tests like `tests/search-bug/search-grand-tour.spec.ts` that chain multiple behaviors into one test. Split broad matches, subset filtering, no results, and clearing search into separate tests.
   - Follow **Arrange-Act-Assert**: establish the prerequisites for one behavior, perform the action under test, then assert its expected outcome. Setup may involve multiple actions; do not interleave unrelated Act-Assert sequences.
   - Give each test a descriptive name identifying its single behavior so a failure is easy to diagnose. Multiple assertions are appropriate when they verify the same outcome, such as matching rows being visible and nonmatching rows being hidden.
   - Each test must be independent: establish its own authentication, data, and UI state directly or through test-scoped fixtures/hooks. Never depend on execution order or state left by another test; tests must work alone and in parallel.
   - Use uniquely identifiable test data and clean up only records created by that test, including when setup or assertions fail. Do not share mutable data between tests.
   - Page objects belong under `tests/pages/` (one class per file); tests must use page objects instead of raw page call chains.