import { test, expect } from '../fixtures/pages';
import { cleanupFreshBug, createFreshBug, getBugById, makeUniqueBugTitle } from './test-helpers';

let bugTitle: string | undefined;
let bugId: number | undefined;

test.beforeEach(async ({ loginPage, boardPage, createBugModal }, testInfo) => {
  bugTitle = makeUniqueBugTitle(testInfo);
  await loginPage.loginWithFirstUser();
  const bug = await createFreshBug(bugTitle, boardPage, createBugModal);
  bugId = bug.id;
});

test.afterEach(async ({ request }) => {
  await cleanupFreshBug(request, bugTitle, bugId);
});

test('Escape discards unsaved edits', async ({ boardPage, editBugModal, request }) => {
  if (!bugTitle || bugId === undefined) throw new Error('Fresh bug setup did not complete.');
  const originalTitle = bugTitle;

  await boardPage.clickBugByTitle(originalTitle);
  await editBugModal.titleInput.fill(`${originalTitle}-unsaved`);
  await editBugModal.pressEscape();

  await expect(editBugModal.dialog).toBeHidden();
  await expect(await boardPage.getBugRowByTitle(originalTitle)).toBeVisible();
  expect(await getBugById(request, bugId)).toMatchObject({ title: originalTitle });
});
