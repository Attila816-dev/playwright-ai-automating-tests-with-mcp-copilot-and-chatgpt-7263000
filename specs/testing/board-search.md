# Board Search — End-to-End Test Plan

## Application Overview

BuggyBoard is a basic bug-tracker web app (Volkswagen Beetle theme) built with React + Tailwind (frontend), Express (backend), and SQLite (single shared file), used as the system under test for a Playwright course. This plan covers the Board Search feature ONLY (specs/features/11-search-board.md), as explicitly scoped by the requester: searching bugs by title from the board page. Bug creation/editing/deletion was intentionally NOT explored or exercised as part of this task (per user instruction) beyond read-only reconnaissance of pre-existing data via GET /api/bugs (no mutation). This is a planning-only artifact: no Playwright test implementation files or application code were created or modified. Per specs/engineering/tech-stack.md ("Do not add Playwright (or other) tests during development"), actual test file creation requires explicit human direction to proceed to implementation. All exploration was performed live via Playwright MCP browser tools against the running app at http://localhost:5174 (the user-specified running port, not the 5173 configured in playwright.config.ts), with authentication done through the real login UI using credentials discovered from the repo's users.json.

## Test Scenarios

## Execution contract and priorities

- The IDs, titles, and counts below record the exploration dataset, not permanent test fixtures. Future tests must arrange controlled data in an isolated environment and replace those references with fixture identities. A unique prefix alone does not isolate a blank search from unrelated records.
- Each implemented test must independently authenticate, select its state filter, establish its query and sort, and use page objects through the existing fixtures. Do not rely on a preceding test's session or data. Only remove records owned by that test during fixture teardown.
- Split compound exploration sequences into atomic tests: substring matching, case-insensitivity, no matches, whitespace normalization, each punctuation example, filter composition, query retention, and each keyboard action.
- P0: blank query, title-substring inclusion and exclusion, case-insensitivity, no results and recovery, Clear reset, specified normalization examples.
- P1: sort preservation with at least two matching rows, state-filter composition, cross-user access, and exclusion of owner-only/description-only matches.
- Pending clarification or additional exploration: unspecified punctuation equivalences, query retention on filter changes, Escape behavior, long queries, non-ASCII text, rapid edits, accessibility, and loading/error recovery. Do not promote observations into requirements without confirmation.

### 1. Board Search

**Seed:** `tests/seed.spec.ts`

#### 1.1. 1. Blank search shows all bugs for the active state filter

**File:** `tests/search-bug/blank-search-shows-all.spec.ts`

