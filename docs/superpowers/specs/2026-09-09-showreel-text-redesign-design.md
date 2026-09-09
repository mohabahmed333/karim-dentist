# Showreel text + text-animation redesign — design

Date: 2026-09-09
Scope: slide copy tightening, word-by-word title animation, public-site scene
goes desktop-only.

## 1. Public site scene: desktop/web only

`site` is currently the only slide with `desktopOnly: false` — every other
slide is forced desktop-only automatically by the `FEATURE()` helper (any
`desktopSrc` containing `mode=product` or `mode=customize`), but `site`'s URL
(`mode=site`) doesn't match either, so it explicitly opts into showing both
desktop and mobile devices side by side while scrolling the real site.

Change: set `desktopOnly: true` on the `site` slide. `ShowreelFeatureDeviceStage`
already conditionally renders the mobile `ShowreelDeviceMockup` only when
`!desktopOnly` (`ShowreelFeatureDeviceStage.tsx`), so this is a one-line data
change — no component change needed. The scroll behavior (`scroll: true`,
`scrollDepth: 1`, etc.) is untouched; it already drives the desktop iframe.

## 2. Copy: light tightening, not a rewrite

Tone stays as-is. Four slides get a trim (the rest are already tight and are
left untouched):

| Slide | Change |
| --- | --- |
| `site` | Drop "Desktop and mobile" (no longer accurate once desktop-only) |
| `site-to-chat` | Drop "public" (redundant) and "Front desk page" (jargon, adds nothing at reel speed) |
| `ai-booking` | Drop "Clinic Assist" (kicker/tags already establish AI context) and "before creating the reservation" (redundant with "review") |
| `clinical-ai` | Drop "once" (odd modifier with no referent) |

Tags/kickers/intro/outro copy: unchanged.

## 3. Word-by-word title animation

### Current state

`useShowreelSlideTransition.ts` animates hero text as whole blocks: the title
(`.showreel-anim-title`), each intro/outro line, and each keyword chip fade +
rise together as single units, staggered only *across* elements (e.g. 3
keyword chips 0.05s apart) — never *within* one line of text.

`.showreel-anim-word` already appears in three places in this file's selector
lists (`prepEnter`, the old `lines` group, `staggerExit`'s `items`) but no
component has ever rendered an element with that class — it's unused
scaffolding for exactly this feature.

### New mechanism

**`showreelSplitWords.ts`** (pure, tested): `splitShowreelWords(text: string):
string[]` — splits on whitespace, trims, drops empty tokens.

**`ShowreelAnimatedText.tsx`**: `{ text: string }` → renders each word as
`<span className="showreel-anim-word">{word}</span>` with a literal space text
node between spans (not CSS margin), so the browser's own line-wrapping still
happens at natural word boundaries and `text-wrap: balance` on the parent
keeps working unmodified.

Applied wherever `.showreel-headline`/hero display text currently interpolates
a raw string:
- `ShowreelSlideShell.tsx` — the FEATURE-slide title, each intro line, the
  outro name.
- `ShowreelFeatureTitleCard.tsx` — the title-card headline (same markup
  pattern, so it inherits the same treatment for free).

Kicker, body, and keyword/tag chips are **not** split — chips already render
one word per element (their existing per-chip stagger already reads as
word-by-word), and kicker/body stay single fast fades per the approved
design, so only the two-out-of-four hero text elements that are currently
single blocks change.

### Timeline changes (enter only — exit is unaffected)

`staggerEnter`'s `lines` group currently bundles `.showreel-intro-line,
.showreel-outro-line, .showreel-keywords .showreel-anim-keyword,
.showreel-anim-word, .showreel-anim-title` and animates them as one group.
Split into two:

- `chips` = `.showreel-keywords .showreel-anim-keyword` only — unchanged
  stagger (0.05s), unchanged behavior.
- `words` = `.showreel-anim-word` — new group, tighter stagger (0.03s),
  smaller rise (`y: 14` vs 18), shorter duration (0.32s vs 0.45s), so it reads
  as kinetic type rather than the same block motion at word granularity.

The **parent** elements (title `<h2>`, intro `<li>`, outro `<span>`) are no
longer animated on enter — their only visible content is now child word spans,
so animating both would double-apply motion. `staggerExit` is untouched: exit
still fades the parent as one block (`.showreel-anim-title`,
`.showreel-intro-line`, `.showreel-outro-line` stay in `staggerExit`'s
`items`), which is simpler and visually adequate — per-word exit would look
nearly identical at 0.28s duration while costing more.

`prepEnter`'s `clearProps` selector already includes `.showreel-anim-word`, so
no change needed there.

### Reduced motion

Unaffected — `useShowreelSlideTransition` already short-circuits both effects
under `prefers-reduced-motion` and calls `resetScene`, which clears transform.
Word spans have no motion to disable beyond what `resetScene` already clears.

## Testing

- `showreelSplitWords.test.ts` (TDD): single word, multiple words, extra
  whitespace, leading/trailing whitespace, empty string.
- Existing `showreelSlides.test.ts` / integrity tests must stay green after
  the copy and `desktopOnly` changes.
- No DOM test runner available for the animation timeline itself (same
  constraint as the rest of this codebase's motion work); verified visually
  against the running dev server.

## Out of scope

- Slide order, durations, or the cursor/action work already shipped.
- Kicker, body, and tag-chip animation (unchanged).
- The `customize` slide's own in-app mobile/desktop preview toggle (a
  different mechanism from the `site` scene's two-device layout; not touched).
