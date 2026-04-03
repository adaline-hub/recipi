# Recipi — Real-Time Collaboration with Supabase

Welcome to Recipi with real-time sync! This app lets you and your mom collaborate on recipe collection with instant updates.

## What Can You Do?

✨ **Add recipes** → they sync to Supabase  
📱 **Your mom adds recipes** → they appear in your app instantly  
📡 **Work offline** → changes sync when you go online  
🔄 **Real-time updates** → see changes as they happen  
💾 **Backup anytime** → export to JSON  

## Quick Start (5 Minutes)

See **`QUICK_START.md`** for the fastest path to getting this working.

## Complete Setup Guide

See **`SUPABASE_SETUP.md`** for detailed instructions, SQL to run, and troubleshooting.

## Implementation Details

See **`IMPLEMENTATION_SUMMARY.md`** for technical details about what was built.

## What's Changed Since Last Time?

### New Features
- ✅ Real-time recipe sync with Supabase
- ✅ Automatic offline support (IndexedDB cache)
- ✅ Sync status indicator in UI
- ✅ Mom can add recipes and you see them instantly
- ✅ Conflict-free last-write-wins resolution

### New Dependencies
- `@supabase/supabase-js` — Supabase client library

### Modified Components
- `src/App.jsx` — Initializes Supabase on load
- `src/components/RecipeForm.jsx` — Saves to Supabase
- `src/components/RecipeDetail.jsx` — Deletes from Supabase
- `src/components/RecipeList.jsx` — Shows sync status
- `package.json` — Added Supabase dependency

### New Files
- `src/lib/supabaseClient.js` — Supabase connection
- `src/lib/supabaseSync.js` — All sync logic
- `src/components/SyncStatus.jsx` — Status indicator
- `.env.local.example` — Configuration template
- `supabase_migrations/001_create_recipes_table.sql` — Database schema

### Existing Features
- ✅ Import/Export still works (JSON backup)
- ✅ Multi-language support (en, fr, ja, zh-CN)
- ✅ Photos, notes, translations — all preserved
- ✅ Works as a PWA (installable on phone)

## How Real-Time Sync Works

### Architecture
```
Your Computer                    Cloud (Supabase)            Mom's Computer
     ↓                                  ↓                            ↓
  Local IndexedDB ←→ Real-Time Sync ←→ recipes table ←→ Real-Time Sync ←→ Local IndexedDB
```

### On App Start
1. Fetch all recipes from Supabase
2. Cache them in local IndexedDB
3. Subscribe to real-time changes
4. Ready to use

### When You Add a Recipe
1. Save to local IndexedDB (instant ✓)
2. Send to Supabase (syncing...)
3. Status updates to "✓ Synced"

### When Mom Adds a Recipe
1. She saves in her app
2. Goes to Supabase
3. Your app gets real-time notification
4. Auto-syncs to your local cache
5. Recipe appears in your list 🎉

### Going Offline
- App works 100% with local cache
- Any recipes you add/edit stay local
- When you go online, everything syncs

## Setting Up

