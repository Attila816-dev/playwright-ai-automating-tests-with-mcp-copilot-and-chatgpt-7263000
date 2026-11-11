import { expect, type APIRequestContext, type TestInfo } from '@playwright/test';
import type { BoardPage } from '../pages/BoardPage';
import type { CreateBugModal } from '../pages/CreateBugModal';

export interface EditBugTestData {
  id: number;
  title: string;
  severity: string;
  owner: string;
  description: string;
  state: string;
}

interface BugListItem {
  id: number;
  title: string;
}

export function makeUniqueBugTitle(testInfo: TestInfo): string {
  const testId = testInfo.testId.replace(/[^a-z0-9]/gi, '-');
  return `edit-test-${testInfo.workerIndex}-${Date.now()}-${testId}-${Math.random().toString(36).slice(2)}`;
}

export async function createFreshBug(
  title: string,
  boardPage: BoardPage,
  createBugModal: CreateBugModal,
): Promise<EditBugTestData> {
  const bug = {
    title,
    severity: 'mid',
    owner: 'edit-test-owner',
    description: 'Initial edit-bug test description',
  };

  await boardPage.clickNewBugButton();
  await expect(createBugModal.dialog).toBeVisible();
  await createBugModal.fillBugForm(bug);
  await createBugModal.submit();

  const row = await boardPage.getBugRowByTitle(title);
  await expect(row).toBeVisible();
  const id = await boardPage.getBugIdByTitle(title);

  return { ...bug, id, severity: 'MID', state: 'OPEN' };
}

export async function getBugById(
  request: APIRequestContext,
  id: number,
): Promise<EditBugTestData> {
  const response = await request.get(`/api/bugs/${id}`);
  if (response.status() !== 200) {
    throw new Error(`Could not read bug ${id}: HTTP ${response.status()}.`);
  }
  return (await response.json()) as EditBugTestData;
}

export async function cleanupFreshBug(
  request: APIRequestContext,
  title: string | undefined,
  id: number | undefined,
): Promise<void> {
  const bugIds: number[] = [];

  if (id !== undefined) {
    bugIds.push(id);
  } else if (title) {
    const response = await request.get('/api/bugs');
    if (response.status() !== 200) {
      throw new Error(`Could not list bugs for cleanup: HTTP ${response.status()}.`);
    }

    const bugs = (await response.json()) as BugListItem[];
    bugIds.push(...bugs.filter((bug) => bug.title === title).map((bug) => bug.id));
  }

  for (const bugId of bugIds) {
    const response = await request.delete(`/api/bugs/${bugId}`);
    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(`Could not clean up test bug ${bugId}: HTTP ${response.status()}.`);
    }
  }
}
