import cloudbase from '@cloudbase/js-sdk';

const TCB_ENV = 'recipi-6gjlno6o87a7532b';
const TCB_PUBLISHABLE_KEY = import.meta.env.VITE_TCB_PUBLISHABLE_KEY;

const app = cloudbase.init({ env: TCB_ENV, region: 'ap-singapore' });
const auth = app.auth({ publishableKey: TCB_PUBLISHABLE_KEY });

let authReady = false;
async function ensureAuth() {
  if (authReady) return;
  await auth.signInAnonymously();
  authReady = true;
}

// Language code mapping for Baidu
export function mapLanguageToBaidu(langCode) {
  const mapping = {
    'en': 'en',
    'fr': 'fr',
    'ja': 'ja',
    'zh-CN': 'zh',
  };
  return mapping[langCode] || langCode;
}

export function isBaiduConfigured() {
  return true;
}

/**
 * Translate text via Tencent CloudBase callFunction (no CORS issues).
 * Calls the 'translate' Regular Cloud Function using the SDK.
 */
export async function translateWithBaidu(text, fromLang, toLang) {
  if (!text || text.trim().length === 0) return text;

  const from = mapLanguageToBaidu(fromLang);
  const to = mapLanguageToBaidu(toLang);

  if (from === to) return text;

  try {
    await ensureAuth();
    const result = await app.callFunction({
      name: 'translate',
      data: { text, from, to },
    });
    return result?.result?.translated || text;
  } catch (error) {
    console.warn(`Translation from ${fromLang} to ${toLang} failed:`, error);
    return text;
  }
}
