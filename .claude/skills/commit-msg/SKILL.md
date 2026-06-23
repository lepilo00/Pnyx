---
name: commit-msg
description: Prepares a draft commit message (in English, matching this repo's convention) for the current changes (staged + unstaged). Does NOT run git commit, git add, or any git write operation - the user commits themselves.
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*)
---

Prepare a draft commit message for the current state of the repository.

1. Run `git status` (untracked + modified files) and `git diff` (unstaged) plus `git diff --staged` (staged) to see the actual changes — not just file names.
2. Run `git log -10 --oneline` to check this repo's message style (e.g. the `#commit` prefix used in past commits, typical length, whether bullet points are used) and match it.
3. Analyze the changes and identify the WHY (intent), not just what changed — a short summary line, with bullet points below if needed for detail.
4. Write the message in English, matching this repo's convention: concise, without listing every changed line.
5. If you spot files that might contain secrets (.env, credentials, keys), flag this and exclude them from the suggested `git add` scope (even though you don't run the commit yourself, warn the user).
6. Print the message to the user in a code block, ready for `git commit -m`. Do not run `git commit`, `git add`, `git push`, or any other git write operation — the user commits themselves.
7. If there are no changes (clean working tree), say so and don't invent a message.
