// spec: specs/testing/board-search.md
// seed: tests/seed.spec.ts
import { randomUUID } from 'node:crypto';
import { test as base, expect } from '../fixtures/pages';

type BugInput = {
  title: string;
  severity?: 'HIGH' | 'MID' | 'LOW';
  owner?: string;
  description?: string;
  state?: 'OPEN' | 'CLOSED';
};

type SearchData = {
  token: string;
  createBug: (input: BugInput) => Promise<string>;
};

const test = base.extend<{ searchData: SearchData }>({
  searchData: async ({ request, page, loginPage }, use) => {
    const token = randomUUID().replaceAll('-', '');
    const ids: number[] = [];

    await loginPage.loginWithFirstUser();

    // Keep real API records, but isolate this browser's list from shared/parallel data.
    await page.route('**/api/bugs', async route => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const response = await route.fetch();
      await expect(response).toBeOK();
      const body: unknown = await response.json();
      if (!Array.isArray(body)) {
        throw new Error('Bug list response must be an array');
      }
      const bugs = body.filter((bug: unknown) =>
        typeof bug === 'object' && bug !== null && 'id' in bug &&
        typeof bug.id === 'number' && ids.includes(bug.id));
      await route.fulfill({ response, json: bugs });
    });

    try {
      await use({
        token,
        createBug: async ({ state = 'OPEN', ...input }) => {
          const title = `${input.title} [${token}]`;
          const data = { severity: 'MID', owner: 'buggy', description: 'Search fixture', ...input, title };
          const response = await request.post('/api/bugs', { data });
          await expect(response).toBeOK();
          const body: unknown = await response.json();
          if (typeof body !== 'object' || body === null || !('id' in body) ||
              typeof body.id !== 'number' || !Number.isInteger(body.id)) {
            throw new Error('Bug creation response must include an integer id');
          }
          ids.push(body.id);
          if (state === 'CLOSED') {
            const update = await request.put(`/api/bugs/${body.id}`, { data: { ...data, state } });
            await expect(update).toBeOK();
          }
          return title;
        },
      });
    } finally {
      for (const id of ids) {
        const response = await request.delete(`/api/bugs/${id}`);
        await expect.soft(response).toBeOK();
      }
    }
  },
});

test.describe('Board Search', () => {
  test('blank search shows every Open bug and excludes Closed bugs', async ({ boardPage, searchData }) => {
    const high = await searchData.createBug({ title: 'First issue', severity: 'HIGH' });
    const low = await searchData.createBug({ title: 'Second issue', severity: 'LOW' });
    await searchData.createBug({ title: 'Resolved issue', state: 'CLOSED' });

    await boardPage.goto();

    await expect(boardPage.searchInput).toHaveValue('');
    await expect(boardPage.bugTitleCells).toHaveText([high, low]);
    await expect(await boardPage.getNoResultsMessage()).not.toBeVisible();
  });

  test('substring search includes matching titles and excludes nonmatching titles', async ({ boardPage, searchData }) => {
    const first = await searchData.createBug({ title: 'Login fails', severity: 'HIGH' });
    const second = await searchData.createBug({ title: 'Login redirect fails', severity: 'LOW' });
    await searchData.createBug({ title: 'Board display fails' });
    await boardPage.goto();

    await boardPage.searchByTitle('login');

    await expect(boardPage.bugTitleCells).toHaveText([first, second]);
  });

  test('search matches titles regardless of case', async ({ boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'MiXeD CaSe issue' });
    await boardPage.goto();

    await boardPage.searchByTitle('MIXED CASE');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  test('unmatched search shows a message and no bug rows', async ({ boardPage, searchData }) => {
    await searchData.createBug({ title: 'Existing issue' });
    await boardPage.goto();

    await boardPage.searchByTitle(`no-match-${randomUUID()}`);

    await expect(await boardPage.getNoResultsMessage()).toBeVisible();
    await expect(boardPage.bugTitleCells).toHaveCount(0);
  });

  test('Clear resets the query and restores the complete Open result set', async ({ boardPage, searchData }) => {
    const high = await searchData.createBug({ title: 'First issue', severity: 'HIGH' });
    const low = await searchData.createBug({ title: 'Second issue', severity: 'LOW' });
    await boardPage.goto();
    await boardPage.searchByTitle('no-match');
    await expect(await boardPage.getNoResultsMessage()).toBeVisible();

    await boardPage.clearSearch();

    await expect(boardPage.searchInput).toHaveValue('');
    await expect(boardPage.clearSearchButton).not.toBeVisible();
    await expect(boardPage.bugTitleCells).toHaveText([high, low]);
    await expect(await boardPage.getNoResultsMessage()).not.toBeVisible();
  });

  test('search collapses query whitespace', async ({ boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'Search whitespace issue' });
    await boardPage.goto();

    await boardPage.searchByTitle('  Search    whitespace   issue  ');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  test('search collapses whitespace in titles', async ({ boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'Search    whitespace   issue' });
    await boardPage.goto();

    await boardPage.searchByTitle('Search whitespace issue');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  test('search normalizes punctuation in the query', async ({ boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'Search punctuation issue' });
    await boardPage.goto();

    await boardPage.searchByTitle('Search-punctuation-issue');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  test('login matches the specified punctuated title log-in', async ({ boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'Issue with log-in' });
    await boardPage.goto();

    test.fail(true, 'Known spec discrepancy: login does not currently match log-in (11-search-board.md).');
    await boardPage.searchByTitle('login');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  test('search preserves Title ascending order and its indicator', async ({ boardPage, searchData }) => {
    const banana = await searchData.createBug({ title: 'Widget Banana', severity: 'HIGH' });
    const apple = await searchData.createBug({ title: 'Widget Apple', severity: 'LOW' });
    await searchData.createBug({ title: 'Unrelated issue' });
    await boardPage.goto();
    await boardPage.clickColumnHeader('Title');
    await expect(boardPage.getColumnHeader('Title')).toContainText('↑');

    await boardPage.searchByTitle('widget');

    await expect(boardPage.bugTitleCells).toHaveText([apple, banana]);
    await expect(boardPage.getColumnHeader('Title')).toContainText('↑');
  });

  test('search and Closed filter both constrain results', async ({ boardPage, searchData }) => {
    await searchData.createBug({ title: 'Widget Open' });
    const closed = await searchData.createBug({ title: 'Widget Closed', state: 'CLOSED' });
    await searchData.createBug({ title: 'Unrelated Closed', state: 'CLOSED' });
    await boardPage.goto();
    await boardPage.selectStateFilter('Closed');

    await boardPage.searchByTitle('widget');

    await expect(boardPage.bugTitleCells).toHaveText([closed]);
  });

  test('another authenticated user can search bugs owned by buggy', async ({ loginPage, boardPage, searchData }) => {
    const title = await searchData.createBug({ title: 'Shared issue', owner: 'buggy' });
    await boardPage.goto();
    await boardPage.logout();
    await loginPage.login('vanny', '1979bus');

    await boardPage.searchByTitle('shared');

    await expect(boardPage.bugTitleCells).toHaveText([title]);
  });

  for (const field of ['owner', 'description'] as const) {
    test(`search ignores matches found only in ${field}`, async ({ boardPage, searchData }) => {
      const keyword = `keyword${searchData.token}`;
      await searchData.createBug({ title: 'Generic title', [field]: keyword });
      await boardPage.goto();

      await boardPage.searchByTitle(keyword);

      await expect(await boardPage.getNoResultsMessage()).toBeVisible();
      await expect(boardPage.bugTitleCells).toHaveCount(0);
    });
  }
});
