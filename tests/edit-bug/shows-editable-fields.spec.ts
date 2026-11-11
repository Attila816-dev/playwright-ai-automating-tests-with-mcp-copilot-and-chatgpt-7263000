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

test('ID is read-only and the other bug fields are editable', async ({ boardPage, editBugModal }) => {
  if (!bugTitle) throw new Error('Fresh bug setup did not complete.');

  await boardPage.clickBugByTitle(bugTitle);

  await expect(editBugModal.idInput).toHaveAttribute('readonly', '');
  await expect(editBugModal.titleInput).toBeEditable();
  await expect(editBugModal.severitySelect).toBeEditable();
  await expect(editBugModal.ownerInput).toBeEditable();
  await expect(editBugModal.descriptionInput).toBeEditable();
  await expect(editBugModal.severityOptions).toHaveText(['HIGH', 'MID', 'LOW']);
  await expect(editBugModal.severitySelect).toHaveValue('mid');

  const dropdownColors = await editBugModal.getSeverityColors();
  const badgeColors = await boardPage.getSeverityBadgeColorsByTitle(bugTitle);
  expect(dropdownColors).toEqual(badgeColors);
});
