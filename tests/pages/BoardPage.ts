import { Page, Locator } from '@playwright/test';

export class BoardPage {
  readonly newBugButton: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly bugsTable: Locator;
  readonly stateFilterGroup: Locator;
  readonly bugTitleCells: Locator;
  readonly logoutButton: Locator;

  constructor(private readonly page: Page) {
    this.newBugButton = page.getByRole('button', { name: 'New Bug' });
    this.searchInput = page.getByRole('search', { name: 'Search bugs by title' });
    this.clearSearchButton = page.getByRole('button', { name: 'Clear search' });
    this.bugsTable = page.locator('table[aria-label="Bugs"]');
    this.stateFilterGroup = page.getByRole('group', { name: 'Filter by bug state' });
    this.bugTitleCells = this.bugsTable.locator('tbody tr td:nth-child(3)');
    this.logoutButton = page.getByRole('button', { name: 'Logout' });
  }

  async goto() {
    await this.page.goto('/board');
  }

  async clickNewBugButton() {
    await this.newBugButton.click();
  }

  async searchByTitle(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
  }

  async clearSearch() {
    await this.clearSearchButton.click();
  }

  async getBugRowByTitle(title: string): Promise<Locator> {
    return this.page.locator('table[aria-label="Bugs"] tbody tr', { hasText: title }).first();
  }

  async getBugIdByTitle(title: string): Promise<number> {
    const row = await this.getBugRowByTitle(title);
    const id = Number(await row.getByRole('cell').first().innerText());
    if (!Number.isSafeInteger(id)) {
      throw new Error(`Could not read the ID of bug "${title}".`);
    }
    return id;
  }

  async getBugSeverityCellByTitle(title: string): Promise<Locator> {
    const row = await this.getBugRowByTitle(title);
    return row.getByRole('cell').nth(1);
  }

  async getBugOwnerCellByTitle(title: string): Promise<Locator> {
    const row = await this.getBugRowByTitle(title);
    return row.getByRole('cell').nth(3);
  }

  async getSeverityBadgeByTitle(title: string): Promise<Locator> {
    const row = await this.getBugRowByTitle(title);
    return row.locator('[data-severity]');
  }

  async getSeverityBadgeColorsByTitle(title: string): Promise<{ color: string; backgroundColor: string }> {
    const badge = await this.getSeverityBadgeByTitle(title);
    return badge.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, backgroundColor: style.backgroundColor };
    });
  }

  async clickBugByTitle(title: string) {
    const row = await this.getBugRowByTitle(title);
    await row.click();
  }

  async getBugCellByTitle(title: string): Promise<Locator> {
    return this.page.getByRole('cell', { name: title, exact: true });
  }

  async getNoResultsMessage(): Promise<Locator> {
    return this.page.getByRole('cell', { name: 'No bugs matched.', exact: true });
  }

  async selectStateFilter(state: 'Open' | 'Closed') {
    await this.stateFilterGroup.getByRole('button', { name: state }).click();
  }

  getColumnHeader(columnName: string): Locator {
    return this.bugsTable.getByRole('columnheader').filter({ hasText: columnName });
  }

  async clickColumnHeader(columnName: string) {
    await this.getColumnHeader(columnName).getByRole('button').click();
  }

  async reload() {
    await this.page.reload();
  }

  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL('**/login');
  }
}
