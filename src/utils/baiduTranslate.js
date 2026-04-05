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
  return true; // Always available via the server-side proxy
}

/**
 * Translate text via Tencent CloudBase Cloud Function.
 * Works from both US and China (hosted on Tencent servers).
 */
export async function translateWithBaidu(text, fromLang, toLang) {
  if (!text || text.trim().length === 0) return text;

  const from = mapLanguageToBaidu(fromLang);
  const to = mapLanguageToBaidu(toLang);

  if (from === to) return text;

  try {
    const response = await fetch('https://recipi-6gjlno6o87a7532b.ap-singapore.app.tcloudbase.com/http/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, from, to }),
    });

    if (!response.ok) return text;

    const data = await response.json();
    return data.translated || text;
  } catch (error) {
    console.warn(`Translation from ${fromLang} to ${toLang} failed:`, error);
    return text;
  }
}
