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

test('saving edits persists all changed fields', async ({ boardPage, editBugModal, request }) => {
  if (!bugTitle || bugId === undefined) throw new Error('Fresh bug setup did not complete.');
  const updatedTitle = `${bugTitle}-updated`;

  await boardPage.clickBugByTitle(bugTitle);
  await editBugModal.titleInput.fill(updatedTitle);
  await editBugModal.severitySelect.selectOption('high');
  await editBugModal.ownerInput.fill('updated-edit-owner');
  await editBugModal.descriptionInput.fill('Updated edit-bug test description');
  await editBugModal.save();

  await expect(editBugModal.dialog).toBeHidden();
  const updatedRow = await boardPage.getBugRowByTitle(updatedTitle);
  await expect(updatedRow).toBeVisible();
  await expect(await boardPage.getBugSeverityCellByTitle(updatedTitle)).toHaveText('HIGH');
  await expect(await boardPage.getBugOwnerCellByTitle(updatedTitle)).toHaveText('updated-edit-owner');

  const savedBug = await getBugById(request, bugId);
  expect(savedBug).toMatchObject({
    id: bugId,
    title: updatedTitle,
    severity: 'HIGH',
    owner: 'updated-edit-owner',
    description: 'Updated edit-bug test description',
    state: 'OPEN',
  });
});
