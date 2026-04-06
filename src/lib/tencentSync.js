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

// Cloud Storage file path for shared recipes
const RECIPES_FILE = 'recipes.json';

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
  console.log('🔐 Signing in anonymously to Tencent...');
  await auth.signInAnonymously();
  authReady = true;
  console.log('✓ Tencent auth ready');
}

export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    console.log('📥 Fetching recipes from Cloud Storage...');
    const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/${RECIPES_FILE}`);
    const buffer = await fileRef.getBytes();
    const text = new TextDecoder().decode(buffer);
    const recipes = JSON.parse(text);

    console.log('📥 Cloud Storage returned', recipes.length, 'recipes');

    if (recipes && recipes.length > 0) {
      for (const recipe of recipes) {
        await db.recipes.put(recipe);
      }
      console.log('✓ Local DB updated with', recipes.length, 'recipes');
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    console.error('❌ Error fetching recipes from Cloud Storage:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
  }
}

export async function saveRecipeToSupabase(recipe) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    console.log('📤 Syncing recipes to Cloud Storage...');

    // Fetch current recipes from Cloud Storage
    let recipes = [];
    try {
      const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/${RECIPES_FILE}`);
      const buffer = await fileRef.getBytes();
      const text = new TextDecoder().decode(buffer);
      recipes = JSON.parse(text);
    } catch {
      recipes = [];
    }

    // Update or add recipe
    const existingIndex = recipes.findIndex(r => r.id === recipe.id);
    if (existingIndex >= 0) {
      recipes[existingIndex] = recipe;
      console.log('✓ Recipe updated in Cloud Storage');
    } else {
      recipes.push(recipe);
      console.log('✓ Recipe added to Cloud Storage');
    }

    // Write updated recipes back to Cloud Storage
    const jsonString = JSON.stringify(recipes, null, 2);
    const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/${RECIPES_FILE}`);
    await fileRef.putString(jsonString, 'text/plain');

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('❌ Error saving recipe to Cloud Storage:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    console.log('🗑️ Deleting recipe from Cloud Storage...');

    // Fetch current recipes
    const fileRef = storage.refFromURL(`cloud://${TCB_ENV}.7265-${TCB_ENV}-1419336399/${RECIPES_FILE}`);
    const buffer = await fileRef.getBytes();
    const text = new TextDecoder().decode(buffer);
    let recipes = JSON.parse(text);

    // Remove recipe
    recipes = recipes.filter(r => r.id !== recipeId);

    // Write back
    const jsonString = JSON.stringify(recipes, null, 2);
    await fileRef.putString(jsonString, 'text/plain');

    console.log('✓ Recipe deleted from Cloud Storage');
    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('❌ Error deleting recipe from Cloud Storage:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export function subscribeToRecipeChanges() {
  return null;
}

export function unsubscribeFromRecipeChanges() {}
