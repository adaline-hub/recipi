// Temporarily disabled translation until Tencent Cloud Function is set up
const ALL_LANGUAGES = ['en', 'zh-CN', 'fr', 'ja'];

/**
 * Translates a recipe to all supported languages and stores translations
 * in the recipe.translations object. Called once at save time.
 *
 * @param {Object} recipe - Recipe object with title, ingredients, instructions, notes
 * @param {string} sourceLanguage - Original language code (e.g., 'en', 'zh-CN')
 * @returns {Promise<Object>} Recipe with populated translations object
 */
export async function translateRecipeToAllLanguages(recipe, sourceLanguage) {
  const translations = {};

  for (const targetLang of ALL_LANGUAGES) {
    // Store original content for all languages (translation API not yet configured)
    translations[targetLang] = {
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: recipe.notes,
    };
  }

  return {
    ...recipe,
    translations,
  };
}
