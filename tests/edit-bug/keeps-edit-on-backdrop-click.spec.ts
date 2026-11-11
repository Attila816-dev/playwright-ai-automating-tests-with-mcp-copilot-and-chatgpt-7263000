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

test('backdrop clicks preserve the open edit and unsaved value', async ({ boardPage, editBugModal, request }) => {
  if (!bugTitle || bugId === undefined) throw new Error('Fresh bug setup did not complete.');
  const unsavedTitle = `${bugTitle}-unsaved`;

  await boardPage.clickBugByTitle(bugTitle);
  await editBugModal.titleInput.fill(unsavedTitle);
  await editBugModal.clickBackdrop();

  await expect(editBugModal.dialog).toBeVisible();
  await expect(editBugModal.titleInput).toHaveValue(unsavedTitle);
  expect(await getBugById(request, bugId)).toMatchObject({ title: bugTitle });
});
