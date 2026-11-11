import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { type Page } from '@playwright/test';
import { test as base } from './pages';
import { LoginPage } from '../pages/LoginPage';
import { BoardPage } from '../pages/BoardPage';
import { CreateBugModal } from '../pages/CreateBugModal';
import { EditBugModal } from '../pages/EditBugModal';

type RecordedPages = {
  loginPage: LoginPage;
  boardPage: BoardPage;
  createBugModal: CreateBugModal;
  editBugModal: EditBugModal;
  finishRecording: () => Promise<string>;
};

async function closeAndGetVideoPath(page: Page, closeContext: () => Promise<void>): Promise<string> {
  await page.close();
  const video = page.video();
  if (!video) {
    throw new Error('The recorded page did not produce a video.');
  }
  await closeContext();
  return video.path();
}

export const test = base.extend<{ recordedPages: RecordedPages }>({
  recordedPages: async ({ browser }, use) => {
    const videoDirectory = join(process.cwd(), 'playwright-videos');
    mkdirSync(videoDirectory, { recursive: true });

    const context = await browser.newContext({
      recordVideo: { dir: videoDirectory, size: { width: 1280, height: 720 } },
    });
    const page = await context.newPage();
    let recordingFinished = false;
    const finishRecording = async () => {
      if (recordingFinished) {
        throw new Error('The video recording has already been finalized.');
      }
      const path = await closeAndGetVideoPath(page, () => context.close());
      recordingFinished = true;
      return path;
    };

    try {
      await use({
        loginPage: new LoginPage(page),
        boardPage: new BoardPage(page),
        createBugModal: new CreateBugModal(page),
        editBugModal: new EditBugModal(page),
        finishRecording,
      });
    } finally {
      if (!recordingFinished) {
        await page.close();
        await context.close();
      }
    }
  },
});

export { expect } from './pages';
