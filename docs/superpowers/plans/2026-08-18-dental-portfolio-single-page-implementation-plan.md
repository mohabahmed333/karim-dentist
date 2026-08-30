# Dentist Portfolio (Single-Page HTML/CSS) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use haac-core:subagent-driven-development (recommended) or haac-core:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fast, responsive single-page dentist portfolio using the provided branding assets (logo + clinic imagery) with clear navigation and working contact CTAs.

**Architecture:** Static `index.html` defines layout sections and assets; `styles.css` provides the design system (cream/gold, responsive grids, modal styling); `script.js` handles lightbox/modal interactions, smooth scrolling, and safe focus behavior.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (no build tools, no frameworks).

## Global Constraints
- Single-page static site: no Next.js/Vite/etc.
- Use local assets via relative paths from project root: `assets/...`
- Theme: cream background + gold accents (match logo styling)
- Accessibility: buttons/links keyboard accessible, modal closes on `Esc` and click-outside, images have meaningful `alt`.
---

### Task 1: Create `index.html` structure

**Files:**
- Create: `index.html`

**Interfaces:**
- Consumes: `assets/766800441_18084577118253727_1449914596899119909_n.jpg` (logo)
- Consumes: `assets/769385837_18084847031253727_8666198053893142707_n.jpg` (doctor photo)
- Consumes: `assets/771453934_18084846845253727_4216909913248468130_n.jpg` (featured results)
- Consumes: `assets/769375317_18084823622253727_452713876016021475_n.jpg` (epicX/laser promo)
- Consumes: `assets/774361792_18086030342253727_5992595618828369379_n.jpg` (extra gallery card)
- Consumes: `assets/768432495_18084585374253727_8866675210638190928_n.webp` (contact image; optional visual)
- Produces: DOM ids/classes consumed by `styles.css` and `script.js`

- [ ] Step 1: Add `<head>` + meta tags (viewport, title)
- [ ] Step 2: Add a top header with nav links to `#about`, `#services`, `#gallery`, `#contact`
- [ ] Step 3: Add Hero section (`#home`)
  - Title: `The Dental Lounge`
  - Subtitle: `Dr. Karim Elshibiny`
  - CTA buttons:
    - `Call / WhatsApp` linking to `tel:+201111922252`
    - `Contact` linking to `#contact`
- [ ] Step 4: Add About section (`#about`)
  - Include doctor image with `alt="Dr. Karim Elshibiny"`
  - Add concise copy text (no placeholders)
- [ ] Step 5: Add Services section (`#services`) with 8 service cards
  - Card titles + descriptions (from your laser services poster OCR):
    - `Gingivectomy` — Removes excess gum tissue and reshapes the gum line
    - `Frenectomy` — Releases abnormal frenum attachments quickly and comfortably
    - `Teeth Whitening` — Removes stains and discoloration for a brighter smile
    - `TMJ Pain Therapy` — Relieves pain and inflammation in jaw muscles and TMJ
    - `Oral Ulcer Removal` — Relieves pain and promotes faster healing of mouth ulcers
    - `Perio Pockets Treatment` — Reduces bacteria and inflammation in periodontal pockets
    - `Endodontic Treatment` — Disinfects root canals effectively and supports faster recovery
    - `Oral Surgeries` — Precise cutting, minimal bleeding, and faster recovery
- [ ] Step 6: Add Gallery section (`#gallery`)
  - Featured full-width results image: `assets/771453934_18084846845253727_4216909913248468130_n.jpg`
  - Secondary 3-up grid with:
    - `assets/769385837_18084847031253727_8666198053893142707_n.jpg`
    - `assets/769375317_18084823622253727_452713876016021475_n.jpg`
    - `assets/774361792_18086030342253727_5992595618828369379_n.jpg` (choice 1)
  - Each gallery image wrapped with a button/link that triggers the lightbox via `data-full` + `data-alt`