**Steps:**
  1. Spec sources read: specs/constitution.md; specs/product/vision.md; specs/design/theme.md; specs/engineering/tech-stack.md; specs/engineering/coding-standards.md; specs/engineering/development-process.md; specs/engineering/test-automation-patterns.md; specs/features/11-search-board.md (primary); specs/features/10-sort-board-columns.md (sort-preserved-during-search interaction); specs/features/13-bug-status.md (state-filter interaction); specs/testing/create-bug.md (plan format reference); specs/PROGRESS.md.
    - expect: All listed files were read successfully by fetching them through the Vite dev server's `/@fs/<absolute-path>` raw-file-serving feature via Playwright's APIRequestContext (no filesystem tool was available to this agent; file:// navigation is blocked by the MCP browser tool, and the code-execution sandbox has no Node `require`/`import`/`process`/`fs`). This is documented as a tooling workaround, not a product behavior.
  2. Repository/environment facts discovered (not guessed): App is running at http://localhost:5174/board (per user instruction; NOT the 5173 in playwright.config.ts baseURL/webServer — tests will need a config override or explicit full URLs to target 5174 if run against this instance). Backend API is reachable directly at http://localhost:3000/api/* (health, bugs) in addition to the proxied path on 5174. Test users (users.json, repo root, read via the same /@fs workaround): `buggy` / `1970beetle` and `vanny` / `1979bus`. Tech stack confirms a single shared SQLite file with no per-test isolation (specs/engineering/tech-stack.md) — global/absolute bug counts are NOT safe assumptions for any test.
  3. Existing page objects (tests/pages/, read via the same workaround): LoginPage.ts (usernameInput, passwordInput, loginButton, goto(), login(), loginWithFirstUser() which reads users.json directly), BoardPage.ts (newBugButton, searchInput [role=search, name='Search bugs by title'], clearSearchButton [role=button, name='Clear search'], bugsTable [table[aria-label="Bugs"]], goto(), clickNewBugButton(), searchByTitle(term) -> fill(), clearSearch(), getBugRowByTitle(title), clickBugByTitle(title), getBugCellByTitle(title), getNoResultsMessage() -> cell 'No bugs matched.'), CreateBugModal.ts, EditBugModal.ts. Fixtures (tests/fixtures/pages.ts) expose loginPage, boardPage, createBugModal, editBugModal — tests must import `test`/`expect` from `../fixtures/pages`, not `@playwright/test` directly, per specs/engineering/test-automation-patterns.md. No TitleBar.ts file exists (404) despite being mentioned in the patterns doc's example architecture — the search input and New Bug/Logout buttons are all part of BoardPage in the real app. No StateFilter.ts page object exists; no sort-header locators exist in BoardPage.ts either.
  4. Worktree status: no git/shell tool was exposed to this planning session, so `git status` could not be run directly; this is reported as a tooling limitation, not confirmed clean/dirty. specs/testing/board-search.md was confirmed NOT to already exist before this save (fetching it via the /@fs route returned the SPA's index.html fallback, i.e. 'file not found' from Vite's perspective), so this is a new file, not an overwrite of prior content.
  5. MCP exploration evidence — dataset observed via live UI (authenticated as buggy) and cross-checked read-only via GET http://localhost:3000/api/bugs (no mutation performed; same 3 bugs confirmed present before and after the entire exploration session): id 1 'test bug' / MID / owner buggy / state OPEN; id 17 'e2e video bug 1794300975479' / MID / owner buggy / state CLOSED; id 18 'e2e bug 1794300975523' / HIGH / owner buggy / state CLOSED. These are pre-existing seed/leftover-from-other-course-exercises rows, not created by this task.
    - expect: With the default state filter = Open (per specs/features/13-bug-status.md), only bug id 1 ('test bug') is visible on fresh load — the board shows exactly 1 row.
    - expect: Switching the state filter to Closed shows exactly 2 rows: id 18 'e2e bug 1794300975523' (HIGH) and id 17 'e2e video bug 1794300975479' (MID), in default Severity-descending order (HIGH before MID).
  6. Arrange: Log in as `buggy`; navigate to the board page; ensure the state filter is 'Open' (default) and the search field is blank.
    - expect: All bugs matching the current state filter are shown (here: the single 'test bug' row) and there is no 'No bugs matched.' message, matching specs/features/11-search-board.md Scenario 'Board shows all bugs when search field is blank'.

#### 1.2. 2. Typing a title substring filters the board to matching bugs only

**File:** `tests/search-bug/filters-by-title-substring.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board page with the Open state filter active (default) and search blank.
  2. Act: Type 'test' into the search field (boardPage.searchByTitle('test')).
    - expect: Observed live: exactly 1 row remains — id 1 'test bug' — and a 'Clear search' (×) button becomes visible next to the field, matching specs/features/11-search-board.md's design ('When not blank, an X appears...').
  3. Act: Replace the query with an uppercase variant 'TEST BUG' (boardPage.searchByTitle('TEST BUG')).
    - expect: Observed live: the same single row ('test bug') still matches — confirms case-insensitive matching, matching the spec's explicit rule 'case insensitive'.
  4. Act: Replace the query with a value containing no matching bug title, e.g. 'zzznotfound' (boardPage.searchByTitle('zzznotfound')).
    - expect: Observed live: the table body is replaced by a single row/cell reading exactly 'No bugs matched.' (boardPage.getNoResultsMessage()), and no bug rows are rendered — matches spec Scenario 'No results message when search matches no bugs'.

#### 1.3. 3. Clearing the search with the X control resets the board

**File:** `tests/search-bug/clear-search-resets-board.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board (Open filter, blank search); type 'zzznotfound' so the board shows 'No bugs matched.' and the Clear ('×') button becomes visible.
  2. Act: Click the Clear search button (boardPage.clearSearch()).
    - expect: Observed live: the search field becomes empty, the Clear button disappears, and the previously-hidden 'test bug' row reappears — matches spec Scenario 'Clearing the search with the X control resets the board'.

#### 1.4. 4. [Spec-required] Whitespace collapsing and punctuation normalization affect matching, not the raw field value

**File:** `tests/search-bug/whitespace-and-punctuation-normalization.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board (Open filter, blank search).
  2. Act: Type '  test    bug  ' (leading/trailing/multiple internal spaces) into the search field.
    - expect: Observed live via page.evaluate reading the raw input.value: the DOM input element's actual value attribute still contains the untouched raw string '  test    bug  ' — the field does NOT visibly trim/collapse as the user types. The matching logic, however, still correctly shows the 'test bug' row. CORRECTION TO SELF-CHECK: an earlier reading of the accessibility snapshot appeared to show a collapsed value ('test bug') for this same input; follow-up direct DOM inspection proved that was an artifact of how the accessibility-tree snapshot renders whitespace in text nodes, NOT a real normalization of the field's value. Testers must assert against the matching OUTCOME (visible rows), not against the displayed/snapshot text of the input, if verifying 'does not trim the field' as a behavior.
    - expect: This confirms the spec's 'collapse whitespace' rule applies to the MATCHING comparison, and is consistent with (but does not prove the exact mechanism of) the acceptance criterion 'Search matching is case insensitive and normalizes whitespace and punctuation'.
  3. Act: Replace the query with 'test-bug' (a hyphen where the title has a space).
    - expect: Observed live: 'test bug' row still matches. This is consistent with the spec's 'normalize punctuation' rule and its own example (query 'login' matches title 'Issue with log-in'), but the EXACT normalization algorithm (e.g., whether punctuation is stripped to nothing vs. converted to a space, whether it happens on one or both sides) is NOT specified in specs/features/11-search-board.md and was not independently verified beyond this single example. Do not assert a specific internal algorithm; assert only the documented example-level outcomes.
  4. Act: Replace the query with 'test!!bug??' (multiple different punctuation characters).
    - expect: Observed live: 'test bug' row still matches — further supports (without fully proving) that punctuation characters are normalized/ignored during matching, per spec.
  5. Unverified/out of scope for this exploration (flag for future test authors): titles in the current live dataset contain NO punctuation characters ('test bug', 'e2e bug ...', 'e2e video bug ...'), so punctuation normalization on the TITLE side (as opposed to the query side) was not directly observed and remains unverified against real data. A dedicated fixture bug with a punctuated title (e.g. 'Issue with log-in', matching the spec's own example) is required to verify this symmetrically — see Fixture Requirements.

#### 1.5. 5. [Spec-required] Sorting is preserved while searching

**File:** `tests/search-bug/sort-preserved-during-search.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board; switch the state filter to Closed (so 2 bugs are visible: id 18 'e2e bug 1794300975523' HIGH, id 17 'e2e video bug 1794300975479' MID).
  2. Act: Click the Title column header once.
    - expect: Observed live: Title header shows an ascending arrow (↑); rows reorder to 'e2e bug 1794300975523' (id 18) then 'e2e video bug 1794300975479' (id 17), i.e. alphabetical ascending by title.
  3. Act: Type 'video' into the search field.
    - expect: Observed live: exactly 1 row remains ('e2e video bug 1794300975479', id 17) and the Title column header STILL shows the ascending arrow (↑) — matches spec Scenario 'Sorting is preserved when searching'.
  4. Note for implementers: BoardPage.ts currently has no locators/methods for column headers or sort-indicator state. A getColumnHeaderButton(name) and getSortIndicator(name) (or similar) must be added to BoardPage.ts (or a new SortableHeader/BugsTable helper) before this scenario can be automated; see Page Object Gaps.

#### 1.6. 6. [Spec-required] Search combines correctly with the Open/Closed state filter

**File:** `tests/search-bug/search-combines-with-state-filter.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board; switch the state filter to Closed.
  2. Act: Type 'bug' into the search field (a substring that also appears in the Open-state bug's title 'test bug').
    - expect: Observed live: exactly the 2 Closed bugs are shown ('e2e bug 1794300975523', 'e2e video bug 1794300975479'); the Open bug 'test bug' — which also contains the substring 'bug' — is correctly NOT shown, proving state filter and search are ANDed together, matching specs/features/13-bug-status.md Scenario 'Search and state filter apply together'.
  3. Arrange the separate query-retention check independently: select Closed and replace the query with 'video'; verify the matching Closed video bug. Then switch to Open without clearing the query.
    - expect: Observed live: the search text remains 'video' and the board displays 'No bugs matched.' Query retention is an observation pending product confirmation, not a release-gating requirement. Investigate an unexplained change rather than automatically accepting it as intentional.

#### 1.7. 7. [Observed-but-unspecified, P2] Keyboard/no-op interactions with the search field

**File:** `tests/search-bug/keyboard-noop-interactions.spec.ts`

**Steps:**
  1. Arrange: Log in as `buggy`; navigate to the board; explicitly select Closed; type 'video' into the search field (the Closed video bug is the expected result in the exploration dataset).
  2. Act: Press Escape while the search field has focus.
    - expect: Observed live: the search field's text is NOT cleared and the filtered result is unchanged. specs/design/theme.md defines Escape's cancel-like behavior only for MODALS; it says nothing about the search field, so this is an observed no-op, not a documented requirement. If a future spec extends Escape-to-clear to the search field, this test's expectation would need deliberate updating — do not treat this current no-op as an immutable guarantee.
  3. Act: Press Enter while the search field has focus and a non-empty query is present.
    - expect: Observed live: no page navigation/reload occurs and the URL remains /board; the filtered result set is unchanged — the search input does not behave as a submitting form control. This is consistent with (but not explicitly asserted by) the 'Filtering happens as the user types' design note, implying no explicit submit step should ever be required.

#### 1.8. 8. [Spec-adjacent] Any authenticated user can search the shared bug list regardless of bug ownership

**File:** `tests/search-bug/any-user-can-search-shared-bugs.spec.ts`

**Steps:**
  1. Arrange independently: start a fresh browser context and log in as the second seeded user `vanny` using the existing login page object and credentials fixture.
  2. Act: Observe the board as `vanny` (Open filter, blank search).
    - expect: Observed live: `vanny` sees the SAME bug ('test bug', owned by 'buggy') as `buggy` did — consistent with specs/product/vision.md's user model: 'A user has full access to all bugs created in the app (no per-bug or per-project permissions in this version).'
  3. Act: As `vanny`, type 'test' into the search field.
    - expect: Observed live: search filters identically for `vanny` as it did for `buggy` (same single matching row) — confirms search is not scoped/restricted per-user or per-owner. This is an important NEGATIVE-space confirmation: search is NOT filtered to 'my bugs', only to title text, consistent with the Out-of-Scope list in specs/features/11-search-board.md ('Search by owner' is out of scope, implying owner plays no role in the search predicate at all).

#### 1.9. 9. [Unverified proposal — requires isolated fixture data] Exact-result-set assertions for substring vs. exact vs. no-match queries

**File:** `tests/search-bug/exact-result-sets-with-fixture-data.spec.ts`

**Steps:**
  1. NOT exercised against the live shared dataset in this exploration, because the only pre-existing titles ('test bug', 'e2e bug <ts>', 'e2e video bug <ts>') do not provide enough controlled variety (no punctuation in titles, no near-duplicate/partial-overlap titles designed to probe exact boundaries, no titles differing only by owner/description to rule out Out-of-Scope fields affecting results) to assert precise, collision-proof result sets without risk of coincidental matches against whatever other rows a shared SQLite database may contain at test-run time (per specs/engineering/tech-stack.md: single shared SQLite file, no per-test isolation).
  2. FUTURE FIXTURE REQUIREMENT (not created by this task): a dedicated, uniquely-prefixed set of bugs should be created (via UI, in a `beforeEach`/fixture, each with a timestamp- or random-suffixed unique prefix such as `[search-fixture-${runId}]`) and deleted in an `afterEach`/fixture teardown, covering at minimum: (a) a title with punctuation, e.g. '[search-fixture-X] Issue with log-in', to test title-side punctuation normalization (not observable with current live data); (b) a title with multiple internal spaces/tabs to test title-side whitespace collapsing; (c) two titles sharing a common substring but differing in a way that must NOT both match a more specific query, to assert a precise two-vs-one result set rather than 'any row matched'; (d) one Closed and one Open bug with otherwise-identical titles, to combine with scenario 6 above using controlled data instead of incidental pre-existing rows.
  3. Until such a fixture exists, all 'exact result set' assertions in scenarios 1–6 above intentionally reference bugs by their FULL, uniquely-identifying title strings (including embedded timestamps, e.g. 'e2e bug 1794300975523') rather than by row count alone, and intentionally select queries that are unlikely to coincidentally match unrelated rows a shared database might contain. Future implementers must preserve this discipline: NEVER assert 'N rows total' or 'any row visible' as a substitute for asserting the specific expected title(s) are present and specific unexpected title(s) are absent.

#### 1.10. 10. Discrepancies, blocked coverage, and tooling limitations summary

**File:** `tests/search-bug/_NOTES-not-a-real-test.md`

**Steps:**
  1. Blocked coverage: performance under rapid typing ('Filtering happens as the user types, but performance should not be impacted') was not measurably tested — only functional correctness of incremental query edits was observed (see scenario 7's sibling exploration where pressSequentially('video') after a non-empty field produced a concatenated 'videobug' query due to cursor position, which is an artifact of the exploration technique, not a product defect — testers should always re-establish a known cursor/selection state, e.g. via fill() or Ctrl+A, before pressSequentially edits in real tests).
  2. Blocked coverage: keyboard Tab-order/focus-management through the search field and Clear button was not exercised (time/scope-boxed); flag as an unverified proposal for accessibility-focused follow-up testing.
  3. Tooling limitation: this planning session had no filesystem-read tool, no shell/git tool, and file:// navigation was blocked by the MCP browser tool; all spec/user/page-object file reads were accomplished only via a workaround (fetching files through the already-running Vite dev server's `/@fs/<absolute-path>` static-file passthrough using Playwright's APIRequestContext from within browser_run_code_unsafe). This means `git status` could not be inspected directly as requested; the absence of a pre-existing specs/testing/board-search.md was confirmed by HTTP-fetching that path and observing Vite's SPA-fallback (index.html) response rather than file content.
  4. Tooling limitation: login credentials were not supplied to this agent in advance; they were discovered by using the same /@fs workaround to read users.json directly (buggy/1970beetle, vanny/1979bus), confirmed authentic by successfully completing a real UI login (POST /api/login returned 200 and the app navigated to /board), not merely by reading the file.
  5. No Create Bug modal was left open at any point during this session (confirmed via browser_snapshot immediately after each navigation/login); no cancellation action was therefore necessary. No bugs were created, edited, or deleted at any point in this task — verified via a before/after GET http://localhost:3000/api/bugs comparison showing identical data (ids 1, 17, 18, same titles/severities/owners/states) before and after the entire exploration session.
