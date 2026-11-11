# Edit Bug — End-to-End Test Plan

## Application overview

Validate that a user can open a bug from the board, inspect its fields, save
changes, and discard changes when canceling or closing the edit dialog. The
plan follows `specs/features/09-edit-bug.md` and keeps each test focused on one
behavior.

## Seed and test data

- **Seed:** `tests/seed.spec.ts`. Use the existing seed unchanged to establish
  the authenticated board during CLI exploration. Do not edit the seed file.
- Each test must be independently runnable: authenticate using the existing
  login page object and create its own fresh bug through the UI during test
  setup.
- Use a unique title per test run (for example,
  `edit-bug-${runId}-${randomId}`), with known initial values for title,
  severity, owner, and description.
- Verify the fresh bug appears on the board before acting. Capture its ID and
  original values for assertions.
- In test-scoped teardown, delete only the bug created by that test, including
  when setup/assertions fail. If a test already removed it, treat it as already
  cleaned up. Do not mutate or delete the seed bug or any pre-existing record.
- Use the page-object fixtures from `tests/fixtures/pages.ts`. Extend the
  existing board/edit page objects as needed for semantic field locators;
  tests should not contain raw UI locator chains.

## Test scenarios

### 1. Opening and inspecting a bug

#### 1.1. Open a freshly created bug from the board

**File:** `tests/edit-bug/opens-fresh-bug.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug in test setup; verify its
   row is visible.
2. **Act:** Click the fresh bug's row.
3. **Assert:** The Edit bug dialog opens, its heading includes the new bug's
   ID, and the ID, title, severity, owner, and description values match the
   created bug.

#### 1.2. Show ID as read-only and the editable fields as controls

**File:** `tests/edit-bug/shows-editable-fields.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug in test setup; open it.
2. **Act:** Inspect the edit form controls.
3. **Assert:** The ID is read-only. Title, severity, owner, and description
   can be edited. The severity dropdown contains HIGH, MID, and LOW, with the
   current value selected and rendered using its severity color.

### 2. Saving changes

#### 2.1. Save changes to a freshly created bug

**File:** `tests/edit-bug/saves-bug-changes.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug with known initial values;
   open it.
2. **Act:** Change the title, severity, owner, and description, then save.
3. **Assert:** The dialog closes, the board shows the updated title and
   severity/owner values, and a fresh read of the bug confirms every changed
   value was persisted for the same ID.

### 3. Discarding changes

#### 3.1. Cancel edits without saving

**File:** `tests/edit-bug/cancels-bug-edits.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug; retain its original values
   and open it.
2. **Act:** Change an editable field and click Cancel.
3. **Assert:** The dialog closes and the bug still has all its original values
   in the board/database.

#### 3.2. Close with the X without saving

**File:** `tests/edit-bug/closes-bug-edit-with-x.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug; retain its original values
   and open it.
2. **Act:** Change an editable field and click the dialog's Close (X) control.
3. **Assert:** The dialog closes and the bug remains unchanged.

#### 3.3. Close with Escape without saving

**File:** `tests/edit-bug/closes-bug-edit-with-escape.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug; retain its original values
   and open it.
2. **Act:** Change an editable field and press Escape.
3. **Assert:** The dialog closes and the bug remains unchanged.

#### 3.4. Keep the dialog open and preserve edits after a backdrop click

**File:** `tests/edit-bug/keeps-edit-on-backdrop-click.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug, then open it.
2. **Act:** Enter an unsaved value and click the dimmed area outside the modal
   panel.
3. **Assert:** The dialog remains open, the entered value is preserved, and
   the stored bug remains unchanged.

### 4. Save button state and required fields

#### 4.1. Disable Save when no fields have changed

**File:** `tests/edit-bug/disables-save-without-changes.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug, then open it without
   changing any field.
2. **Act:** Inspect the Save button.
3. **Assert:** Save is disabled.

#### 4.2. Disable Save when the title is blank

**File:** `tests/edit-bug/disables-save-with-blank-title.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug, then open it.
2. **Act:** Clear the title field.
3. **Assert:** Save is disabled and the original bug remains unchanged.

#### 4.3. Disable Save when the owner is blank

**File:** `tests/edit-bug/disables-save-with-blank-owner.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug, then open it.
2. **Act:** Clear the owner field.
3. **Assert:** Save is disabled and the original bug remains unchanged.

#### 4.4. Disable Save when the description is blank

**File:** `tests/edit-bug/disables-save-with-blank-description.spec.ts`

1. **Arrange:** Authenticate and create a fresh bug, then open it.
2. **Act:** Clear the description field.
3. **Assert:** Save is disabled and the original bug remains unchanged.

## UI exploration notes

- The existing seed logs in the first user and verifies the Logout button. It
  was used unchanged to reach the authenticated board for CLI exploration.
- A uniquely named temporary bug was created through the UI to verify that an
  edit dialog displays the bug ID and fields, that ID is read-only, Save is
  disabled when unchanged, and saving updates the board.
- Cancel and Escape discarded unsaved changes; a backdrop click left the
  dialog open with its unsaved value intact.
- The severity control offered only HIGH, MID, and LOW. Since it has no blank
  option, a separate UI test that attempts to clear severity is not applicable;
  verify its available options and selected value instead.
- The temporary exploration bug was deleted after inspection and verified
  absent through the API. No Playwright test implementation was created or
  run for this plan.
