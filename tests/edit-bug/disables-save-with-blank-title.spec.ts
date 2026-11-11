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

test('Save is disabled when the title is blank', async ({ boardPage, editBugModal, request }) => {
  if (!bugTitle || bugId === undefined) throw new Error('Fresh bug setup did not complete.');

  await boardPage.clickBugByTitle(bugTitle);
  await editBugModal.titleInput.fill('');

  await expect(editBugModal.saveButton).toBeDisabled();
  expect(await getBugById(request, bugId)).toMatchObject({ title: bugTitle });
});
