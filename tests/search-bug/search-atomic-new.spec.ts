import { randomUUID } from 'node:crypto';
import { test as base, expect } from '../fixtures/pages';

const bugData = [
  { title: 'Login page crashes on empty password', severity: 'HIGH', description: 'App crashes when submitting an empty password on login.' },
  { title: 'Login page redirect fails after auth', severity: 'MID', description: 'User is not redirected to board after successful login.' },
  { title: 'Login page error message not shown', severity: 'LOW', description: 'No error message appears for invalid credentials.' },
  { title: 'Login page enter key stops working', severity: 'MID', description: 'Enter key does not submit the login form.' },
  { title: 'Board page fails to load', severity: 'HIGH', description: 'The bug board is empty even when bugs exist in the database.' },
  { title: 'Search field disappears on page resize', severity: 'LOW', description: 'The search input is not visible after resizing the window.' },
  { title: 'Severity dropdown missing on create page', severity: 'MID', description: 'The severity dropdown does not render in the create bug modal.' },
  { title: 'Create page modal does not close on cancel', severity: 'LOW', description: 'The create bug modal stays open after clicking Cancel.' },
  { title: 'Title bar logo missing on page load', severity: 'LOW', description: 'The logo image does not appear in the title bar.' },
  { title: 'Sort resets on page refresh', severity: 'MID', description: 'Sorting order is lost when the page is refreshed.' },
];

const test = base.extend<{ searchBugs: typeof bugData }>({
  searchBugs: async ({ request, loginPage, boardPage }, use) => {
    const suffix = randomUUID();
    const bugs = bugData.map(bug => ({ ...bug, title: `${bug.title} [${suffix}]` }));
    const createdBugIds: number[] = [];

    await loginPage.loginWithFirstUser();

    try {
      for (const bug of bugs) {
        const response = await request.post('/api/bugs', {
          data: { ...bug, owner: 'buggy' },
        });
        await expect(response).toBeOK();
        const body = await response.json();
        if (!Number.isInteger(body.id)) {
          throw new Error('Bug creation response must include an integer id');
        }
        createdBugIds.push(body.id);
      }

      await boardPage.goto();
      await use(bugs);
    } finally {
      for (const id of createdBugIds) {
        const response = await request.delete(`/api/bugs/${id}`);
        await expect.soft(response).toBeOK();
      }
    }
  },
});

test.describe('Atomic board search', () => {
  test('shows all matching bugs for a broad title query', async ({ boardPage, searchBugs }) => {
    await boardPage.searchByTitle('page');

    for (const bug of searchBugs) {
      await expect(await boardPage.getBugCellByTitle(bug.title)).toBeVisible();
    }
  });

  test('shows matching titles and hides nonmatching titles', async ({ boardPage, searchBugs }) => {
    await boardPage.searchByTitle('login');

    for (const bug of searchBugs) {
      const cell = await boardPage.getBugCellByTitle(bug.title);
      if (bug.title.startsWith('Login')) {
        await expect(cell).toBeVisible();
      } else {
        await expect(cell).not.toBeVisible();
      }
    }
  });

  test('shows the no-results message when no title matches', async ({ boardPage, searchBugs }) => {
    await boardPage.searchByTitle(`xyzzy-${randomUUID()}`);

    await expect(await boardPage.getNoResultsMessage()).toBeVisible();
    for (const bug of searchBugs) {
      await expect(await boardPage.getBugCellByTitle(bug.title)).not.toBeVisible();
    }
  });

  test('clearing a search restores the bugs hidden by that search', async ({ boardPage, searchBugs }) => {
    await boardPage.searchByTitle('login');
    const hiddenBug = searchBugs.find(bug => bug.title.startsWith('Board'));
    if (!hiddenBug) {
      throw new Error('Search fixture must include a non-login bug');
    }
    await expect(await boardPage.getBugCellByTitle(hiddenBug.title)).not.toBeVisible();

    await boardPage.clearSearch();

    await expect(boardPage.searchInput).toHaveValue('');
    await expect(boardPage.clearSearchButton).not.toBeVisible();
    for (const bug of searchBugs) {
      await expect(await boardPage.getBugCellByTitle(bug.title)).toBeVisible();
    }
  });
});
