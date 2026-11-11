import { type APIRequestContext } from '@playwright/test';

interface BugListItem {
  id: number;
  title: string;
}

export async function cleanupCreatedBug(
  request: APIRequestContext,
  title: string | undefined,
  id: number | undefined,
): Promise<void> {
  if (!title) {
    return;
  }

  let bugIds = id === undefined ? [] : [id];
  if (id === undefined) {
    const response = await request.get('/api/bugs');
    if (response.status() !== 200) {
      throw new Error(`Could not list bugs for cleanup: HTTP ${response.status()}.`);
    }

    const bugs = (await response.json()) as BugListItem[];
    bugIds = bugs.filter((bug) => bug.title === title).map((bug) => bug.id);
  }

  for (const bugId of bugIds) {
    const response = await request.delete(`/api/bugs/${bugId}`);
    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(`Could not clean up test bug ${bugId}: HTTP ${response.status()}.`);
    }
  }
}
