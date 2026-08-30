# GlowDent-Style Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. (Subagent fan-out disabled by workspace rules — execute inline.)

**Goal:** Rebuild The Dental Lounge single-page site to match the GlowDent visual system while keeping EN/AR, assets, contact CTAs, lightbox, and bottom slider.

**Architecture:** Rewrite markup structure in `index.html` for GlowDent section chrome; replace `styles.css` with a white/navy/black design system; extend `script.js` i18n keys and preserve lightbox + slider behavior.

**Tech Stack:** Vanilla HTML/CSS/JS, Google Fonts (Inter + italic serif + Cairo for Arabic).

## Global Constraints
- Brand name stays English: `The Dental Lounge`
- Full EN/AR switch with RTL
- No fake partner logos / product overlays / invented award badges
- Trust row uses qualitative chips, not fabricated metrics
- Reuse existing `assets/*`
- Keep tel / WhatsApp / Maps links

---

### Task 1: Rebuild `index.html` markup

**Files:**
- Modify: `index.html`

**Interfaces:**
- Produces: GlowDent-style section structure + `data-i18n` hooks consumed by `script.js`
- Preserves: gallery lightbox markup, slider track with remaining images, contact CTAs

- [ ] Step 1: Update font links (Inter + Instrument Serif or similar italic display + Cairo)
- [ ] Step 2: Rebuild header (logo left, nav + EN/AR right)
- [ ] Step 3: Rebuild hero (headline with `<em>` emphasis, Set Appointment CTA, large rounded doctor image)
- [ ] Step 4: Rebuild About (01) with narrative, 2 images, trust chips
- [ ] Step 5: Rebuild Services (02) grid for 8 services
- [ ] Step 6: Rebuild Gallery (03) featured + 3 cards + lightbox hooks
- [ ] Step 7: Keep More Images slider (04) + Contact (05) + footer, restyled class names
- [ ] Step 8: Ensure all user-facing strings have `data-i18n` / alt / aria hooks

### Task 2: Replace `styles.css` with GlowDent design system

**Files:**
- Modify: `styles.css`

- [ ] Step 1: CSS variables — white bg, navy text, gray muted, black CTA, large radii
- [ ] Step 2: Header / hero / about / services / gallery / slider / contact / footer styles
- [ ] Step 3: RTL overrides for Arabic
- [ ] Step 4: Responsive breakpoints (980 / 768 / 480)

### Task 3: Update `script.js` translations + keep interactions

**Files:**
- Modify: `script.js`

- [ ] Step 1: Add/update EN and AR strings for new copy keys
- [ ] Step 2: Keep language switch, lightbox, slider autoplay/arrows working
- [ ] Step 3: Brand keys remain English in both languages

### Task 4: Verify locally

- [ ] Step 1: Serve with `python3 -m http.server 8080`
- [ ] Step 2: Check EN layout, AR RTL, language toggle
- [ ] Step 3: Check lightbox + slider arrows/autoplay
- [ ] Step 4: Check contact links
