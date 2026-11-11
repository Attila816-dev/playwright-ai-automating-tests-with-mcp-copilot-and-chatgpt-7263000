import { test, expect } from '../fixtures/pages';
import { cleanupFreshBug, createFreshBug, makeUniqueBugTitle } from './test-helpers';

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

test('Save is disabled when no fields have changed', async ({ boardPage, editBugModal }) => {
  if (!bugTitle) throw new Error('Fresh bug setup did not complete.');

  await boardPage.clickBugByTitle(bugTitle);

  await expect(editBugModal.saveButton).toBeDisabled();
});
