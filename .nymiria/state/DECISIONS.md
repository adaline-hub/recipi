# Decision Log

*Record architectural and technical decisions here.*
## 2026-04-04 — language**, not just the UI.
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** I understand now. You want recipes to **automatically show in the selected language**, not just the UI.

Currently:
- UI translates (i18n works)
- Recipe content only translates if manually saved in that language

You want:
- Switch to Chinese → recipes auto-display in Chinese
- Switch to French → r

---
## 2026-04-05 — set up Tencent CloudBase. Follow these steps:
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** Perfect! Let's set up Tencent CloudBase. Follow these steps:

**Step 1 — Create Tencent Cloud account**
1. Go to https://cloud.tencent.com/
2. Click **注册** (Register)
3. Choose phone number registration
4. Complete identity verification (required for Chinese cloud services)

**Step 2 — Enable CloudB

---
## 2026-04-05 — try **API Key authentication instead** (more reliable for web):
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** Fair point — you've already paid. Let me debug properly.

The issue is **anonymous login authentication**. Let's try **API Key authentication instead** (more reliable for web):

**Step 1 — Get API Key from Tencent:**
1. Go to your Tencent CloudBase console
2. Click **安全配置** (Security Settings)
3. Lo

---
## 2026-04-05 — the **older Tencent CloudBase console** instead:
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** I see the issue now. You're in the **Relational Database** (MySQL) section, but the JS SDK uses Tencent CloudBase's **built-in document database**, which is different.

The Tencent console seems to have been reorganized. Try going to the **older Tencent CloudBase console** instead:

**Go to: https:/

---
## 2026-04-05 — just test if the app can save.** Since sync was showing "synced" earlier, maybe
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** That's the external MongoDB connection wizard again. That's **not** what CloudBase uses natively.

The CloudBase JS SDK uses CloudBase's **built-in document database**, not an external MongoDB. The problem is your environment may not have the built-in database activated.

**Let me try a different ap

---
## 2026-04-05 — set it up now. Here's what to do:
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** Two important things from this log:

**Good news:** Your recipes ARE loading — I can see 6 different recipe IDs in the logs. Sync is working!

**Bad news:** You're still running the **old code** (`index-Czfqaz3B.js`). Our new code hasn't been picked up yet. Do a hard refresh:

**Mac: Cmd + Shift + R

---
## 2026-04-05 — fix CORS in Tencent.** That's the immediate blocker. In your Tencent CloudBase c
**Provider:** claude
**Rationale:** (auto-detected)
**Source:** Good questions. Let me clarify both:

**1. To update the function code:**
In the Tencent console, look for an **"Edit"** or **"Modify"** button on the translate function. You should be able to upload a new zip without deleting. If you can't find it, yes, you'd need to delete and recreate.

**2. For 

---
## 2026-04-14 — see the current translation implementation
**Provider:** minimax
**Rationale:** (auto-detected)
**Source:** I'll fix the translation and run e2e tests. Let me start by examining the translation setup.

---

**Fixing Translation**

Looking at the translation utility... the comment says "Cloud Function permissions need to be fixed." Let me check the actual implementation and Supabase setup.

```bash
# First

---
