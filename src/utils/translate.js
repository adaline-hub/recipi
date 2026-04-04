import { translateWithBaidu, isBaiduConfigured } from './baiduTranslate';

/**
 * Translate text from source language to target language
 * Uses Baidu Translate API (requires API credentials in .env.local)
 */
export async function translateText(text, sourceLanguage, targetLanguage) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // If source and target are the same, return as-is
  if (sourceLanguage === targetLanguage) {
    return text;
  }

  if (!isBaiduConfigured()) {
    console.warn('⚠️ Baidu Translate API not configured. Using original text.');
    return text;
  }

  return translateWithBaidu(text, sourceLanguage, targetLanguage);
}
