import Dexie from 'dexie';

export const db = new Dexie('recipi');

db.version(1).stores({
  recipes: 'id, title, createdAt, updatedAt'
});