### Prerequisites
- Node.js installed
- A Supabase account (free at https://supabase.com)

### Steps
1. **Create Supabase project** (2 min)
   - Go to https://app.supabase.com
   - Create new project named "recipi"

2. **Create database table** (1 min)
   - Use SQL Editor
   - Run the SQL from `supabase_migrations/001_create_recipes_table.sql`

3. **Get credentials** (1 min)
   - Go to Project Settings → API
   - Copy Project URL and Anon Key

4. **Configure app** (1 min)
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your credentials
   ```

5. **Test** (1 min)
   ```bash
   npm run dev
   # Add a recipe, check Supabase dashboard
   ```

6. **Share with your mom** (varies)
   - Give her this repo
   - She does steps 1-4 (same Supabase project)
   - Both of you run `npm run dev`
   - Start collaborating!

## Sync Status Indicator

In the top-right of the app, you'll see:

| Icon | Text | Meaning |
|------|------|---------|
| ✓ | Synced | Everything is up to date |
| ⟳ | Syncing | Currently syncing |
| ⊗ | Offline | No Supabase connection |
| ! | Error | Sync problem (check console) |

## Troubleshooting

### "Offline" status
- Check `.env.local` has correct credentials
- Check internet connection
- Check browser console (F12) for errors

### Recipes not appearing in Supabase
- Check sync status
- Open console (F12 → Console)
- Look for red error messages

### Real-time updates not working
- Refresh page
- Check SQL migration ran successfully
- Make sure both apps are running

### "Error" status
- Open browser console (F12)
- Look for error messages
- Usually caused by:
  - Missing `.env.local`
  - Wrong API key
  - Network issue

See **`SUPABASE_SETUP.md`** for detailed troubleshooting.

## Going to Production

To deploy permanently:

1. **Deploy to Vercel**
   - Push to GitHub
   - Connect to Vercel
   - Add environment variables
   - Deploy

2. **Share the URL with your mom**
   - She opens in browser
   - No local setup needed
   - Syncing works the same

## Database Schema

The `recipes` table:

```sql
id              UUID (auto-generated)
title           TEXT (recipe name)
ingredients     JSON array
instructions    TEXT
notes           TEXT
photo           TEXT (base64)
language        TEXT (en, fr, ja, zh-CN)
translations    JSON object (multi-language)
created_by      TEXT (who added it)
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

Row-level security is enabled with permissive policies (suitable for a private family app).

Real-time subscriptions are active, so changes sync instantly.

## Files You Need to Know About

- `QUICK_START.md` — 5-minute setup
- `SUPABASE_SETUP.md` — Detailed guide (7000+ words)
- `IMPLEMENTATION_SUMMARY.md` — Technical details
- `SUPABASE_IMPLEMENTATION_COMPLETE.txt` — Big picture summary
- `src/lib/supabaseClient.js` — Supabase connection
- `src/lib/supabaseSync.js` — All sync logic
- `src/components/SyncStatus.jsx` — Status indicator
- `.env.local.example` — Configuration template
- `supabase_migrations/001_create_recipes_table.sql` — Database schema

## Security

For a **private family app**, this is secure:
- Row-level security (RLS) is enabled
- Open policies are appropriate for personal use

If you later want to add:
- Multi-user with authentication
- Fine-grained access control
- Public sharing

Just update the RLS policies in Supabase — the frontend supports it.

## Features Overview

| Feature | Status | Notes |
|---------|--------|-------|
| Add/Edit/Delete recipes | ✅ | Works offline, syncs online |
| Real-time collaboration | ✅ | Mom's recipes appear instantly |
| Photo storage | ✅ | Base64 in database |
| Multi-language | ✅ | en, fr, ja, zh-CN |
| Offline support | ✅ | IndexedDB cache |
| Import/Export | ✅ | JSON backup still works |
| Sync status UI | ✅ | Real-time indicator |
| PWA/Installable | ✅ | Works on iOS/Android |

## Performance

- Real-time subscriptions only activate when data changes
- Initial fetch: all recipes in one request
- Offline: instant saves to local cache
- Online: async sync to cloud
- Conflict resolution: last-write-wins by timestamp

## Next Steps (Optional)

After basic setup works:
- [ ] Deploy to Vercel for persistent URL
- [ ] Add Supabase authentication
- [ ] Set up automated backups
- [ ] Add recipe search filters
- [ ] Compress photos before upload

## Support

1. **Setup problems?** → Read `SUPABASE_SETUP.md`
2. **Code problems?** → Check `IMPLEMENTATION_SUMMARY.md`
3. **Sync issues?** → Check browser console (F12)
4. **Supabase questions?** → https://supabase.com/docs

## License & Attribution

Recipi + Supabase integration completed April 2026.

Based on the original Recipi project with offline-first architecture.

---

**Ready to get started? → Open `QUICK_START.md`** ⏱️
