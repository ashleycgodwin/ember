---
inclusion: manual
name: end-session
description: End-of-session wrap-up — update the evidence log, remind about screenshots, suggest a commit message.
---

The user has run the "End session" workflow. Do the following steps in order:

## 1. Review what changed

Run `git diff HEAD` and `git status` to see all modified and untracked files. Also reflect on what was done in this chat session.

## 2. Update the evidence log

Open `docs/kiro-evidence/log.md` and prepend one or more new rows to the table (newest first). Use today's date in YYYY-MM-DD format.

For each distinct thing that happened this session, add a row:

| Column | What to write |
|--------|---------------|
| Date | Today in YYYY-MM-DD |
| Kiro Feature | The Kiro feature used (e.g. "Chat agent", "Spec", "Hook", "Steering") |
| What I asked or set up | Short plain-English description of the user's request |
| What happened or what it saved me | What Kiro did and the concrete value it delivered — written for a non-technical reader, no jargon |
| Screenshot | Leave as `—` (user fills in later) |

Write each row so a non-technical reader can understand it without knowing what Kiro is.

## 3. Remind about screenshots

Tell the user:

> Drop any screenshots into `docs/kiro-evidence/screenshots/` and replace the `—` in the Screenshot column with the filename (e.g. `![desc](screenshots/2026-11-07-something.png)`).

## 4. Suggest a commit message

Based on the git diff, suggest a single commit message in conventional-commit format (e.g. `feat: add end-session steering and update evidence log`). Show it in a code block.

Tell the user to copy and run the following themselves when ready — do **not** run `git add` or `git commit`:

```
git add -p
git commit -m "<your suggested message>"
```
