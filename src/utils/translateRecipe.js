const ALL_LANGUAGES = ['en', 'zh-CN', 'fr', 'ja'];
import { translateText } from './translate';

async function translateIngredients(ingredients, sourceLanguage, targetLanguage) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];
  const translated = await Promise.all(
    ingredients.map(async (ingredient) => {
      try {
        return await translateText(ingredient, sourceLanguage, targetLanguage);
      } catch {
        return ingredient;
      }
    })
  );
  return translated;
}

export async function translateRecipeToAllLanguages(recipe, sourceLanguage) {
  const translations = {};

  await Promise.all(
    ALL_LANGUAGES.map(async (targetLang) => {
      try {
        const [title, ingredients, instructions, notes] = await Promise.all([
          translateText(recipe.title || '', sourceLanguage, targetLang),
          translateIngredients(recipe.ingredients, sourceLanguage, targetLang),
          translateText(recipe.instructions || '', sourceLanguage, targetLang),
          translateText(recipe.notes || '', sourceLanguage, targetLang),
        ]);

        translations[targetLang] = {
          title,
          ingredients,
          instructions,
          notes,
        };
      } catch (error) {
        console.warn(`Failed to translate recipe to ${targetLang}:`, error);
        translations[targetLang] = {
          title: recipe.title,
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,
          notes: recipe.notes,
        };
      }
    })
  );

  return { ...recipe, translations };
}
