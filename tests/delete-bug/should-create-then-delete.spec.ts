import { test, expect } from '../fixtures/pages';
import { createBug, deleteBugIfExists } from './test-helpers';

test.describe('Delete Bug - edit dialog action', () => {
  let title: string | undefined;

  test.beforeEach(async ({ loginPage, boardPage, createBugModal }, testInfo) => {
    await loginPage.loginWithFirstUser();
    title = `delete-bug-${Date.now()}-${testInfo.workerIndex}-${Math.random().toString(36).slice(2)}`;
    await createBug(title, boardPage, createBugModal);
  });

  test.afterEach(async ({ request }) => {
    await deleteBugIfExists(request, title);
  });

  test('edit dialog shows a delete button for a fresh bug', async ({ boardPage, editBugModal }) => {
    if (!title) throw new Error('Test bug title was not initialized.');

    // Arrange
    const row = await boardPage.getBugRowByTitle(title);
    await expect(row).toBeVisible();

    // Act
    await boardPage.clickBugByTitle(title);

    // Assert
    await expect(editBugModal.dialog).toBeVisible();
    await expect(editBugModal.deleteButton).toBeVisible();
  });
});
