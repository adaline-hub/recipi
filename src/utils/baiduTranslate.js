import CryptoJS from 'crypto-js';

const BAIDU_APPID = import.meta.env.VITE_BAIDU_APPID;
const BAIDU_SECRET_KEY = import.meta.env.VITE_BAIDU_SECRET_KEY;
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

function generateSign(query, salt) {
  const str = BAIDU_APPID + query + salt + BAIDU_SECRET_KEY;
  return CryptoJS.MD5(str).toString();
}

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
  return !!(BAIDU_APPID && BAIDU_SECRET_KEY);
}

export async function translateWithBaidu(text, fromLang, toLang) {
  if (!text || text.trim().length === 0) {
    return text;
  }

  const fromLangBaidu = mapLanguageToBaidu(fromLang);
  const toLangBaidu = mapLanguageToBaidu(toLang);

  if (fromLangBaidu === toLangBaidu) {
    return text;
  }

  try {
    const salt = Math.random().toString().slice(2);
    const sign = generateSign(text, salt);

    const params = new URLSearchParams();
    params.append('q', text);
    params.append('from', fromLangBaidu);
    params.append('to', toLangBaidu);
    params.append('appid', BAIDU_APPID);
    params.append('salt', salt);
    params.append('sign', sign);

    const response = await fetch(BAIDU_API_URL, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      console.error(`Baidu API error: ${response.status}`);
      return text;
    }

    const data = await response.json();

    if (data.error_code) {
      console.warn(`Baidu translation error (${data.error_code}): ${data.error_msg}`);
      return text;
    }

    if (data.trans_result && data.trans_result.length > 0) {
      return data.trans_result[0].dst;
    }

    return text;
  } catch (error) {
    console.warn(`Translation from ${fromLang} to ${toLang} failed:`, error);
    return text;
  }
}
