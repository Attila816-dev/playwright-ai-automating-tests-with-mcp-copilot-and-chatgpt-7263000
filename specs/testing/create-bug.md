# Create Bug — End-to-End Test Plan

## Application Overview

## Context

BuggyBoard is a basic bug-tracker web app (Volkswagen Beetle theme) built with React + Tailwind (frontend), Express (backend), and SQLite, used as the system under test for a Playwright course. This plan covers the **Create Bug** feature only, as specified in `specs/features/06-create-bug.md`, and follows the spec-first workflow described in `specs/constitution.md` and `specs/engineering/development-process.md`.

This document is a **test plan only**. No Playwright test implementation files or application code were created or modified as part of this work. Per `specs/engineering/tech-stack.md` ("Do not add Playwright (or other) tests during development"), actual test file creation requires explicit human direction to proceed to implementation.

## Spec sources read

- `specs/constitution.md`
- `specs/product/vision.md`
- `specs/design/theme.md`
- `specs/engineering/tech-stack.md`
- `specs/engineering/coding-standards.md`
- `specs/engineering/development-process.md`
- `specs/engineering/test-automation-patterns.md`
- `specs/features/06-create-bug.md` (primary spec for this plan)
- `specs/features/13-bug-status.md` (for default bug state context, referenced but not re-tested here)
- `specs/PROGRESS.md`

## Repository / environment facts discovered (not guessed)

- App base URL: `http://localhost:5173` (from `playwright.config.ts` `use.baseURL` and `webServer.url`).
- Dev server start command: `npm run dev` (root `package.json`), which Playwright's `webServer` config in `playwright.config.ts` runs automatically with `reuseExistingServer: !process.env.CI`. The MCP planner's `setup_page` tool already started/attached to this server — the board page (`http://localhost:5173/board`) loaded successfully and responded, confirming the server is up. No separate VS Code task was required since Playwright's own `webServer` directive manages startup; `.vscode/tasks.json` does not exist in this repo.
- `.vscode/mcp.json` configures the `playwright-test` MCP server via `npx playwright run-test-mcp-server`.
- Test users (`users.json`, repo root): `buggy` / `1970beetle` and `vanny` / `1979bus`. The MCP session was already authenticated as `buggy` (owner of the pre-existing seed bug "test bug").
- Existing page objects (`tests/pages/`): `LoginPage.ts`, `BoardPage.ts`, `CreateBugModal.ts`, `EditBugModal.ts`. Existing fixtures: `tests/fixtures/pages.ts` exposes `loginPage`, `boardPage`, `createBugModal`, `editBugModal` fixtures; tests must import `test`/`expect` from `tests/fixtures/pages` per `specs/engineering/test-automation-patterns.md`, not from `@playwright/test` directly.
- Existing create-bug tests already present under `tests/create-bug/`: `open-create-bug-modal.spec.ts`, `create-and-close.spec.ts`, `create-and-close-video.spec.ts`. This plan is intentionally broader (covers validation, cancel/X/Escape/backdrop, color coding, per-field required checks) and should be reconciled with/supersede ad hoc scripts like `create-and-close.spec.ts` (which mixes screenshot capture and state-toggle concerns) when implementation begins — flagged as a proposal, not yet actioned.
- `CreateBugModal.ts` currently has `fillBugForm()` treat `severity`/`owner`/`description` as optional (only filled `if` truthy) — convenient for the "leave blank" test cases in this plan (pass `''` or omit the field) but testers must confirm the page object actually leaves the field blank (owner is pre-filled by the app, so an explicit `.fill('')` call must be added to the page object, or a new method, to properly blank it out — see page-object gap notes below).

## Worktree status at planning time

The planner could not inspect git status because no git/shell tool was exposed to its session. Parent-session verification afterward confirmed that `specs/testing/create-bug.md` is an existing tracked plan, now updated at the requested path, and that `specs/PROGRESS.md` has one added checklist line under the existing "Create bug" section. Other worktree changes are present; their provenance was not established by this planning task, and they were left untouched. No test implementation or application code was added by this task.

## MCP exploration performed (evidence)

