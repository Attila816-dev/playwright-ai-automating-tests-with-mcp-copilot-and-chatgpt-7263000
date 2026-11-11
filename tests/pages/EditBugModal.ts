import { Page, Locator } from '@playwright/test';

export class EditBugModal {
  readonly dialog: Locator;
  readonly heading: Locator;
  readonly idInput: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly severityOptions: Locator;
  readonly stateSelect: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly deleteButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly saveButton: Locator;
  readonly confirmationDialog: Locator;
  readonly confirmDeleteButton: Locator;
  readonly cancelDeleteConfirmationButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /Edit bug/ });
    this.heading = this.dialog.getByRole('heading');
    this.idInput = this.dialog.getByLabel('ID');
    this.titleInput = this.dialog.getByLabel('Title');
    this.severitySelect = this.dialog.getByLabel('Severity');
    this.severityOptions = this.severitySelect.getByRole('option');
    this.stateSelect = this.dialog.getByLabel('State');
    this.ownerInput = this.dialog.getByLabel('Owner');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.deleteButton = this.dialog.getByRole('button', { name: 'Delete' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
    this.closeButton = this.dialog.getByRole('button', { name: 'Close' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.confirmationDialog = page.getByRole('dialog', { name: 'Confirm delete' });
    this.confirmDeleteButton = this.confirmationDialog.getByRole('button', { name: 'Delete' });
    this.cancelDeleteConfirmationButton = this.confirmationDialog.getByRole('button', { name: 'Cancel' });
  }

  async openDeleteConfirmation() {
    await this.deleteButton.click();
    await this.confirmationDialog.waitFor({ state: 'visible' });
  }

  async confirmDeletion() {
    await this.confirmDeleteButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async save() {
    await this.saveButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async getSeverityColors(): Promise<{ color: string; backgroundColor: string }> {
    return this.severitySelect.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });
  }

  async pressEscape() {
    await this.page.keyboard.press('Escape');
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async cancelDeleteConfirmation() {
    await this.cancelDeleteConfirmationButton.click();
    await this.confirmationDialog.waitFor({ state: 'hidden' });
    await this.dialog.waitFor({ state: 'visible' });
  }

  async delete() {
    await this.openDeleteConfirmation();
    await this.confirmDeletion();
  }

  async cancel() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async clickBackdrop() {
    await this.dialog.click({ position: { x: 5, y: 5 } });
  }

  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }
}
