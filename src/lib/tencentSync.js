import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;

const app = cloudbase.init({
  env: TCB_ENV,
  region: 'ap-singapore',
});
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });
const tcbDb = app.database();
const collection = tcbDb.collection('recipes');

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

    const { data } = await collection.limit(1000).get();
    if (data && data.length > 0) {
      for (const recipe of data) {
        // CloudBase adds _id, use our id field
        const { _id, ...recipeData } = recipe;
        await db.recipes.put(recipeData);
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

    // Check if document exists
    const { data } = await collection.where({ id: recipe.id }).limit(1).get();

    if (data && data.length > 0) {
      await collection.doc(data[0]._id).update(recipe);
    } else {
      await collection.add(recipe);
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

    const { data } = await collection.where({ id: recipeId }).limit(1).get();
    if (data && data.length > 0) {
      await collection.doc(data[0]._id).remove();
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
  // Real-time push not available; poll on window focus instead
  window.addEventListener('focus', fetchRecipesFromSupabase);
}

export function unsubscribeFromRecipeChanges() {
  window.removeEventListener('focus', fetchRecipesFromSupabase);
}
