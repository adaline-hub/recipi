# Recipi Translation Feature — Test Guide

## Quick Test (5 minutes)

### Prerequisites
- Recipi running locally (`npm run dev` on port 5173)
- Browser open

### Test Steps

#### Step 1: Add a Chinese Recipe
1. Open Recipi
2. Click **"＋ 新增食谱"** (Add Recipe) or switch to Chinese first
3. Fill in:
   - **食谱名称 (Recipe Name):** 番茄鸡蛋面 (Tomato Egg Noodles)
   - **创建者 (Creator):** 妈妈 (Mom)
   - **食谱语言 (Language):** 中文（简体） (Chinese Simplified)
   - **食材 (Ingredients):**
     ```
     番茄 2个
     鸡蛋 3个
     面条 300克
     盐 1茶匙
     油 2汤匙
     ```
   - **做法 (Instructions):** Tomato and eggs fried together, then mixed with noodles
   - **语言:** 中文（简体）
4. Click **"新增食谱"** (Add Recipe)

#### Step 2: Switch to English and Auto-Translate
1. Change app language to **English** (top-left corner)
2. Open the recipe you just created (should be at the top)
3. Click **"🌐 Add Translation"** button (blue button with globe)
4. Modal opens with:
   - Dropdown showing "English"
   - Original recipe preview
   - **"✨ Auto"** button next to language selector
5. Click **"✨ Auto"** button
6. Wait 2-3 seconds...
7. **✅ Fields should populate:**
   - Title: "Tomato and Egg Noodles" (or similar)
   - Ingredients: Auto-translated, each on new line
   - Instructions: Auto-translated text
8. Review translations (should be readable English)
9. Click **"Save English Translation"** button

#### Step 3: View Translated Recipe
1. Recipe now displays in English
2. Look at the **blue header section**:
   - Should show: **"Translated by 妈妈 on [Today's Date]"**
   - Should show: **"✨ Auto-translated"** badge (small text below date)
3. Content is in English throughout
4. Ingredients are properly formatted with line breaks

#### Step 4: Verify Translation Works Both Ways
1. Click **"← Back"** to list
2. Change language back to **中文 (Chinese)**
3. Open the same recipe again
4. Now shows **original Chinese text** (unaffected)
5. Change back to **English**
6. Shows **English translation** you created

---

## What to Look For

### ✅ Success Indicators
- Auto-translate button appears and is clickable
- Fields populate with translated text within 2-3 seconds
- Translation saved and shows in header metadata
- "✨ Auto-translated" badge appears
- Can switch between original and translation
- Ingredient list maintains structure (one per line)

### ⚠️ If Something Breaks
- **Auto-translate doesn't work?** Check browser console (F12) for errors
- **Translation is gibberish?** Try different ingredient (translator may struggle with some cuisines)
- **Modal won't open?** Refresh page and try again
- **Saved but not showing?** Refresh browser

---

## Test Scenarios

### Scenario A: Chinese → English (Most Important)
- ✅ Main use case
- Recipe created in Chinese, translated to English

### Scenario B: English → French
- Create recipe in English
- Switch language to French
- Click "🌐 Add Translation" → French
- Auto-translate
- Verify it shows in French

### Scenario C: Manual Entry (Fallback)
- If auto-translate fails or you want manual control:
- Click "✨ Auto" button
- Wait for timeout (it will fail silently)
- Manually type translation
- Click "Save [Language] Translation"
- ✅ Should work fine

---

## Expected Output Example

### Original (Chinese)
```
番茄鸡蛋面
食材：
• 番茄 2个
• 鸡蛋 3个
• 面条 300克

做法：
Fry tomatoes and eggs together, toss with noodles
```

### Translated (English)
```
Tomato and Egg Noodles
Ingredients:
• 2 tomatoes
• 3 eggs
• 300g noodles

Instructions:
Fry tomatoes and eggs together, toss with noodles
```

**Header Shows:**
```
原文：中文（简体）
正在以English显示
1 个翻译

Translated by 妈妈 on Apr 3, 2026
✨ Auto-translated
```

---

## Known Limitations

- **Translation API:** Uses free tier (may be slow or have rate limits)
- **Quality:** Works well for recipes, may struggle with slang/idioms
- **Offline:** Requires internet connection
- **Ingredients:** Better with structured lists than prose descriptions
- **Cultural dishes:** May not know specialized ingredient names

---

## Bug Report Template

If something doesn't work, include:
1. What language(s) you tested
2. What recipe content you used
3. Error message (if any) from browser console
4. Whether auto-translate button appeared
5. What happened instead of expected behavior

---

**Ready to test? Start with Step 1! 🎉**
