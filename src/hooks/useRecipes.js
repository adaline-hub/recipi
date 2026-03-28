import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export function useRecipes() {
  return useLiveQuery(() => db.recipes.orderBy('createdAt').reverse().toArray(), []);
}

export function useRecipe(id) {
  return useLiveQuery(() => (id ? db.recipes.get(id) : undefined), [id]);
}
