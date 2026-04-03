import Dexie from 'dexie';

export const db = new Dexie('recipi');

db.version(1).stores({
  recipes: 'id, title, createdAt, updatedAt'
});

db.version(2).stores({
  recipes: 'id, title, createdAt, updatedAt'
  // photo field added (not indexed — just stored on the object)
});

db.version(3).stores({
  recipes: 'id, title, createdAt, updatedAt'
  // translations field added: { en: { title, ingredients, instructions, notes }, ja: {...}, etc }
});

db.version(4).stores({
  recipes: 'id, title, language, createdAt, updatedAt'
  // language field added: tracks the original language of the recipe (e.g. 'en', 'ja', 'fr', 'zh-CN')
  // translations field structure: { en: { title, ingredients[], instructions, notes }, ja: {...}, ... }
});

db.version(5).stores({
  recipes: 'id, title, createdBy, language, createdAt, updatedAt'
  // createdBy field added: string (person's name/initials)
  // Allows searching recipes by creator
});
