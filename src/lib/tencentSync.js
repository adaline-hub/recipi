import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;

const app = cloudbase.init({
  env: TCB_ENV,
  region: 'ap-singapore',
});
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });
const storage = app.storage();

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

    // Try to fetch from Cloud Storage
    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/recipes.json`);
      const buffer = await fileRef.getBytes();
      const text = new TextDecoder().decode(buffer);
      const recipes = JSON.parse(text);

      if (recipes && Array.isArray(recipes) && recipes.length > 0) {
        for (const recipe of recipes) {
          await db.recipes.put(recipe);
        }
      }
    } catch (err) {
      // Silently fail if Cloud Storage not available
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    setSyncStatus(SYNC_STATUS.OFFLINE);
  }
}

export async function saveRecipeToSupabase(recipe) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    // Fetch current recipes
    let recipes = [];
    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/recipes.json`);
      const buffer = await fileRef.getBytes();
      const text = new TextDecoder().decode(buffer);
      recipes = JSON.parse(text);
    } catch {
      recipes = [];
    }

    // Update or add recipe
    const idx = recipes.findIndex(r => r.id === recipe.id);
    if (idx >= 0) {
      recipes[idx] = recipe;
    } else {
      recipes.push(recipe);
    }

    // Write back to Cloud Storage
    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/recipes.json`);
      await fileRef.putString(JSON.stringify(recipes), 'text/plain');
    } catch (err) {
      console.error('Save to Cloud Storage failed:', err);
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    let recipes = [];
    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/recipes.json`);
      const buffer = await fileRef.getBytes();
      const text = new TextDecoder().decode(buffer);
      recipes = JSON.parse(text);
    } catch {
      recipes = [];
    }

    recipes = recipes.filter(r => r.id !== recipeId);

    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/recipes.json`);
      await fileRef.putString(JSON.stringify(recipes), 'text/plain');
    } catch (err) {
      console.error('Delete from Cloud Storage failed:', err);
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export function subscribeToRecipeChanges() {
  return null;
}

export function unsubscribeFromRecipeChanges() {}
