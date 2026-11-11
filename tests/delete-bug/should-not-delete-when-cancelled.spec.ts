import { test, expect } from '../fixtures/pages';
import { createBug, deleteBugIfExists } from './test-helpers';

test.describe('Delete Bug - cancel confirmation', () => {
  let title: string | undefined;
  let bugId: number;

  test.beforeEach(async ({ loginPage, boardPage, createBugModal }, testInfo) => {
    await loginPage.loginWithFirstUser();
    title = `delete-bug-${Date.now()}-${testInfo.workerIndex}-${Math.random().toString(36).slice(2)}`;
    bugId = await createBug(title, boardPage, createBugModal);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugIfExists(request, title);
  });

  test('canceling confirmation keeps the fresh bug', async ({ boardPage, editBugModal, request }) => {
    if (!title) throw new Error('Test bug title was not initialized.');

    // Arrange
    const row = await boardPage.getBugRowByTitle(title);
    await expect(row).toBeVisible();

    // Act
    await boardPage.clickBugByTitle(title);
    await expect(editBugModal.dialog).toBeVisible();
    await editBugModal.openDeleteConfirmation();
    await expect(editBugModal.confirmationDialog).toBeVisible();
    await editBugModal.cancelDeleteConfirmation();

    // Assert
    await expect(editBugModal.confirmationDialog).toBeHidden();
    await expect(editBugModal.dialog).toBeVisible();
    await expect(row).toBeVisible();
    const response = await request.get(`/api/bugs/${bugId}`);
    expect(response.status()).toBe(200);
  });
});
