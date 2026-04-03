import translate from 'translate-google';

/**
 * Translate text from source language to target language
 * Uses google-translate-api-free (no API key required)
 */
export async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // If source and target are the same, return as-is
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  try {
    const result = await translate(text, {
      from: sourceLanguage,
      to: targetLanguage,
    });
    return result;
  } catch (error) {
    console.warn(`Translation from ${sourceLanguage} to ${targetLanguage} failed:`, error);
    // Return original text if translation fails
    return text;
  }
}
