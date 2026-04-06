import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;
const BUCKET = `7265-${TCB_ENV}-1419336399`;

const app = cloudbase.init({
  env: TCB_ENV,
  region: 'ap-singapore',
});
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });

// app.storage is already an object (not a function)
const bucket = app.storage.from(BUCKET);

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

export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    // List all recipe files
    const { data: files, error: listError } = await bucket.list('recipes/');
    if (listError) {
      console.error('List error:', listError);
      setSyncStatus(SYNC_STATUS.OFFLINE);
      return;
    }

    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const { data, error } = await bucket.download(`recipes/${file.name}`);
          if (error || !data) continue;
          const recipe = JSON.parse(await data.text());
          await db.recipes.put(recipe);
        } catch (e) {
          console.error('Download error for', file.name, e);
        }
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

    const blob = new Blob([JSON.stringify(recipe)], { type: 'application/json' });
    const { error } = await bucket.upload(`recipes/${recipe.id}.json`, blob, { upsert: true });

    if (error) {
      console.error('Upload error:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      return false;
    }

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

    const { error } = await bucket.remove([`recipes/${recipeId}.json`]);
    if (error) {
      console.error('Delete error:', error);
    }

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
