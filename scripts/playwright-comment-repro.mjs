import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4173;
const BASE_URL = `http://${HOST}:${PORT}`;
const DEV_SERVER_TIMEOUT_MS = 60_000;
const CLOUD_SYNC_WAIT_MS = 45_000;

function log(message) {
  console.log(`[playwright-repro] ${message}`);
}

function parseMode(argv) {
  const modeArg = argv.find((arg) => arg.startsWith('--mode='));
  if (!modeArg) return 'local';
  const mode = modeArg.split('=')[1];
  if (mode !== 'local' && mode !== 'cloud') {
    throw new Error(`Invalid --mode value "${mode}". Use "local" or "cloud".`);
  }
  return mode;
}

function startDevServer() {
  const child = spawn(
    'npm',
    ['run', 'dev', '--', '--host', HOST, '--port', String(PORT), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[vite] ${chunk}`);
  });
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[vite:err] ${chunk}`);
  });

  return child;
}

async function waitForServer(url, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // server not ready yet
    }
    await delay(500);
  }
  throw new Error(`Timed out waiting for dev server at ${url}`);
}

async function openList(page) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /add recipe/i }).waitFor({ timeout: 20_000 });
}

async function createRecipe(page, title) {
  await page.getByRole('button', { name: /add recipe/i }).click();
  await page.locator('input[type="text"]').first().fill(title);
  await page.locator('textarea').first().fill('1 cup rice');
  await page.getByRole('button', { name: /^add recipe$/i }).click();
  await page.getByRole('heading', { name: title }).waitFor({ timeout: 30_000 });
}

async function addComment(page, authorName, text) {
  await page.getByRole('button', { name: authorName }).click();
  await page.getByPlaceholder(/add a comment/i).fill(text);
  await page.getByRole('button', { name: /^post$/i }).click();
  await page.getByText(text, { exact: true }).waitFor({ timeout: 20_000 });
}

async function waitForRecipeOnPage(page, title, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const card = page.getByRole('button', { name: new RegExp(title, 'i') });
    if (await card.count()) {
      await card.first().click();
      await page.getByRole('heading', { name: title }).waitFor({ timeout: 10_000 });
      return;
    }
    await delay(1_000);
    await page.reload({ waitUntil: 'domcontentloaded' });
  }
  throw new Error(`Recipe "${title}" never appeared before timeout`);
}

async function waitForBothComments(page, title, first, second, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    await openList(page);
    const card = page.getByRole('button', { name: new RegExp(title, 'i') });
    if (!(await card.count())) {
      await delay(1_000);
      continue;
    }

    await card.first().click();
    const firstVisible = await page.getByText(first, { exact: true }).count();
    const secondVisible = await page.getByText(second, { exact: true }).count();
    if (firstVisible > 0 && secondVisible > 0) return;

    await delay(1_000);
  }
  throw new Error('Merged comments did not appear within timeout');
}

async function runCloudScenario(browser, recipeTitle, commentA, commentB) {
  const deviceA = await browser.newContext();
  const deviceB = await browser.newContext();
  const pageA = await deviceA.newPage();
  const pageB = await deviceB.newPage();

  try {
    log('Cloud mode: Device A creates recipe and adds first comment');
    await openList(pageA);
    await createRecipe(pageA, recipeTitle);
    await addComment(pageA, 'Little B', commentA);

    log('Cloud mode: Device B waits for sync and adds second comment');
    await openList(pageB);
    await waitForRecipeOnPage(pageB, recipeTitle, CLOUD_SYNC_WAIT_MS);
    await addComment(pageB, 'Little Pan', commentB);

    log('Cloud mode: Device A refreshes and verifies merged comments');
    await waitForBothComments(pageA, recipeTitle, commentA, commentB, CLOUD_SYNC_WAIT_MS);

    log('PASS: cloud mode merged comments are visible on both devices');
  } finally {
    await deviceA.close();
    await deviceB.close();
  }
}

async function runLocalScenario(browser, recipeTitle, commentA, commentB) {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    window.__RECIPI_DISABLE_CLOUD_SYNC__ = true;
  });

  const pageA = await context.newPage();

  try {
    log('Local mode: create recipe and add first comment');
    await openList(pageA);
    await createRecipe(pageA, recipeTitle);
    await addComment(pageA, 'Little B', commentA);

    log('Local mode: add second comment from another author');
    await addComment(pageA, 'Little Pan', commentB);

    log('Local mode: verify both comments');
    await pageA.getByText(commentA, { exact: true }).waitFor({ timeout: 10_000 });
    await pageA.getByText(commentB, { exact: true }).waitFor({ timeout: 10_000 });

    log('PASS: local mode comment flow completed end-to-end');
  } finally {
    await context.close();
  }
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  const runId = Date.now();
  const recipeTitle = `PW Comment Sync ${runId}`;
  const commentA = `Device A comment ${runId}`;
  const commentB = `Device B comment ${runId}`;

  log(`Starting Vite dev server (mode=${mode})`);
  const devServer = startDevServer();

  try {
    await waitForServer(BASE_URL, DEV_SERVER_TIMEOUT_MS);
    log('Dev server is ready');

    const browser = await chromium.launch({ headless: true });
    try {
      if (mode === 'cloud') {
        await runCloudScenario(browser, recipeTitle, commentA, commentB);
      } else {
        await runLocalScenario(browser, recipeTitle, commentA, commentB);
      }

      assert.ok(true);
    } finally {
      await browser.close();
    }
  } finally {
    devServer.kill('SIGTERM');
  }
}

main().catch((error) => {
  console.error('[playwright-repro] FAIL:', error);
  process.exitCode = 1;
});
