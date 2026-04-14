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
let pollingTimer = null;
let isSubscribed = false;
let fetchInFlight = null;
let saveInFlight = null;
const POLL_INTERVAL_MS = 10000;
const ENV_DISABLE_CLOUD_SYNC = import.meta.env.VITE_DISABLE_CLOUD_SYNC === '1';

function isCloudSyncDisabled() {
  if (ENV_DISABLE_CLOUD_SYNC) return true;
  if (typeof window === 'undefined') return false;
  return window.__RECIPI_DISABLE_CLOUD_SYNC__ === true;
}

const triggerRefresh = () => {
  fetchRecipesFromCloud();
};

function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    triggerRefresh();
  }
}

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
    console.log('[TencentSync] Auth successful');
  } catch (err) {
    console.error('[TencentSync] Auth error:', err);
    throw err;
  }
}

async function downloadRecipes() {
  try {
    console.log('[TencentSync] Downloading recipes from cloud...');
    const { fileList } = await app.getTempFileURL({ fileList: [RECIPES_FILE_ID] });
    const url = fileList?.[0]?.tempFileURL;
    if (!url) {
      console.log('[TencentSync] No file URL, returning empty array');
      return [];
    }
    const res = await fetch(url);
    if (!res.ok) {
      console.error('[TencentSync] Failed to fetch:', res.status);
      return null;
    }
    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      // File exists but content is corrupted (e.g. blob URL string was uploaded instead of JSON).
      // Return [] so the caller will re-upload local data to heal the cloud file.
      console.warn('[TencentSync] Cloud file corrupt, will overwrite with local data:', parseErr.message);
      return [];
    }
    console.log(`[TencentSync] Downloaded ${Array.isArray(data) ? data.length : 0} recipes`);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error('[TencentSync] Download error:', err);
    return null;
  }
}

async function uploadRecipes(recipes) {
  const blob = new Blob([JSON.stringify(recipes)], { type: 'application/json' });
  try {
    console.log(`[TencentSync] Uploading ${recipes.length} recipes to cloud...`);
    await app.uploadFile({ cloudPath: RECIPES_CLOUD_PATH, filePath: blob });
    console.log('[TencentSync] Upload successful');
  } catch (err) {
    console.error('[TencentSync] Upload error:', err);
    throw err;
  }
}

// ─── Timestamp helpers ─────────────────────────────────────────────────────

export function toMillis(value) {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// ─── Comment merge ─────────────────────────────────────────────────────────

/**
 * Merge two comment arrays, deduplicating by id.
 * When the same id appears in both, the newer (by createdAt) version wins.
 * Result is sorted oldest → newest.
 */
export function mergeComments(a, b) {
  const all = [...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])];
  const byId = new Map();

  for (const comment of all) {
    if (!comment?.id) continue;
    const existing = byId.get(comment.id);
    if (!existing) {
      byId.set(comment.id, comment);
      continue;
    }

    const existingTs = toMillis(existing.createdAt);
    const incomingTs = toMillis(comment.createdAt);
    if (incomingTs >= existingTs) {
      byId.set(comment.id, { ...existing, ...comment });
    }
  }

  return Array.from(byId.values()).sort(
    (left, right) => toMillis(left.createdAt) - toMillis(right.createdAt)
  );
}

// ─── Recipe merge ───────────────────────────────────────────────────────────

/**
 * Deep-merge two recipe objects.
 * - translations are unioned (both sides preserved)
 * - comments are merged via mergeComments
 * - other fields come from `incoming` (newer)
 */
export function mergeRecipes(baseRecipe, incomingRecipe) {
  const base = baseRecipe || {};
  const incoming = incomingRecipe || {};

  return {
    ...base,
    ...incoming,
    translations: {
      ...(base.translations || {}),
      ...(incoming.translations || {}),
    },
    comments: mergeComments(base.comments, incoming.comments),
  };
}

// ─── Comparison helpers (for detecting dirty state) ────────────────────────

export function normalizeForCompare(recipe) {
  if (!recipe) return null;

  const normalizedComments = Array.isArray(recipe.comments)
    ? recipe.comments
        .map((comment) => ({
          ...comment,
          createdAt: toMillis(comment?.createdAt),
        }))
        .sort((left, right) => {
          if ((left.id || '') === (right.id || '')) {
            return toMillis(left.createdAt) - toMillis(right.createdAt);
          }
          return (left.id || '').localeCompare(right.id || '');
        })
    : [];

  const translationEntries = Object.entries(recipe.translations || {}).sort(
    ([left], [right]) => left.localeCompare(right)
  );

  return {
    ...recipe,
    createdAt: toMillis(recipe.createdAt),
    updatedAt: toMillis(recipe.updatedAt),
    comments: normalizedComments,
    translations: Object.fromEntries(translationEntries),
  };
}

