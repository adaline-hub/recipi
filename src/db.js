import Dexie from 'dexie';

export const db = new Dexie('recipi');

db.version(1).stores({
  recipes: 'id, title, createdAt, updatedAt'
});

db.version(2).stores({
  recipes: 'id, title, createdAt, updatedAt'
  // photo field added (not indexed — just stored on the object)
});
