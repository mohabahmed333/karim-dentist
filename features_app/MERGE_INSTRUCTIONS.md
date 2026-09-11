# Merge instructions — for the Claude session that owns `feat/whatsapp-ai-quality`

> **Paste everything below this line into that session.**

---

You are merging your branch `feat/whatsapp-ai-quality` into `main` in
`/Users/mohab/Desktop/karim-dentist`. Another session added a large feature set to
`main` while you worked. This procedure was **rehearsed on 11 September 2026**:
it produced exactly 2 conflicts, and after resolving them as described below,
typecheck, lint, all **1,082 unit tests** and the production build passed.

Follow it exactly. **If anything differs from what is described, STOP and report
to the user — do not improvise.**

## What is on each side

**Your branch** — 3 commits not on `main`:

| Commit | What |
|---|---|
| `225eca4` | fix(whatsapp-ai): never tell a patient they are booked when they are not — `replyGuards`, `runAutoReply`, `canBook` in `processJob` and `buildAutoReplyPrompt` |
| `1ddce1a` | feat(db): patient notification outbox — **an accidental duplicate** of `main`'s commit `bb708a9`, made when both sessions shared one working directory |
| `5fdfd3a` | feat(admin): Off / Draft / Replies switch — `AiModeSwitch.tsx`, `SupportInboxColumn.tsx`, `admin.frontDesk.aiMode*` i18n keys |

**`main`** — 25 feature commits plus a docs commit: patient notifications,
waitlist, follow-ups and recalls, knowledge base, assistant review, voice notes,
STOP opt-outs. Details in `features_app/README.md`.

## Step 1 — Pre-flight. Stop if any check fails.

```bash
cd /Users/mohab/Desktop/karim-dentist
git status --short          # must be clean, except possibly an untracked features_app/ if not yet committed
git worktree list           # note which directories exist
git merge-base main feat/whatsapp-ai-quality
#   must print: 0531d873bcc46ecf37ea5d5b40fc44a0d5d6242a
git log --oneline main..feat/whatsapp-ai-quality
#   must print exactly the 3 commits above: 5fdfd3a, 1ddce1a, 225eca4
```

**Where to do the merge:** in `/Users/mohab/Desktop/karim-dentist` itself,
provided no other session is working in it. Do **not** use a fresh worktree with a
symlinked `node_modules`: Turbopack then fails the build with
*"Symlink [project]/node_modules is invalid, it points out of the filesystem root"* —
an environment problem that looks like a merge problem.

## Step 2 — Confirm the two conflicts are safe to resolve toward `main`

Both conflicts come from the duplicated commit `1ddce1a`. Your branch holds an
older copy of these files; `main` holds a strict superset. Prove it before trusting it:

```bash
for f in e2e/notifications.spec.ts src/lib/supabase/database.types.ts; do
  echo "$f: $(diff <(git show main:"$f") <(git show feat/whatsapp-ai-quality:"$f") | grep -c '^>') lines only on your branch"
done
#   both must print 0. If either is not 0, STOP — your branch has changed since the rehearsal.

git diff main feat/whatsapp-ai-quality -- supabase/migrations/20260911100000_patient_notifications.sql
#   must print nothing — the migration is identical on both sides
```

## Step 3 — Merge

```bash
git checkout main
git merge --no-ff feat/whatsapp-ai-quality
```

Expected output includes **exactly two** conflicts:

```
CONFLICT (add/add): Merge conflict in e2e/notifications.spec.ts
CONFLICT (content): Merge conflict in src/lib/supabase/database.types.ts
```

and clean auto-merges of `buildAutoReplyPrompt.ts`, `buildAutoReplyPrompt.test.ts`,
`processJob.ts`, `ar.ts`, `en.ts`.

Check:

```bash
git diff --name-only --diff-filter=U
#   must list exactly those two files. Any other file → STOP and run: git merge --abort
```

## Step 4 — Resolve both conflicts by keeping `main`

```bash
git checkout --ours e2e/notifications.spec.ts src/lib/supabase/database.types.ts
git add e2e/notifications.spec.ts src/lib/supabase/database.types.ts
```

During a **merge**, `--ours` is the branch you are on (`main`) and `--theirs` is
`feat/whatsapp-ai-quality`. (It is reversed during a rebase — do not rebase.)

Why `main` wins:

- **`e2e/notifications.spec.ts`** — your copy only has the storage tests. `main`'s has
  those plus the reservations-trigger tests and the dispatch-endpoint auth tests.
