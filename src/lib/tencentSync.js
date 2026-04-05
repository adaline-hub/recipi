import cloudbase from '@cloudbase/js-sdk';
import { db } from '../db';

// Initialize Tencent CloudBase
const app = cloudbase.init({
  env: 'recipi-6gjlno6o87a7532b',
});

const database = app.database();

export const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error',
};

let currentSyncStatus = SYNC_STATUS.OFFLINE;
let syncStatusCallback = null;
let subscription = null;

/**
 * Register a callback to be notified of sync status changes
 */
export function onSyncStatusChange(callback) {
  syncStatusCallback = callback;
  callback(currentSyncStatus);
}

/**
 * Set sync status and notify listeners
 */
function setSyncStatus(status) {
  if (currentSyncStatus !== status) {
    currentSyncStatus = status;
    if (syncStatusCallback) {
      syncStatusCallback(status);
    }
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus() {
  return currentSyncStatus;
}

/**
 * Fetch all recipes from Tencent CloudBase on app load
 */
export async function fetchRecipesFromSupabase() {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

    // Authenticate anonymously
    await app.auth().signInAnonymously();

    // Fetch all recipes from the 'recipes' collection
    const { data } = await database.collection('recipes').get();

    if (data && data.length > 0) {
      for (const recipe of data) {
        // CloudBase uses _id instead of id
        const recipeData = {
          ...recipe,
          id: recipe._id,
        };
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

    // Check if recipe exists
    const { data: existing } = await database
      .collection('recipes')
      .where({ id: recipe.id })
      .get();

    if (existing && existing.length > 0) {
      // Update existing recipe
      await database
        .collection('recipes')
        .doc(existing[0]._id)
        .update(recipeData);
    } else {
      // Add new recipe
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

/**
 * Delete a recipe from Tencent CloudBase
 */
export async function deleteRecipeFromSupabase(recipeId) {
  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

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

/**
 * Subscribe to real-time changes from Tencent CloudBase
 */
export function subscribeToRecipeChanges() {
  try {
    subscription = database
      .collection('recipes')
      .on('change', async (snapshot) => {
        console.log('📡 Real-time update received');

        try {
          const docs = snapshot.docs || [];
          for (const doc of docs) {
            const recipe = {
              ...doc.data(),
              id: doc.data().id || doc._id,
            };
            await db.recipes.put(recipe);
          }
        } catch (err) {
          console.error('Error handling real-time update:', err);
        }
      });

    return subscription;
  } catch (err) {
    console.error('Error subscribing to changes:', err);
    return null;
  }
}

/**
 * Unsubscribe from real-time changes
 */
export function unsubscribeFromRecipeChanges() {
  if (subscription) {
    subscription.off();
    subscription = null;
  }
}
