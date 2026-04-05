import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;

const app = cloudbase.init({
  env: TCB_ENV,
  region: 'ap-singapore',
});
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });
const database = app.database();

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
  await auth.signInAnonymously();
  authReady = true;
}

export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const { data } = await database.collection('recipes').get();

    if (data && data.length > 0) {
      for (const recipe of data) {
        const recipeData = { ...recipe, id: recipe.id || recipe._id };
        delete recipeData._id;
        await db.recipes.put(recipeData);
      }
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    console.error('Error syncing recipes from Tencent:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
  }
}

export async function saveRecipeToSupabase(recipe) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const recipeData = {
      id: recipe.id,
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: recipe.notes,
      photo: recipe.photo,
      language: recipe.language,
      translations: recipe.translations || {},
      createdBy: recipe.createdBy,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
    };

    const { data: existing } = await database
      .collection('recipes')
      .where({ id: recipe.id })
      .get();

    if (existing && existing.length > 0) {
      await database.collection('recipes').doc(existing[0]._id).update(recipeData);
    } else {
      await database.collection('recipes').add(recipeData);
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Error saving recipe to Tencent:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const { data: existing } = await database
      .collection('recipes')
      .where({ id: recipeId })
      .get();

    if (existing && existing.length > 0) {
      await database.collection('recipes').doc(existing[0]._id).remove();
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Error deleting recipe from Tencent:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

export function subscribeToRecipeChanges() {
  return null;
}

export function unsubscribeFromRecipeChanges() {}
