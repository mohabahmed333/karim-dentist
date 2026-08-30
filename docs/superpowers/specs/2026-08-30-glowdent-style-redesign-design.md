# The Dental Lounge — GlowDent-Style Homepage Redesign

## Status
- User chose: full homepage redesign in GlowDent visual style
- Keep brand: The Dental Lounge / Dr. Karim Elshibiny
- Keep: EN/AR language switcher (English brand name always), contact details, existing assets, bottom image slider with autoplay + arrows
- Approach: rebuild visual system on existing `index.html` / `styles.css` / `script.js`

## Goal
Restyle the single-page portfolio to match the provided GlowDent reference: white/minimal layout, deep navy typography, italic serif emphasis, large rounded media, numbered section labels, black pill CTAs — while preserving Dental Lounge content, bilingual support, and clinic assets.

## Visual System
- Background: white / near-white (`#FFFFFF`, soft gray surfaces)
- Primary text: deep navy (`#0F2744` range)
- Muted text: medium gray
- Primary CTA: solid black pill + arrow
- Secondary controls: circular outline buttons
- Images: very large border-radius (~32–48px)
- Type: clean sans for UI/body; elegant italic serif for emphasized words in headlines
- Arabic: Cairo (or equivalent) for body/headings when `lang=ar`; keep `dir=rtl`

## Sections

### 1. Header
- Left: logo mark + `The Dental Lounge` (English always)
- Right: compact nav (or icon menu on mobile) + `EN | AR` switcher
- Sticky, light, minimal

### 2. Hero
- Two-column desktop layout
- Left: large headline with italic emphasis (e.g. Caring for Your *Smile*…), short supporting text, black `Set Appointment` CTA → `#contact` / WhatsApp/call
- Right: large rounded hero image (prefer doctor clinic photo from assets)
- Optional small overlay on image for Contact shortcut
- No partner-logo strip (placeholder logos from reference are out of scope)

### 3. About (01)
- Section chrome: label `About Us` + `(01)` + thin divider
- Large narrative with italic emphasis on key phrases
- Two rounded supporting images from clinic assets
- Simple trust row (3 short stats) — use honest, non-fabricated copy if real numbers unknown; prefer qualitative trust chips over fake metrics when numbers are not available
- Stats decision: use soft trust chips (Laser-focused care / New Cairo / Comfort-first) unless real clinic stats are provided later

### 4. Services (02)
- Label `Our Services` + `(02)`
- Grid of the existing 8 laser/cosmetic services with short descriptions
- Clean cards matching GlowDent softness (rounded, light borders, no heavy shadows)

### 5. Gallery (03)
- Label `Gallery` + `(03)`
- Featured before/during/after image + secondary gallery cards (existing lightbox behavior)

### 6. More Images / Slider (04)
- Keep autoplay + arrow bottom slider with remaining assets
- Restyle controls/cards to match new system

### 7. Contact (05) + Footer
- Contact card: clinic name (English), address, phone, Call / WhatsApp / Directions
- Contact visual image retained
- Footer: logo + © The Dental Lounge

## Behavior Preserved
- Full i18n dictionary (EN/AR), `localStorage` preference
- Arabic RTL layout
- Gallery lightbox (Esc / outside click / close button)
- Slider autoplay + arrows

## Out of Scope
- Search icon / product overlay from GlowDent mock (toothbrush product card)
- Fake partner logos
- Fake award badge unless we have a real one
- Separate multi-page app / framework migration

## Files
- Modify: `index.html`, `styles.css`, `script.js`
- Assets: reuse existing `assets/*` clinic imagery

## Success Criteria
- Homepage visually reads as GlowDent-style minimal dental landing
- Brand remains The Dental Lounge
- EN/AR still works end-to-end
- Contact CTAs still work
- Gallery lightbox + bottom slider still work
- Mobile layout remains usable