export function recipesEqual(leftRecipe, rightRecipe) {
  return JSON.stringify(normalizeForCompare(leftRecipe)) === JSON.stringify(normalizeForCompare(rightRecipe));
}

// ─── Fetch with reconcile-write ─────────────────────────────────────────────

export async function fetchRecipesFromCloud() {
  if (isCloudSyncDisabled()) {
    setSyncStatus(SYNC_STATUS.SYNCED);
    return db.recipes.toArray();
  }

  if (fetchInFlight) return fetchInFlight;

  fetchInFlight = (async () => {
    try {
      if (saveInFlight) {
        await saveInFlight;
      }

      setSyncStatus(SYNC_STATUS.SYNCING);
      await ensureAuth();

      const downloadResult = await downloadRecipes();
      if (downloadResult === null) {
        throw new Error('Cloud download failed');
      }
      const cloudRecipes = downloadResult;
      const localRecipes = await db.recipes.toArray();

      const cloudById = new Map(cloudRecipes.map((recipe) => [recipe.id, recipe]));
      const localById = new Map(localRecipes.map((recipe) => [recipe.id, recipe]));
      const allIds = new Set([...cloudById.keys(), ...localById.keys()]);

      let needsCloudWrite = false;
      const reconciledForCloud = [];

      for (const id of allIds) {
        const cloudRecipe = cloudById.get(id);
        const localRecipe = localById.get(id);

        if (cloudRecipe && localRecipe) {
          const cloudUpdatedAt = toMillis(cloudRecipe.updatedAt);
          const localUpdatedAt = toMillis(localRecipe.updatedAt);
          let merged =
            localUpdatedAt >= cloudUpdatedAt
              ? mergeRecipes(cloudRecipe, localRecipe) // local is newer
              : mergeRecipes(localRecipe, cloudRecipe); // cloud is newer

          // Re-read local to catch any concurrent writes (e.g. comment added
          // while this fetch was in progress). Merge again if local changed.
          const freshLocal = await db.recipes.get(id);
          if (freshLocal && toMillis(freshLocal.updatedAt) > toMillis(merged.updatedAt)) {
            merged = mergeRecipes(merged, freshLocal);
          } else if (freshLocal) {
            // Even if updatedAt hasn't advanced, merge comments to be safe
            merged = { ...merged, comments: mergeComments(merged.comments, freshLocal.comments) };
          }

          await db.recipes.put(merged);
          reconciledForCloud.push(merged);

          if (!recipesEqual(merged, cloudRecipe)) {
            needsCloudWrite = true;
          }
          continue;
        }

        const singleSourceRecipe = localRecipe || cloudRecipe;
        if (!singleSourceRecipe) continue;

        await db.recipes.put(singleSourceRecipe);
        reconciledForCloud.push(singleSourceRecipe);

        if (localRecipe && !cloudRecipe) {
          needsCloudWrite = true;
        }
      }

      if (needsCloudWrite) {
        reconciledForCloud.sort((left, right) => {
          const updatedDelta = toMillis(right.updatedAt) - toMillis(left.updatedAt);
          if (updatedDelta !== 0) return updatedDelta;
          return (left.id || '').localeCompare(right.id || '');
        });
        await uploadRecipes(reconciledForCloud);
      }

      setSyncStatus(SYNC_STATUS.SYNCED);
    } catch (err) {
      console.error('[TencentSync] Fetch error:', err);
      setSyncStatus(SYNC_STATUS.OFFLINE);
    } finally {
      fetchInFlight = null;
    }
  })();

  return fetchInFlight;
}

// ─── Save / Delete ──────────────────────────────────────────────────────────

/**
 * Save a recipe (with comments) to both local Dexie and the cloud file.
 * - First writes to local DB so the UI reflects the change immediately.
 * - Then fetches the latest cloud state, merges comments/translations, and
 *   pushes the reconciled result back to cloud.
 * This ensures comments survive across devices even if cloud was modified
 * concurrently by another session.
 */
