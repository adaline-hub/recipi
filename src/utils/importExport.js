import { db } from '../db';

export async function exportRecipes() {
  const recipes = await db.recipes.toArray();
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    recipes,
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recipi-export-${today}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importRecipes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const raw = JSON.parse(e.target.result);

        if (!raw || raw.version !== 1 || !Array.isArray(raw.recipes)) {
          return reject(new Error('Invalid file format: must have version 1 and a recipes array.'));
        }

        let added = 0;
        let updated = 0;
        let skipped = 0;

        for (const r of raw.recipes) {
          // Basic validation
          if (
            !r.id ||
            typeof r.id !== 'string' ||
            !r.title ||
            typeof r.title !== 'string' ||
            !Array.isArray(r.ingredients) ||
            typeof r.instructions !== 'string'
          ) {
            skipped++;
            continue;
          }

          const existing = await db.recipes.get(r.id);
          if (existing) {
            if (r.updatedAt > existing.updatedAt) {
              await db.recipes.put(r);
              updated++;
            } else {
              skipped++;
            }
          } else {
            await db.recipes.add(r);
            added++;
          }
        }

        resolve({ added, updated, skipped });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsText(file);
  });
}