- [ ] Step 7: Add Contact section (`#contact`)
  - Address: `A 41 Ozone Medical Center, New Cairo, Al Narges Buildings`
  - Phone: `+20 111 192 2252`
  - CTA links:
    - `Call` → `tel:+201111922252`
    - `WhatsApp` → `https://wa.me/201111922252` (format number without `+` and spaces)
    - Optional `Get Directions` → Google Maps query URL built from address
- [ ] Step 8: Add Footer
  - Small logo image
  - `© The Dental Lounge`
- [ ] Step 9: Add lightbox modal markup (hidden by default) for images
  - Example structure:
    - `div#lightbox` containing `img#lightbox-img` and `button#lightbox-close`

### Task 2: Create `styles.css` for design system + responsive layout

**Files:**
- Create: `styles.css`

**Interfaces:**
- Consumes: class/id hooks from `index.html` (header, hero, cards, gallery grid, modal)
- Produces: visual behavior for desktop/mobile and modal styling

- [ ] Step 1: Define CSS variables (colors, spacing, radii, shadows)
- [ ] Step 2: Style global typography and container width
- [ ] Step 3: Style header/nav (sticky or fixed, responsive)
- [ ] Step 4: Style hero (centered title/subtitle + CTA buttons)
- [ ] Step 5: Style About section (2 columns on desktop, stacked on mobile)
- [ ] Step 6: Style services grid (cards with icons optional; keep simple)
- [ ] Step 7: Style gallery (featured image, secondary 3-up grid, hover affordance)
- [ ] Step 8: Style contact card + buttons (consistent gold accent)
- [ ] Step 9: Style lightbox modal
  - overlay background
  - centered image
  - close button
- [ ] Step 10: Add responsive breakpoints (at least 768px and 480px)

### Task 3: Create `script.js` for lightbox + smooth scrolling

**Files:**
- Create: `script.js`

**Interfaces:**
- Consumes: lightbox elements `#lightbox`, `#lightbox-img`, `#lightbox-close`
- Consumes: gallery triggers (elements with a known class, e.g. `.gallery-item`)
- Produces: interactive behavior

- [ ] Step 1: Implement smooth scrolling for nav links (CSS `scroll-behavior` + JS fallback optional)
- [ ] Step 2: Implement lightbox open:
  - On trigger click, set `#lightbox-img.src` and `alt`
  - Add an `aria-hidden` / `hidden` toggle pattern
  - Save previously focused element and restore focus on close
- [ ] Step 3: Implement lightbox close:
  - Close on `#lightbox-close` click
  - Close on overlay click (click outside image)
  - Close on `Esc`
- [ ] Step 4: Prevent background scroll when lightbox is open (toggle `document.body.style.overflow`)

### Task 4: Local verification (no automated test suite; manual checks)

**Files:**
- Modify: none (verification only)

**Interfaces:**
- Produces: evidence that core UI works

- [ ] Step 1: Start local server: `python3 -m http.server 8080`
- [ ] Step 2: Open `http://localhost:8080` in browser
- [ ] Step 3: Verify nav scrolls to sections without broken anchors
- [ ] Step 4: Verify services section cards display correctly (8 cards)
- [ ] Step 5: Verify gallery modal:
  - open by clicking images
  - close by `Esc`
  - close by clicking outside image
- [ ] Step 6: Verify contact CTA links:
  - `tel:+201111922252`
  - `https://wa.me/201111922252`
  - `Get Directions` (if included) opens Google Maps

### Task 5: Final polish pass

**Files:**
- Modify: `styles.css` / `index.html` / `script.js` if needed

- [ ] Step 1: Check mobile layout at ~375px wide
- [ ] Step 2: Check image aspect ratios and card spacing
- [ ] Step 3: Check color contrast for text/buttons
- [ ] Step 4: Ensure all images have descriptive `alt` and interactive elements are reachable by keyboard

