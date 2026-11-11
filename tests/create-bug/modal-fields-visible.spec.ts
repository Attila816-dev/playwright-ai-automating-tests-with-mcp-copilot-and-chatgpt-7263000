// spec: specs/testing/create-bug.md (scenario 1.1)
// seed: tests/seed.spec.ts

import { test, expect } from '../fixtures/pages';

test.describe('Create Bug — Modal Display and Defaults', () => {
  test('Opening the New Bug button shows the create-bug modal with all required fields and buttons', async ({
    loginPage,
    boardPage,
    createBugModal,
  }) => {
    await loginPage.loginWithFirstUser();
    await boardPage.goto();

    await boardPage.clickNewBugButton();

    await expect(createBugModal.dialog).toBeVisible();
    await expect(createBugModal.titleInput).toBeVisible();
    await expect(createBugModal.severitySelect).toBeVisible();
    await expect(createBugModal.ownerInput).toBeVisible();
    await expect(createBugModal.descriptionInput).toBeVisible();
    await expect(createBugModal.saveButton).toBeVisible();
    await expect(createBugModal.cancelButton).toBeVisible();
  });
});