export async function saveRecipeToCloud(recipe) {
  if (isCloudSyncDisabled()) {
    const existingLocal = await db.recipes.get(recipe.id);
    const mergedBase = existingLocal ? mergeRecipes(existingLocal, recipe) : recipe;
    const merged = {
      ...mergedBase,
      updatedAt: Math.max(
        toMillis(mergedBase.updatedAt),
        toMillis(recipe.updatedAt),
        toMillis(existingLocal?.updatedAt),
        Date.now()
      ),
    };
    await db.recipes.put(merged);
    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  }

  // Wait for any in-flight fetch to finish first to avoid race conditions
  // where the fetch could overwrite our data in Dexie.
  if (fetchInFlight) {
    await fetchInFlight;
  }

  // If another save is in flight, wait for it then run ours (don't drop it).
  if (saveInFlight) {
    await saveInFlight;
  }

  console.log('[TencentSync] saveRecipeToCloud called for:', recipe.id, 'comments:', recipe.comments?.length || 0);
  saveInFlight = (async () => {
    try {
      setSyncStatus(SYNC_STATUS.SYNCING);
      await ensureAuth();

      // ── Step 1: Write to local Dexie immediately ─────────────────────────
      await db.recipes.put(recipe);
      console.log('[TencentSync] Saved to local Dexie');

      // ── Step 2: Fetch latest cloud state, merge, and push back ──────────
      const existing = await downloadRecipes();
      if (existing === null) {
        throw new Error('Cloud download failed during save');
      }
      const cloudRecipe = existing.find((r) => r.id === recipe.id);

      console.log('[TencentSync] Cloud recipe exists:', !!cloudRecipe);
      if (cloudRecipe) {
        console.log('[TencentSync] Cloud comments:', cloudRecipe.comments?.length || 0);
      }

      // Re-read local to catch any changes made while we were downloading
      const freshLocal = await db.recipes.get(recipe.id);
      const localWithLatest = freshLocal && toMillis(freshLocal.updatedAt) > toMillis(recipe.updatedAt)
        ? mergeRecipes(recipe, freshLocal)
        : recipe;

      const mergedBase = cloudRecipe ? mergeRecipes(cloudRecipe, localWithLatest) : localWithLatest;
      const merged = {
        ...mergedBase,
        updatedAt: Math.max(
          toMillis(mergedBase.updatedAt),
          toMillis(recipe.updatedAt),
          toMillis(cloudRecipe?.updatedAt),
          Date.now()
        ),
      };

      console.log('[TencentSync] Merged comments:', merged.comments?.length || 0);

      // Update or insert the merged recipe
      const idx = existing.findIndex((r) => r.id === recipe.id);
      if (idx >= 0) {
        existing[idx] = merged;
      } else {
        existing.push(merged);
      }

      // Upload the updated cloud file
      await uploadRecipes(existing);

      // Keep local in sync with the canonical merged record.
      await db.recipes.put(merged);

      setSyncStatus(SYNC_STATUS.SYNCED);
      console.log('[TencentSync] Save complete, comments synced:', merged.comments?.length || 0);
      return true;
    } catch (err) {
      console.error('[TencentSync] Save error:', err);
      setSyncStatus(SYNC_STATUS.ERROR);
      return false;
    } finally {
      saveInFlight = null;
    }
  })();

  return saveInFlight;
}

// Alias for backwards compatibility
export const saveRecipeToSupabase = saveRecipeToCloud;
export const fetchRecipesFromSupabase = fetchRecipesFromCloud;
export const deleteRecipeFromSupabase = deleteRecipeFromCloud;

export async function deleteRecipeFromCloud(recipeId) {
  if (isCloudSyncDisabled()) {
    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  }

  try {
    setSyncStatus(SYNC_STATUS.SYNCING);
    await ensureAuth();

    const existing = await downloadRecipes();
    if (existing === null) {
      throw new Error('Cloud download failed during delete');
    }
    await uploadRecipes(existing.filter(r => r.id !== recipeId));

    setSyncStatus(SYNC_STATUS.SYNCED);
    return true;
  } catch (err) {
    console.error('[TencentSync] Delete error:', err);
    setSyncStatus(SYNC_STATUS.ERROR);
    return false;
  }
}

// ─── Subscription / Polling ─────────────────────────────────────────────────

export function subscribeToRecipeChanges() {
  if (isCloudSyncDisabled()) {
    setSyncStatus(SYNC_STATUS.SYNCED);
    return;
  }

  if (isSubscribed) return;
  isSubscribed = true;

  window.addEventListener('focus', triggerRefresh);
  window.addEventListener('online', triggerRefresh);
  document.addEventListener('visibilitychange', handleVisibilityChange);

  pollingTimer = window.setInterval(triggerRefresh, POLL_INTERVAL_MS);
  triggerRefresh();
}

export function unsubscribeFromRecipeChanges() {
  if (!isSubscribed) return;
  isSubscribed = false;

  window.removeEventListener('focus', triggerRefresh);
  window.removeEventListener('online', triggerRefresh);
  document.removeEventListener('visibilitychange', handleVisibilityChange);

  if (pollingTimer) {
    window.clearInterval(pollingTimer);
    pollingTimer = null;
  }
}
