import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { test, expect } from '../fixtures/recorded-pages';
import { cleanupCreatedBug } from './test-helpers';

let createdBugTitle: string | undefined;
let createdBugId: number | undefined;

test.afterEach(async ({ request }) => {
  await cleanupCreatedBug(request, createdBugTitle, createdBugId);
  createdBugTitle = undefined;
  createdBugId = undefined;
});

test('create a bug then edit it to Closed and record a video', async ({ recordedPages }) => {
  const { loginPage, boardPage, createBugModal, editBugModal } = recordedPages;
  await loginPage.loginWithFirstUser();
  await boardPage.clickNewBugButton();

  const title = `e2e video bug ${randomUUID()}`;
  createdBugTitle = title;
  await createBugModal.fillBugForm({
    title,
    severity: 'mid',
    owner: 'buggy',
    description: 'Created by automated video test',
  });
  await createBugModal.submit();

  await expect(await boardPage.getBugRowByTitle(title)).toBeVisible();
  createdBugId = await boardPage.getBugIdByTitle(title);
  await boardPage.clickBugByTitle(title);
  await expect(editBugModal.dialog).toBeVisible();
  await editBugModal.stateSelect.selectOption('closed');
  await editBugModal.save();
  await boardPage.selectStateFilter('Closed');

  const videoPath = await recordedPages.finishRecording();
  expect(existsSync(videoPath)).toBe(true);
});