All exploration was performed live against the running app at `http://localhost:5173/board` using Playwright MCP browser tools (`browser_snapshot`, `browser_click`, `browser_type`, `browser_select_option`, `browser_press_key`, `browser_evaluate`, `browser_take_screenshot`). Source/code reading (via file:// navigation, for context only) was clearly separated from live UI interaction. Every bug created during exploration was deleted afterward via the Edit Bug modal's Delete + Confirm flow, returning the board to its original single seed bug ("1 MID test bug buggy").

Observed live behaviors (confirmed by direct interaction, with evidence):
1. Clicking "New Bug" opens a modal (`role=dialog`, name "Create bug") with Title, Severity (select), Owner, Description fields, a Save and Cancel button, and an "×" Close button in the header. Title field is auto-focused.
2. **Severity defaults to "MID" every time the modal is freshly opened** (observed repeatedly, including after cancel-and-reopen). This default is **not specified** in `specs/features/06-create-bug.md` — it is an **observed behavior**, not a documented spec requirement. Flagged as a discrepancy/gap between spec and implementation (spec says nothing about a default severity).
3. Owner field is pre-filled with the current user's username ("buggy") — matches spec scenario "Create-bug modal defaults owner to the current user".
4. Severity select visibly recolors per the selected option, confirmed via computed style inspection:
   - MID → `rgb(166, 124, 71)` text / amber-tinted background (matches spec's "amber" for MID).
   - HIGH → `rgb(184, 74, 46)` text / terracotta-tinted background (matches spec's "strong terracotta" for HIGH).
   - LOW → `rgb(74, 107, 94)` text / sage-tinted background (matches spec's "muted sage" for LOW).
5. Attempting Save with Title and Description blank shows an alert region (`role=alert`) listing `"Title is required."` and `"Description is required."`; modal remains open; no new row appears on the board.
6. Attempting Save with only Owner blank (Title and Description filled) shows `"Owner is required."` in the alert region; modal remains open; no new bug saved. (Initial attempt at this check was invalidated by a tooling artifact — see "Tooling pitfalls" below — and was re-verified correctly afterward.)
7. A **whitespace-only title** (three spaces) is treated as blank: Save shows `"Title is required."` and does not save. This is a positive finding (no bug saved with a blank-looking title), though exact trimming logic (client vs. server) was not isolated.
8. Clicking the "×" Close button closes the modal without saving, with previously entered data (title text) discarded — board unchanged.
9. Pressing Escape while the modal is open (with title text entered) closes the modal without saving — board unchanged.
10. Clicking the darkened backdrop area (confirmed via `elementFromPoint` on a coordinate outside the modal panel's bounding box) does **not** close the modal, and the previously entered title text (`"Backdrop click test"`) is preserved in the field afterward.
11. Clicking the explicit "Cancel" button closes the modal without saving, discarding entered data — board unchanged.
12. A full valid submission (Title "Login fails with special characters", Severity HIGH, Description containing literal `<` and `>` characters) succeeds: the modal closes, a new row appears on the board immediately (ID auto-assigned, e.g. 62; Owner "buggy"; Severity "HIGH" displayed in caps), and re-opening that bug's Edit modal confirms the description was stored and redisplayed with the literal `<`/`>` characters intact (no visible escaping corruption). State defaulted to "Open" (per `specs/features/13-bug-status.md`, consistent but out of scope for this plan to re-verify in depth).
13. The newly created bug sorted into the table per the board's default sort (Severity descending), appearing above the existing MID-severity bug — this is board-page behavior, out of scope for this create-bug plan but noted as a side observation.

Tooling pitfalls encountered during exploration (documented for transparency, not product defects):
- Setting an input's `.value` directly via `element.value = ''` plus a dispatched `input` event did **not** register with the app's React state (the field visually looked cleared in the DOM snapshot briefly but the value re-appeared as the original "buggy" owner on save) — this is a **test-tooling** artifact of bypassing React's synthetic event system, not an app defect. The correct approach (used in the final, trusted test) is Playwright's `locator.fill('')`, which dispatches proper input events React recognizes.
- Issuing multiple `browser_type` calls "in parallel" (concurrently) against different fields of the same open modal caused values to land in the wrong fields (a race condition in the exploration tooling, not the app). All field-filling steps must be performed **sequentially** within a single test, which is already the natural behavior of Playwright's `page.locator.fill()` calls executed one after another in generated test code.

Aside/out-of-scope observation (not part of this create-bug plan, flagged for awareness): immediately after deleting one bug (#61) and then opening a different bug's (#62) Edit modal, a "Confirm delete" dialog appeared already open underneath/alongside the Edit modal before any Delete button was clicked for #62. This suggests possible confirmation-dialog state not being fully reset between Edit-modal open/close cycles. This is an **Edit Bug / Delete Bug** concern, not Create Bug, and is intentionally **not** included as a test case in this plan (scope is limited to Create Bug), but is recorded here as a discrepancy worth a separate investigation/test plan for the Edit/Delete features.

## Distinguishing spec vs. observed vs. proposed

- **Spec-required** (from `specs/features/06-create-bug.md`) — must be tested: modal opens with all fields; owner defaults to current user; valid save persists and closes; cancel/X/Escape all discard without saving; backdrop click does not close; blank required fields block save with field-level messaging; each of title/severity/owner/description individually blocks save when blank.
- **Observed-but-unspecified** — tested as *current behavior*, explicitly annotated as not a hard spec requirement so a future spec change isn't treated as a regression: default severity of MID on open; whitespace-only title treated as blank; literal `<`/`>` preserved without visible corruption (not a documented requirement but good to guard against regressions/XSS-adjacent issues).
- **Unverified proposals** (not exercised live due to scope/time, should be covered when tests are implemented, but are not asserted as currently-observed truths): behavior for a second user (`vanny`) opening the modal and seeing "vanny" as owner default; maximum-length title/description handling; duplicate titles allowed; concurrent creation from two sessions; network-failure handling on Save; keyboard-only (Tab-order) operability of the form; locale-specific characters in title/description.

## Coverage priorities

1. **P0 (must have before any release gate):** modal opens with correct fields (AC1); owner default (AC2); happy-path save (AC3); cancel discards (AC4); blank-required-fields blocks save with messaging (AC8); per-field blank validation for title/severity/owner/description (AC9, scenario outline).
2. **P1:** X button discards (AC5); Escape discards (AC6); backdrop click keeps modal + data (AC7); severity color coding matches board (design/theme.md cross-check).
3. **P2 (nice-to-have / regression guards for observed-but-unspecified behavior):** default severity value is MID; whitespace-only title rejected; special characters preserved; proposals in "Unverified proposals" above once resourced.

## Cleanup / reset guidance for implementation

- Every test that successfully creates a bug must delete it afterward (via `EditBugModal` Delete + Confirm flow) in the same test, ideally in a `finally`/fixture teardown, OR tests should run against a backend reset between runs if one becomes available. Today there is no API or UI "reset database" affordance observed — deletion through the UI is the only verified cleanup mechanism.
- Tests that only open-and-cancel/X/Escape the modal require no cleanup since no bug is persisted (confirmed above).
- Because `fullyParallel: true` is set in `playwright.config.ts` and there is a single shared SQLite file (per `specs/engineering/tech-stack.md`), tests should use unique, identifiable titles (e.g. a timestamp or random suffix, consistent with the existing `create-and-close.spec.ts` convention of `` `e2e bug ${Date.now()}` ``) to avoid cross-test collisions and to make cleanup/lookup reliable even under parallel execution.
- Do not assume bug IDs; always locate created bugs by their unique title via `BoardPage.getBugRowByTitle()`.

## Page object / fixture gaps noted (for implementers, not actioned here)

- `CreateBugModal.fillBugForm()` only fills `severity`/`owner`/`description` `if (data.x)` is truthy, so passing `owner: ''` to deliberately blank the pre-filled owner field will not call `.fill('')` and will leave "buggy" in place. A new explicit method (e.g. `clearOwner()`) or a boolean flag (e.g. `clearOwnerFirst: true`) should be added to the page object before the "owner blank" test case can be implemented using the existing `fillBugForm` API as-is.
- There is no existing page-object query for the validation alert's list items (e.g. `getRequiredFieldErrors()`); one should be added to `CreateBugModal.ts` returning the text content of `[role="alert"] li` items, to assert exact required-field messages atomically.
- There is no existing helper for clicking the backdrop; a `clickBackdrop()` method should be added to `CreateBugModal.ts` (e.g. clicking at a fixed offset like `{x: 10, y: 10}` via `page.mouse.click()`), since the dialog's own bounding box spans the full viewport and only its inner panel is the "non-backdrop" region.

## Test Scenarios

### 1. Create Bug — Modal Display and Defaults

**Seed:** `tests/seed.spec.ts`

#### 1.1. Opening the New Bug button shows the create-bug modal with all required fields and buttons

**File:** `tests/create-bug/modal-fields-visible.spec.ts`

**Steps:**
  1. Arrange: Using the loginPage fixture, log in as the first user from users.json; navigate to the board page via boardPage.goto() if not already there.
  2. Act: Click the 'New Bug' button via boardPage.clickNewBugButton().
  3. Assert: createBugModal.dialog is visible; createBugModal.titleInput, severitySelect, ownerInput, descriptionInput, saveButton, cancelButton are all visible.
    - expect: The modal labeled 'Create bug' is visible with Title, Severity, Owner, Description fields and Save/Cancel buttons, matching feature spec scenario 'User can open the create-bug modal from the board page'.

#### 1.2. Create-bug modal pre-fills the Owner field with the current logged-in user

**File:** `tests/create-bug/owner-default.spec.ts`

**Steps:**
  1. Arrange: Log in as a specific known user (e.g. 'buggy' from users.json) via loginPage.login(username, password).
  2. Act: Click 'New Bug' to open the modal.
  3. Assert: createBugModal.ownerInput has value equal to the logged-in username.
    - expect: Owner field is pre-filled with the current user's username, per spec scenario 'Create-bug modal defaults owner to the current user'. This was directly observed live in MCP exploration (owner pre-filled with 'buggy').

#### 1.3. [Observed-but-unspecified, P2] Severity field defaults to MID when the modal is freshly opened

**File:** `tests/create-bug/severity-default-observed.spec.ts`

**Steps:**
  1. Arrange: Log in and open the create-bug modal.
  2. Act: Read the current value of createBugModal.severitySelect without changing it.
  3. Assert: The select's value is 'mid' (case-insensitive) / displayed option is 'MID'.
    - expect: This documents an OBSERVED default (confirmed live via MCP exploration across multiple modal open/reopen cycles) that is NOT specified in specs/features/06-create-bug.md. Treat a future change to this default as an intentional product decision, not a regression, unless the spec is updated to require it. If this default changes, update or remove this test rather than treating a failure as a blocking defect.

#### 1.4. [Observed, P2] Selecting each severity option recolors the select to match board severity color coding

**File:** `tests/create-bug/severity-color-coding.spec.ts`

**Steps:**
  1. Arrange: Log in and open the create-bug modal.
  2. Act: Select 'HIGH' in createBugModal.severitySelect; read computed style color/background of the select element.
    - expect: Color corresponds to the terracotta HIGH severity token (observed live as rgb(184, 74, 46) text with a matching tinted background) per specs/design/theme.md and specs/features/08-board-severity.md CSS custom properties.
  3. Act: Select 'MID'; read computed style.
    - expect: Color corresponds to the amber MID severity token (observed live as rgb(166, 124, 71)).
  4. Act: Select 'LOW'; read computed style.
    - expect: Color corresponds to the sage LOW severity token (observed live as rgb(74, 107, 94)).

### 2. Create Bug — Successful Save

**Seed:** `tests/seed.spec.ts`

#### 2.1. Saving the create-bug modal with all required fields filled creates a new bug and closes the modal

**File:** `tests/create-bug/create-success.spec.ts`

**Steps:**
  1. Arrange: Log in; navigate to the board page; note the current bug count/rows for later comparison; generate a unique title, e.g. `Login fails with special characters ${Date.now()}`.
  2. Act: Click 'New Bug'; fill Title with the unique title; select Severity 'HIGH'; fill Description with 'When I use < and > in my password, login fails.' (leave Owner as its pre-filled default); click Save.
  3. Assert: createBugModal.dialog becomes hidden (modal closed).
    - expect: Matches spec scenario 'User can save a new bug with all required fields' — modal closes after save.
  4. Assert: boardPage.getBugRowByTitle(uniqueTitle) is visible in the table with Severity 'HIGH' and Owner equal to the logged-in username.
    - expect: The bug is saved to the database with the entered data and visible on the board (observed live: new row appeared immediately with auto-assigned ID, HIGH severity, correct owner).
  5. Act: Open the created bug's Edit modal (boardPage.clickBugByTitle) to inspect the Description field value.
  6. Assert: The Description field contains the exact text including the literal '<' and '>' characters, unmodified.
    - expect: Special characters in the description are preserved and redisplayed correctly, matching the exact data entered (observed live; no visible corruption or unintended escaping).
  7. Cleanup: Delete the created bug via editBugModal.delete() (opens delete confirmation and confirms) so no leftover test data remains.
    - expect: The bug no longer appears on the board after deletion.

### 3. Create Bug — Cancellation Paths (no save occurs)

**Seed:** `tests/seed.spec.ts`

#### 3.1. Clicking Cancel in the create-bug modal discards entered data and does not save a bug

**File:** `tests/create-bug/cancel-no-save.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count on the board.
  2. Act: Fill the Title field with some text (e.g. 'Cancel button test bug'); do not fill other fields.
  3. Act: Click createBugModal.cancelButton (createBugModal.cancel()).
  4. Assert: createBugModal.dialog is hidden.
    - expect: Modal is closed, matching spec scenario 'User can cancel creating a bug without saving'.
  5. Assert: The board's row count is unchanged and no row with the entered title text exists.
    - expect: No new bug was saved to the database (observed live: board returned to its pre-test single-row state after Cancel).

#### 3.2. Clicking the X (Close) button in the upper-right corner of the create-bug modal discards entered data and does not save a bug

**File:** `tests/create-bug/close-x-no-save.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count on the board.
  2. Act: Fill the Title field with some text.
  3. Act: Click the modal's 'Close' (×) button in the upper-right corner.
  4. Assert: The modal is hidden.
    - expect: Matches spec scenario 'User can close the create-bug modal with the X button' and the global modal rule in specs/design/theme.md that the X has the same effect as Cancel.
  5. Assert: No new bug row with the entered title exists on the board; row count unchanged.
    - expect: No new bug was saved (observed live).

#### 3.3. Pressing Escape while the create-bug modal is open discards entered data and does not save a bug

**File:** `tests/create-bug/escape-no-save.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count on the board.
  2. Act: Fill the Title field with some text (e.g. 'Escape key test bug').
  3. Act: Press the Escape key.
  4. Assert: The modal is hidden.
    - expect: Matches spec scenario 'User can close the create-bug modal with the Escape key' and the global modal rule in specs/design/theme.md.
  5. Assert: No new bug row with the entered title exists on the board; row count unchanged.
    - expect: No new bug was saved (observed live).

#### 3.4. Clicking the dimmed backdrop outside the create-bug modal does not close it and preserves entered data

**File:** `tests/create-bug/backdrop-preserves-state.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal.
  2. Act: Fill the Title field with some text (e.g. 'Backdrop click test').
  3. Act: Click on the dimmed backdrop area outside the modal's content panel (e.g. via a new CreateBugModal.clickBackdrop() helper that clicks a fixed point known to be outside the centered panel, such as the top-left corner of the viewport).
  4. Assert: createBugModal.dialog remains visible.
    - expect: Matches spec scenario 'Clicking outside the create-bug modal does not close it'. Observed live: the modal panel occupies a centered ~512px-wide box; clicking at viewport coordinates outside that box (confirmed via elementFromPoint) did not close the dialog.
  5. Assert: The Title field still contains the previously entered text.
    - expect: Data entered in the modal fields is preserved after a backdrop click (observed live).
  6. Cleanup: Close the modal via Cancel (no bug was saved, so no further cleanup needed).

### 4. Create Bug — Required Field Validation

**Seed:** `tests/seed.spec.ts`

#### 4.1. Attempting to save with Title and Description blank shows required-field messages and does not save

**File:** `tests/create-bug/validation-all-blank.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count on the board.
  2. Act: Without filling Title or Description (leave Owner as pre-filled default, Severity as default), click Save.
  3. Assert: createBugModal.dialog remains visible.
    - expect: The modal remains open per spec scenario 'Save is blocked when required fields are blank'.
  4. Assert: An alert region lists the specific missing fields, e.g. 'Title is required.' and 'Description is required.' (add a CreateBugModal.getRequiredFieldErrors() helper returning the alert's list item texts).
    - expect: The user is informed which fields are required (observed live: exact messages 'Title is required.' and 'Description is required.' appeared in a role=alert region).
  5. Assert: The board's row count is unchanged; no bug was saved.
    - expect: No new bug is saved to the database (observed live).

#### 4.2. Title field blank with all other required fields filled blocks save (scenario outline: field = title)

**File:** `tests/create-bug/validation-title-blank.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count.
  2. Act: Leave Title blank; select a valid Severity (e.g. keep default or explicitly select 'HIGH'); keep Owner as pre-filled; fill Description with valid text; click Save.
  3. Assert: The modal remains open and an alert shows 'Title is required.'; no new bug appears on the board.
    - expect: Matches spec Scenario Outline 'Each required field must not be blank' for field=title (observed live).

#### 4.3. Severity field blank with all other required fields filled blocks save (scenario outline: field = severity)

**File:** `tests/create-bug/validation-severity-blank.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count.
  2. Act: This case is blocked pending spec clarification: the observed select has no empty option. Do not manipulate the DOM to manufacture an unreachable end-to-end state. If a supported empty/placeholder option is introduced, fill Title and Description with valid text, keep Owner as pre-filled, select that empty option through the page object, and click Save.
  3. Assert: The modal remains open and an alert indicates severity is required (exact wording TBD — not yet observed live since the <select> only exposed HIGH/MID/LOW with MID pre-selected and no blank option during exploration); no new bug appears on the board.
    - expect: UNVERIFIED PROPOSAL: this scenario from the spec's outline table could not be exercised live because the severity <select> always has a non-blank value selected (defaults to MID) with no empty option observed. Before implementing, confirm with the team whether this spec scenario is actually reachable in the current UI, or whether the <select>'s mandatory default makes 'severity blank' structurally impossible, and update the spec or this test accordingly rather than assuming either outcome.

#### 4.4. Owner field blank with all other required fields filled blocks save (scenario outline: field = owner)

**File:** `tests/create-bug/validation-owner-blank.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count.
  2. Act: Fill Title with valid text; fill Description with valid text; explicitly clear the Owner field using locator.fill('') (NOT by directly assigning the DOM element's .value — confirmed via live exploration that bypassing the fill() API does not register with the app's React state and silently leaves the original owner value in place, causing a false negative); click Save.
  3. Assert: The modal remains open and an alert shows 'Owner is required.'; no new bug appears on the board.
    - expect: Matches spec Scenario Outline 'Each required field must not be blank' for field=owner. Re-verified live using locator.fill('') after an initial attempt using raw DOM value assignment produced a false negative (bug saved with owner still 'buggy') due to a test-tooling artifact, not an app defect.

#### 4.5. Description field blank with all other required fields filled blocks save (scenario outline: field = description)

**File:** `tests/create-bug/validation-description-blank.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count.
  2. Act: Fill Title with valid text; keep Owner as pre-filled; leave Description blank; click Save.
  3. Assert: The modal remains open and an alert shows 'Description is required.'; no new bug appears on the board.
    - expect: Matches spec Scenario Outline 'Each required field must not be blank' for field=description (observed live as part of the combined 'all blank' test; isolate here for atomicity per Arrange-Act-Assert and independent-test guidance).

#### 4.6. [Observed-but-unspecified, P2] A whitespace-only title is treated as blank and blocks save

**File:** `tests/create-bug/validation-whitespace-title.spec.ts`

**Steps:**
  1. Arrange: Log in; open the create-bug modal; note the current row count.
  2. Act: Fill Title with three spaces ('   '); fill Description with valid text; keep Owner as pre-filled; click Save.
  3. Assert: The modal remains open and an alert shows 'Title is required.'; no new bug appears on the board.
    - expect: OBSERVED LIVE: a whitespace-only title is rejected as if blank (not specified explicitly in specs/features/06-create-bug.md, but a reasonable and currently-true guard). If a future change allows whitespace-only titles to be saved, this is a product decision to confirm with the team, not an automatic regression to silently update.
