# START HERE — Recipi + Supabase Setup Guide

Welcome! Real-time recipe collaboration is ready. Here's how to get started.

## ⏱️ Time Required: 10 Minutes

- Create Supabase project: 2 min
- Create database table: 1 min
- Get credentials: 1 min
- Configure app: 1 min
- Test: 5 min

## 📖 Pick Your Path

### 🚀 Fast Track (5 minutes)
If you want to get up and running **right now**:

**→ Open `QUICK_START.md`**

Follow the 5 steps and you're done.

---

### 📚 Detailed Setup (15 minutes)
If you want **comprehensive explanations** and **troubleshooting**:

**→ Open `SUPABASE_SETUP.md`**

This is a 7,000+ word guide with:
- Step-by-step instructions
- Explanations of each step
- SQL to copy/paste
- Detailed troubleshooting
- How to share with your mom

---

### 🔍 What's the Architecture? (Technical deep-dive)
If you want to **understand how it works** before setting up:

**→ Open `IMPLEMENTATION_SUMMARY.md`**

This explains:
- What was built
- How real-time sync works
- Data flow diagrams
- Files that changed

---

### 💡 Quick Reference
If you've already set up and just need **answers**:

**→ Open `README_SUPABASE.md`**

Quick reference guide with:
- Feature overview
- Database schema
- Sync status meanings
- Troubleshooting checklist

---

## 🎯 The Plan

```
Step 1: Create Supabase Project
        ↓ (2 min)
        
Step 2: Create Database Table
        ↓ (1 min)
        
Step 3: Get Credentials
        ↓ (1 min)
        
Step 4: Configure .env.local
        ↓ (1 min)
        
Step 5: Test & Verify
        ↓ (5 min)
        
✅ DONE! Recipes now sync in real-time
```

## 📋 What You're Setting Up

**Goal:** Real-time recipe collaboration between you and your mom

**How it works:**
1. You add a recipe → syncs to Supabase cloud
2. Your mom sees it instantly in her app
3. She adds a recipe → you see it instantly
4. Works offline too!

**Why Supabase?**
- Easy to set up (5 minutes)
- Real-time sync out of the box
- Free tier covers your needs
- No code to write (already done!)

## ✅ What's Been Done For You

✅ Frontend code fully integrated with Supabase  
✅ Real-time sync logic implemented  
✅ Offline support built in  
✅ Sync status UI added  
✅ All dependencies installed  
✅ All documentation written  
✅ Code compiled and tested  

**You just need to:**
- Create a Supabase project
- Configure `.env.local` with your credentials
- That's it!

## 🚨 Important Files

| File | What It Is | When To Read |
|------|-----------|--------------|
| `QUICK_START.md` | 5-minute fast track | If you want to start NOW |
| `SUPABASE_SETUP.md` | Detailed guide | If you want explanations |
| `IMPLEMENTATION_SUMMARY.md` | Technical details | If you want to understand code |
| `README_SUPABASE.md` | Quick reference | If you need answers later |
| `.env.local.example` | Configuration template | When configuring the app |
| `supabase_migrations/001_create_recipes_table.sql` | Database schema | When creating the table |

## 💻 What You'll Do

### In Browser (Supabase)
1. Create a project at https://app.supabase.com
2. Run some SQL to create the database table
3. Copy your API credentials

### In Terminal
```bash
cd /home/adeline/.openclaw/workspace/recipi
cp .env.local.example .env.local
# Edit .env.local with your credentials
```

### In App
1. Run: `npm run dev`
2. Add a test recipe
3. Check Supabase dashboard to verify it's there
4. Done!

## 🎁 What You Get

**Immediately:**
- Real-time sync with Supabase
- Offline-first architecture (app works without internet)
- Sync status indicator
- All existing features (import/export, photos, translations)

**Later (optional):**
- Deploy to Vercel for permanent URL
- Add authentication for multi-user
- Set up automated backups

## ❓ FAQ

**Q: Will this break my existing recipes?**  
A: No! All existing recipes in your local IndexedDB will stay. When you connect Supabase, they'll sync to the cloud.

**Q: Can I use it offline?**  
A: Yes! The app works 100% offline. Changes sync when you're back online.

**Q: What if internet drops mid-recipe?**  
A: No problem! It saves locally and syncs automatically when connection returns.

**Q: Can my mom use the same Supabase project?**  
A: Yes! You both use the same project. That's how you see each other's recipes.

**Q: What happens if we edit the same recipe at the same time?**  
A: Last edit wins. Whoever saves last has their version in the cloud.

**Q: Is this secure?**  
A: Yes! Row-level security is enabled. It's suitable for a private family app.

## 🆘 Need Help?

1. **Setup stuck?** → Follow `QUICK_START.md` step-by-step
2. **Don't understand something?** → Read `SUPABASE_SETUP.md`
3. **Sync not working?** → Check browser console (F12)
4. **Still stuck?** → See troubleshooting in `SUPABASE_SETUP.md`

## ⏭️ What's Next?

### Immediately
1. Pick your path above (Fast Track or Detailed)
2. Follow the steps
3. Test it
4. Celebrate! 🎉

### Soon
- Give your mom a copy
- Have her set up with the same Supabase project
- Start collaborating!

### Later
- Deploy to Vercel
- Add more features
- Invite family members

## 📊 System Diagram

```
Adeline's Computer              Cloud Database            Mom's Computer
        ↓                              ↓                        ↓
   Your App                    Supabase Cloud              Her App
   (React)                   (recipes table)              (React)
        ↓                              ↓                        ↓
   IndexedDB ←→ Real-Time Sync ←→ PostgreSQL ←→ Real-Time Sync ←→ IndexedDB
   (local                    (auto-sync)                    (local
    cache)                                                   cache)

When you add a recipe:
  1. Save to your IndexedDB (instant ✓)
  2. Send to Supabase (sync...)
  3. Status updates (✓ Synced)

When mom adds a recipe:
  1. She saves to her IndexedDB
  2. Sends to Supabase
  3. You get real-time notification
  4. Auto-syncs to your IndexedDB
  5. You see it instantly! 🎉
```

## 🎯 Your Next Step

**→ Open `QUICK_START.md` and follow the 5 steps!**

Or if you prefer detailed instructions:

**→ Open `SUPABASE_SETUP.md`**

Either way, you'll be set up in under 10 minutes.

---

**You've got this!** 🚀

Questions? The answers are in the docs above.

Happy cooking with real-time sync! 👩‍🍳✨
