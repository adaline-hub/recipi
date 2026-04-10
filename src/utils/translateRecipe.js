// Translation temporarily disabled - Cloud Function permissions need to be fixed
const ALL_LANGUAGES = ['en', 'zh-CN', 'fr', 'ja'];

export async function translateRecipeToAllLanguages(recipe, _sourceLanguage) {
  const translations = {};
  for (const targetLang of ALL_LANGUAGES) {
    translations[targetLang] = {
      title: recipe.title,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      notes: recipe.notes,
    };
  }
  return { ...recipe, translations };
}
