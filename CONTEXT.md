# Recipi — Context

## Recall
`subcog recall "recipi"`

## Status
**Live on Vercel.** Full feature set complete: offline-first PWA, multi-language, optional photo per recipe, import/export. Ready for Adeline's mama to use.

## Runtime
- **Deployed:** https://recipi-neon.vercel.app
- **Repo:** https://github.com/adaline-hub/recipi (main branch)
- **Stack:** React 18 + Vite, Dexie.js (IndexedDB), i18n (react-i18next)
- **Languages:** EN, FR, JA, ZH-CN (simplified Chinese)
- **Storage:** IndexedDB (offline), photos as base64 (max 1200px JPEG)

## Blockers
None. Feature-complete.

## Active Sprint
- ✅ Core CRUD (add/edit/delete recipes)
- ✅ Multi-language UI (4 languages)
- ✅ Photo upload per recipe
- ✅ Import/Export JSON with merge logic
- ✅ PWA service worker (offline mode)
