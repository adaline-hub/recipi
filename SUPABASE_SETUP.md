# Recipi + Supabase Real-Time Collaboration Setup

This guide explains how to set up real-time recipe synchronization between you and your mom using Supabase.

## Architecture Overview

- **Recipes live in Supabase** (cloud database)
- **App works offline** using IndexedDB as a local cache
- **Real-time sync** when online — when mom adds a recipe, it automatically appears in your app
- **Import/Export remains** as a backup option

---

## Step 1: Create a Supabase Project

1. **Sign up or log in**: https://app.supabase.com
2. **Create a new project**:
   - Click "New Project"
   - Choose organization (or create one)
   - Give it a name: `recipi`
   - Create a strong password (save it!)
   - Select a region close to you

3. **Wait for setup** (~2 minutes)
   - You'll get an email when the project is ready

---

## Step 2: Create the `recipes` Table

1. **Go to the SQL Editor**:
   - In Supabase dashboard, click "SQL Editor" (left sidebar)
   - Click "New Query"

2. **Run this SQL** to create the table:

```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions TEXT,
  notes TEXT,
  photo TEXT,
  language TEXT DEFAULT 'en',
  translations JSONB DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow all users to read recipes (no authentication required for now)
CREATE POLICY "Allow read access" ON recipes
  FOR SELECT USING (true);

-- Allow all users to insert recipes
CREATE POLICY "Allow insert access" ON recipes
  FOR INSERT WITH CHECK (true);

-- Allow all users to update recipes
CREATE POLICY "Allow update access" ON recipes
  FOR UPDATE USING (true);

-- Allow all users to delete recipes
CREATE POLICY "Allow delete access" ON recipes
  FOR DELETE USING (true);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE recipes;
```

3. **Click "Run"** (or Ctrl+Enter)
   - You should see "Success" message

---

## Step 3: Get Your API Credentials

1. **Go to Project Settings**:
   - Click the gear icon ⚙️ (bottom left) → "Settings"
   - Or go to: https://app.supabase.com/project/_/settings/api

2. **Copy these values**:
   - **Project URL**: Look for "URL" field (starts with `https://`)
   - **Anon Public Key**: Look for "anon public" key (a long string starting with `eyJ...`)

---

## Step 4: Configure the Frontend

1. **Copy the example env file**:
   ```bash
   cd /home/adeline/.openclaw/workspace/recipi
   cp .env.local.example .env.local
   ```

2. **Edit `.env.local`** and paste your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-long-anon-key-here
   ```

3. **Save the file**

---

## Step 5: Test the Setup

1. **Start the dev server** (if not already running):
   ```bash
   cd /home/adeline/.openclaw/workspace/recipi
   npm run dev
   ```

2. **Open the app** in your browser:
   - Usually http://localhost:5173

3. **Check the sync indicator** in the top-right corner:
   - ✓ Synced = working!
   - ⟳ Syncing = in progress
   - ⊗ Offline = not configured or network down
   - ! Error = check console for details

4. **Add a test recipe** and make sure it appears in Supabase:
   - Go to Supabase dashboard → "Table Editor"
   - Click "recipes" table
   - You should see your test recipe listed

---

## Step 6: Share with Your Mom

Your mom needs to:

1. **Have access to the same Supabase project**
   - You can invite her in Supabase: Settings → Team → Invite
   - Or share the URL + anon key with her

2. **Install the same frontend**:
   - Clone or copy the repo to her computer
   - Configure the same `.env.local` file
   - Run `npm install && npm run dev`

3. **Start adding recipes**:
   - When she adds a recipe, it appears in Supabase
   - Your app auto-syncs and shows it instantly
   - And vice versa!

---

## How It Works

### On App Load
1. App checks if Supabase is configured
2. Fetches all recipes from Supabase cloud
3. Saves them to local IndexedDB cache
4. Subscribes to real-time changes

### When You Add a Recipe
1. You fill out the form and tap Save
2. Recipe is saved to **local IndexedDB** instantly ✓
3. Recipe is also sent to **Supabase** (sync status shows "Syncing...")
4. When Supabase confirms, status changes to "Synced" ✓

### When Your Mom Adds a Recipe
1. She adds and saves a recipe in her app
2. It's sent to Supabase
3. Your app receives a **real-time notification**
4. Recipe auto-syncs to your local IndexedDB
5. You see it instantly in your list! 🎉

### Going Offline
- Your app still works 100% using the local cache
- Any recipes you add are saved locally
- When you go back online, they'll sync to Supabase

### Conflicts
- If you both edit the same recipe at the same time, **last-write-wins**
- The most recent `updatedAt` timestamp takes priority

---

## Troubleshooting

### Sync status shows "Offline"
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env.local`
- Check your internet connection
- Check browser console (F12) for errors

### No real-time updates
- Real-time works automatically if configured
- Check that the `recipes` table has `ALTER PUBLICATION supabase_realtime ADD TABLE recipes;` (see Step 2)
- Refresh your browser

### Recipes not appearing in Supabase
- Check sync status (should be "Synced", not "Error")
- Check browser console (F12 → Console tab) for error messages
- Verify table schema in Supabase dashboard

### "Error" status in sync indicator
- Open browser console (F12)
- Look for red error messages
- Common issues:
  - Missing `.env.local` file
  - Wrong API key or URL
  - Network connectivity
  - CORS issues (shouldn't happen, but worth checking)

---

## Schema Details

The `recipes` table has these columns:

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID | Unique identifier, auto-generated |
| `title` | TEXT | Recipe name |
| `ingredients` | JSON Array | List of ingredients |
| `instructions` | TEXT | How to make it |
| `notes` | TEXT | Tips and memories |
| `photo` | TEXT | Base64-encoded image |
| `language` | TEXT | Original language (en, fr, ja, zh-CN) |
| `translations` | JSON Object | Translations in other languages |
| `created_by` | TEXT | Who added it (Little B or Little Pan) |
| `created_at` | TIMESTAMP | When it was created |
| `updated_at` | TIMESTAMP | When it was last updated |

---

## Import/Export (Backup)

The existing Import/Export feature **still works**:
- You can export recipes to JSON anytime
- You can import from a JSON backup
- This is independent of Supabase — use it as a backup plan

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Create recipes table
3. ✅ Get API credentials
4. ✅ Configure `.env.local`
5. ✅ Test with a demo recipe
6. ✅ Share with your mom
7. 🎉 Start collaborating!

Questions? Check the browser console (F12) for detailed error messages.
