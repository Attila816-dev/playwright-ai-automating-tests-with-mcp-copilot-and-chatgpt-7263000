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

test('opening a fresh bug shows its ID and field values', async ({ boardPage, editBugModal }) => {
  if (!bugTitle || bugId === undefined) throw new Error('Fresh bug setup did not complete.');

  const row = await boardPage.getBugRowByTitle(bugTitle);
  await expect(row).toBeVisible();
  await boardPage.clickBugByTitle(bugTitle);

  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.heading).toHaveText(`Edit bug #${bugId}`);
  await expect(editBugModal.idInput).toHaveValue(String(bugId));
  await expect(editBugModal.titleInput).toHaveValue(bugTitle);
  await expect(editBugModal.severitySelect).toHaveValue('mid');
  await expect(editBugModal.ownerInput).toHaveValue('edit-test-owner');
  await expect(editBugModal.descriptionInput).toHaveValue('Initial edit-bug test description');
});
