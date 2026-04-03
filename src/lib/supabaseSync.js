import { supabase, isSupabaseConfigured } from './supabaseClient';
import { db } from '../db';

// Track subscription for cleanup
let subscription = null;
let syncStatusCallback = null;

export const SYNC_STATUS = {
  SYNCED: 'synced',
  SYNCING: 'syncing',
  OFFLINE: 'offline',
  ERROR: 'error',
};

let currentSyncStatus = SYNC_STATUS.OFFLINE;

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
 * Fetch all recipes from Supabase on app load
 */
export async function fetchRecipesFromSupabase() {
  if (!isSupabaseConfigured()) {
    setSyncStatus(SYNC_STATUS.OFFLINE);
    return;
  }

  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    const { data, error } = await supabase
      .from('recipes')
      .select('*');

    if (error) {
      console.error('Error fetching recipes from Supabase:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      return;
    }

    // Clear local db and repopulate with Supabase data (don't delete pending items)
    if (data && data.length > 0) {
      for (const recipe of data) {
        // Convert timestamps to milliseconds if needed
        if (typeof recipe.createdAt === 'string') {
          recipe.createdAt = new Date(recipe.createdAt).getTime();
        }
        if (typeof recipe.updatedAt === 'string') {
          recipe.updatedAt = new Date(recipe.updatedAt).getTime();
        }

        await db.recipes.put(recipe);
      }
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
  } catch (err) {
    console.error('Error syncing recipes:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
  }
}

/**
 * Save a recipe to Supabase
 */
export async function saveRecipeToSupabase(recipe) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

    // Prepare recipe data for Supabase
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
      createdAt: new Date(recipe.createdAt).toISOString(),
      updatedAt: new Date(recipe.updatedAt).toISOString(),
    };

    const { error } = await supabase
      .from('recipes')
      .upsert(recipeData, { onConflict: 'id' });

    if (error) {
      console.error('Error saving recipe to Supabase:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      return false;
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Error saving recipe:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

/**
 * Delete a recipe from Supabase
 */
export async function deleteRecipeFromSupabase(recipeId) {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    setSyncStatus(SYNC_STATUS.SYNCING);

    const { error } = await supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe from Supabase:', error);
      setSyncStatus(SYNC_STATUS.ERROR);
      return false;
    }

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('Error deleting recipe:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

/**
 * Subscribe to real-time changes from Supabase
 * When mom adds a recipe, Adeline's app will auto-update
 */
export function subscribeToRecipeChanges() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  // Unsubscribe from previous subscription if it exists
  if (subscription) {
    supabase.removeChannel(subscription);
  }

  subscription = supabase
    .channel('recipes_changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'recipes' },
      async (payload) => {
        console.log('📡 Real-time update received:', payload.eventType);

        try {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const recipe = payload.new;

            // Convert timestamps
            if (typeof recipe.createdAt === 'string') {
              recipe.createdAt = new Date(recipe.createdAt).getTime();
            }
            if (typeof recipe.updatedAt === 'string') {
              recipe.updatedAt = new Date(recipe.updatedAt).getTime();
            }

            // Save to local IndexedDB
            await db.recipes.put(recipe);
            console.log('✓ Recipe synced to local db');
          } else if (payload.eventType === 'DELETE') {
            await db.recipes.delete(payload.old.id);
            console.log('✓ Recipe deleted from local db');
          }
        } catch (err) {
          console.error('Error handling real-time update:', err);
        }
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from real-time changes
 */
export function unsubscribeFromRecipeChanges() {
  if (subscription) {
    supabase.removeChannel(subscription);
    subscription = null;
  }
}