- **`database.types.ts`** — your only change is the duplicated outbox types. `main`
  also has `recall_enabled`, `waitlist_id`, `slot_id`, and the `appointment_waitlist`,
  `clinic_knowledge` and `whatsapp_ai_corrections` tables plus two RPC signatures.
  Taking your side would break the typecheck across dozens of files.

Never use `--theirs` on these two files.

## Step 5 — Check the files that merged automatically

These merged without conflict, but both sessions edited them. Confirm **both**
sessions' code is present:

```bash
# Your work
grep -n "canBook" src/services/whatsapp_ai/buildAutoReplyPrompt.ts src/services/whatsapp_ai/processJob.ts
grep -n "stripInternalIds\|isSendableReply" src/services/whatsapp_ai/runAutoReply.ts
grep -c "admin.frontDesk.aiMode" src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts

# Main's work
grep -n "knowledgeBlock(input.knowledge" src/services/whatsapp_ai/buildAutoReplyPrompt.ts
grep -n "isOptOutMessage(inbound\|heldSlotIds\|searchClinicKnowledge" src/services/whatsapp_ai/processJob.ts
grep -c "admin.nav.knowledge\|admin.nav.waitlist\|admin.nav.outbox\|admin.settings.notifications" src/lib/i18n/messages/admin/en.ts
```

Every command must print at least one match. Then:

```bash
# No conflict markers anywhere
grep -rln '^<<<<<<< \|^>>>>>>> ' src e2e prompts supabase docs || echo "none"

# No duplicated translation keys (a duplicate key fails the typecheck)
for f in src/lib/i18n/messages/admin/en.ts src/lib/i18n/messages/admin/ar.ts; do
  echo "$f: $(grep -oE '^\s*"admin\.[^"]+"\s*:' "$f" | tr -d ' :' | sort | uniq -d | wc -l | tr -d ' ') duplicates"
done
#   both must print 0
```

## Step 6 — Verify. All must pass before committing.

`yarn` fails unless `GITHUB_TOKEN` is set (the `.npmrc` needs it), so prefix it
with a dummy value.

```bash
npx tsc --noEmit
#   exit 0, no output

GITHUB_TOKEN=x bash scripts/test.sh 2>&1 | grep -E "^ℹ (tests|pass|fail)"
#   rehearsal: tests 1082, pass 1082, fail 0.
#   The count may differ if your branch changed, but fail MUST be 0.

npx eslint src/services/whatsapp_ai src/features/admin/components/support/AiModeSwitch.tsx
#   exit 0

GITHUB_TOKEN=x yarn build
#   exit 0 — must run with the real node_modules
```

Lint errors already exist elsewhere in the repo — for example
`src/features/admin/components/AdminFloatingBubbles.tsx` (`react-hooks/set-state-in-effect`).
They predate this merge. **Do not fix them in the merge commit.**

If anything fails: `git merge --abort`, then report the exact output to the user.

## Step 7 — Commit the merge

```bash
git commit
```

Suggested message (add the attribution footer your environment requires):

```
Merge feat/whatsapp-ai-quality into main

Brings in the reply guard that stops the assistant telling a patient they are
booked when they are not, canBook in the prompt, and the Off / Draft / Replies
switch in the inbox.

Two conflicts, both resolved toward main. They came from 1ddce1a, an accidental
duplicate of main's bb708a9 made while two sessions shared a working directory:

- e2e/notifications.spec.ts: main's copy is a superset (adds trigger and
  dispatch-auth tests).
- src/lib/supabase/database.types.ts: main's copy is a superset (adds
  recall_enabled, waitlist_id, slot_id and three tables).

Checked that neither file held a line on this branch that main lacked. Verified
after the merge: typecheck, lint on the touched areas, unit tests and production
build all pass.
```

## Do NOT

- **Push** — the user decides when. Pushing `main` starts a Vercel production deploy.
- Run `supabase db push` — production migrations are a separate, deliberate step
  (`features_app/06-go-live-checklist.md`).
- Run the Playwright e2e suite — `.env.local` points at **production** Supabase, so it
  could create and delete real bookings.
- Rebase or force-push either branch.
- Delete `feat/whatsapp-ai-quality` or `feat/patient-notifications` without the user's OK.
  (Both are fully merged after this. A stale worktree for `feat/patient-notifications`
  may still be listed under a `/private/tmp/claude-…/scratchpad/wt-notifications` path.)

## Report back to the user

1. The conflicts git actually reported
2. The output of each check in Steps 2, 5 and 6
3. The merge commit hash
4. Anything that did not match these instructions
