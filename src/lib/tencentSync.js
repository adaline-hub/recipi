import { db } from '../db';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_TOKEN = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;
// Singapore region endpoint (extracted from publishable key issuer)
const TCB_BASE = `https://${TCB_ENV}.ap-shanghai.tcb-api.tencentcloudapi.com/web/v1`;

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

/**
 * Make authenticated HTTP request to Tencent CloudBase database API
 */
async function tcbRequest(action, body) {
  const res = await fetch(`${TCB_BASE}/database/${action}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TCB_TOKEN}`,
      'X-CloudBase-Env': TCB_ENV,
    },
    body: JSON.stringify({ env: TCB_ENV, ...body }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TCB API error ${res.status}: ${text}`);
  }

  return res.json();
}

/**
 * Fetch all recipes from Tencent CloudBase on app load
 */
export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

    const result = await tcbRequest('query', {
      collection: 'recipes',
      query: '{}',
      limit: 200,
    });

    const records = result.data || [];
    for (const recipe of records) {
      const recipeData = { ...recipe, id: recipe.id || recipe._id };
      delete recipeData._id;
      await db.recipes.put(recipeData);
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    console.error('Error syncing recipes from Tencent:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
  }
}

/**
 * Save a recipe to Tencent CloudBase
 */
export async function saveRecipeToSupabase(recipe) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

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

    // Try to update first, then insert if not found
    try {
      await tcbRequest('update', {
        collection: 'recipes',
        query: `{"id":"${recipe.id}"}`,
        multi: false,
        upsert: true,
        data: `{"$set":${JSON.stringify(recipeData)}}`,
      });
    } catch {
      await tcbRequest('add', {
        collection: 'recipes',
        data: JSON.stringify(recipeData),
      });
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Error saving recipe to Tencent:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

/**
 * Delete a recipe from Tencent CloudBase
 */
export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

    await tcbRequest('delete', {
      collection: 'recipes',
      query: `{"id":"${recipeId}"}`,
      multi: false,
    });

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
