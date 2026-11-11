# Delete Bug — End-to-End Test Plan

## Purpose and scope

Plan independent UI tests for deleting a bug in BuggyBoard, based on
`specs/features/12-delete-bug.md`. The live UI flow was inspected with
Playwright CLI: selecting a board row opens an **Edit bug** dialog; its
**Delete** button opens a nested **Confirm delete** dialog with **Cancel** and
**Delete** actions.

This is a plan only. Do not create or modify Playwright test scripts as part of
this task.

## Shared test setup and isolation

- Each test authenticates independently using the existing login page object
  and a test account from `users.json`.
- In test setup, create a new bug through the UI using the existing
  `BoardPage` and `CreateBugModal` page objects. Give it a unique title, such
  as `delete-test-${randomId}`, and fill all required fields.
- Confirm the newly created row is visible before opening it. Use this test's
  unique title to locate the row and capture its bug ID if needed for the
  persistence assertion.
- Use the existing page-object fixtures and the `test`/`expect` exports from
  `tests/fixtures/pages.ts`. Keep each test focused on one behavior and use
  Arrange–Act–Assert.
- In test-scoped teardown, clean up only the bug created by that test, even if
  setup or assertions fail. If the test already deleted it, treat it as
  already cleaned up; never delete pre-existing or other tests' bugs.
- Tests must not depend on execution order, pre-existing bugs, or shared
  mutable data. They should run alone and in parallel.

## Scenarios

### 1. The edit dialog provides a Delete action

**Suggested test:** `should-show-delete-button-for-fresh-bug`

1. **Arrange:** Log in and create a fresh, uniquely titled bug in test setup;
   verify its row is visible.
2. **Act:** Open that bug from the board.
3. **Assert:** The Edit bug dialog is visible and contains a **Delete** button.

### 2. Confirming deletion removes the fresh bug

**Suggested test:** `should-delete-fresh-bug-after-confirmation`

1. **Arrange:** Log in and create a fresh, uniquely titled bug in test setup;
   verify its row is visible.
2. **Act:** Open that bug, click **Delete**, and verify the **Confirm delete**
   dialog appears. Confirm deletion with its **Delete** button.
3. **Assert:** Both dialogs close, the test bug's row is no longer visible, and
   a `GET /api/bugs/{id}` for the captured bug ID returns `404` to verify it
   was removed rather than merely hidden from the board.
4. **Cleanup:** Teardown should recognize the bug is already absent and leave
   all unrelated records untouched.

### 3. Canceling confirmation retains the fresh bug

**Suggested test:** `should-keep-fresh-bug-when-delete-is-cancelled`

1. **Arrange:** Log in and create a fresh, uniquely titled bug in test setup;
   verify its row is visible.
2. **Act:** Open that bug, click **Delete**, and cancel in the **Confirm
   delete** dialog.
3. **Assert:** The confirmation dialog closes, the Edit bug dialog stays open,
   the test bug's row remains visible, and a `GET /api/bugs/{id}` for its
   captured ID returns `200`.
4. **Cleanup:** Remove only this test's bug during teardown.
