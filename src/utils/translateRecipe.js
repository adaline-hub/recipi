import { translateText } from './translate';
import { mapLanguageToBaidu } from './baiduTranslate';

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
    if (targetLang === sourceLanguage) {
      // Store original content for source language
      translations[targetLang] = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
      };
      continue;
    }

    try {
      // Translate each field
      const [translatedTitle, translatedInstructions, translatedNotes] = await Promise.all([
        translateText(
          recipe.title,
          mapLanguageToBaidu(sourceLanguage),
          mapLanguageToBaidu(targetLang)
        ),
        recipe.instructions
          ? translateText(
              recipe.instructions,
              mapLanguageToBaidu(sourceLanguage),
              mapLanguageToBaidu(targetLang)
            )
          : '',
        recipe.notes
          ? translateText(
              recipe.notes,
              mapLanguageToBaidu(sourceLanguage),
              mapLanguageToBaidu(targetLang)
            )
          : '',
      ]);

      // Translate ingredients (array of strings)
      const translatedIngredients = await Promise.all(
        recipe.ingredients.map((ing) =>
          translateText(
            ing,
            mapLanguageToBaidu(sourceLanguage),
            mapLanguageToBaidu(targetLang)
          )
        )
      );

      translations[targetLang] = {
        title: translatedTitle,
        ingredients: translatedIngredients,
        instructions: translatedInstructions,
        notes: translatedNotes,
      };
    } catch (err) {
      console.error(`Error translating recipe to ${targetLang}:`, err);
      // If translation fails, use original content as fallback
      translations[targetLang] = {
        title: recipe.title,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        notes: recipe.notes,
      };
    }
  }

  return {
    ...recipe,
    translations,
  };
}
