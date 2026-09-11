# 08 · Commit log

25 commits on `main`, on top of `0531d87`. Oldest first.

## Phase 1 — confirmations and reminders

| Commit | What |
|---|---|
| `1ddde73` | Template constants (with the name swap), Cairo date formatting, language choice |
| `bb708a9` | Outbox, settings and opt-out tables |
| `01162df` | Trigger that queues messages from bookings |
| `a04b66e` | Find or create a patient's WhatsApp conversation |
| `b451738` | Quiet hours and the dispatch policy |
| `780c2a2` | The dispatcher and its cron endpoint |
| `ed44bf3` | Runbook, and the pg_cron script |
| `6e17da9` | Feature flag and "what's missing" panel in Settings |

## Phase 2 — the WhatsApp assistant

| Commit | What |
|---|---|
| `d79072f` | Answer voice notes instead of ignoring them |
| `fd41085` | Cancel an appointment by replying to a reminder |
| `e566216` | Match conversations by phone suffix |
| `1e4824f` | Searchable clinic knowledge base |
| `f97ea8c` | Save what staff sent against what the assistant proposed |
| `a27e6d9` | Knowledge editor page |
| `f517b35` | Assistant review queue page |

## Phase 3 — waitlist, follow-ups, recalls, reviews, STOP

| Commit | What |
|---|---|
| `a6c5364` | Waitlist table and freed-slot trigger |
| `d98e875` | Send waitlist offers safely |
| `7fac704` | Let the assistant book a slot it was offered (bug fix) |
| `4dc22ed` | Follow-ups and six-month recalls |
| `654b190` | Waitlist management page |
| `3039e88` | Docs for the above |
| `188a588` | STOP opt-outs and the outbox page |
| `c38c0d8` | Review requests only for happy patients |
| `71637ce` | Docs for STOP and review requests |
| `8b7a7c4` | Settings links to the outbox; marketing switch relabelled |

Full messages: `git log --reverse 0531d87..main`
