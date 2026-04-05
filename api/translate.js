import CryptoJS from 'crypto-js';

export default async function handler(req, res) {
  // Allow CORS from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text, from, to } = req.body;

  if (!text || !from || !to) {
    return res.status(400).json({ error: 'Missing text, from, or to' });
  }

  const APPID = process.env.VITE_BAIDU_APPID;
  const SECRET = process.env.VITE_BAIDU_SECRET_KEY;

  if (!APPID || !SECRET) {
    return res.status(500).json({ error: 'Baidu credentials not configured' });
  }

  const salt = Date.now().toString();
  const sign = CryptoJS.MD5(APPID + text + salt + SECRET).toString();

  const params = new URLSearchParams({ q: text, from, to, appid: APPID, salt, sign });

  try {
    const response = await fetch(`https://fanyi-api.baidu.com/api/trans/vip/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    const data = await response.json();

    if (data.error_code) {
      return res.status(400).json({ error: data.error_msg });
    }

    const translated = data.trans_result?.[0]?.dst || text;
    return res.status(200).json({ translated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
