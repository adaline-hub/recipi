import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;
const BUCKET = `7265-${TCB_ENV}-1419336399`;
const RECIPES_CLOUD_PATH = 'recipi/recipes.json';
const RECIPES_FILE_ID = `cloud://${TCB_ENV}.${BUCKET}/${RECIPES_CLOUD_PATH}`;

const app = cloudbase.init({
  env: TCB_ENV,
  region: 'ap-singapore',
});
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });

export const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error',
};

let currentSyncStatus = SYNC_STATUS.OFFLINE;
let syncStatusCallback = null;

export function onSyncStatusChange(callback) {
  syncStatusCallback = callback;
  callback(currentSyncStatus);
}

function setSyncStatus(status) {
  if (currentSyncStatus !== status) {
    currentSyncStatus = status;
    if (syncStatusCallback) syncStatusCallback(status);
  }
}

export function getSyncStatus() {
  return currentSyncStatus;
}

let authReady = false;

async function ensureAuth() {
  if (authReady) return;
  try {
    await auth.signInAnonymously();
    authReady = true;
  } catch (err) {
    console.error('Auth error:', err);
  }
}

async function downloadRecipes() {
  try {
    const { fileList } = await app.getTempFileURL({ fileList: [RECIPES_FILE_ID] });
    const url = fileList?.[0]?.tempFileURL;
    if (!url) return null;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function uploadRecipes(recipes) {
  const file = new File(
    [JSON.stringify(recipes)],
    'recipes.json',
    { type: 'application/json' }
  );
  await app.uploadFile({ cloudPath: RECIPES_CLOUD_PATH, filePath: file });
}

export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const recipes = await downloadRecipes();
    if (recipes && Array.isArray(recipes)) {
      for (const recipe of recipes) {
        await db.recipes.put(recipe);
      }
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    console.error('Fetch error:', err);
    setSyncStatus(SYNC_STATUS.OFFLINE);
  }
}

export async function saveRecipeToSupabase(recipe) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const existing = (await downloadRecipes()) || [];
    const idx = existing.findIndex(r => r.id === recipe.id);
    if (idx >= 0) {
      existing[idx] = recipe;
    } else {
      existing.push(recipe);
    }
    await uploadRecipes(existing);

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Save error:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const existing = (await downloadRecipes()) || [];
    await uploadRecipes(existing.filter(r => r.id !== recipeId));

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Delete error:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export function subscribeToRecipeChanges() {
  window.addEventListener('focus', fetchRecipesFromSupabase);
}

export function unsubscribeFromRecipeChanges() {
  window.removeEventListener('focus', fetchRecipesFromSupabase);
}
