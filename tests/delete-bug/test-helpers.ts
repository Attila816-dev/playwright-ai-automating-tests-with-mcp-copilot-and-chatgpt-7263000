import { APIRequestContext, expect } from '@playwright/test';
import { BoardPage } from '../pages/BoardPage';
import { CreateBugModal } from '../pages/CreateBugModal';

interface BugRecord {
  id: number;
  title: string;
}

export async function createBug(
  title: string,
  boardPage: BoardPage,
  createBugModal: CreateBugModal,
): Promise<number> {
  await boardPage.clickNewBugButton();
  await expect(createBugModal.dialog).toBeVisible();
  await createBugModal.fillBugForm({
    title,
    severity: 'mid',
    description: 'created by test',
  });
  await createBugModal.submit();

  const row = await boardPage.getBugRowByTitle(title);
  await expect(row).toBeVisible();
  const id = Number(await row.getByRole('cell').first().innerText());
  if (!Number.isSafeInteger(id)) {
    throw new Error(`Could not read the ID of created bug "${title}".`);
  }
  return id;
}

export async function deleteBugIfExists(
  request: APIRequestContext,
  title: string | undefined,
) {
  if (!title) return;

  const listResponse = await request.get('/api/bugs');
  if (listResponse.status() !== 200) {
    throw new Error(`Could not list bugs for cleanup: ${listResponse.status()}.`);
  }

  const bugs = (await listResponse.json()) as BugRecord[];
  const testBugs = bugs.filter((bug) => bug.title === title);

  for (const bug of testBugs) {
    const deleteResponse = await request.delete(`/api/bugs/${bug.id}`);
    if (deleteResponse.status() !== 204 && deleteResponse.status() !== 404) {
      throw new Error(
        `Could not clean up test bug "${title}" (ID ${bug.id}): ${deleteResponse.status()}.`,
      );
    }
  }
}
