import { test, expect } from '../fixtures/pages';
import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { cleanupCreatedBug } from './test-helpers';

let createdBugTitle: string | undefined;
let createdBugId: number | undefined;

test.afterEach(async ({ request }) => {
  await cleanupCreatedBug(request, createdBugTitle, createdBugId);
  createdBugTitle = undefined;
  createdBugId = undefined;
});

test('create a bug then edit it to Closed and capture screenshots', async ({
  page,
  loginPage,
  boardPage,
  createBugModal,
  editBugModal,
}, testInfo) => {
  const screenshotsDir = testInfo.outputPath('playwright-screenshots');
  mkdirSync(screenshotsDir, { recursive: true });

  await loginPage.loginWithFirstUser();
  await page.screenshot({ path: join(screenshotsDir, '01-logged-in.png'), fullPage: true });

  await boardPage.clickNewBugButton();
  await page.screenshot({ path: join(screenshotsDir, '02-create-modal-open.png') });

  const title = `e2e bug ${randomUUID()}`;
  createdBugTitle = title;
  await createBugModal.fillBugForm({
    title,
    severity: 'high',
    owner: 'buggy',
    description: 'Created by automated test',
  });
  await page.screenshot({ path: join(screenshotsDir, '03-create-filled.png') });
  await createBugModal.submit();

  const row = await boardPage.getBugRowByTitle(title);
  await expect(row).toBeVisible();
  createdBugId = await boardPage.getBugIdByTitle(title);
  await page.screenshot({ path: join(screenshotsDir, '04-bug-created.png'), fullPage: true });

  await boardPage.clickBugByTitle(title);
  await expect(editBugModal.dialog).toBeVisible();
  await page.screenshot({ path: join(screenshotsDir, '05-edit-modal-open.png') });

  await editBugModal.stateSelect.selectOption('closed');
  await page.screenshot({ path: join(screenshotsDir, '06-state-set-to-closed.png') });

  await editBugModal.save();

  await boardPage.selectStateFilter('Closed');
  const closedRow = await boardPage.getBugRowByTitle(title);
  await expect(closedRow).toBeVisible();
  await page.screenshot({ path: join(screenshotsDir, '07-bug-closed-in-board.png'), fullPage: true });
});
