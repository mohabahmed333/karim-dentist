# 07 · Decisions, findings and known gaps

## Key decisions

| Decision | Why |
|---|---|
| Enqueue from a database trigger | The admin panel writes bookings straight from the browser; code would miss them |
| Trigger failures only log a warning | A notification must never be able to fail a booking |
| pg_cron, not Vercel Cron | Vercel Hobby allows one run per day |
| Scheduler setup is a script, not a migration | A migration would make every laptop call production every minute |
| Never retry after the send started | A duplicate WhatsApp message is worse than a missed one |
| Everything ships off | Turning things on is a deliberate human decision |
| Reminder replies go to the existing assistant | The submitted templates have no buttons |
| Keep the misspelled / swapped template names | Meta does not allow renaming |
| Full-text search, not embeddings | Free, instant, debuggable at a few hundred entries |
| New knowledge entries start unpublished | Blank text must never reach a patient |
| "Promote" creates knowledge + JSON export | Vercel cannot write test files at runtime |
| Recalls and reviews have their own switch | They are marketing |
| STOP ignores "الغاء" | It means "cancel my appointment" |

## Bugs found and fixed

1. **Voice notes ignored** — every patient voice note got no reply
2. **Offered slots never read back** — patients could not accept an offered slot
3. **Conversation split risk** — `+2010…` vs `2010…` could create two threads

## Things reported as bugs that were not

Stated here so nobody "fixes" them:

- **`book_open_appointment_slot` not granted to `service_role`.** It already has
  access through Supabase's default privileges. Checked on the live database.
- **`rescheduleReservation` strands slots.** Its callers already release and rebook
  the slot around it.

## Known gaps — not done

| Gap | Effect | Fix |
|---|---|---|
| Booking functions do not pass `p_source` | The "bot already told the patient" rule never fires, so once a cancellation template exists, a bot cancellation could send two messages | Add `p_source` to the three booking functions and `set_config('app.notify_source', …)` |
| Waitlist status never returns to `waiting` | A patient offered a slot they did not take stays `offered` and gets no further offers | Expire offers after 30 min; mark `booked` when claimed |
| No way to re-subscribe by message | A patient who sent STOP can only be re-added by staff | Handle a `START` keyword |
| Readiness panel only checks the 4 core templates | It says "ready" while follow-up etc. have no template | Extend the check |
| Arabic search has no stemming | "الأسنان" and "اسنان" may not match | Add simple normalisation or a trigram index |
| New admin pages are not in the sidebar | Staff must use the URL or ⌘K | Add them to the navigation |
| Old AI drafts show no correction history | Captures start from this change | — |

## Not verified

- **Playwright end-to-end tests were never run.** `.env.e2e` does not exist, and
  `.env.local` points at **production** Supabase, so running them without care could
  create and delete real bookings. Specs exist in `e2e/notifications.spec.ts`.
- **Pages not opened in a browser.** They compile and build; the layout is unchecked.
- **No real WhatsApp message sent.** Templates are not approved yet.

What *was* verified against a real (local) database: trigger behaviour for every
booking event, trigger failure isolation, a dry-run message rendered in Arabic,
conversation matching, knowledge search in both languages, waitlist offers,
offered-slot booking, follow-up/recall scans (and running them twice), STOP through
the real job runner, and the review-request veto.

## Environment notes

- `yarn` fails unless `GITHUB_TOKEN` is set (the `.npmrc` needs it). Use
  `GITHUB_TOKEN=x yarn test`, or `bash scripts/test.sh`
- A leftover git worktree exists in the session scratchpad on branch
  `feat/patient-notifications` (stale at commit `6e17da9`). Safe to remove:
  `git worktree prune` after the folder is gone, then `git branch -D feat/patient-notifications`
