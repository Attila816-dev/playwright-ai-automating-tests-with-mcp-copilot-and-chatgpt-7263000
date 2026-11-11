import { Page, Locator } from '@playwright/test';

export interface BugFormData {
  title: string;
  severity?: string;
  owner?: string;
  description?: string;
}

export class CreateBugModal {
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Create bug' });
    this.titleInput = this.dialog.getByLabel('Title');
    this.severitySelect = this.dialog.getByLabel('Severity');
    this.ownerInput = this.dialog.getByLabel('Owner');
    this.descriptionInput = this.dialog.getByLabel('Description');
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: 'Cancel' });
  }

  async fillBugForm(data: BugFormData) {
    await this.titleInput.fill(data.title);
    if (data.severity) {
      await this.severitySelect.selectOption(data.severity);
    }
    if (data.owner) {
      await this.ownerInput.fill(data.owner);
    }
    if (data.description) {
      await this.descriptionInput.fill(data.description);
    }
  }

  async submit() {
    await this.saveButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async cancel() {
    await this.cancelButton.click();
    await this.dialog.waitFor({ state: 'hidden' });
  }

  async isVisible(): Promise<boolean> {
    return this.dialog.isVisible();
  }
}
