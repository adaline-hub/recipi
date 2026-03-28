# Recipi 🍴

A family recipe manager that works offline. Built with React + Vite + Dexie.js (IndexedDB) + Tailwind CSS. Installable as a PWA.

## Features

- 📱 Mobile-first, warm design
- 💾 100% offline — stores everything in IndexedDB
- 🔍 Search recipes by title
- ✏️ Add, edit, delete recipes
- 📤 Export/import recipes as JSON (backup & sync across devices)
- 📲 Installable as a PWA (works like a native app)

## Tech Stack

- React 18 + Vite
- Dexie.js (IndexedDB wrapper)
- Tailwind CSS v4
- vite-plugin-pwa (Workbox)

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy

Push to GitHub and connect to Vercel. Zero config needed — Vite output goes to `dist/`.

## Import/Export Format

```json
{
  "version": 1,
  "exportedAt": "2026-03-28T08:00:00.000Z",
  "recipes": [
    {
      "id": "uuid-v4",
      "title": "Recipe Name",
      "ingredients": ["2 cups flour", "1 tsp salt"],
      "instructions": "Mix everything...",
      "notes": "Optional notes",
      "createdAt": 1234567890000,
      "updatedAt": 1234567890000
    }
  ]
}
```
