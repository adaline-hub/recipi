# Quick Start — Recipi + Supabase (5 minutes)

## TL;DR — The Fastest Path to Real-Time Recipes

### 1. Create Supabase Project (2 min)
```
→ Go to https://app.supabase.com
→ Click "New Project"
→ Name it "recipi"
→ Remember the password
→ Wait for email (project is ready)
```

### 2. Create Database Table (1 min)
```
→ Go to SQL Editor in your project
→ Click "New Query"
→ Copy/paste everything from: supabase_migrations/001_create_recipes_table.sql
→ Click "Run"
→ Should say "Success"
```

### 3. Get Your Credentials (1 min)
```
→ Click Settings (⚙️ icon bottom-left)
→ Go to "API"
→ Copy: Project URL (looks like https://xxxxx.supabase.co)
→ Copy: Anon public key (long string starting with eyJ...)
```

### 4. Configure Your App (1 min)
```bash
# In terminal:
cd /home/adeline/.openclaw/workspace/recipi
cp .env.local.example .env.local

# Edit .env.local with the values from Step 3
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-long-key-here
```

### 5. Run & Test (1 min)
```bash
# Make sure dev server is running:
npm run dev

# Open http://localhost:5173
# Look for sync status indicator (top right)
# Should show "✓ Synced" or "Offline" (depends on .env setup)
# Add a test recipe
# Check Supabase Dashboard → Table Editor → recipes
# You should see your recipe there!
```

---

## Common Issues

| Issue | Fix |
|-------|-----|
| Status says "Offline" | Check `.env.local` has correct URL and key |
| No recipes appear in Supabase | Check sync status, look at browser console (F12) for errors |
| Can't find API credentials | Go to your project → Settings (⚙️) → API |
| SQL failed to run | Check for typos, make sure you're in SQL Editor (not Table Editor) |

---

## Ready to Share with Your Mom?

1. She gets a copy of this project
2. She does Steps 1-4 (same Supabase project)
3. Both of you run `npm run dev`
4. Start adding recipes — they sync automatically!

---

## Full Docs

- **Setup details:** `SUPABASE_SETUP.md`
- **What changed in code:** `IMPLEMENTATION_SUMMARY.md`
- **Troubleshooting:** Both docs above have troubleshooting sections

---

**You're done! 🎉**
